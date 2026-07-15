import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Button } from './ui/button';
import {
  RefreshCw,
  Download,
  RotateCcw,
  Clock,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Rocket,
  ChevronDown,
} from 'lucide-react';

type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'not-available'
  | 'downloading'
  | 'downloaded'
  | 'error';

interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseNotes: string;
  files: { url: string; size: number }[];
}

interface UpdateProgress {
  bytesPerSecond: number;
  percent: number;
  total: number;
  transferred: number;
  eta: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialAction?: 'check' | 'auto';
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatSpeed(bytesPerSecond: number): string {
  return formatBytes(bytesPerSecond) + '/s';
}

function formatETA(seconds: number): string {
  if (seconds <= 0) return '';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function parseReleaseNotes(notes: string): string {
  if (!notes) return 'No release notes available.';
  return notes;
}

export const UpdateDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  initialAction = 'auto',
}) => {
  const [status, setStatus] = useState<UpdateStatus>('idle');
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [progress, setProgress] = useState<UpdateProgress | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [appVersion, setAppVersion] = useState<string>('');
  const [showNotes, setShowNotes] = useState(false);
  const progressRef = useRef(false);

  const reset = useCallback(() => {
    setStatus('idle');
    setUpdateInfo(null);
    setProgress(null);
    setErrorMessage(null);
    setShowNotes(false);
    progressRef.current = false;
  }, []);

  useEffect(() => {
    if (!open) {
      reset();
      return;
    }

    window.api.removeUpdateListeners?.();
    window.api.onUpdateStatus?.((data) => {
      const s = data.status as UpdateStatus;
      setStatus(s);
      if (data.info) setUpdateInfo(data.info);
      if (s === 'downloaded') progressRef.current = false;
    });
    window.api.onUpdateProgress?.((data) => {
      setProgress(data);
    });
    window.api.onUpdateError?.((data) => {
      setErrorMessage(data.message);
    });

    window.api.getAppVersion?.().then(setAppVersion).catch(() => {});

    if (initialAction === 'check') {
      handleCheck();
    } else if (initialAction === 'auto') {
      handleCheck();
    }

    return () => {
      window.api.removeUpdateListeners?.();
    };
  }, [open]);

  const handleCheck = async () => {
    setStatus('checking');
    setProgress(null);
    setErrorMessage(null);
    setUpdateInfo(null);
    try {
      const result = await window.api.checkForUpdates?.();
      if (!result) return;
      if (result.status === 'available' && result.info) {
        setStatus('available');
        setUpdateInfo(result.info);
      } else if (result.status === 'not-available') {
        setStatus('not-available');
      } else if (result.status === 'error' && result.error) {
        setStatus('error');
        setErrorMessage(result.error);
      } else if (result.status === 'idle') {
        setStatus('idle');
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Failed to check for updates');
    }
  };

  const handleDownload = async () => {
    setStatus('downloading');
    progressRef.current = true;
    try {
      await window.api.downloadUpdate?.();
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Download failed');
    }
  };

  const handleInstall = () => {
    window.api.installUpdate?.();
  };

  const handleSkip = async () => {
    if (updateInfo?.version) {
      await window.api.skipVersion?.(updateInfo.version);
    }
    onOpenChange(false);
  };

  const handleRemindLater = async () => {
    await window.api.remindLater?.(24);
    onOpenChange(false);
  };

  const fileSize = updateInfo?.files?.[0]?.size ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={status !== 'downloading'}
        className="max-w-md p-0 gap-0 overflow-hidden"
      >
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-base font-bold tracking-tight flex items-center gap-2">
            {status === 'checking' && (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Checking for Updates
              </>
            )}
            {status === 'available' && (
              <>
                <Download size={16} className="text-primary" />
                Update Available
              </>
            )}
            {status === 'not-available' && (
              <>
                <CheckCircle2 size={16} className="text-green-500" />
                You're up to date
              </>
            )}
            {status === 'downloading' && (
              <>
                <Download size={16} className="text-primary" />
                Downloading Update
              </>
            )}
            {status === 'downloaded' && (
              <>
                <Rocket size={16} className="text-primary" />
                Ready to Install
              </>
            )}
            {status === 'error' && (
              <>
                <AlertTriangle size={16} className="text-destructive" />
                Update Error
              </>
            )}
            {status === 'idle' && (
              <>
                <RefreshCw size={16} />
                Update Check
              </>
            )}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Software update dialog
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4">
          {status === 'checking' && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <RefreshCw size={32} className="animate-spin text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Checking GitHub for the latest version...
              </p>
            </div>
          )}

          {status === 'not-available' && (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
              <CheckCircle2 size={40} className="text-green-500 mb-1" />
              <p className="text-sm font-semibold">You're using the latest version</p>
              <p className="text-xs text-muted-foreground">
                Shega v{appVersion} is up to date
              </p>
            </div>
          )}

          {status === 'available' && updateInfo && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-muted/30 p-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                    Current Version
                  </p>
                  <p className="text-sm font-bold">v{appVersion}</p>
                </div>
                <div className="rounded-xl bg-primary/5 p-3 border border-primary/10">
                  <p className="text-[9px] font-black uppercase tracking-widest text-primary/70 mb-1">
                    Latest Version
                  </p>
                  <p className="text-sm font-bold text-primary">v{updateInfo.version}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock size={12} />
                <span>Released {formatDate(updateInfo.releaseDate)}</span>
                {fileSize > 0 && (
                  <>
                    <span className="text-muted-foreground/40">|</span>
                    <span>{formatBytes(fileSize)}</span>
                  </>
                )}
              </div>

              <div className="rounded-xl border bg-muted/10">
                <button
                  onClick={() => setShowNotes(!showNotes)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground"
                >
                  Release Notes
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${showNotes ? 'rotate-180' : ''}`}
                  />
                </button>
                {showNotes && (
                  <div className="px-3 pb-3 max-h-32 overflow-y-auto text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap border-t border-border/30 pt-2">
                    {parseReleaseNotes(updateInfo.releaseNotes)}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Button onClick={handleDownload} className="w-full h-10 text-xs font-bold">
                  <Download size={14} />
                  Download & Install
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemindLater}
                    className="flex-1 h-8 text-[10px] font-bold"
                  >
                    <Clock size={12} />
                    Remind Later
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSkip}
                    className="flex-1 h-8 text-[10px] font-bold text-muted-foreground"
                  >
                    <XCircle size={12} />
                    Skip This Version
                  </Button>
                </div>
              </div>
            </div>
          )}

          {status === 'downloading' && (
            <div className="space-y-4 py-4">
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-full bg-muted/30 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${Math.min(progress?.percent ?? 0, 100)}%` }}
                  />
                </div>
                <p className="text-sm font-bold">
                  {progress ? `${progress.percent.toFixed(1)}%` : '0%'}
                </p>
              </div>

              {progress && (
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-lg bg-muted/20 p-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                      Speed
                    </p>
                    <p className="text-xs font-bold mt-0.5">
                      {formatSpeed(progress.bytesPerSecond)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/20 p-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                      Downloaded
                    </p>
                    <p className="text-xs font-bold mt-0.5">
                      {formatBytes(progress.transferred)} / {formatBytes(progress.total)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/20 p-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                      Remaining
                    </p>
                    <p className="text-xs font-bold mt-0.5">
                      {formatETA(progress.eta)}
                    </p>
                  </div>
                </div>
              )}

              <p className="text-xs text-center text-muted-foreground">
                Downloading update in the background...
              </p>
            </div>
          )}

          {status === 'downloaded' && (
            <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
              <Rocket size={40} className="text-primary" />
              <div>
                <p className="text-sm font-semibold">Restart to Install Update</p>
                <p className="text-xs text-muted-foreground mt-1">
                  v{updateInfo?.version ?? ''} is ready to install. Save your work before restarting.
                </p>
              </div>
              <Button onClick={handleInstall} className="w-full h-10 text-xs font-bold">
                <Rocket size={14} />
                Restart & Install
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="text-[10px] font-bold text-muted-foreground"
              >
                Later
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
              <AlertTriangle size={40} className="text-destructive" />
              <div>
                <p className="text-sm font-semibold">Update Check Failed</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  {errorMessage || 'An unexpected error occurred. Please check your connection and try again.'}
                </p>
              </div>
              <div className="flex gap-2 w-full">
                <Button onClick={handleCheck} className="flex-1 h-9 text-xs font-bold">
                  <RotateCcw size={12} />
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1 h-9 text-xs font-bold"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          )}

          {status === 'idle' && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <p className="text-sm text-muted-foreground">
                No update information available.
              </p>
              <Button onClick={handleCheck} className="h-9 text-xs font-bold">
                <RefreshCw size={12} />
                Check Now
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
