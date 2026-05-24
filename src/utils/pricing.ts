import { AppTab, UserProfile } from '../types';

export const FEATURE_INFO: Record<AppTab, { name: string; price: number; description: string }> = {
  dashboard: {
    name: 'Overview',
    price: 15.00,
    description: 'Dynamic 7-day trajectory graphs, volume dynamics, and alert metrics.'
  },
  inventory: {
    name: 'Supply/Stock',
    price: 25.00,
    description: 'Bento-style inventory grid, manual stock entry, and tracking.'
  },
  market: {
    name: 'Pricing Hub',
    price: 20.00,
    description: 'Boutique intelligence on active price adjustments and drops.'
  },
  requisition: {
    name: 'Ordering System',
    price: 20.00,
    description: 'Low-stock queue, order history, and manual requisitions.'
  },
  history: {
    name: 'Audit Logs',
    price: 15.00,
    description: 'Traceable operations logs and printable action histories.'
  },
};

/**
 * Calculates current price for a user's subscription based on their active features.
 * - Superadmins are always free.
 * - Tenants that the superadmin chose to be "free" (subscriptionTier === 'free') are free.
 * - Otherwise, cost is based on toggled features.
 */
export function calculateSubscriptionPrice(profile: UserProfile | null | undefined): {
  total: number;
  breakdown: Array<{ feature: AppTab; name: string; price: number }>;
  isFreeByConfig: boolean;
  isSuperAdmin: boolean;
} {
  if (!profile) {
    return { total: 0, breakdown: [], isFreeByConfig: false, isSuperAdmin: false };
  }

  const isSuper = profile.role === 'superadmin';
  const isFree = profile.subscriptionTier === 'free';

  const defaultTabs: AppTab[] = ['dashboard', 'inventory', 'requisition', 'history'];
  const activeTabs = profile.enabledTabs || defaultTabs;

  const breakdown = activeTabs.map(tab => ({
    feature: tab,
    name: FEATURE_INFO[tab]?.name || tab,
    price: FEATURE_INFO[tab]?.price || 0
  }));

  if (isSuper) {
    return {
      total: 0,
      breakdown,
      isFreeByConfig: false,
      isSuperAdmin: true,
    };
  }

  if (isFree) {
    return {
      total: 0,
      breakdown,
      isFreeByConfig: true,
      isSuperAdmin: false,
    };
  }

  // Calculate sum of active features
  const total = breakdown.reduce((sum, item) => sum + item.price, 0);

  return {
    total,
    breakdown,
    isFreeByConfig: false,
    isSuperAdmin: false,
  };
}
