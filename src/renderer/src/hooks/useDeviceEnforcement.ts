import { useCallback, useEffect, useRef, useState } from 'react';

/** Statuses that block this desktop install (spec §17/§18 remote device control). */
const BLOCKING_STATUSES = ['locked', 'disabled', 'removed'];

const POLL_MS = 15_000;

export interface SelfDeviceStatus {
  found: boolean;
  deviceId: string;
  status: string | null;
  name: string | null;
}

export interface DeviceEnforcementState {
  status: string | null;
  blocked: boolean;
  name: string | null;
  reason: string;
  refresh: () => void;
}

function reasonFor(status: string): string {
  switch (status) {
    case 'locked':
      return 'This device has been locked by the business owner or manager. Contact them to unlock it.';
    case 'disabled':
      return 'This device has been disabled by the business owner. Contact them to reactivate it.';
    case 'removed':
      return 'This device has been removed from the business. Contact the owner to restore access.';
    default:
      return 'This device is not authorized for use with this business.';
  }
}

/**
 * Self-enforcement on the desktop receive side of remote device control.
 * Reads THIS install's roster status from the main process and re-checks on an
 * interval and on window focus, so an admin's remote lock/disable (relayed into
 * `roster_devices` by the sync hub) blocks the whole UI promptly.
 */
export function useDeviceEnforcement(): DeviceEnforcementState {
  const [info, setInfo] = useState<SelfDeviceStatus>({
    found: false,
    deviceId: '',
    status: null,
    name: null,
  });
  const infoRef = useRef<SelfDeviceStatus>(info);

  const refresh = useCallback(async () => {
    // Try the LAN-delivered roster status first; the cloud is authoritative when
    // it reports a status, so a remote disable arriving via the Internet path is
    // applied even if the LAN hub is off / on a different network (spec §17/§18).
    let status: string | null = null;
    let name: string | null = null;
    let found = false;
    try {
      const cloud = (await window.api.cloudSelfStatus()) as { status: string | null; blocked: boolean } | null;
      if (cloud && typeof cloud.status === 'string' && cloud.status.length > 0) {
        status = cloud.status;
        found = true;
      }
    } catch {
      // Cloud not configured / unreachable — fall through to LAN.
    }
    if (!found) {
      try {
        const next = (await window.api.businessSelfDeviceStatus()) as SelfDeviceStatus;
        status = next?.status ?? null;
        name = next?.name ?? null;
        found = !!next?.found;
      } catch {
        // Main process not ready / not paired — treat as unblocked.
      }
    }
    infoRef.current = { found, deviceId: '', status, name };
    setInfo(infoRef.current);
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_MS);
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [refresh]);

  const blocked = !!info.status && BLOCKING_STATUSES.includes(info.status);
  return {
    status: info.status,
    blocked,
    name: info.name,
    reason: blocked && info.status ? reasonFor(info.status) : '',
    refresh,
  };
}
