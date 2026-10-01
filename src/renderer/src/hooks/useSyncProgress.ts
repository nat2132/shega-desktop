/**
 * Renderer bindings for the desktop sync progress state.
 *
 * The state lives in the main process (where sync actually runs) and is pushed
 * over IPC. Two paths are needed for correctness:
 *
 *  - a PUSH listener, so a running bar tracks the real sync, and
 *  - a one-shot GET on mount, so a window that opens mid-sync renders the right
 *    value immediately instead of sitting at zero until the next state change.
 *
 * Without the GET, opening the settings panel after a finished sync would show
 * "idle" indefinitely — the push already happened and nothing more is coming.
 */

import { useEffect, useState } from 'react';
import type { SyncProgressState } from '@shega/shared';

const EMPTY: SyncProgressState = {
  phase: 'idle',
  total: 0,
  detected: 0,
  completed: 0,
  failed: 0,
  conflicts: 0,
  determinate: false,
  fraction: null,
  startedAt: null,
  updatedAt: 0,
  finishedAt: null,
  peerId: null,
  anotherPassQueued: false,
  consecutiveFailures: 0,
  error: null,
  label: 'idle',
};

/** Live sync state, kept in step with the main process. */
export function useSyncProgress(): SyncProgressState {
  const [state, setState] = useState<SyncProgressState>(EMPTY);

  useEffect(() => {
    let cancelled = false;
    // IPC goes through the preload bridge (`window.api`), never through the
    // `electron` package: the renderer runs with contextIsolation and has no
    // Node globals, so importing `electron` there drags in its binary-path
    // resolution and throws `__dirname is not defined` at load. That is a
    // runtime crash the typechecker cannot see, because the module resolves.
    const api = typeof window !== 'undefined' ? (window as any).api : undefined;
    if (!api) return;

    // Subscribe before fetching so a change landing between the two is not lost —
    // the GET would otherwise overwrite a newer pushed value with an older one.
    const unsubscribe = api.onSyncProgress((next: SyncProgressState) => {
      if (!cancelled && next) setState(next);
    });
    api.syncProgressGet()
      .then((current: SyncProgressState) => {
        if (!cancelled && current) setState(current);
      })
      .catch(() => { /* no sync running yet */ });

    return () => {
      cancelled = true;
      try { unsubscribe?.(); } catch { /* already gone */ }
    };
  }, []);

  return state;
}

export function useIsSyncActive(): boolean {
  const { phase } = useSyncProgress();
  return phase === 'checking' || phase === 'changes-found' || phase === 'syncing';
}

/**
 * A user-facing sentence.
 *
 * The state machine publishes a stable `label` key; the wording lives here so it
 * can be localized, and so "Syncing… 40%" is only rendered when the fraction is
 * real. An unknown total renders without a percentage rather than inventing one.
 */
export function useSyncStatusText(): string {
  const { phase, fraction, anotherPassQueued, total, completed, detected } = useSyncProgress();
  switch (phase) {
    case 'idle': return 'Not connected to a hub yet';
    case 'checking': return 'Checking for changes…';
    case 'changes-found':
      // Only "Found N" when the count is real — the peer often cannot report a
      // size before the batch is fetched, and "Found 0 changes" would be a lie.
      return detected > 0
        ? `Found ${detected} change${detected === 1 ? '' : 's'} — syncing now…`
        : 'Changes found — syncing now…';
    case 'syncing': {
      // Real counts when the batch size is known; a percentage is only shown
      // when the fraction is real, never guessed.
      if (total > 0) return `Applying changes… ${completed} / ${total}`;
      return fraction != null ? `Syncing… ${Math.round(fraction * 100)}%` : 'Syncing…';
    }
    case 'paused': return 'Connection interrupted — will resume when reconnected';
    case 'complete':
      return anotherPassQueued ? 'Sync complete — checking for more changes…' : 'All changes synced';
    case 'error': return 'Sync failed — retrying';
    case 'up-to-date': return 'All changes synced';
    default: return '';
  }
}
