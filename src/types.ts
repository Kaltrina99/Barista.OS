/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ProductInfo {
  name: string;
  contents: string[];
  substitutes: string[];
  description: string;
}

export interface Location {
  id: string;
  name: string;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  threshold: number;
  lastStockUpdate: string;
  price: number; // Cost per unit
  supplier?: string;
  locationId: string;
  isVisibleToTenants?: boolean; // Superadmin control
}

export interface RestockRecord {
  id: string;
  timestamp: string;
  itemsRestocked: SoldItem[]; // Reusing SoldItem for name/qty/price
  source: string;
  totalCost: number;
  locationId: string;
}

export interface SoldItem {
  name: string;
  quantity: number;
  price?: number; // Price found at time of scan
}

export interface SalesRecord {
  id: string;
  timestamp: string;
  photoUrl?: string;
  itemsSold: SoldItem[];
  extractedText?: string;
  status: 'processed' | 'pending';
  totalValue?: number;
  locationId: string;
}

export interface StockHistoryRecord {
  id: string;
  itemId: string;
  itemName: string;
  change: number;
  newQuantity: number;
  reason: 'sale' | 'restock' | 'manual_adjustment' | 'deletion' | 'creation';
  timestamp: string;
  locationId: string;
  userId: string;
}

export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'enterprise';
export type AppTab = 'dashboard' | 'inventory' | 'market' | 'requisition' | 'history';

export interface UserProfile {
  uid: string;
  email: string;
  subscriptionTier: SubscriptionTier;
  isApproved: boolean;
  role: 'superadmin' | 'tenant';
  activeLocationId?: string;
  createdAt: string;
  lastActive: string;
  impersonatingUid?: string; // For superadmin support
  enabledTabs?: AppTab[]; // Admin controlled access
    permissions?: {
      dashboard: boolean;
      inventory: boolean;
      market: boolean;
      requisition: boolean;
      history: boolean;
      canAddItems: boolean;
      canEditItems: boolean;
      canDeleteItems: boolean;
      canProcessSales: boolean;
      canProcessRestocks: boolean;
    };
}
