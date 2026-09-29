import { useSubscription } from './SubscriptionContext';
import { useSettings } from './SettingsContext';
import { useCallback } from 'react';

/**
 * Message explaining why the account is in view-only mode, derived from
 * the subscription status.
 */
function getViewOnlyMessage(sub: any): string {
  if (!sub) return '';
  const cloudAccess = sub.cloudAccess ?? (sub.status === 'active' ? 'full' : 'view_only');
  if (sub.status === 'payment_rejected') {
    return 'Your payment was rejected. Submit a valid payment to resume editing.';
  }
  if (sub.status === 'pending_payment') {
    return 'Your payment is still awaiting approval. Editing stays locked until it is approved.';
  }
  if (sub.status === 'expired' || cloudAccess === 'view_only') {
    return 'Your Shega subscription has expired. Renew to edit your business data.';
  }
  return 'Your account is currently read-only. Renew or upgrade your plan to resume editing.';
}

export interface ViewOnlyState {
  isViewOnly: boolean;
  message: string;
  refresh: () => Promise<void>;
}

/**
 * Hook that exposes the view-only state derived from the subscription.
 * Uses the existing subscription context to avoid duplicate fetches.
 */
export function useViewOnly(): ViewOnlyState {
  const { subscription, refresh, isReadOnly } = useSubscription();
  const { t } = useSettings();

  const message = subscription ? getViewOnlyMessage(subscription) : '';

  const wrappedRefresh = useCallback(async () => {
    await refresh();
  }, [refresh]);

  return {
    isViewOnly: isReadOnly,
    message: message || (isReadOnly ? t('view_only.default_message', 'Your subscription has expired. You can view data but cannot make changes.') : ''),
    refresh: wrappedRefresh,
  };
}

/**
 * Simple boolean hook for components that just need to disable mutations.
 */
export const useIsViewOnly = (): boolean => useViewOnly().isViewOnly;
export const useViewOnlyMessage = (): string => useViewOnly().message;