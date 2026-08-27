import React, { useState, useEffect, useCallback } from 'react';
import { Printer, CheckCircle, XCircle, RefreshCw, TestTube2, Banknote, Save, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { toast } from 'sonner';

interface PrintStatus {
  enabled: boolean;
  transport: string;
  host: string;
  port: number;
  online: boolean;
  lastError: string | null;
  lastPrintAt: string | null;
}

const DeviceSettings: React.FC = () => {
  const [status, setStatus] = useState<PrintStatus | null>(null);
  const [transport, setTransport] = useState<'network' | 'os-dialog'>('os-dialog');
  const [host, setHost] = useState('127.0.0.1');
  const [port, setPort] = useState('9100');
  const [drawerPin, setDrawerPin] = useState<'2' | '5'>('2');
  const [autoOpenDrawer, setAutoOpenDrawer] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const s = await window.api?.getPrintStatus?.();
      if (s) {
        setStatus(s);
        setTransport(s.transport);
        setHost(s.host);
        setPort(String(s.port));
        setDrawerPin(s.drawerPin ?? '2');
        setAutoOpenDrawer(s.autoOpenDrawer !== false);
        setEnabled(s.enabled !== false);
      }
    } catch {
      /* status unavailable */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    try {
      await window.api?.setPrinterConfig?.({
        transport,
        host: transport === 'network' ? host.trim() : undefined,
        port: transport === 'network' ? Number(port) || 9100 : undefined,
        drawerPin: Number(drawerPin) as 2 | 5,
        autoOpenDrawer,
        enabled,
      });
      toast.success('Printer settings saved');
      await load();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save printer settings');
    }
  };

  const testPage = async () => {
    setTesting(true);
    try {
      await save();
      const res = await window.api?.printTestPage?.();
      if (res?.success) toast.success('Test page sent to printer');
      else toast.error(res?.error || 'Test page failed');
    } catch (e: any) {
      toast.error(e?.message || 'Test page failed');
    } finally {
      setTesting(false);
    }
  };

  const openCashDrawer = async () => {
    try {
      const res = await window.api?.openCashDrawer?.();
      if (res?.success) toast.success('Drawer opened');
      else toast.error(res?.error || 'Drawer open failed');
    } catch (e: any) {
      toast.error(e?.message || 'Drawer open failed');
    }
  };

  const online = status?.enabled && status?.transport === 'network' && status?.online;

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h3 className="text-xl font-black tracking-tight">Devices &amp; Peripherals</h3>
        <p className="text-xs text-muted-foreground uppercase font-black tracking-widest">Thermal printer, cash drawer and barcode label output</p>
      </div>

      <div className="p-6 rounded-2xl border bg-muted/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Printer size={20} className="text-foreground" />
            <div>
              <p className="text-sm font-black uppercase tracking-widest">ESC/POS Thermal Printer</p>
              <p className="text-xs text-muted-foreground font-bold uppercase mt-0.5">Raw receipts via TCP 9100 (network) or the OS print dialog</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {online ? (
              <Badge variant="secondary" className="gap-1.5 border-green-500/30 text-green-700 dark:text-green-400"><CheckCircle size={12} /> Online</Badge>
            ) : (
              <Badge variant="secondary" className="gap-1.5 border-red-500/30 text-red-600 dark:text-red-400"><XCircle size={12} /> Offline</Badge>
            )}
            <Button size="sm" variant="ghost" onClick={load} className="h-8 w-8 p-0" title="Refresh status">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Transport</Label>
            <Select value={transport} onValueChange={(v: any) => setTransport(v)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="network">Network (TCP 9100)</SelectItem>
                <SelectItem value="os-dialog">OS Print Dialog</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Enabled</Label>
            <div className="flex items-center justify-between rounded-xl border border-border/70 px-3 py-2 h-9">
              <span className="text-sm font-medium">Print receipts &amp; labels</span>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>
          </div>
          {transport === 'network' && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Printer Host</Label>
                <Input value={host} onChange={(e) => setHost(e.target.value)} placeholder="192.168.1.50" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Port</Label>
                <Input value={port} onChange={(e) => setPort(e.target.value)} placeholder="9100" />
              </div>
            </>
          )}
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Cash Drawer Pin</Label>
            <Select value={drawerPin} onValueChange={(v: any) => setDrawerPin(v)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="2">Pin 2 (connector A)</SelectItem>
                <SelectItem value="5">Pin 5 (connector B)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Auto-Open</Label>
            <div className="flex items-center justify-between rounded-xl border border-border/70 px-3 py-2 h-9">
              <span className="text-sm font-medium">Open drawer on cash payment</span>
              <Switch checked={autoOpenDrawer} onCheckedChange={setAutoOpenDrawer} />
            </div>
          </div>
        </div>

        {status?.lastError && (
          <p className="mt-4 text-xs font-bold text-destructive">Last error: {status.lastError}</p>
        )}

        <div className="flex flex-wrap gap-2 mt-6">
          <Button size="sm" onClick={save} className="h-9 px-4 text-xs">
            <Save size={12} className="mr-1.5" /> Save Settings
          </Button>
          <Button size="sm" variant="outline" onClick={testPage} disabled={testing} className="h-9 px-4 text-xs">
            {testing ? <Loader2 size={12} className="mr-1.5 animate-spin" /> : <TestTube2 size={12} className="mr-1.5" />} Print Test Page
          </Button>
          <Button size="sm" variant="outline" onClick={openCashDrawer} className="h-9 px-4 text-xs">
            <Banknote size={12} className="mr-1.5" /> Open Drawer
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeviceSettings;