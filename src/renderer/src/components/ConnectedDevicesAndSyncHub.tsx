import React from 'react';
import P2pSyncStatus from './P2pSyncStatus';
import SyncSettings from './SyncSettings';

/**
 * Devices & Sync Hub — Consolidated device pairing and synchronization view.
 *
 * Combines:
 * 1. Live connected devices (Desktop & Mobile), status, rename, unpair, and pairing radar
 * 2. Sync hub configuration, pairing code, QR code for phone scanning, verification & logs
 */
export const ConnectedDevicesAndSyncHub: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h3 className="text-xl font-black tracking-tight">Devices &amp; Sync Hub</h3>
        <p className="text-xs text-muted-foreground uppercase font-black tracking-widest">
          Manage device pairing, nearby discovery, pairing QR codes, and sync status
        </p>
      </div>

      {/* Connected devices list, status & discovery radar */}
      <P2pSyncStatus />

      {/* Sync hub configuration, QR code, verification & log */}
      <SyncSettings />
    </div>
  );
};

export default ConnectedDevicesAndSyncHub;
