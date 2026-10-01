/**
 * SyncStatusStrip — the desktop equivalent of the mobile SyncStatusBar.
 *
 * Same rules, same states, deliberately: a user moving between the two apps
 * should not have to learn two vocabularies for the same event.
 *
 * The bar is bound to real applied-counts. When the batch size is not yet known
 * the track is indeterminate rather than showing an invented percentage — a bar
 * that hits 100% while the sync is still running teaches the user to ignore it.
 */

import { useSyncProgress, useSyncStatusText } from '../hooks/useSyncProgress';

type Tone = 'busy' | 'ok' | 'problem';

const TONE_COLOR: Record<Tone, string> = {
  busy: 'var(--color-primary, #2563eb)',
  ok: 'var(--color-success, #16a34a)',
  problem: 'var(--color-danger, #dc2626)',
};

export interface SyncStatusStripProps {
  /** Hide entirely while idle (default). */
  hideWhenIdle?: boolean;
  /** Shown as a "Retry" action while the state is `error`. */
  onRetry?: () => void;
}

export default function SyncStatusStrip({ hideWhenIdle = true, onRetry }: SyncStatusStripProps) {
  const { phase, fraction, failed, conflicts } = useSyncProgress();
  const statusText = useSyncStatusText();

  const busy = phase === 'checking' || phase === 'changes-found' || phase === 'syncing' || phase === 'paused';
  const problem = phase === 'error';
  const done = phase === 'up-to-date' || phase === 'complete';

  if (hideWhenIdle && phase === 'idle') return null;
  // A finished result should not become permanent chrome.
  if (done && !busy) return null;

  const tone: Tone = problem ? 'problem' : busy ? 'busy' : 'ok';
  const determinate = fraction != null;
  const pct = determinate ? Math.round((fraction ?? 0) * 100) : 0;

  return (
    <div
      role="progressbar"
      aria-label={statusText}
      aria-valuemin={determinate ? 0 : undefined}
      aria-valuemax={determinate ? 100 : undefined}
      aria-valuenow={determinate ? pct : undefined}
      data-testid="sync-status-strip"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        padding: '8px 12px',
        borderBottom: '1px solid var(--color-border, #e5e7eb)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 12, color: TONE_COLOR[tone], whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {statusText}
        </span>
        {conflicts > 0 && (
          // Informational, not an error: last-write-wins resolved these. Showing
          // them in the failure colour next to "failed" makes a healthy sync look
          // like data loss.
          <span
            title="Both devices changed these records; the most recent version was kept."
            style={{ fontSize: 12, color: 'var(--color-warning, #b45309)', whiteSpace: 'nowrap' }}
          >
            {`${conflicts} conflict${conflicts === 1 ? '' : 's'} resolved`}
          </span>
        )}
        {failed > 0 && (
          <span style={{ fontSize: 12, color: TONE_COLOR.problem, whiteSpace: 'nowrap' }}>
            {`${failed} failed`}
          </span>
        )}
        {phase === 'error' && onRetry && (
          // An explicit retry, because "retrying" on its own can leave the user
          // watching a bar that never moves again.
          <button
            type="button"
            onClick={onRetry}
            style={{
              fontSize: 12,
              color: TONE_COLOR.problem,
              fontWeight: 600,
              background: 'transparent',
              border: `1px solid ${TONE_COLOR.problem}`,
              borderRadius: 4,
              padding: '1px 8px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Retry
          </button>
        )}
      </div>

      <div
        style={{
          height: 4,
          borderRadius: 2,
          background: 'var(--color-border, #e5e7eb)',
          overflow: 'hidden',
        }}
      >
        {determinate ? (
          <div style={{ height: '100%', width: `${pct}%`, background: TONE_COLOR[tone], transition: 'width 120ms linear' }} />
        ) : (
          // Indeterminate: the size is genuinely unknown, so the band slides
          // instead of claiming a percentage we do not have.
          <div
            style={{
              height: '100%',
              width: '35%',
              background: TONE_COLOR[tone],
              opacity: 0.7,
              animation: 'shega-sync-slide 1.1s ease-in-out infinite',
            }}
          />
        )}
      </div>

      <style>{'@keyframes shega-sync-slide { 0% { margin-left: -35% } 100% { margin-left: 100% } }'}</style>
    </div>
  );
}
