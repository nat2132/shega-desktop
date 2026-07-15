import { autoUpdater, UpdateInfo, ProgressInfo } from 'electron-updater';
import { BrowserWindow, app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

const UPDATE_CACHE_TTL = 1000 * 60 * 60;
const PREFS_FILE = 'update-preferences.json';
const LOG_FILE = 'updater.log';

export type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'not-available'
  | 'downloading'
  | 'downloaded'
  | 'error';

export interface UpdateProgress {
  bytesPerSecond: number;
  percent: number;
  total: number;
  transferred: number;
  eta: number;
}

export interface UpdateInfoData {
  version: string;
  releaseDate: string;
  releaseNotes: string;
  files: { url: string; size: number }[];
}

interface UpdateCache {
  version: string;
  releaseDate: string;
  releaseNotes: string;
  files: { url: string; size: number }[];
  cachedAt: number;
}

interface UpdatePreferences {
  skippedVersions: string[];
  remindLaterAt: number | null;
  autoCheckEnabled: boolean;
}

class AppUpdater {
  private mainWindow: BrowserWindow | null = null;
  private status: UpdateStatus = 'idle';
  private updateInfo: UpdateInfo | null = null;
  private progressInfo: ProgressInfo | null = null;
  private errorMessage: string | null = null;
  private prefs: UpdatePreferences = {
    skippedVersions: [],
    remindLaterAt: null,
    autoCheckEnabled: true,
  };
  private cache: UpdateCache | null = null;
  private logPath: string;
  private prefsPath: string;
  private initialized = false;
  private isDev: boolean;

  constructor() {
    this.isDev = !app.isPackaged;
    this.logPath = '';
    this.prefsPath = '';
    this.setupAutoUpdater();
  }

  private ensurePaths(): void {
    if (this.logPath) return;
    const userDataPath = app.getPath('userData');
    this.logPath = path.join(userDataPath, LOG_FILE);
    this.prefsPath = path.join(userDataPath, PREFS_FILE);
    this.loadPreferences();
  }

  private setupAutoUpdater(): void {
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = false;
    autoUpdater.allowPrerelease = false;

    if (this.isDev) {
      this.log('Development mode - update checking disabled by default');
    }
  }

  private setUpstreamEvents(): void {
    autoUpdater.on('checking-for-update', () => {
      this.log('Checking for updates...');
      this.status = 'checking';
      this.errorMessage = null;
      this.emit('update:status', { status: 'checking' });
    });

    autoUpdater.on('update-available', (info: UpdateInfo) => {
      this.log(`Update available: v${info.version}`);
      this.status = 'available';
      this.updateInfo = info;
      this.cacheUpdateInfo(info);
      const formatted = this.formatUpdateInfo(info);
      this.emit('update:status', { status: 'available', info: formatted });
    });

    autoUpdater.on('update-not-available', () => {
      this.log('No updates available');
      this.status = 'not-available';
      this.updateInfo = null;
      this.emit('update:status', { status: 'not-available' });
    });

    autoUpdater.on('download-progress', (progress: ProgressInfo) => {
      this.progressInfo = progress;
      this.emit('update:progress', {
        bytesPerSecond: progress.bytesPerSecond,
        percent: progress.percent,
        total: progress.total,
        transferred: progress.transferred,
        eta: this.calculateETA(progress),
      });
    });

    autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
      this.log(`Update downloaded successfully: v${info.version}`);
      this.status = 'downloaded';
      this.emit('update:status', {
        status: 'downloaded',
        info: this.formatUpdateInfo(info),
      });
    });

    autoUpdater.on('error', (error: Error) => {
      this.log(`Error: ${error.message}`);
      this.status = 'error';
      this.errorMessage = error.message;
      this.emit('update:error', { message: error.message });
    });
  }

  init(mainWindow: BrowserWindow): void {
    this.mainWindow = mainWindow;
    this.ensurePaths();
    if (!this.initialized) {
      this.setUpstreamEvents();
      this.initialized = true;
      this.log('Updater initialized');
    }
  }

  private emit(channel: string, data: unknown): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data);
    }
  }

  private log(message: string): void {
    const ts = new Date().toISOString();
    const line = `[${ts}] [UPDATER] ${message}`;
    console.log(line);
    if (!this.logPath) return;
    try {
      fs.appendFileSync(this.logPath, line + '\n');
    } catch {}
  }

  private formatUpdateInfo(info: UpdateInfo): UpdateInfoData {
    let releaseNotes = '';
    if (typeof info.releaseNotes === 'string') {
      releaseNotes = info.releaseNotes;
    } else if (Array.isArray(info.releaseNotes)) {
      releaseNotes = info.releaseNotes
        .map((n) => (typeof n === 'string' ? n : (n as any).note || ''))
        .join('\n');
    }

    return {
      version: info.version,
      releaseDate: info.releaseDate || '',
      releaseNotes,
      files: (info.files || []).map((f: any) => ({
        url: f.url || '',
        size: f.size || 0,
      })),
    };
  }

  private calculateETA(progress: ProgressInfo): number {
    if (progress.bytesPerSecond <= 0) return 0;
    const remaining = progress.total - progress.transferred;
    return Math.ceil(remaining / progress.bytesPerSecond);
  }

  private cacheUpdateInfo(info: UpdateInfo): void {
    this.cache = {
      ...this.formatUpdateInfo(info),
      cachedAt: Date.now(),
    };
  }

  private loadPreferences(): void {
    if (!this.prefsPath) return;
    try {
      if (fs.existsSync(this.prefsPath)) {
        const raw = fs.readFileSync(this.prefsPath, 'utf-8');
        this.prefs = { ...this.prefs, ...JSON.parse(raw) };
      }
    } catch (err) {
      console.error('[UPDATER] Failed to load preferences:', err);
    }
  }

  private savePreferences(): void {
    if (!this.prefsPath) return;
    try {
      const dir = path.dirname(this.prefsPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.prefsPath, JSON.stringify(this.prefs, null, 2));
    } catch (err) {
      console.error('[UPDATER] Failed to save preferences:', err);
    }
  }

  isVersionSkipped(version: string): boolean {
    return this.prefs.skippedVersions.includes(version);
  }

  async checkForUpdates(): Promise<{
    status: UpdateStatus;
    info?: UpdateInfoData;
    error?: string;
  }> {
    if (this.isDev) {
      this.log('Dev mode - returning up-to-date');
      this.status = 'not-available';
      return { status: 'not-available' };
    }

    if (this.cache && Date.now() - this.cache.cachedAt < UPDATE_CACHE_TTL) {
      this.log(`Using cached update info (v${this.cache.version})`);
      if (this.isVersionSkipped(this.cache.version)) {
        this.status = 'idle';
        return { status: 'idle' };
      }
      this.status = 'available';
      return { status: 'available', info: this.cache };
    }

    try {
      this.log('Checking GitHub for updates...');
      const result = await autoUpdater.checkForUpdates();

      if (!result || !result.updateInfo) {
        return { status: 'not-available' };
      }

      const info = result.updateInfo;
      const isSkipped = this.isVersionSkipped(info.version);

      if (isSkipped) {
        this.log(`Version v${info.version} was skipped by user`);
        return { status: 'idle' };
      }

      return { status: 'available', info: this.formatUpdateInfo(info) };
    } catch (error: any) {
      this.log(`Check failed: ${error.message}`);
      this.status = 'error';
      this.errorMessage = error.message;
      return { status: 'error', error: error.message };
    }
  }

  async downloadUpdate(): Promise<void> {
    if (this.isDev) {
      this.log('Dev mode - download simulated');
      return;
    }
    this.log('Starting update download...');
    this.status = 'downloading';
    this.emit('update:status', { status: 'downloading' });
    await autoUpdater.downloadUpdate();
  }

  installUpdate(): void {
    this.log('Installing update...');
    autoUpdater.quitAndInstall(true, true);
  }

  skipVersion(version: string): void {
    this.log(`User skipped version v${version}`);
    if (!this.prefs.skippedVersions.includes(version)) {
      this.prefs.skippedVersions.push(version);
      this.savePreferences();
    }
  }

  remindLater(hours: number = 24): void {
    const remindAt = Date.now() + hours * 60 * 60 * 1000;
    this.prefs.remindLaterAt = remindAt;
    this.savePreferences();
    this.log(`Reminder set for ${new Date(remindAt).toISOString()}`);
  }

  clearReminder(): void {
    this.prefs.remindLaterAt = null;
    this.savePreferences();
  }

  shouldRemind(): boolean {
    if (!this.prefs.remindLaterAt) return true;
    return Date.now() >= this.prefs.remindLaterAt;
  }

  setAutoCheckEnabled(enabled: boolean): void {
    this.prefs.autoCheckEnabled = enabled;
    this.savePreferences();
    this.log(`Auto-check ${enabled ? 'enabled' : 'disabled'}`);
  }

  isAutoCheckEnabled(): boolean {
    return this.prefs.autoCheckEnabled;
  }

  setAllowPrerelease(allow: boolean): void {
    autoUpdater.allowPrerelease = allow;
    this.log(`Pre-releases ${allow ? 'allowed' : 'ignored'}`);
  }

  getStatus(): UpdateStatus {
    return this.status;
  }

  getUpdateInfo(): UpdateInfoData | null {
    return this.updateInfo ? this.formatUpdateInfo(this.updateInfo) : null;
  }

  getProgress(): UpdateProgress | null {
    if (!this.progressInfo) return null;
    return {
      bytesPerSecond: this.progressInfo.bytesPerSecond,
      percent: this.progressInfo.percent,
      total: this.progressInfo.total,
      transferred: this.progressInfo.transferred,
      eta: this.calculateETA(this.progressInfo),
    };
  }

  getError(): string | null {
    return this.errorMessage;
  }

  getAppVersion(): string {
    return app.getVersion();
  }

  async checkOnLaunch(): Promise<void> {
    if (this.isDev) return;
    if (!this.prefs.autoCheckEnabled) {
      this.log('Auto-check disabled by user preference');
      return;
    }
    if (!this.shouldRemind()) {
      this.log('Reminder not due yet, skipping auto-check');
      return;
    }

    this.log('Auto-check on launch...');
    await this.checkForUpdates();
  }
}

export const appUpdater = new AppUpdater();
