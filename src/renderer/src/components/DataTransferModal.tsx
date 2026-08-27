import React, { useState, useEffect, useCallback } from 'react';
import { Download, Upload, FileSpreadsheet, FileText, Database, Check, AlertCircle, AlertTriangle, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { useSettings } from '../context/SettingsContext';
import { exportPDF } from '../lib/export-utils';
import { getSchema, generateCSVTemplate, parseCSV, matchColumns, validateRow, type ColumnMatch, type ValidationError, generateCSVExport } from '../lib/schemas';
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
type DataType = 'sales' | 'inventory' | 'expenses' | 'customers' | 'suppliers' | 'shipments' | 'adjustments' | 'orders' | 'contacts' | 'employees' | 'warehouses' | 'supplier-purchases' | 'all';

interface PreviewData {
  headers: string[];
  rows: string[][];
  rawRows: Record<string, string>[];
}

const DATATYPE_OPTIONS: { value: DataType; labelKey: string }[] = [
  { value: 'sales', labelKey: 'data_transfer.sales' },
  { value: 'inventory', labelKey: 'data_transfer.inventory' },
  { value: 'expenses', labelKey: 'data_transfer.expenses' },
  { value: 'customers', labelKey: 'data_transfer.customers' },
  { value: 'suppliers', labelKey: 'data_transfer.suppliers' },
  { value: 'shipments', labelKey: 'data_transfer.shipments' },
  { value: 'adjustments', labelKey: 'data_transfer.adjustments' },
  { value: 'orders', labelKey: 'data_transfer.orders' },
  { value: 'contacts', labelKey: 'data_transfer.contacts' },
  { value: 'employees', labelKey: 'data_transfer.employees' },
  { value: 'warehouses', labelKey: 'data_transfer.warehouses' },
  { value: 'supplier-purchases', labelKey: 'data_transfer.supplier_purchases' },
  { value: 'all', labelKey: 'data_transfer.all' },
];

const DataTransferModal: React.FC<DataTransferModalProps> = ({ open, onClose }) => {
  const { t, formatDate } = useSettings();
  const [step, setStep] = useState<'export' | 'import'>('export');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [dataType, setDataType] = useState<DataType>('sales');
  const [importDataType, setImportDataType] = useState<DataType>('sales');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [columnMap, setColumnMap] = useState<ColumnMatch[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [importResult, setImportResult] = useState<{ success: boolean; imported: number; errors: { row: number; message: string }[]; skipped: number } | null>(null);
  const [backups, setBackups] = useState<{ name: string; size: number; createdAt: string }[]>([]);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const showDateRange = dataType === 'sales' || dataType === 'expenses';
  const currentSchema = getSchema(importDataType === 'all' ? 'sales' : importDataType);

  useEffect(() => {
    if (open && step === 'import') {
      window.api?.listBackups().then(setBackups).catch(() => {});
    }
  }, [open, step]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    setImportResult(null);
    setValidationErrors([]);
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
          setPreview({ headers, rows, rawRows: data });
        } else {
          const parsed = parseCSV(text);
          const rawRows = parsed.rows.map(r => {
            const obj: Record<string, string> = {};
            parsed.headers.forEach((h, i) => { obj[h] = r[i] || '' });
            return obj;
          });
          setPreview({ headers: parsed.headers, rows: parsed.rows.slice(0, 5), rawRows });

          if (currentSchema) {
            const map = matchColumns(currentSchema, parsed.headers);
            setColumnMap(map);

            const allRows = parseCSV(text);
            const errors: ValidationError[] = [];
            allRows.rows.forEach((row, i) => {
              errors.push(...validateRow(currentSchema, row, map, i + 1));
            });
            setValidationErrors(errors.slice(0, 50));
          }
        }
      } catch {
        setPreview(null);
      }
    };
    reader.readAsText(file);
  }, [currentSchema]);

  const handleDownloadTemplate = useCallback((module: string) => {
    const csv = generateCSVTemplate(module);
    if (!csv) return;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shega-${module}-template.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Template downloaded for ${module}`);
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

      const params: any = { limit: 50000 };
      if (showDateRange) {
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
      }

      let rows: Record<string, any>[] = [];

      switch (dataType) {
        case 'sales': {
          rows = await window.api?.getSales(params) || [];
          break;
        }
        case 'inventory': {
          rows = await window.api?.getItems(params) || [];
          break;
        }
        case 'expenses': {
          rows = await window.api?.getExpenses(params) || [];
          break;
        }
        case 'customers': {
          rows = await window.api?.getCustomers() || [];
          break;
        }
        case 'suppliers': {
          const sup = await window.api?.getSuppliers(params) || { rows: [] };
          rows = Array.isArray(sup) ? sup : sup.rows || [];
          break;
        }
        case 'shipments': {
          rows = await window.api?.getShipments(params) || [];
          break;
        }
        case 'adjustments': {
          rows = await window.api?.getAdjustments(params) || [];
          break;
        }
        case 'orders': {
          rows = await window.api?.getOrders(params) || [];
          break;
        }
        case 'contacts': {
          rows = await window.api?.getContacts(params) || [];
          break;
        }
        case 'employees': {
          rows = await window.api?.getEmployees(params) || [];
          break;
        }
        case 'warehouses': {
          rows = await window.api?.getWarehouses() || [];
          break;
        }
        case 'supplier-purchases': {
          const sp = await window.api?.getSupplierPurchases(params) || { rows: [] };
          rows = Array.isArray(sp) ? sp : sp.rows || [];
          break;
        }
        default: {
          setExporting(false);
          return;
        }
      }

      if (exportFormat === 'csv') {
        const csv = generateCSVExport(dataType, rows);
        if (csv) {
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `shega-${dataType}-${Date.now()}.csv`;
          a.click();
          URL.revokeObjectURL(url);
        }
      } else {
        const schema = getSchema(dataType);
        const headers = schema ? schema.fields.map(f => f.label) : Object.keys(rows[0] || {});
        const dataRows = rows.map(r =>
          schema ? schema.fields.map(f => String(r[f.key] ?? '')) : Object.values(r).map(v => String(v ?? ''))
        );
        exportPDF(t(`data_transfer.${dataType}_report`), headers, dataRows, `shega-${dataType}`);
      }
      toast.success(t('data_transfer.export_success'));
    } catch (err: any) {
      toast.error(err?.message || t('data_transfer.export_error'));
    }
    setExporting(false);
  };

  const handleImportCSV = async () => {
    if (!selectedFile || !preview) return;
    const module = importDataType;
    if (validationErrors.some(e => e.message.includes('missing'))) {
      toast.error('Fix required field mappings before importing');
      return;
    }

    setImporting(true);
    setImportResult(null);
    try {
      const schema = getSchema(module);
      if (!schema) { toast.error('Unknown module'); setImporting(false); return; }

      const text = await selectedFile.text();
      const parsed = parseCSV(text);
      const map = matchColumns(schema, parsed.headers);

      if (map.every(m => m.confidence === 'none')) {
        toast.error('Could not match CSV columns to database fields. Check the CSV headers match the template.');
        setImporting(false);
        return;
      }

      const rawRows = parsed.rows.map(r => {
        const obj: Record<string, string> = {};
        map.forEach(m => {
          if (m.headerIndex >= 0) {
            obj[m.fieldKey] = r[m.headerIndex]?.trim() ?? '';
          }
        });
        return obj;
      });

      const result = await window.api?.importData(module, rawRows);
      if (result) {
        setImportResult(result);
        if (result.success) {
          toast.success(`Imported ${result.imported} ${module} records${result.skipped > 0 ? ` (${result.skipped} skipped as duplicates)` : ''}`);
        } else {
          toast.error(`Import failed with ${result.errors.length} errors`);
        }
        if (result.errors.length > 0) {
          const first = result.errors[0];
          toast.error(`Row ${first.row}: ${first.message}`);
        }
      }
    } catch (err: any) {
      toast.error(err?.message || 'Import failed');
    }
    setImporting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl rounded-3xl border-border/50 max-h-[90vh] overflow-y-auto">
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
            <TabsTrigger value="export" className="text-xs font-black uppercase tracking-widest">
              <Download className="h-3.5 w-3.5" />
              {t('data_transfer.export')}
            </TabsTrigger>
            <TabsTrigger value="import" className="text-xs font-black uppercase tracking-widest">
              <Upload className="h-3.5 w-3.5" />
              {t('data_transfer.import')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4 mt-4">
            <Card className="border-border/40 rounded-xl">
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    {t('data_transfer.format')}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant={exportFormat === 'csv' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setExportFormat('csv')}
                      className="rounded-xl text-xs font-black uppercase tracking-widest flex-1"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5" />
                      CSV Data
                    </Button>
                    <Button
                      variant={exportFormat === 'pdf' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setExportFormat('pdf')}
                      className="rounded-xl text-xs font-black uppercase tracking-widest flex-1"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      PDF Report
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
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

                {dataType !== 'all' && (
                  <div className="flex items-center justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadTemplate(dataType)}
                      className="rounded-xl text-xs font-black uppercase tracking-widest h-8"
                    >
                      <FileDown className="h-3 w-3 mr-1.5" />
                      Download CSV Template
                    </Button>
                  </div>
                )}

                {showDateRange && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
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
              className="w-full rounded-xl text-xs font-black uppercase tracking-widest"
            >
              <Database className="h-3.5 w-3.5" />
              {exporting ? t('common.loading') : t('data_transfer.export_action')}
            </Button>
          </TabsContent>

          <TabsContent value="import" className="space-y-4 mt-4">
            <Card className="border-border/40 rounded-xl">
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    {t('data_transfer.data_type')}
                  </p>
                  <div className="flex gap-2">
                    <Select value={importDataType} onValueChange={(v) => setImportDataType(v as DataType)}>
                      <SelectTrigger className="w-full text-xs rounded-xl">
                        <SelectValue placeholder={t('data_transfer.select_type')} />
                      </SelectTrigger>
                      <SelectContent>
                        {DATATYPE_OPTIONS.filter(o => o.value !== 'all').map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className="text-xs">
                            {t(opt.labelKey)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadTemplate(importDataType)}
                      className="rounded-xl text-xs font-black uppercase tracking-widest h-10 shrink-0"
                    >
                      <FileDown className="h-3 w-3 mr-1" />
                      Template
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    {t('data_transfer.upload_file')}
                  </p>
                  <Input
                    type="file"
                    accept=".csv,.json"
                    onChange={handleFileChange}
                    className="rounded-xl text-xs file:rounded-xl file:text-xs file:font-black file:uppercase file:tracking-widest"
                  />
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-3 w-3 text-amber-500" />
                    <span className="text-xs text-muted-foreground">
                      {t('data_transfer.file_hint')}
                    </span>
                  </div>
                </div>

                {currentSchema && columnMap.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Column Mapping
                    </p>
                    <div className="grid grid-cols-2 gap-1">
                      {columnMap.filter(m => m.confidence !== 'none').map(m => {
                        const field = currentSchema.fields.find(f => f.key === m.fieldKey);
                        return (
                          <div key={m.fieldKey} className="flex items-center gap-1.5 text-xs">
                            <Check className={`h-2.5 w-2.5 ${m.confidence === 'exact' ? 'text-emerald-500' : 'text-amber-500'}`} />
                            <span className="font-medium text-foreground/80">{field?.label || m.fieldKey}</span>
                            <span className="text-muted-foreground">→</span>
                            <span className="text-muted-foreground">{preview?.headers[m.headerIndex]}</span>
                          </div>
                        );
                      })}
                      {columnMap.filter(m => m.confidence === 'none').map(m => {
                        const field = currentSchema.fields.find(f => f.key === m.fieldKey);
                        return field?.required ? (
                          <div key={m.fieldKey} className="flex items-center gap-1.5 text-xs text-destructive">
                            <AlertTriangle className="h-2.5 w-2.5" />
                            <span className="font-medium">{field.label}</span>
                            <span className="text-destructive/70">(missing - required)</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                {validationErrors.length > 0 && (
                  <div className="space-y-1 p-2 rounded-lg bg-red-500/5 border border-red-500/20">
                    <p className="text-xs font-bold uppercase tracking-widest text-destructive flex items-center gap-1.5">
                      <AlertTriangle className="h-3 w-3" />
                      {validationErrors.length} Validation {validationErrors.length === 1 ? 'Error' : 'Errors'}
                    </p>
                    <div className="max-h-24 overflow-y-auto space-y-0.5">
                      {validationErrors.slice(0, 10).map((e, i) => (
                        <p key={i} className="text-xs text-destructive/80">
                          Row {e.row}: {e.message}
                        </p>
                      ))}
                      {validationErrors.length > 10 && (
                        <p className="text-xs text-muted-foreground">...and {validationErrors.length - 10} more</p>
                      )}
                    </div>
                  </div>
                )}

                {preview && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        {t('data_transfer.preview')}
                      </p>
                      <Badge variant="outline" className="text-xs font-black uppercase tracking-widest">
                        {preview.rows.length} {t('common.rows')}
                      </Badge>
                    </div>
                    <div className="overflow-x-auto rounded-lg border border-border/40">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border/40 bg-muted/30">
                            {preview.headers.slice(0, 7).map((h, i) => (
                              <th key={i} className="px-2 py-1.5 text-left font-semibold uppercase tracking-wider text-muted-foreground">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {preview.rows.map((row, ri) => (
                            <tr key={ri} className="border-b border-border/20 last:border-0">
                              {row.slice(0, 7).map((cell, ci) => (
                                <td key={ci} className="px-2 py-1.5 truncate max-w-[120px]">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {importResult && (
                  <div className={`space-y-1 p-3 rounded-lg border ${
                    importResult.success && importResult.imported > 0
                      ? 'bg-emerald-500/5 border-emerald-500/20'
                      : 'bg-red-500/5 border-red-500/20'
                  }`}>
                    <p className="text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                      {importResult.success ? (
                        <><Check className="h-3 w-3 text-emerald-500" /> Import Complete</>
                      ) : (
                        <><AlertTriangle className="h-3 w-3 text-destructive" /> Import Failed</>
                      )}
                    </p>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span>Imported: <strong>{importResult.imported}</strong></span>
                      {importResult.skipped > 0 && <span>Skipped: <strong>{importResult.skipped}</strong></span>}
                      {importResult.errors.length > 0 && <span>Errors: <strong className="text-destructive">{importResult.errors.length}</strong></span>}
                    </div>
                    {importResult.errors.length > 0 && (
                      <div className="max-h-20 overflow-y-auto mt-1 space-y-0.5">
                        {importResult.errors.slice(0, 5).map((e, i) => (
                          <p key={i} className="text-xs text-destructive/80">Row {e.row}: {e.message}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {selectedFile?.name.endsWith('.json') && (
                  <Button
                    onClick={() => selectedFile && handleRestoreFromBackup(selectedFile.name)}
                    disabled={importing}
                    className="w-full rounded-xl text-xs font-black uppercase tracking-widest"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {importing ? t('common.loading') : t('data_transfer.restore_action')}
                  </Button>
                )}

                {selectedFile?.name.endsWith('.csv') && (
                  <Button
                    onClick={handleImportCSV}
                    disabled={importing || validationErrors.some(e => e.message.includes('missing'))}
                    className="w-full rounded-xl text-xs font-black uppercase tracking-widest"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {importing ? t('common.loading') : t('data_transfer.import_action')}
                  </Button>
                )}

                {backups.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-border/40">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
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
                            <span className="text-xs font-medium truncate">{b.name}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-muted-foreground">
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

  async function handleRestoreFromBackup(name: string) {
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
  }
};

export default DataTransferModal;
