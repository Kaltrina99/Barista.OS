/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  Timestamp,
  getDocFromServer,
  limit,
  getDoc,
  deleteField
} from "firebase/firestore";
import { db, auth } from "./firebase";
export { db, auth };
import { InventoryItem, SalesRecord, SoldItem, UserProfile, RestockRecord, Location, StockHistoryRecord } from "../types";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const getUserPath = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");
  
  // Check if current user is superadmin and impersonating
  // Use getDocFromServer to ensure we get the latest impersonation state bypass cache
  const docSnap = await getDocFromServer(doc(db, "users", user.uid, "profile", "data"));
  if (docSnap.exists()) {
    const profile = docSnap.data() as UserProfile;
    if (profile.role === 'superadmin' && profile.impersonatingUid) {
      console.log(`[Impersonation] Targeting UID: ${profile.impersonatingUid}`);
      return `users/${profile.impersonatingUid}`;
    }
  }
  
  return `users/${user.uid}`;
};

const getActiveLocationId = async (targetUserId: string) => {
  // Always get from server when calculating for inventory/sales/restock to match userPath
  const docSnap = await getDocFromServer(doc(db, "users", targetUserId, "profile", "data"));
  if (docSnap.exists()) {
    return (docSnap.data() as UserProfile).activeLocationId || 'default';
  }
  return 'default';
};

export const inventoryService = {
  testConnection: async () => {
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
    } catch (error) {
      if(error instanceof Error && error.message.includes('the client is offline')) {
        console.error("Please check your Firebase configuration.");
      }
    }
  },

  logStockHistory: async (userId: string, record: Omit<StockHistoryRecord, 'id' | 'userId'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const path = `users/${userId}/stock_history`;
    try {
      await setDoc(doc(db, path, id), { ...record, id, userId });
    } catch (error) {
      console.error("Failed to log stock history:", error);
    }
  },

  getInventory: async (searchTerm?: string): Promise<InventoryItem[]> => {
    const userPath = await getUserPath();
    const targetUserId = userPath.split('/')[1];
    const locationId = await getActiveLocationId(targetUserId);
    const path = `${userPath}/inventory`;
    try {
      // Fetch tenant's items
      const snapshot = await getDocs(query(collection(db, path)));
      let items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem));
      
      // Filter by location
      items = items.filter(i => i.locationId === locationId);

      // Fetch global items from superadmin (only if superadmin UID is known)
      // Usually we'd fetch from a dedicated 'global' collection or search across all tenants
      // For simplicity in this structure, we'll fetch from the known superadmin if the current user isn't the superadmin
      const superAdminUid = 'd37f031c-c5e2-48f6-b3c9-4d2f35082bd1'; // Example placeholder or we look it up
      // Instead of hardcoding, we can query the 'profiles' collection for a superadmin, but for now we'll assumes items flagged as visible are searchable
      // Firestore doesn't support easy "search all collections named inventory" without a root collection
      // So we'll fetch from a "global_inventory" collection that superadmin writes to when toggled
      
      const globalSnapshot = await getDocs(query(collection(db, "global_inventory")));
      const globalItems = globalSnapshot.docs.map(doc => {
        const data = doc.data() as InventoryItem;
        return { ...data, id: doc.id, isGlobal: true };
      });
      
      // Deduplicate items (tenant items take precedence over global copies if IDs match)
      const itemMap = new Map<string, InventoryItem>();
      globalItems.forEach(item => itemMap.set(item.id, item));
      items.forEach(item => itemMap.set(item.id, item));
      
      items = Array.from(itemMap.values());

      if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        return items.filter(i => i.name.toLowerCase().includes(lowerSearch));
      }
      return items;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  updateItem: async (id: string, updates: Partial<InventoryItem>) => {
    const userPath = await getUserPath();
    const targetUserId = userPath.split('/')[1];
    const path = `${userPath}/inventory`;
    try {
      const itemRef = doc(db, path, id);
      
      // If quantity is being updated manually, log it
      if (updates.quantity !== undefined) {
        const docSnap = await getDoc(itemRef);
        if (docSnap.exists()) {
          const prevItem = docSnap.data() as InventoryItem;
          const diff = updates.quantity - prevItem.quantity;
          if (diff !== 0) {
            await inventoryService.logStockHistory(targetUserId, {
              itemId: id,
              itemName: prevItem.name,
              change: diff,
              newQuantity: updates.quantity,
              reason: 'manual_adjustment',
              timestamp: new Date().toISOString(),
              locationId: prevItem.locationId
            });
          }
        }
      }

      await updateDoc(itemRef, { 
        ...updates, 
        lastStockUpdate: new Date().toISOString() 
      });

      // If it's visible to tenants and we are superadmin, update global copy
      if (updates.isVisibleToTenants !== undefined || updates.price !== undefined) {
        const itemSnap = await getDoc(itemRef);
        const itemData = itemSnap.data() as InventoryItem;
        if (itemData.isVisibleToTenants) {
          await setDoc(doc(db, "global_inventory", id), itemData);
        } else {
          await deleteDoc(doc(db, "global_inventory", id));
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${path}/${id}`);
    }
  },

  addItem: async (item: Omit<InventoryItem, "id" | "lastStockUpdate" | "locationId">) => {
    const userPath = await getUserPath();
    const targetUserId = userPath.split('/')[1];
    const locationId = await getActiveLocationId(targetUserId);
    const path = `${userPath}/inventory`;
    const id = Math.random().toString(36).substr(2, 9);
    try {
      const newItem: InventoryItem = {
        ...item,
        id,
        locationId,
        lastStockUpdate: new Date().toISOString(),
      };
      await setDoc(doc(db, path, id), newItem);

      await inventoryService.logStockHistory(targetUserId, {
        itemId: id,
        itemName: newItem.name,
        change: newItem.quantity,
        newQuantity: newItem.quantity,
        reason: 'creation',
        timestamp: newItem.lastStockUpdate,
        locationId: newItem.locationId
      });

      if (newItem.isVisibleToTenants) {
        await setDoc(doc(db, "global_inventory", id), newItem);
      }

      return newItem;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `${path}/${id}`);
      throw error;
    }
  },

  getProfile: async (uid?: string): Promise<UserProfile | null> => {
    const user = auth.currentUser;
    const targetUid = uid || user?.uid;
    if (!targetUid) return null;

    try {
      const isSelf = targetUid === user?.uid;
      const email = user?.email;
      const isSystemAdminEmail = email === 'kaltrina99a@gmail.com';

      // Use getDocFromServer for critical profile path to ensure we see latest role
      const docRef = doc(db, "users", targetUid, "profile", "data");
      const docSnap = isSelf ? await getDocFromServer(docRef) : await getDoc(docRef);
      
      let profile: UserProfile | null = null;
      
      if (!docSnap.exists()) {
        if (!isSelf) return null;

        // Create initial profile if it's the current user
        const defaultPermissions = {
          dashboard: true,
          inventory: true,
          market: true,
          requisition: true,
          history: true,
          canAddItems: true,
          canEditItems: true,
          canDeleteItems: true,
          canProcessSales: true,
          canProcessRestocks: true
        };

        const newProfile: UserProfile = {
          uid: targetUid,
          email: email || '',
          isApproved: isSystemAdminEmail,
          subscriptionTier: 'free',
          role: isSystemAdminEmail ? 'superadmin' : 'tenant',
          activeLocationId: 'default',
          createdAt: new Date().toISOString(),
          lastActive: new Date().toISOString(),
          enabledTabs: ['dashboard', 'inventory', 'market', 'requisition', 'history'],
          permissions: defaultPermissions
        };

        await setDoc(doc(db, "users", targetUid, "profile", "data"), newProfile);
        await setDoc(doc(db, "profiles", targetUid), newProfile);
        profile = newProfile;
      } else {
        profile = docSnap.data() as UserProfile;
        
        if (isSelf) {
          // Verify global sync
          const topProfileSnap = await getDoc(doc(db, "profiles", targetUid));
          const needsPromotion = isSystemAdminEmail && profile.role !== 'superadmin';
          const needsSync = !topProfileSnap.exists();

          if (needsPromotion || needsSync) {
            const updates = {
              role: isSystemAdminEmail ? 'superadmin' : profile.role,
              isApproved: isSystemAdminEmail ? true : profile.isApproved,
              lastActive: new Date().toISOString()
            };
            await inventoryService.updateProfile(targetUid, updates);
            profile = { ...profile, ...updates };
          } else {
            await inventoryService.updateProfile(targetUid, { lastActive: new Date().toISOString() });
          }
        }
      }
      
      return profile;
    } catch (error) {
       console.warn("Profile fetch issue, falling back to local:", error);
       try {
         const localSnap = await getDoc(doc(db, "users", targetUid, "profile", "data"));
         return localSnap.exists() ? (localSnap.data() as UserProfile) : null;
       } catch {
         return null;
       }
    }
  },

  updateProfile: async (uid: string, updates: any) => {
    // If impersonatingUid is explicitly undefined or null, use deleteField()
    const cleanedUpdates = { ...updates };
    if ('impersonatingUid' in updates && !updates.impersonatingUid) {
      cleanedUpdates.impersonatingUid = deleteField();
    }

    try {
      // Sync to both locations
      await setDoc(doc(db, "users", uid, "profile", "data"), cleanedUpdates, { merge: true });
      await setDoc(doc(db, "profiles", uid), cleanedUpdates, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `profiles/${uid}`);
    }
  },

  getAllTenants: async (): Promise<UserProfile[]> => {
    // Call our new Node backend API to bypass client permission issues and allow local fallback
    let serverTenants: UserProfile[] = [];
    try {
      const response = await fetch('/api/tenants');
      if (response.ok) {
        const data = await response.json();
        serverTenants = Array.isArray(data) ? data : [];
      }
    } catch (error) {
      console.error("Error fetching tenants from server:", error);
    }

    // Always fetch from Firestore as the source of truth if we can, then merge
    try {
      const snapshot = await getDocs(collection(db, "profiles"));
      const firestoreTenants = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
      
      // Merge results, Firestore takes precedence for overlapping UIDs
      const tenantMap = new Map<string, UserProfile>();
      serverTenants.forEach(t => {
        if (t && t.uid) tenantMap.set(t.uid, t);
      });
      firestoreTenants.forEach(t => {
        if (t && t.uid) tenantMap.set(t.uid, t);
      });
      
      return Array.from(tenantMap.values());
    } catch (fbError) {
      console.error("Firebase fetch failed in getAllTenants:", fbError);
      return serverTenants.filter(t => t && t.uid); 
    }
  },

  createProfileIfMissing: async (email: string) => {
    const user = auth.currentUser;
    if (!user) return;
    const profile = await inventoryService.getProfile();
    if (!profile) {
      const isSuperAdmin = email === 'kaltrina99a@gmail.com';
      const defaultPermissions = {
        dashboard: true,
        inventory: true,
        market: true,
        requisition: true,
        history: true,
        canAddItems: true,
        canEditItems: true,
        canDeleteItems: true,
        canProcessSales: true,
        canProcessRestocks: true
      };

      const newProfile: UserProfile = {
        uid: user.uid,
        email,
        subscriptionTier: 'free',
        isApproved: isSuperAdmin, // Auto-approve the main user
        role: isSuperAdmin ? 'superadmin' : 'tenant',
        activeLocationId: 'default',
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        enabledTabs: ['dashboard', 'inventory', 'market', 'requisition', 'history'],
        permissions: defaultPermissions
      };
      await setDoc(doc(db, "users", user.uid, "profile", "data"), newProfile);
      
      // Create a default location
      const locationId = 'default';
      await setDoc(doc(db, "users", user.uid, "locations", locationId), {
        id: locationId,
        name: 'Main Branch',
        createdAt: new Date().toISOString()
      });

      // Also write to global profiles for super admin tracking
      await setDoc(doc(db, "profiles", user.uid), newProfile);
    } else {
      // Upgrade to superadmin if email matches but role is not set correctly
      if (email === 'kaltrina99a@gmail.com' && profile.role !== 'superadmin') {
        await inventoryService.updateProfile(user.uid, { 
          role: 'superadmin', 
          isApproved: true
        });
      }
      
      // Always update last active
      await inventoryService.updateProfile(user.uid, { lastActive: new Date().toISOString() });
    }
  },

  getLocations: async (uid?: string): Promise<Location[]> => {
    const targetUid = uid || auth.currentUser?.uid;
    if (!targetUid) return [];
    const path = `users/${targetUid}/locations`;
    try {
      const snapshot = await getDocs(collection(db, path));
      const locMap = new Map<string, Location>();
      snapshot.docs.forEach(doc => {
        const id = doc.id;
        if (id) {
          locMap.set(id, { ...doc.data(), id } as Location);
        }
      });
      // Ensure at least a default location exists in memory if empty 
      // AND use a stable ID to prevent random duplicate keys if multiple components fetch
      if (locMap.size === 0) {
        locMap.set('primary-node', { id: 'primary-node', name: 'Main Branch', createdAt: new Date().toISOString() });
      }
      return Array.from(locMap.values());
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [{ id: 'primary-node', name: 'Main Branch', createdAt: new Date().toISOString() }];
    }
  },

  addLocation: async (uid: string, location: Omit<Location, 'id' | 'createdAt'>) => {
    const locationId = Math.random().toString(36).substr(2, 9);
    const newLocation: Location = {
      name: location.name,
      id: locationId,
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, "users", uid, "locations", locationId), newLocation);
    return newLocation;
  },

  deleteLocation: async (uid: string, locationId: string) => {
    try {
      await deleteDoc(doc(db, "users", uid, "locations", locationId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${uid}/locations/${locationId}`);
    }
  },

  updateLocation: async (uid: string, locationId: string, updates: Partial<Location>) => {
    try {
      const defaultFields = locationId === 'primary-node' ? { name: 'Main Branch', createdAt: new Date().toISOString() } : {};
      await setDoc(doc(db, "users", uid, "locations", locationId), {
        ...defaultFields,
        ...updates
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}/locations/${locationId}`);
    }
  },

  deleteItem: async (id: string) => {
    const userPath = await getUserPath();
    const targetUserId = userPath.split('/')[1];
    const path = `${userPath}/inventory`;
    try {
      const itemSnap = await getDoc(doc(db, path, id));
      if (itemSnap.exists()) {
        const item = itemSnap.data() as InventoryItem;
        await inventoryService.logStockHistory(targetUserId, {
          itemId: id,
          itemName: item.name,
          change: -item.quantity,
          newQuantity: 0,
          reason: 'deletion',
          timestamp: new Date().toISOString(),
          locationId: item.locationId
        });
      }
      await deleteDoc(doc(db, path, id));
      // Try to delete from global too just in case
      await deleteDoc(doc(db, "global_inventory", id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${path}/${id}`);
    }
  },

  getSalesHistory: async (limitCount: number = 50): Promise<SalesRecord[]> => {
    const userPath = await getUserPath();
    const targetUserId = userPath.split('/')[1];
    const locationId = await getActiveLocationId(targetUserId);
    const path = `${userPath}/sales`;
    try {
      const q = query(collection(db, path), orderBy("timestamp", "desc"), limit(limitCount));
      const snapshot = await getDocs(q);
      return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as SalesRecord))
        .filter(r => r.locationId === locationId);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  getRestockHistory: async (limitCount: number = 50): Promise<RestockRecord[]> => {
    const userPath = await getUserPath();
    const targetUserId = userPath.split('/')[1];
    const locationId = await getActiveLocationId(targetUserId);
    const path = `${userPath}/restocks`;
    try {
      const q = query(collection(db, path), orderBy("timestamp", "desc"), limit(limitCount));
      const snapshot = await getDocs(q);
      return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as RestockRecord))
        .filter(r => r.locationId === locationId);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  processSales: async (soldItems: SoldItem[]): Promise<void> => {
    const userPath = await getUserPath();
    const targetUserId = userPath.split('/')[1];
    const locationId = await getActiveLocationId(targetUserId);
    
    const inventory = await inventoryService.getInventory();
    const salesPath = `${userPath}/sales`;

    // Calculate total value based on inventory prices
    let totalSalesValue = 0;
    const enrichedItems = soldItems.map(sold => {
      const invItem = inventory.find(i => i.name.toLowerCase().includes(sold.name.toLowerCase()));
      const unitPrice = invItem?.price || sold.price || 0;
      totalSalesValue += unitPrice * sold.quantity;
      return { ...sold, price: unitPrice };
    });

    // Create a sales record
    const saleId = Math.random().toString(36).substr(2, 9);
    const newRecord: SalesRecord = {
      id: saleId,
      timestamp: new Date().toISOString(),
      itemsSold: enrichedItems,
      status: 'processed',
      totalValue: totalSalesValue,
      locationId
    };
    
    try {
      await setDoc(doc(db, salesPath, saleId), newRecord);

      // Update inventory levels
      for (const sold of enrichedItems) {
        const item = inventory.find(i => i.name.toLowerCase().includes(sold.name.toLowerCase()) || sold.name.toLowerCase().includes(i.name.toLowerCase()));
        if (item) {
          const newQty = Math.max(0, item.quantity - sold.quantity);
          await inventoryService.updateItem(item.id, { quantity: newQty });
          await inventoryService.logStockHistory(targetUserId, {
            itemId: item.id,
            itemName: item.name,
            change: -sold.quantity,
            newQuantity: newQty,
            reason: 'sale',
            timestamp: new Date().toISOString(),
            locationId
          });
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, salesPath);
    }
  },

  processRestock: async (restockItems: SoldItem[], source: string = "Manual Scan"): Promise<void> => {
    const userPath = await getUserPath();
    const targetUserId = userPath.split('/')[1];
    const locationId = await getActiveLocationId(targetUserId);
    
    const inventory = await inventoryService.getInventory();
    const restocksPath = `${userPath}/restocks`;
    
    let totalCost = 0;
    
    // Update inventory levels and track price changes
    for (const restock of restockItems) {
      totalCost += (restock.price || 0) * restock.quantity;
      const item = inventory.find(i => 
        i.name.toLowerCase().includes(restock.name.toLowerCase()) || 
        restock.name.toLowerCase().includes(i.name.toLowerCase())
      );

      if (item) {
        const newQty = item.quantity + restock.quantity;
        const updates: Partial<InventoryItem> = { 
          quantity: newQty,
          supplier: source !== "Manual Scan" ? source : item.supplier
        };
        // If restock bill has a price, we might update the item's cost basis
        if (restock.price && restock.price !== item.price) {
          updates.price = restock.price; // Update to latest price from bill
        }
        await inventoryService.updateItem(item.id, updates);
        await inventoryService.logStockHistory(targetUserId, {
          itemId: item.id,
          itemName: item.name,
          change: restock.quantity,
          newQuantity: newQty,
          reason: 'restock',
          timestamp: new Date().toISOString(),
          locationId
        });
      } else {
        // If item doesn't exist, add it to inventory
        await inventoryService.addItem({
          name: restock.name,
          quantity: restock.quantity,
          unit: 'unit',
          threshold: Math.ceil(restock.quantity * 0.2),
          price: restock.price || 0,
          supplier: source
        });
      }
    }

    // Save restock record
    const restockId = Math.random().toString(36).substr(2, 9);
    try {
      await setDoc(doc(db, restocksPath, restockId), {
        id: restockId,
        timestamp: new Date().toISOString(),
        itemsRestocked: restockItems,
        source,
        totalCost,
        locationId
      });
    } catch (error) {
       handleFirestoreError(error, OperationType.CREATE, restocksPath);
    }
  },

  clearSalesHistory: async (): Promise<void> => {
    const userPath = await getUserPath();
    const path = `${userPath}/sales`;
    try {
      const snapshot = await getDocs(collection(db, path));
      const batch = snapshot.docs.map(docSnap => deleteDoc(doc(db, path, docSnap.id)));
      await Promise.all(batch);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  clearRestockHistory: async (): Promise<void> => {
    const userPath = await getUserPath();
    const path = `${userPath}/restocks`;
    try {
      const snapshot = await getDocs(collection(db, path));
      const batch = snapshot.docs.map(docSnap => deleteDoc(doc(db, path, docSnap.id)));
      await Promise.all(batch);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  getStockHistory: async (limitCount: number = 50): Promise<StockHistoryRecord[]> => {
    const userPath = await getUserPath();
    const targetUserId = userPath.split('/')[1];
    const locationId = await getActiveLocationId(targetUserId);
    const path = `${userPath}/stock_history`;
    try {
      const q = query(collection(db, path), orderBy("timestamp", "desc"), limit(limitCount));
      const snapshot = await getDocs(q);
      return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as StockHistoryRecord))
        .filter(r => r.locationId === locationId);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  clearStockHistory: async (): Promise<void> => {
    const userPath = await getUserPath();
    const path = `${userPath}/stock_history`;
    try {
      const snapshot = await getDocs(collection(db, path));
      const batch = snapshot.docs.map(docSnap => deleteDoc(doc(db, path, docSnap.id)));
      await Promise.all(batch);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  deleteTenant: async (uid: string): Promise<void> => {
    try {
      // Sync delete from both authorized locations
      await deleteDoc(doc(db, "profiles", uid));
      await deleteDoc(doc(db, "users", uid, "profile", "data"));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `profiles/${uid}`);
    }
  }
};
