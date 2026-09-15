/**
 * Subscribe to the main-process `data:changed` push event and re-invoke the
 * supplied refresh callback every time a sync pull lands new data.
 *
 * Pages call it once:
 *
 *     useDataChangedRefresh(loadData);
 *
 * The callback reference is updated on each render so the effect always calls
 * the latest version without needing to be a dependency.
 */
import { useEffect, useRef } from 'react';

export function useDataChangedRefresh(loadData: () => void | Promise<void>): void {
  const ref = useRef(loadData);
  ref.current = loadData;

  useEffect(() => {
    window.api.onDataChanged(() => {
      try { ref.current(); } catch {}
    });
    return () => { window.api.removeDataChangedListeners(); };
  }, []);
}