import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

/**
 * The main process blocks business-data writes while a linked account is
 * read-only (expired / rejected / unapproved payment). The preload flags those
 * rejections with a `shega:view-only` event; this turns that into a clear toast
 * and sends the user to the screen where they can renew.
 */
export const VIEW_ONLY_EVENT = 'shega:view-only';

const MARKER = '[SUBSCRIPTION_REQUIRED]';

export function isViewOnlyError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return message.includes(MARKER) || (error as any)?.code === 'SUBSCRIPTION_REQUIRED';
}

export function viewOnlyMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return message.replace(MARKER, '').trim() || 'Your Shega subscription has expired.';
}

/** Mount once inside the router to handle blocked writes globally. */
export function useViewOnlyNotice(): void {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onViewOnly = (event: Event) => {
      const message = (event as CustomEvent<{ message?: string }>).detail?.message;
      toast.error(message ? message.replace(MARKER, '').trim() : 'Your Shega subscription has expired.', {
        description: 'Renew or submit a valid payment to unlock editing.',
        duration: 8000,
      });
      if (!location.pathname.startsWith('/subscription')) navigate('/subscription');
    };

    window.addEventListener(VIEW_ONLY_EVENT, onViewOnly);
    return () => window.removeEventListener(VIEW_ONLY_EVENT, onViewOnly);
  }, [navigate, location.pathname]);
}
