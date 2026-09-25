import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface SubscriptionInfo {
  id: number;
  businessId: number;
  planId: number | null;
  tier: string;
  status: string;
  isTrial: number;
  startedAt: string | null;
  expiresAt: string | null;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  autoRenew: number;
  plan: any | null;
  /** Present when the desktop is linked to a Shega backend account. */
  cloudStatus?: string;
  cloudAccess?: 'full' | 'view_only';
  cloudPlanName?: string | null;
  cloudLicenseKey?: string | null;
}

interface RenewalInfo {
  daysRemaining: number;
  expiresAt: string;
  isExpired: boolean;
  needsRenewal: boolean;
  tier: string;
  status: string;
  isTrial: boolean;
}

interface SubscriptionContextType {
  subscription: SubscriptionInfo | null;
  loading: boolean;
  refresh: () => Promise<void>;
  status: string | null;
  isPremium: boolean;
  isTrial: boolean;
  isExpired: boolean;
  isReadOnly: boolean;
  daysRemaining: number;
  renewalInfo: RenewalInfo | null;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [renewalInfo, setRenewalInfo] = useState<RenewalInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [sub, renewal] = await Promise.all([
        window.api?.getCurrentSubscription(),
        window.api?.getRenewalInfo(),
      ]);
      setSubscription(sub);
      setRenewalInfo(renewal);
    } catch (err) {
      console.error('Failed to load subscription:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Access is no longer tiered: the plans differ by EDITION (Mobile / Desktop /
  // Mobile + Desktop), not by capability, so any active or trial subscription
  // unlocks the whole app. When linked to the backend its `access` flag wins.
  let isPremium = false;
  let isTrial = false;
  let isExpired = false;
  let isReadOnly = false;
  if (subscription) {
    const fullAccess = subscription.cloudAccess
      ? subscription.cloudAccess === 'full'
      : subscription.status === 'active';
    if (fullAccess) {
      isPremium = true;
      isTrial = !!subscription.isTrial;
      isExpired = !!renewalInfo?.isExpired;
      isReadOnly = isExpired;
    } else {
      isExpired = true;
      isReadOnly = true;
    }
  }
  const daysRemaining = renewalInfo?.daysRemaining ?? 0;

  return (
    <SubscriptionContext.Provider value={{
      subscription, loading, refresh,
      status: subscription?.status ?? null,
      isPremium, isTrial, isExpired, isReadOnly, daysRemaining, renewalInfo,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) throw new Error('useSubscription must be used within SubscriptionProvider');
  return context;
};
