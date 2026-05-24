import React, { useState, useEffect, useMemo } from 'react';
import { 
  Coffee, 
  Package, 
  Camera, 
  Plus, 
  Trash2, 
  AlertCircle, 
  RefreshCw, 
  CheckCircle2, 
  TrendingUp, 
  Menu, 
  X,
  ShoppingBag,
  History,
  LayoutDashboard,
  Users,
  ShieldCheck,
  CreditCard,
  DollarSign,
  ArrowUpRight,
  Settings,
  MapPin,
  ShieldAlert,
  LogOut,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, subDays } from 'date-fns';

import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { auth } from './services/firebase';
import { InventoryItem, SoldItem, SalesRecord, ProductInfo, UserProfile, SubscriptionTier, RestockRecord, Location, StockHistoryRecord, AppTab } from './types';
import { inventoryService } from './services/inventoryService';
import { analyzeSalesPhoto, analyzeRestockPhoto, identifyProduct } from './services/geminiService';

import { cn } from './lib/utils';
import { Modal, InputGroup } from './components/shared/Modals';
import { CompactStat, ActionButton } from './components/shared/Stats';
import { NavTab, MobileNavTab } from './components/layout/Navigation';
import { Sidebar } from './components/layout/Sidebar';
import { Overview } from './components/features/Dashboard/Overview';
import { SupplyGrid } from './components/features/Inventory/SupplyGrid';
import { MarketWatch } from './components/features/Market/MarketWatch';
import { AuditLedger } from './components/features/History/AuditLedger';
import { PriceHistoryModal } from './components/features/Inventory/PriceHistoryModal';
import { LocationManager } from './components/features/Admin/LocationManager';
import { PermissionManager } from './components/features/Admin/PermissionManagement';
import { AuthScreen } from './components/features/Auth/AuthScreen';
import { ManualControls } from './components/features/Inventory/ManualControls';
import { RequisitionQueue } from './components/features/Inventory/RequisitionQueue';
import { RegionIntel } from './components/features/Inventory/RegionIntel';
import { AdminPanel } from './components/features/Admin/AdminPanel';
import { CameraOverlay } from './components/shared/CameraOverlay';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [salesHistory, setSalesHistory] = useState<SalesRecord[]>([]);
  const [restockHistory, setRestockHistory] = useState<RestockRecord[]>([]);
  const [stockHistory, setStockHistory] = useState<StockHistoryRecord[]>([]);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isProcessingSales, setIsProcessingSales] = useState(false);
  const [isProcessingRestock, setIsProcessingRestock] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraPurpose, setCameraPurpose] = useState<'sale' | 'restock' | 'intel'>('sale');
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isManualRestockOpen, setIsManualRestockOpen] = useState(false);
  const [isManualSaleOpen, setIsManualSaleOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'history' | 'requisition' | 'market' | 'admin' | 'intel'>('dashboard');
  const [analyzedItems, setAnalyzedItems] = useState<SoldItem[] | null>(null);
  const [analyzedRestockItems, setAnalyzedRestockItems] = useState<SoldItem[] | null>(null);
  const [isResourceIntelOpen, setIsResourceIntelOpen] = useState(false);
  const [identifiedProduct, setIdentifiedProduct] = useState<ProductInfo | null>(null);
  const [newItem, setNewItem] = useState({ name: '', quantity: 0, unit: '', threshold: 0, price: 0, supplier: '' });
  const [manualSale, setManualSale] = useState<{ itemId: string; quantity: number }>({ itemId: '', quantity: 1 });
  const [manualRestock, setManualRestock] = useState<{ itemId: string; quantity: number }>({ itemId: '', quantity: 1 });
  const [restockSource, setRestockSource] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isClearingHistory, setIsClearingHistory] = useState(false);
  const [lastScanPhoto, setLastScanPhoto] = useState<string | null>(null);
  const [lastIntelPhoto, setLastIntelPhoto] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchHistoryTerm, setSearchHistoryTerm] = useState('');
  const [historyLimit, setHistoryLimit] = useState(50);
  const [isHistoryLoadingMore, setIsHistoryLoadingMore] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [allTenants, setAllTenants] = useState<UserProfile[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isManagingLocations, setIsManagingLocations] = useState(false);
  const [isManagingPermissions, setIsManagingPermissions] = useState(false);
  const [newLocation, setNewLocation] = useState({ name: '' });
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [currentTime, setCurrentTime] = useState(new Date());

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [auditType, setAuditType] = useState<'sales' | 'restocks' | 'stock'>('sales');
  const [viewingPriceHistoryItem, setViewingPriceHistoryItem] = useState<InventoryItem | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSuperAdmin = useMemo(() => {
    return user?.email === 'kaltrina99a@gmail.com' || profile?.role === 'superadmin';
  }, [user, profile]);

  const activeThemeProfile = useMemo(() => {
    if (profile?.impersonatingUid && allTenants.length > 0) {
      return allTenants.find(t => t.uid === profile.impersonatingUid) || profile;
    }
    return profile;
  }, [profile, allTenants]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setIsAuthLoading(false);
      if (u) {
        inventoryService.testConnection();
        await inventoryService.createProfileIfMissing(u.email || '');
        const p = await inventoryService.getProfile();
        setProfile(p);
        refreshData(p);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const refreshData = async (currentProfile?: UserProfile | null) => {
    if (!auth.currentUser) return;
    const activeProfile = currentProfile !== undefined ? currentProfile : profile;
    const inv = await inventoryService.getInventory();
    const history = await inventoryService.getSalesHistory(historyLimit);
    const restocks = await inventoryService.getRestockHistory(historyLimit);
    const stock = await inventoryService.getStockHistory(historyLimit);
    // Use impersonation UID for locations if active
    const targetUidForLocs = activeProfile?.impersonatingUid || auth.currentUser.uid;
    const locs = await inventoryService.getLocations(targetUidForLocs);
    setInventory(inv);
    setSalesHistory(history);
    setRestockHistory(restocks);
    setStockHistory(stock);
    setLocations(locs);
    
    const isActuallySuperAdmin = auth.currentUser.email === 'kaltrina99a@gmail.com' || activeProfile?.role === 'superadmin';

    if (isActuallySuperAdmin) {
      setIsAdminLoading(true);
      const tenants = await inventoryService.getAllTenants();
      setAllTenants(tenants);
      setIsAdminLoading(false);
    }
  };

  const loadMoreHistory = async () => {
    if (!auth.currentUser || isHistoryLoadingMore) return;
    setIsHistoryLoadingMore(true);
    const newLimit = historyLimit + 50;
    const history = await inventoryService.getSalesHistory(newLimit);
    const restocks = await inventoryService.getRestockHistory(newLimit);
    const stock = await inventoryService.getStockHistory(newLimit);
    setSalesHistory(history);
    setRestockHistory(restocks);
    setStockHistory(stock);
    setHistoryLimit(newLimit);
    setIsHistoryLoadingMore(false);
  };

  const filteredInventory = useMemo(() => {
    return inventory.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.supplier && item.supplier.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [inventory, searchTerm]);

  const filteredHistory = useMemo(() => {
    if (auditType === 'sales') {
      if (!searchHistoryTerm) return salesHistory;
      const lowerSearch = searchHistoryTerm.toLowerCase();
      return salesHistory.filter(record => 
        record.itemsSold.some(item => item.name.toLowerCase().includes(lowerSearch)) ||
        format(new Date(record.timestamp), 'MMM d, yyyy').toLowerCase().includes(lowerSearch)
      );
    } else {
      if (!searchHistoryTerm) return restockHistory;
      const lowerSearch = searchHistoryTerm.toLowerCase();
      return restockHistory.filter(record => 
        record.source.toLowerCase().includes(lowerSearch) ||
        record.itemsRestocked.some(item => item.name.toLowerCase().includes(lowerSearch)) ||
        format(new Date(record.timestamp), 'MMM d, yyyy').toLowerCase().includes(lowerSearch)
      );
    }
  }, [salesHistory, restockHistory, searchHistoryTerm, auditType]);

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error(error);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      console.error(error);
      alert(error.message);
    }
  };

  const handleAddLocation = React.useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    const targetUid = profile.impersonatingUid || profile.uid;
    await inventoryService.addLocation(targetUid, newLocation);
    setNewLocation({ name: '' });
    refreshData();
  }, [profile, newLocation]);

  const handleDeleteLocation = React.useCallback(async (id: string) => {
    if (!profile || id === 'primary-node') return;
    const targetUid = profile.impersonatingUid || profile.uid;
    const isActive = (profile?.activeLocationId || 'primary-node') === id;

    try {
      if (isActive) {
        await inventoryService.updateProfile(targetUid, { activeLocationId: 'default' });
      }
      await inventoryService.deleteLocation(targetUid, id);
      await refreshData();
      if (isActive) {
        const p = await inventoryService.getProfile();
        setProfile(p);
      }
    } catch (error) {
      console.error("Location deletion failed:", error);
    }
  }, [profile]);

  const handleImpersonate = React.useCallback(async (targetUid: string | null) => {
    if (!profile || profile.role !== 'superadmin') return;
    await inventoryService.updateProfile(profile.uid, { impersonatingUid: targetUid || undefined });
    const p = await inventoryService.getProfile();
    setProfile(p);
    refreshData(p);
  }, [profile]);

  const handleSwitchLocation = React.useCallback(async (locationId: string) => {
    if (!profile) return;
    // Update the profile of whoever we are currently viewing
    const targetUid = profile.impersonatingUid || profile.uid;
    await inventoryService.updateProfile(targetUid, { activeLocationId: locationId });
    const p = await inventoryService.getProfile();
    setProfile(p);
    refreshData(p);
  }, [profile]);

  const handleOverviewAction = React.useCallback((action: 'sales' | 'restock' | 'intel' | 'requisition') => {
    if (action === 'sales') setIsProcessingSales(true);
    if (action === 'restock') setIsProcessingRestock(true);
    if (action === 'intel') setIsResourceIntelOpen(true);
    if (action === 'requisition') setActiveTab('requisition');
  }, []);

  const handleSignOut = () => {
    signOut(auth);
  };

  const handleApproveTenant = async (uid: string, isApproved: boolean) => {
    await inventoryService.updateProfile(uid, { isApproved });
    refreshData();
  };

  const handleUpdateSubscription = async (uid: string, tier: SubscriptionTier) => {
    await inventoryService.updateProfile(uid, { subscriptionTier: tier });
    refreshData();
  };

  const handleUpdateTabs = async (uid: string, tabs: AppTab[]) => {
    await inventoryService.updateProfile(uid, { enabledTabs: tabs });
    refreshData();
  };

  const handleUpdateTheme = async (uid: string, theme: any) => {
    await inventoryService.updateProfile(uid, { theme });
    refreshData();
  };

  const handleUpdatePermissions = React.useCallback(async (uid: string, updates: any) => {
    await inventoryService.updateProfile(uid, updates);
    refreshData();
  }, [profile]);
  
  // Dynamic Branding Effect
  React.useEffect(() => {
    const theme = activeThemeProfile?.theme;
    if (theme?.primaryColor) {
      document.documentElement.style.setProperty('--primary-accent', theme.primaryColor);
      document.documentElement.style.setProperty('--secondary-accent', '#C88D67');
    } else {
      document.documentElement.style.setProperty('--primary-accent', '#5A5A40');
      document.documentElement.style.setProperty('--secondary-accent', '#C88D67');
    }
  }, [activeThemeProfile?.theme]);

  const handleDeleteTenant = async (uid: string) => {
    await inventoryService.deleteTenant(uid);
    refreshData();
  };

  const totalInventoryValue = useMemo(() => {
    return inventory.reduce((acc, item) => acc + (item.quantity * item.price), 0);
  }, [inventory]);

  const recentRestockCost = useMemo(() => {
    return restockHistory.reduce((acc, record) => acc + (record.totalCost || 0), 0);
  }, [restockHistory]);

  const marketInsights = useMemo(() => {
    return inventory.map(item => {
      const itemRestocks = restockHistory.flatMap(r => 
        r.itemsRestocked
          .filter(ri => 
            ri.name.toLowerCase().includes(item.name.toLowerCase()) || 
            item.name.toLowerCase().includes(ri.name.toLowerCase())
          )
          .map(ri => ({ ...ri, timestamp: r.timestamp, source: r.source }))
      );

      if (itemRestocks.length < 2) {
        // Fallback: If only one restock, compare with its own price vs current (might be same)
        return null;
      }

      const sortedRestocks = itemRestocks.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const latest = sortedRestocks[0];
      const previous = sortedRestocks[1];

      if (!latest.price || !previous.price) return null;

      const change = ((latest.price - previous.price) / previous.price) * 100;

      if (Math.abs(change) < 0.01) return null; // Ignore negligible changes

      return {
        id: item.id,
        name: item.name,
        supplier: item.supplier || latest.source,
        currentPrice: latest.price,
        previousPrice: previous.price,
        change,
        type: change > 0 ? 'inflation' : 'discount'
      };
    }).filter(Boolean);
  }, [inventory, restockHistory]);

  const chartData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dateStr = format(date, 'MMM d');
      const daySales = salesHistory.filter(s => 
        format(new Date(s.timestamp), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );
      const totalUnits = daySales.reduce((acc, s) => acc + s.itemsSold.reduce((ia, item) => ia + item.quantity, 0), 0);
      return { name: dateStr, units: totalUnits || 0 };
    });
    return days;
  }, [salesHistory]);

  const topItemsData = useMemo(() => {
    const itemMap = new Map<string, number>();
    salesHistory.forEach(record => {
      record.itemsSold.forEach(item => {
        const name = item.name.toLowerCase();
        itemMap.set(name, (itemMap.get(name) || 0) + item.quantity);
      });
    });
    return Array.from(itemMap.entries())
      .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [salesHistory]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !newItem.name.trim()) return;
    
    if (!isSuperAdmin && profile?.permissions && !profile.permissions.canAddItems) {
      alert("Permission denied: You do not have access to create items.");
      return;
    }

    setIsSubmitting(true);
    try {
      await inventoryService.addItem({ ...newItem, name: newItem.name.trim() });
      setNewItem({ name: '', quantity: 0, unit: '', threshold: 0, price: 0, supplier: '' });
      setIsAddingItem(false);
      refreshData();
    } catch (error) {
      console.error(error);
      alert("Failed to add item. Please check permissions.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || isSubmitting || !editingItem.name.trim()) return;

    if (!isSuperAdmin && profile?.permissions && !profile.permissions.canEditItems) {
      alert("Permission denied: You do not have access to edit items.");
      return;
    }

    setIsSubmitting(true);
    try {
      await inventoryService.updateItem(editingItem.id, {
        name: editingItem.name.trim(),
        quantity: editingItem.quantity,
        unit: editingItem.unit,
        threshold: editingItem.threshold,
        price: editingItem.price,
        supplier: editingItem.supplier
      });
      setEditingItem(null);
      refreshData();
    } catch (error) {
      console.error(error);
      alert("Update failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!isSuperAdmin && profile?.permissions && !profile.permissions.canDeleteItems) {
      alert("Permission denied: You do not have access to delete items.");
      return;
    }
    setItemToDelete(id);
  };

  const confirmDelete = async () => {
    if (!itemToDelete || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await inventoryService.deleteItem(itemToDelete);
      setItemToDelete(null);
      refreshData();
    } catch (error) {
      console.error(error);
      alert("Deletion failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isSuperAdmin && profile?.permissions && !profile.permissions.canProcessSales) {
      alert("Permission denied: You do not have access to process sales scans.");
      return;
    }

    setIsAnalyzing(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        setLastScanPhoto(base64);
        const result = await analyzeSalesPhoto(base64, file.type);
        setAnalyzedItems(result);
      } catch (error) {
        console.error(error);
        alert("Analysis failed.");
      } finally {
        setIsAnalyzing(false);
      }
    };
  };

  const handleRestockFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isSuperAdmin && profile?.permissions && !profile.permissions.canProcessRestocks) {
      alert("Permission denied: You do not have access to process restock scans.");
      return;
    }

    setIsAnalyzing(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        setLastScanPhoto(base64);
        const result = await analyzeRestockPhoto(base64, file.type);
        setAnalyzedRestockItems(result);
      } catch (error) {
        console.error(error);
        alert("Restock analysis failed.");
      } finally {
        setIsAnalyzing(false);
      }
    };
  };

  const handleProductIntelFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsAnalyzing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = reader.result as string;
        setLastIntelPhoto(base64);
        const result = await identifyProduct(base64, file.type);
        setIdentifiedProduct(result);
        setIsAnalyzing(false);
      };
    } catch (error) {
      console.error(error);
      alert("Product identification failed.");
      setIsAnalyzing(false);
    }
  };

  const handleManualRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    const item = inventory.find(i => i.id === manualRestock.itemId);
    if (!item) return;
    
    await inventoryService.processRestock([{ name: item.name, quantity: manualRestock.quantity }], restockSource || "Manual Entry");
    setIsManualRestockOpen(false);
    setManualRestock({ itemId: '', quantity: 1 });
    setRestockSource('');
    refreshData();
  };

  const handleManualSale = async (e: React.FormEvent) => {
    e.preventDefault();
    const item = inventory.find(i => i.id === manualSale.itemId);
    if (!item) return;
    
    await inventoryService.processSales([{ name: item.name, quantity: manualSale.quantity }]);
    setIsManualSaleOpen(false);
    setManualSale({ itemId: '', quantity: 1 });
    refreshData();
  };

  const confirmSales = async () => {
    if (!analyzedItems) return;
    await inventoryService.processSales(analyzedItems);
    setAnalyzedItems(null);
    setIsProcessingSales(false);
    refreshData();
  };

  const confirmRestock = async () => {
    if (!analyzedRestockItems) return;
    await inventoryService.processRestock(analyzedRestockItems, restockSource || "Image Scan");
    setAnalyzedRestockItems(null);
    setIsProcessingRestock(false);
    setRestockSource('');
    refreshData();
  };

  const handleClearHistory = async () => {
    if (auditType === 'sales') {
      await inventoryService.clearSalesHistory();
    } else {
      await inventoryService.clearRestockHistory();
    }
    setIsClearingHistory(false);
    refreshData();
  };

  const downloadCSV = (headers: string[], rows: any[][], filename: string) => {
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        const val = cell === null || cell === undefined ? '' : String(cell);
        return `"${val.replace(/"/g, '""')}"`;
      }).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportInventory = () => {
    const headers = ["ID", "Name", "Quantity", "Unit", "Threshold", "Price", "Supplier", "Last Update"];
    const rows = inventory.map(item => [
      item.id,
      item.name,
      item.quantity,
      item.unit,
      item.threshold,
      item.price,
      item.supplier || 'N/A',
      item.lastStockUpdate
    ]);
    downloadCSV(headers, rows, `Inventory_Export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
  };

  const handleExportAudit = () => {
    if (auditType === 'sales') {
      const headers = ["Timestamp", "Transaction ID", "Items", "Total Value ($)"];
      const rows = salesHistory.map(record => [
        record.timestamp,
        record.id,
        record.itemsSold.map(i => `${i.name} (${i.quantity})`).join(' | '),
        (record.totalValue || 0).toFixed(2)
      ]);
      downloadCSV(headers, rows, `Sales_Audit_Export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    } else {
      const headers = ["Timestamp", "Restock ID", "Source", "Items", "Total Cost ($)"];
      const rows = restockHistory.map(record => [
        record.timestamp,
        record.id,
        record.source,
        record.itemsRestocked.map(i => `${i.name} (${i.quantity}) @ $${(i.price || 0).toFixed(2)}`).join(' | '),
        (record.totalCost || 0).toFixed(2)
      ]);
      downloadCSV(headers, rows, `Restock_Audit_Export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center">
        <RefreshCw className="animate-spin text-[#5A5A40]" size={32} />
      </div>
    );
  }

  if (!user) {
    return (
      <AuthScreen 
        authMode={authMode}
        setAuthMode={setAuthMode}
        handleEmailAuth={handleEmailAuth}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        handleSignIn={handleSignIn}
      />
    );
  }

  if (profile && !profile.isApproved && !isSuperAdmin) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 bg-[#C88D67]/10 rounded-[32px] flex items-center justify-center mb-8">
          <ShieldAlert size={48} className="text-[#C88D67]" />
        </div>
        <h1 className="text-3xl font-serif text-[#5A5A40] mb-4 italic">Verification Pending.</h1>
        <p className="max-w-md text-[#8C857D] font-medium leading-relaxed mb-10">
          Your account has been successfully created, but access requires a manual security audit by our administrators. Please contact your system provider to expedite verification.
        </p>
        <button 
          onClick={handleSignOut}
          className="px-8 py-4 bg-white border border-[#E8E2D9] text-[#5A5A40] rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#5A5A40] hover:text-white transition-all shadow-xl shadow-black/5"
        >
          Sign Out & Return Later
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#2D2A26] font-sans selection:bg-[#EBDCCB]">
      {/* Background Decorative Element */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-[#5A5A40]/5 rounded-full blur-[120px] -z-10 -translate-y-1/2 translate-x-1/2" />
      
      {/* Sidebar (Desktop Only) */}
      <Sidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSuperAdmin={isSuperAdmin}
        profile={profile}
        handleSignOut={handleSignOut}
        setIsAddingItem={setIsAddingItem}
        handleImpersonate={handleImpersonate}
      />

      {/* Mobile Header (Hidden on Desktop) */}
      <nav className="lg:hidden fixed top-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-2xl border-b border-[#E8E2D9]">
        <div className="px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-[14px] bg-brand-primary flex items-center justify-center text-white shadow-lg rotate-3">
              <Coffee size={20} />
            </div>
            <div>
              <h1 className="text-lg font-serif font-semibold text-brand-primary tracking-tight leading-none">Barista.OS</h1>
              <p className="text-[8px] text-[#8C857D] uppercase tracking-[0.2em] font-black mt-1">Intelligence Hub</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(isSuperAdmin || profile?.permissions?.canAddItems) && (
              <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsAddingItem(true)}
                className="bg-brand-primary text-white p-3 rounded-xl shadow-lg shadow-brand-primary/20"
              >
                <Plus size={18} />
              </motion.button>
            )}
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={handleSignOut}
              className="text-[#8C857D] p-2"
            >
              <LogOut size={20} />
            </motion.button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="lg:ml-72 transition-all duration-300">
        <main className="max-w-6xl mx-auto px-6 pt-28 lg:pt-16 pb-40 lg:pb-32">
        {/* System Status & Global Context Bar */}
        <div className="mb-12 py-8 px-12 bg-white border border-[#E8E2D9] rounded-[48px] shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-12">
          <div className="flex flex-col sm:flex-row sm:items-center gap-12">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8C857D] mb-4">Infrastructure Core</span>
              <div className="flex items-center gap-6">
                <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse shadow-[0_0_20px_rgba(34,197,94,0.3)]" />
                <div className="flex flex-col">
                  <span className="text-4xl font-mono font-black text-brand-primary leading-none tracking-tighter">
                    {format(currentTime, 'HH:mm:ss')}
                  </span>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] text-[#8C857D] font-bold uppercase tracking-widest">
                      {format(currentTime, 'EEEE, LLLL dd')}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-[#E8E2D9]" />
                    <span className="text-[10px] font-black text-brand-primary uppercase tracking-tighter">Cortex v4.0 Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col flex-1">
          <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <MapPin size={12} className="text-[#C88D67]" />
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#8C857D]">Deployment Nodes</span>
              </div>
              <div className="flex items-center gap-2">
                {isSuperAdmin && (
                  <button 
                    onClick={() => setIsManagingPermissions(true)}
                    className="px-5 py-2 bg-[#F9F8F6] border border-[#E8E2D9] text-[#8C857D] hover:text-[#C88D67] hover:border-[#C88D67] rounded-full transition-all flex items-center gap-2 group"
                  >
                    <ShieldCheck size={12} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Access Controls</span>
                  </button>
                )}
                <button 
                  onClick={() => setIsManagingLocations(true)}
                  className="px-5 py-2 bg-[#F9F8F6] border border-[#E8E2D9] text-[#8C857D] hover:text-[#5A5A40] hover:border-[#5A5A40] rounded-full transition-all flex items-center gap-2 group"
                >
                  <Settings size={12} className="group-hover:rotate-90 transition-transform duration-500" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Manage Nodes</span>
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {locations.map((loc, idx) => {
                const isActive = (profile?.activeLocationId || 'primary-node') === loc.id;
                return (
                  <button
                    key={`${loc.id}-${idx}`}
                    onClick={() => handleSwitchLocation(loc.id)}
                    className={cn(
                      "group relative min-w-[140px] p-4 rounded-[28px] border transition-all duration-300 text-left",
                      isActive 
                        ? "bg-brand-primary border-brand-primary shadow-2xl shadow-brand-primary/30 -translate-y-1" 
                        : "bg-[#F9F8F6] border-[#E8E2D9] hover:border-brand-primary/30 hover:bg-white"
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={cn(
                        "p-2 rounded-xl transition-colors",
                        isActive ? "bg-white/10" : "bg-white border border-[#E8E2D9]"
                      )}>
                        <MapPin size={14} className={isActive ? "text-white" : "text-brand-primary"} />
                      </div>
                      {isActive && (
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
                      )}
                    </div>
                    <p className={cn(
                      "text-[10px] font-black uppercase tracking-widest truncate",
                      isActive ? "text-white" : "text-brand-primary"
                    )}>
                      {loc.name}
                    </p>
                    <p className={cn(
                      "text-[8px] font-bold uppercase mt-1",
                      isActive ? "text-white/50" : "text-[#8C857D]"
                    )}>
                      {isActive ? 'Primary Buffer' : 'Auxiliary Site'}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'market' && (
            <MarketWatch insights={marketInsights as any} />
          )}

           {activeTab === 'dashboard' && (
            <Overview 
              totalInventoryValue={totalInventoryValue}
              criticalItems={inventory.filter(i => i.quantity <= i.threshold)}
              recentRestockCost={recentRestockCost}
              chartData={chartData}
              topItemsData={topItemsData}
              onAction={handleOverviewAction}
              isApproved={!!profile?.isApproved} profile={profile}
            />
          )}

          {activeTab === 'inventory' && (
            <SupplyGrid 
              filteredInventory={filteredInventory}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              handleExportInventory={handleExportInventory}
              setEditingItem={setEditingItem}
              handleDeleteItem={handleDeleteItem}
              onViewPriceHistory={setViewingPriceHistoryItem}
              inventoryCount={inventory.filter(i => i.quantity > 0).length}
              profile={profile}
              isSuperAdmin={isSuperAdmin}
            />
          )}

          {activeTab === 'requisition' && (
            <RequisitionQueue
              inventory={inventory}
              salesHistory={salesHistory}
              onDispatchOrder={(itemId, quantity, supplier) => {
                setManualRestock({ itemId, quantity });
                setRestockSource(supplier || '');
                setIsManualRestockOpen(true);
              }}
            />
          )}

          {activeTab === 'history' && (
            <AuditLedger 
              auditType={auditType}
              setAuditType={setAuditType}
              filteredHistory={filteredHistory}
              searchHistoryTerm={searchHistoryTerm}
              setSearchHistoryTerm={setSearchHistoryTerm}
              handleExportAudit={handleExportAudit}
              setIsClearingHistory={setIsClearingHistory}
              loadMoreHistory={loadMoreHistory}
              isHistoryLoadingMore={isHistoryLoadingMore}
              hasMore={salesHistory.length >= historyLimit || restockHistory.length >= historyLimit || stockHistory.length >= historyLimit}
              stockHistory={stockHistory}
            />
          )}

          {activeTab === 'intel' && (
            <RegionIntel
              locations={locations}
              activeLocationId={profile?.activeLocationId || 'default'}
              onUpdateLocationRegion={async (locationId, country, region) => {
                if (!profile) return;
                const targetUid = profile.impersonatingUid || profile.uid;
                await inventoryService.updateLocation(targetUid, locationId, { country, region });
                refreshData();
              }}
              profile={profile}
            />
          )}

          {activeTab === 'admin' && isSuperAdmin && (
            <AdminPanel 
              isAdminLoading={isAdminLoading}
              allTenants={allTenants}
              handleImpersonate={handleImpersonate}
              handleUpdateSubscription={handleUpdateSubscription}
              handleUpdateTabs={handleUpdateTabs}
              handleApproveTenant={handleApproveTenant}
              handleDeleteTenant={handleDeleteTenant}
              handleUpdateTheme={handleUpdateTheme}
            />
          )}
        </AnimatePresence>
      </main>
    </div>

      {/* Persistent Quick Controls FAB & Mobile Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 z-[110] lg:hidden">
                {/* Quick Controls above the nav */}
        <div className="px-6 pb-4 flex justify-between items-end">
           <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsMobileMenuOpen(true)}
            className="bg-[#C88D67] text-white p-5 rounded-[24px] shadow-2xl flex items-center justify-center shadow-[#C88D67]/30"
          >
            <Menu size={24} />
          </motion.button>

          {(isSuperAdmin || profile?.permissions?.canProcessSales) && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsProcessingSales(true)}
              className="bg-[#5A5A40] text-white w-16 h-16 rounded-[24px] shadow-2xl flex items-center justify-center shadow-[#5A5A40]/30"
            >
              <Camera size={28} />
            </motion.button>
          )}
        </div>

        <div className="bg-white/90 backdrop-blur-2xl border-t border-[#E8E2D9] px-6 py-3 flex items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
           {(isSuperAdmin || profile?.enabledTabs?.includes('dashboard')) && (
             <MobileNavTab active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={22}/>} label="Home" />
           )}
           {(isSuperAdmin || profile?.enabledTabs?.includes('inventory')) && (
             <MobileNavTab active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} icon={<Package size={22}/>} label="Stock" />
           )}
           {(isSuperAdmin || profile?.enabledTabs?.includes('requisition')) && (
             <MobileNavTab active={activeTab === 'requisition'} onClick={() => setActiveTab('requisition')} icon={<ShoppingBag size={22}/>} label="Orders" />
            )}
            {(isSuperAdmin || !profile?.enabledTabs || profile?.enabledTabs?.includes('intel')) && (
              <MobileNavTab active={activeTab === 'intel'} onClick={() => setActiveTab('intel')} icon={<Globe size={22}/>} label="Intel" />
           )}
           {isSuperAdmin ? (
             <MobileNavTab active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} icon={<ShieldCheck size={22}/>} label="Admin" />
           ) : (
             (profile?.enabledTabs?.includes('history')) && (
               <MobileNavTab active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<History size={22}/>} label="Logs" />
             )
           )}
        </div>
      </div>

      {/* Desktop FABs */}
      <div className="hidden lg:flex fixed bottom-8 right-8 z-[90] flex-col gap-4">
        <motion.button
          whileHover={{ x: -4, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsMobileMenuOpen(true)}
          className="bg-[#C88D67] text-white px-8 py-5 rounded-[24px] shadow-2xl flex items-center gap-4 text-[11px] font-black uppercase tracking-[0.2em] shadow-[#C88D67]/30"
        >
          <Menu size={20} />
          Manual Controls
        </motion.button>
        
        {(isSuperAdmin || profile?.permissions?.canProcessSales) && (
          <motion.button
            whileHover={{ x: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsProcessingSales(true)}
            className="bg-[#5A5A40] text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center shadow-[#5A5A40]/30 self-end"
          >
            <Camera size={24} />
          </motion.button>
        )}
      </div>

      <ManualControls 
        isMenuOpen={isMobileMenuOpen}
        setIsMenuOpen={setIsMobileMenuOpen}
        isRestockOpen={isManualRestockOpen}
        setIsRestockOpen={setIsManualRestockOpen}
        isSaleOpen={isManualSaleOpen}
        setIsSaleOpen={setIsManualSaleOpen}
        inventory={inventory}
        manualRestock={manualRestock}
        setManualRestock={setManualRestock}
        manualSale={manualSale}
        setManualSale={setManualSale}
        restockSource={restockSource}
        setRestockSource={setRestockSource}
        handleManualRestock={handleManualRestock}
        handleManualSale={handleManualSale}
        handleSignOut={handleSignOut}
        userEmail={user?.email}
        profile={profile}
        isSuperAdmin={isSuperAdmin}
      />

      {/* Item Modals & Other Overlays */}
      <AnimatePresence>
        {editingItem && (
          <Modal onClose={() => setEditingItem(null)} title="Modify Asset">
            <form onSubmit={handleUpdateItem} className="space-y-6">
              <InputGroup 
                label="Resource Identity" 
                value={editingItem.name} 
                onChange={v => setEditingItem({...editingItem, name: v})} 
                placeholder="e.g. Specialty Beans" 
              />
              <div className="grid grid-cols-2 gap-4">
                <InputGroup 
                  label="Current Volume" 
                  value={(editingItem.quantity || 0).toString()} 
                  onChange={v => setEditingItem({...editingItem, quantity: parseInt(v) || 0})} 
                  type="number" 
                />
                <InputGroup 
                  label="Scale (Unit)" 
                  value={editingItem.unit} 
                  onChange={v => setEditingItem({...editingItem, unit: v})} 
                  placeholder="kg / L / unit" 
                />
              </div>
            <div className="grid grid-cols-2 gap-4">
                <InputGroup 
                  label="Scarcity Threshold" 
                  value={(editingItem.threshold || 0).toString()} 
                  onChange={v => setEditingItem({...editingItem, threshold: parseInt(v) || 0})} 
                  type="number" 
                />
                <InputGroup 
                  label="Unit Price ($)" 
                  value={(editingItem.price || 0).toString()} 
                  onChange={v => setEditingItem({...editingItem, price: parseFloat(v) || 0})} 
                  type="number" 
                />
              </div>
              <InputGroup 
                label="Supplier Info" 
                value={editingItem.supplier || ''} 
                onChange={v => setEditingItem({...editingItem, supplier: v})} 
                placeholder="Current source entity..." 
              />
              {isSuperAdmin && (
                <div className="flex items-center gap-4 p-4 border border-[#F0EBE4] rounded-2xl bg-[#FDFBF9]">
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#5A5A40]">Cross-Tenant Visibility</p>
                    <p className="text-[10px] text-[#8C857D]">Allow other tenants to view this item/price</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setEditingItem({...editingItem, isVisibleToTenants: !editingItem.isVisibleToTenants})}
                    className={cn(
                      "w-12 h-6 rounded-full transition-all relative",
                      editingItem.isVisibleToTenants ? "bg-[#5A5A40]" : "bg-gray-200"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                      editingItem.isVisibleToTenants ? "right-1" : "left-1"
                    )} />
                  </button>
                </div>
              )}
              <div className="pt-4 flex gap-4">
                <button 
                   type="submit" 
                   disabled={isSubmitting}
                   className="flex-1 bg-[#5A5A40] text-white py-5 rounded-2xl font-bold text-xs uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all shadow-xl disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <RefreshCw className="animate-spin" size={16} /> : null}
                  {isSubmitting ? "Updating..." : "Commit Updates"}
                </button>
                <button 
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setEditingItem(null)}
                  className="px-8 py-5 rounded-2xl border border-[#E8E2D9] text-[#8C857D] font-bold text-xs uppercase tracking-widest hover:bg-[#F9F8F6] transition-all disabled:opacity-50"
                >
                  Abort
                </button>
              </div>
            </form>
          </Modal>
        )}

        {isAddingItem && (
          <Modal onClose={() => setIsAddingItem(false)} title="Registry Entry">
            <form onSubmit={handleAddItem} className="space-y-6">
              <InputGroup label="Entity Name" value={newItem.name} onChange={v => setNewItem({...newItem, name: v})} placeholder="e.g. Arabica Beans" />
              <div className="grid grid-cols-2 gap-4">
                <InputGroup label="Initial Level" value={(newItem.quantity || 0).toString()} onChange={v => setNewItem({...newItem, quantity: parseInt(v) || 0})} type="number" />
                <InputGroup label="Unit Descriptor" value={newItem.unit} onChange={v => setNewItem({...newItem, unit: v})} placeholder="kg / bags / caps" />
              </div>
            <div className="grid grid-cols-2 gap-4">
                <InputGroup label="Threshold Alert" value={(newItem.threshold || 0).toString()} onChange={v => setNewItem({...newItem, threshold: parseInt(v) || 0})} type="number" />
                <InputGroup label="Unit Price ($)" value={(newItem.price || 0).toString()} onChange={v => setNewItem({...newItem, price: parseFloat(v) || 0})} type="number" />
              </div>
              <InputGroup label="Primary Supplier" value={newItem.supplier} onChange={v => setNewItem({...newItem, supplier: v})} placeholder="e.g. Origin Coffee Imports" />
              {isSuperAdmin && (
                <div className="flex items-center gap-4 p-4 border border-[#F0EBE4] rounded-2xl bg-[#FDFBF9]">
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#5A5A40]">Cross-Tenant Visibility</p>
                    <p className="text-[10px] text-[#8C857D]">Allow other tenants to view this item/price</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setNewItem({...newItem, isVisibleToTenants: !newItem.isVisibleToTenants} as any)}
                    className={cn(
                      "w-12 h-6 rounded-full transition-all relative",
                      (newItem as any).isVisibleToTenants ? "bg-[#5A5A40]" : "bg-gray-200"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                      (newItem as any).isVisibleToTenants ? "right-1" : "left-1"
                    )} />
                  </button>
                </div>
              )}
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-[#5A5A40] text-white py-5 rounded-2xl font-bold text-xs uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <RefreshCw className="animate-spin" size={16} /> : null}
                {isSubmitting ? "Registering..." : "Confirm Entry"}
              </button>
            </form>
          </Modal>
        )}

        {isProcessingSales && (
          <Modal onClose={() => !isAnalyzing && setIsProcessingSales(false)} title="Daily Outflow Scan">
            {!analyzedItems ? (
              <div className="space-y-8">
                <div className="bg-[#5A5A40] border-2 border-dashed border-white/20 rounded-[32px] p-12 text-center text-white shadow-inner relative overflow-hidden group">
                  <div className="absolute inset-0 bg-[#5A5A40] group-hover:bg-[#4A4A35] transition-colors" />
                  {isAnalyzing ? (
                    <div className="relative z-10 flex flex-col items-center gap-6">
                      <RefreshCw className="animate-spin text-white/50" size={48} />
                      <p className="font-serif text-2xl italic">Gemini is auditing...</p>
                    </div>
                  ) : (
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-8 border border-white/10 shadow-2xl">
                        <Camera size={36} />
                      </div>
                      <p className="font-serif text-2xl mb-3 lowercase italic text-white/90">sync reality.</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black mb-10 max-w-[200px]">Upload end-of-day sales logs or registers</p>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <button 
                          onClick={() => {
                            setCameraPurpose('sale');
                            setIsCameraOpen(true);
                          }}
                          className="bg-white text-[#5A5A40] px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#F9F8F6] active:scale-95 transition-all shadow-2xl flex items-center gap-2"
                        >
                          <Camera size={14} />
                          Tap to Snap
                        </button>
                        <label className="bg-white/10 text-white border border-white/20 px-10 py-4 rounded-2xl cursor-pointer text-[10px] font-black uppercase tracking-widest hover:bg-white/20 active:scale-95 transition-all">
                          Upload File
                          <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {lastScanPhoto && (
                    <div className="rounded-[24px] overflow-hidden border border-[#E8E2D9] h-full bg-black flex items-center justify-center">
                      <img src={lastScanPhoto} alt="Original Scan" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    </div>
                  )}
                  <div className="bg-[#F9F8F6] border border-[#E8E2D9] rounded-[32px] p-8">
                    <h4 className="font-serif text-xl text-[#5A5A40] mb-6 italic">Verified Audit.</h4>
                    <div className="space-y-4">
                      {analyzedItems.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between py-3 border-b border-[#E8E2D9]/40 last:border-0 font-medium">
                          <span className="text-[#2D2A26] capitalize">{item.name}</span>
                          <span className="font-mono bg-red-50 text-red-600 px-3 py-1 rounded-xl text-xs">-{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button onClick={confirmSales} className="flex-1 bg-[#5A5A40] text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:opacity-90 transition-all">Synchronize Levels</button>
                  <button onClick={() => setAnalyzedItems(null)} className="px-8 py-5 rounded-2xl border border-[#E8E2D9] text-[#8C857D] font-black text-[10px] uppercase tracking-widest hover:bg-[#F9F8F6] transition-all">Discard</button>
                </div>
              </div>
            )}
          </Modal>
        )}

        {isProcessingRestock && (
          <Modal onClose={() => !isAnalyzing && setIsProcessingRestock(false)} title="Restock Intake" color="#C88D67">
            {!analyzedRestockItems ? (
              <div className="space-y-8">
                <div className="bg-[#C88D67] border-2 border-dashed border-white/20 rounded-[32px] p-12 text-center text-white shadow-inner relative overflow-hidden group">
                  <div className="absolute inset-0 bg-[#C88D67] group-hover:bg-[#B57C5A] transition-colors" />
                  {isAnalyzing ? (
                    <div className="relative z-10 flex flex-col items-center gap-6">
                      <RefreshCw className="animate-spin text-white/50" size={48} />
                      <p className="font-serif text-2xl italic text-white/80">Scanning Arrivals...</p>
                    </div>
                  ) : (
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-8 border border-white/10 shadow-2xl">
                        <TrendingUp size={36} />
                      </div>
                      <p className="font-serif text-2xl mb-3 lowercase italic text-white/90">Arrivals audit.</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black mb-10 max-w-[200px]">Scan invoices or handwritten delivery notes</p>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <button 
                          onClick={() => {
                            setCameraPurpose('restock');
                            setIsCameraOpen(true);
                          }}
                          className="bg-white text-[#C88D67] px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#F9F8F6] active:scale-95 transition-all shadow-2xl flex items-center gap-2"
                        >
                          <Camera size={14} />
                          Live Scan
                        </button>
                        <label className="bg-white/10 text-white border border-white/20 px-10 py-4 rounded-2xl cursor-pointer text-[10px] font-black uppercase tracking-widest hover:bg-white/20 active:scale-95 transition-all">
                          Browse Files
                          <input type="file" accept="image/*" className="hidden" onChange={handleRestockFileUpload} />
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {lastScanPhoto && (
                    <div className="rounded-[24px] overflow-hidden border border-[#E8E2D9] h-full bg-black flex items-center justify-center">
                      <img src={lastScanPhoto} alt="Arrival Scan" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    </div>
                  )}
                  <div className="bg-[#F9F8F6] border border-[#E8E2D9] rounded-[32px] p-8">
                    <h4 className="font-serif text-xl text-[#C88D67] mb-6 italic">Confirmed Arrivals.</h4>
                    <div className="space-y-4 mb-8">
                      <InputGroup 
                        label="Source / Supplier" 
                        value={restockSource} 
                        onChange={setRestockSource} 
                        placeholder="Invoiced entity..." 
                      />
                    </div>
                    <div className="space-y-4">
                      {analyzedRestockItems.map((item, idx) => {
                        const currentItem = inventory.find(i => 
                          i.name.toLowerCase().includes(item.name.toLowerCase()) || 
                          item.name.toLowerCase().includes(i.name.toLowerCase())
                        );
                        const isPriceHigher = currentItem && item.price && item.price > currentItem.price;
                        
                        return (
                          <div key={idx} className="flex items-center justify-between py-3 border-b border-[#E8E2D9]/40 last:border-0 font-medium">
                            <div className="flex flex-col">
                              <span className="text-[#2D2A26] capitalize">{item.name}</span>
                              {item.price && item.price > 0 && (
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-[#C88D67] font-bold">${item.price.toFixed(2)}/unit</span>
                                  {isPriceHigher && (
                                    <span className="flex items-center gap-0.5 text-[8px] font-black uppercase tracking-widest text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                                      <TrendingUp size={10} /> Inflation
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            <span className="font-mono bg-green-50 text-green-600 px-3 py-1 rounded-xl text-xs">+{item.quantity}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button onClick={confirmRestock} className="flex-1 bg-[#C88D67] text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:opacity-90 transition-all">Commit Intake</button>
                  <button onClick={() => setAnalyzedRestockItems(null)} className="px-8 py-5 rounded-2xl border border-[#E8E2D9] text-[#8C857D] font-black text-[10px] uppercase tracking-widest hover:bg-[#F9F8F6] transition-all">Retry</button>
                </div>
              </div>
            )}
          </Modal>
        )}

        {isManagingLocations && (
          <LocationManager 
            onClose={() => setIsManagingLocations(false)}
            locations={locations}
            activeLocationId={profile?.activeLocationId || 'default'}
            onAdd={async (name) => {
              if (!profile || !name.trim()) return;
              const targetUid = profile.impersonatingUid || profile.uid;
              await inventoryService.addLocation(targetUid, { name: name.trim() });
              setNewLocation({ name: '' });
              refreshData();
            }}
            onUpdate={async (id, name) => {
              if (!profile || !name.trim()) return;
              const targetUid = profile.impersonatingUid || profile.uid;
              await inventoryService.updateLocation(targetUid, id, { name: name.trim() });
              refreshData();
            }}
            onDelete={handleDeleteLocation}
            newLocationName={newLocation.name}
            setNewLocationName={(v) => setNewLocation({ name: v })}
          />
        )}

        {isManagingPermissions && isSuperAdmin && (
          <PermissionManager 
            onClose={() => setIsManagingPermissions(false)}
            tenants={allTenants}
            onUpdatePermissions={handleUpdatePermissions}
          />
        )}

        <CameraOverlay 
          isOpen={isCameraOpen}
          onClose={() => setIsCameraOpen(false)}
          onCapture={(file) => {
            if (cameraPurpose === 'sale') {
              const event = { target: { files: [file] } } as any;
              handleFileUpload(event);
            } else if (cameraPurpose === 'intel') {
              const event = { target: { files: [file] } } as any;
              handleProductIntelFileUpload(event);
            } else {
              const event = { target: { files: [file] } } as any;
              handleRestockFileUpload(event);
            }
          }}
          title={
            cameraPurpose === 'sale' 
              ? "Capture Sale Sheet" 
              : cameraPurpose === 'intel' 
                ? "Capture Product for Intel" 
                : "Capture Restock Receipt"
          }
        />

        {isResourceIntelOpen && (
          <Modal onClose={() => !isAnalyzing && setIsResourceIntelOpen(false)} title="Resource Intelligence" color="#5A5A40">
            {!identifiedProduct ? (
              <div className="space-y-8">
                <div className="bg-[#5A5A40] border-2 border-dashed border-white/20 rounded-[32px] p-12 text-center text-white shadow-inner relative overflow-hidden group">
                  <div className="absolute inset-0 bg-[#5A5A40] group-hover:bg-[#4A4A35] transition-colors" />
                  {isAnalyzing ? (
                    <div className="relative z-10 flex flex-col items-center gap-6">
                      <RefreshCw className="animate-spin text-white/50" size={48} />
                      <p className="font-serif text-2xl italic">Deep Scanning Product...</p>
                    </div>
                  ) : (
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-8 border border-white/10 shadow-2xl">
                        <Package size={36} />
                      </div>
                      <p className="font-serif text-2xl mb-3 lowercase italic text-white/90">identify resource.</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black mb-10 max-w-[200px]">Photo any ingredient to see composition & alternatives</p>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <button 
                          onClick={() => {
                            setCameraPurpose('intel');
                            setIsCameraOpen(true);
                          }}
                          className="bg-white text-[#5A5A40] px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#F9F8F6] active:scale-95 transition-all shadow-2xl flex items-center gap-2"
                        >
                          <Camera size={14} />
                          Tap to Snap
                        </button>
                        <label className="bg-white/10 text-white border border-white/20 px-10 py-4 rounded-2xl cursor-pointer text-[10px] font-black uppercase tracking-widest hover:bg-white/20 active:scale-95 transition-all flex items-center justify-center">
                          Upload File
                          <input type="file" accept="image/*" className="hidden" onChange={handleProductIntelFileUpload} />
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {lastIntelPhoto && (
                    <div className="rounded-[24px] overflow-hidden border border-[#E8E2D9] h-full bg-black flex items-center justify-center min-h-[300px]">
                      <img src={lastIntelPhoto} alt="Product Photo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    </div>
                  )}
                  <div className="bg-[#F9F8F6] border border-[#E8E2D9] rounded-[32px] p-8">
                    <div className="mb-6">
                      <p className="text-[10px] font-black text-[#8C857D] uppercase tracking-widest mb-1">Identified Entity</p>
                      <h4 className="font-serif text-3xl text-[#5A5A40] italic leading-tight">{identifiedProduct.name}</h4>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <p className="text-[10px] font-black text-[#5A5A40] uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Coffee size={12} /> Composition / Ingredients
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {identifiedProduct.contents.map((c, i) => (
                            <span key={i} className="px-3 py-1 bg-white border border-[#E8E2D9] rounded-full text-xs font-medium text-[#2D2A26]">{c}</span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] font-black text-[#C88D67] uppercase tracking-widest mb-3 flex items-center gap-2">
                          <AlertCircle size={12} /> Logical Substitutes
                        </p>
                        <div className="space-y-2">
                          {identifiedProduct.substitutes.map((s, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 bg-white border border-[#FCEEE0] rounded-2xl">
                              <div className="w-8 h-8 rounded-full bg-[#FCEEE0] flex items-center justify-center text-[#C88D67] text-[10px] font-black">{i+1}</div>
                              <span className="text-sm font-medium text-[#2D2A26]">{s}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-6 border-t border-[#E8E2D9]/40">
                        <p className="text-[10px] font-black text-[#8C857D] uppercase tracking-widest mb-2">Profile Intel</p>
                        <p className="text-sm text-[#8C857D] leading-relaxed italic">{identifiedProduct.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <button onClick={() => setIdentifiedProduct(null)} className="w-full py-5 rounded-2xl border border-[#E8E2D9] text-[#8C857D] font-black text-[10px] uppercase tracking-widest hover:bg-[#F9F8F6] transition-all">New Search</button>
              </div>
            )}
          </Modal>
        )}

        {itemToDelete && (
          <Modal onClose={() => setItemToDelete(null)} title="Confirm Deletion" color="#EF4444">
            <div className="space-y-8">
              <div className="p-8 bg-red-50 rounded-[32px] border border-red-100 text-center">
                <Trash2 size={48} className="text-red-500 mx-auto mb-6" />
                <p className="text-[#2D2A26] font-medium mb-2">Are you certain you want to remove this resource?</p>
                <p className="text-xs text-[#8C857D]">This action is irreversible and will remove all associated stock data.</p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={confirmDelete}
                  disabled={isSubmitting}
                  className="flex-1 bg-red-500 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <RefreshCw className="animate-spin" size={16} /> : null}
                  {isSubmitting ? "Removing..." : "Confirm Delete"}
                </button>
                <button 
                  onClick={() => setItemToDelete(null)}
                  disabled={isSubmitting}
                  className="px-8 py-5 rounded-2xl border border-[#E8E2D9] text-[#8C857D] font-black text-[10px] uppercase tracking-widest hover:bg-[#F9F8F6] transition-all disabled:opacity-50"
                >
                  Abort
                </button>
              </div>
            </div>
          </Modal>
        )}

        {isClearingHistory && (
          <Modal onClose={() => setIsClearingHistory(false)} title="Wipe History Audit" color="#EF4444">
            <div className="space-y-8">
              <div className="p-8 bg-red-50 rounded-[32px] border border-red-100 text-center">
                <Trash2 size={48} className="text-red-500 mx-auto mb-6" />
                <p className="text-[#2D2A26] font-medium mb-2">Permanent Audit Erasure</p>
                <p className="text-xs text-[#8C857D]">You are about to delete the entire {auditType === 'sales' ? 'sales' : 'restock'} history. This cannot be undone.</p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={handleClearHistory}
                  className="flex-1 bg-red-500 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-red-600 transition-all"
                >
                  Wipe Data
                </button>
                <button 
                  onClick={() => setIsClearingHistory(false)}
                  className="px-8 py-5 rounded-2xl border border-[#E8E2D9] text-[#8C857D] font-black text-[10px] uppercase tracking-widest hover:bg-[#F9F8F6] transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </Modal>
        )}

        {viewingPriceHistoryItem && (
          <PriceHistoryModal 
            item={viewingPriceHistoryItem} 
            restockHistory={restockHistory} 
            onClose={() => setViewingPriceHistoryItem(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Sub-components are now in their own files
