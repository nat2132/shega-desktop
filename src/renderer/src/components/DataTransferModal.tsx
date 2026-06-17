import React, { useState, useEffect, useCallback } from 'react';
import { Download, Upload, FileSpreadsheet, FileText, Database, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useSettings } from '../context/SettingsContext';
import { exportCSV, exportPDF } from '../lib/export-utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { DatePicker } from '../components/DatePicker';

interface DataTransferModalProps {
  open: boolean;
  onClose: () => void;
}

type ExportFormat = 'pdf' | 'csv';
type DataType = 'sales' | 'inventory' | 'expenses' | 'customers' | 'all';

interface PreviewRow {
  headers: string[];
  rows: string[][];
}

const DATATYPE_OPTIONS: { value: DataType; labelKey: string }[] = [
  { value: 'sales', labelKey: 'data_transfer.sales' },
  { value: 'inventory', labelKey: 'data_transfer.inventory' },
  { value: 'expenses', labelKey: 'data_transfer.expenses' },
  { value: 'customers', labelKey: 'data_transfer.customers' },
  { value: 'all', labelKey: 'data_transfer.all' },
];

const DataTransferModal: React.FC<DataTransferModalProps> = ({ open, onClose }) => {
  const { t, formatDate, formatTime, formatDateTime } = useSettings();
  const [step, setStep] = useState<'export' | 'import'>('export');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [dataType, setDataType] = useState<DataType>('sales');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewRow | null>(null);
  const [backups, setBackups] = useState<{ name: string; size: number; createdAt: string }[]>([]);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const showDateRange = dataType === 'sales' || dataType === 'expenses';

  useEffect(() => {
    if (open && step === 'import') {
      window.api?.listBackups().then(setBackups).catch(() => {});
    }
  }, [open, step]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    if (!file) { setPreview(null); return; }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      try {
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          const data = Array.isArray(parsed) ? parsed : parsed.data || [];
          const headers = data.length > 0 ? Object.keys(data[0]) : [];
          const rows = data.slice(0, 5).map((r: any) => headers.map((h) => String(r[h] ?? '')));
          setPreview({ headers, rows });
        } else {
          const lines = text.split('\n').filter(Boolean);
          if (lines.length < 2) { setPreview(null); return; }
          const headers = lines[0].split(',').map((h) => h.replace(/^"|"$/g, ''));
          const rows = lines.slice(1, 6).map((l) => l.split(',').map((c) => c.replace(/^"|"$/g, '')));
          setPreview({ headers, rows });
        }
      } catch {
        setPreview(null);
      }
    };
    reader.readAsText(file);
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      if (dataType === 'all') {
        const data = await window.api?.exportData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `shega-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(t('data_transfer.export_success'));
        setExporting(false);
        return;
      }

      const params: any = { limit: 10000 };
      if (showDateRange) {
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
      }

      let rows: string[][] = [];
      let headers: string[] = [];
      let title: string = '';

      switch (dataType) {
        case 'sales': {
          const data = await window.api?.getSales(params) || [];
          headers = [t('common.id'), t('common.date'), t('common.customer'), t('common.total'), t('common.status')];
          title = t('data_transfer.sales_report');
          rows = data.map((s: any) => [s.id, s.created_at || s.date, s.customer_name || '-', s.total, s.status]);
          break;
        }
        case 'inventory': {
          const data = await window.api?.getItems(params) || [];
          headers = [t('common.id'), t('common.name'), t('common.sku'), t('common.price'), t('common.stock')];
          title = t('data_transfer.inventory_report');
          rows = data.map((i: any) => [i.id, i.name, i.sku || '-', i.selling_price, i.stock_quantity]);
          break;
        }
        case 'expenses': {
          const data = await window.api?.getExpenses(params) || [];
          headers = [t('common.id'), t('common.date'), t('common.category'), t('common.amount'), t('common.note')];
          title = t('data_transfer.expenses_report');
          rows = data.map((e: any) => [e.id, e.date, e.category_name || e.category, e.amount, e.note || '-']);
          break;
        }
        case 'customers': {
          const data = await window.api?.getCustomers() || [];
          headers = [t('common.id'), t('common.name'), t('common.phone'), t('common.email'), t('common.balance')];
          title = t('data_transfer.customers_report');
          rows = data.map((c: any) => [c.id, c.name, c.phone || '-', c.email || '-', c.balance || '0']);
          break;
        }
        default: {
          setExporting(false);
          return;
        }
      }

      if (exportFormat === 'csv') {
        exportCSV(headers, rows, `shega-${dataType}`);
      } else {
        exportPDF(title, headers, rows, `shega-${dataType}`);
      }
      toast.success(t('data_transfer.export_success'));
    } catch (err: any) {
      toast.error(err?.message || t('data_transfer.export_error'));
    }
    setExporting(false);
  };

  const handleImportCSV = async () => {
    toast.info(t('data_transfer.coming_soon'));
  };

  const handleRestoreFromBackup = async (name: string) => {
    setImporting(true);
    try {
      const result = await window.api?.restoreBackup(name);
      if (result?.success) {
        toast.success(t('data_transfer.restore_success'));
        setTimeout(() => window.location.reload(), 1500);
      } else {
        toast.error(result?.error || t('data_transfer.restore_error'));
      }
    } catch (err: any) {
      toast.error(err?.message || t('data_transfer.restore_error'));
    }
    setImporting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg rounded-3xl border-border/50 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-black uppercase tracking-widest">
            {t('data_transfer.title')}
          </DialogTitle>
          <DialogDescription className="text-[11px] text-muted-foreground">
            {t('data_transfer.subtitle')}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={step} onValueChange={(v) => setStep(v as 'export' | 'import')} className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="export" className="text-[10px] font-black uppercase tracking-widest">
              <Download className="h-3.5 w-3.5" />
              {t('data_transfer.export')}
            </TabsTrigger>
            <TabsTrigger value="import" className="text-[10px] font-black uppercase tracking-widest">
              <Upload className="h-3.5 w-3.5" />
              {t('data_transfer.import')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4 mt-4">
            <Card className="border-border/40 rounded-xl">
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {t('data_transfer.format')}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant={exportFormat === 'csv' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setExportFormat('csv')}
                      className="rounded-xl text-[10px] font-black uppercase tracking-widest flex-1"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5" />
                      CSV Data
                    </Button>
                    <Button
                      variant={exportFormat === 'pdf' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setExportFormat('pdf')}
                      className="rounded-xl text-[10px] font-black uppercase tracking-widest flex-1"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      PDF Report
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {t('data_transfer.data_type')}
                  </p>
                  <Select value={dataType} onValueChange={(v) => setDataType(v as DataType)}>
                    <SelectTrigger className="w-full text-xs rounded-xl">
                      <SelectValue placeholder={t('data_transfer.select_type')} />
                    </SelectTrigger>
                    <SelectContent>
                      {DATATYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="text-xs">
                          {t(opt.labelKey)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {showDateRange && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      {t('common.date_range')}
                    </p>
                    <div className="space-y-2">
                      <DatePicker
                        value={startDate}
                        onChange={(e) => setStartDate(e)}
                        className="rounded-xl text-xs w-full"
                        placeholder={t('common.start_date')}
                      />
                      <DatePicker
                        value={endDate}
                        onChange={(e) => setEndDate(e)}
                        className="rounded-xl text-xs w-full"
                        placeholder={t('common.end_date')}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Button
              onClick={handleExport}
              disabled={exporting}
              className="w-full rounded-xl text-[10px] font-black uppercase tracking-widest"
            >
              <Database className="h-3.5 w-3.5" />
              {exporting ? t('common.loading') : t('data_transfer.export_action')}
            </Button>
          </TabsContent>

          <TabsContent value="import" className="space-y-4 mt-4">
            <Card className="border-border/40 rounded-xl">
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {t('data_transfer.upload_file')}
                  </p>
                  <Input
                    type="file"
                    accept=".csv,.json"
                    onChange={handleFileChange}
                    className="rounded-xl text-xs file:rounded-xl file:text-[10px] file:font-black file:uppercase file:tracking-widest"
                  />
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-3 w-3 text-amber-500" />
                    <span className="text-[9px] text-muted-foreground">
                      {t('data_transfer.file_hint')}
                    </span>
                  </div>
                </div>

                {preview && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                        {t('data_transfer.preview')}
                      </p>
                      <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest">
                        {preview.rows.length} {t('common.rows')}
                      </Badge>
                    </div>
                    <div className="overflow-x-auto rounded-lg border border-border/40">
                      <table className="w-full text-[10px]">
                        <thead>
                          <tr className="border-b border-border/40 bg-muted/30">
                            {preview.headers.slice(0, 6).map((h, i) => (
                              <th key={i} className="px-2 py-1.5 text-left font-semibold uppercase tracking-wider text-muted-foreground">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {preview.rows.map((row, ri) => (
                            <tr key={ri} className="border-b border-border/20 last:border-0">
                              {row.slice(0, 6).map((cell, ci) => (
                                <td key={ci} className="px-2 py-1.5 truncate max-w-[120px]">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {selectedFile?.name.endsWith('.csv') && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <AlertCircle className="h-3 w-3 text-amber-500 shrink-0" />
                        <span className="text-[10px] text-amber-500/80">
                          {t('data_transfer.csv_warning')}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {selectedFile?.name.endsWith('.json') && (
                  <Button
                    onClick={() => selectedFile && handleRestoreFromBackup(selectedFile.name)}
                    disabled={importing}
                    className="w-full rounded-xl text-[10px] font-black uppercase tracking-widest"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {importing ? t('common.loading') : t('data_transfer.restore_action')}
                  </Button>
                )}

                {(!selectedFile || selectedFile.name.endsWith('.csv')) && (
                  <Button
                    onClick={handleImportCSV}
                    className="w-full rounded-xl text-[10px] font-black uppercase tracking-widest relative overflow-hidden"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {t('data_transfer.import_action')}
                    <span className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-[1px]">
                      <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-widest">
                        {t('data_transfer.coming_soon')}
                      </Badge>
                    </span>
                  </Button>
                )}

                {backups.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-border/40">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      {t('data_transfer.available_backups')}
                    </p>
                    <div className="space-y-1 max-h-[160px] overflow-y-auto">
                      {backups.map((b) => (
                        <div
                          key={b.name}
                          className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => handleRestoreFromBackup(b.name)}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Database className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="text-[10px] font-medium truncate">{b.name}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[9px] text-muted-foreground">
                              {formatDate(b.createdAt)}
                            </span>
                            <Check className="h-3 w-3 text-emerald-500" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default DataTransferModal;
