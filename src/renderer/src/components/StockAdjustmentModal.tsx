import React, { useState, useEffect } from 'react';
import { Wrench, Check, Package } from 'lucide-react';
import { toast } from 'sonner';
import { parseProductImages } from '../lib/productImages';
import Modal from './Modal';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  preSelectedItem?: any;
  onClose: () => void;
  onSuccess?: () => void;
}

const REASON_OPTIONS = [
  { id: 'damaged', label: 'Damaged', isDeduction: true },
  { id: 'expired', label: 'Expired', isDeduction: true },
  { id: 'lost', label: 'Lost / Stolen', isDeduction: true },
  { id: 'discrepancy', label: 'Count Discrepancy', isDeduction: true },
  { id: 'found', label: 'Found / Addition', isDeduction: false },
  { id: 'other', label: 'Other', isDeduction: true },
];

const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  preSelectedItem,
  onClose,
  onSuccess,
}) => {
  const [items, setItems] = useState<any[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [reasonType, setReasonType] = useState<string>('damaged');
  const [quantity, setQuantity] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      window.api?.getItems?.({ limit: 500 }).then((res: any[]) => {
        const loaded = Array.isArray(res) ? res : [];
        setItems(loaded);
        if (preSelectedItem?.id) {
          setSelectedItemId(String(preSelectedItem.id));
        } else if (loaded.length > 0) {
          setSelectedItemId(String(loaded[0].id));
        }
      });
      setQuantity('');
      setNote('');
      setReasonType('damaged');
    }
  }, [isOpen, preSelectedItem]);

  const selectedItem = items.find((i) => String(i.id) === selectedItemId) || preSelectedItem;
  const currentStock = Number(selectedItem?.totalBaseQuantity) || 0;
  const adjQty = Math.max(0, parseFloat(quantity) || 0);

  const activeReason = REASON_OPTIONS.find((r) => r.id === reasonType) || REASON_OPTIONS[0];
  const newStock = activeReason.isDeduction ? Math.max(0, currentStock - adjQty) : currentStock + adjQty;

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) {
      toast.error('Select a product to adjust');
      return;
    }
    if (isNaN(adjQty) || adjQty <= 0) {
      toast.error('Enter a valid quantity greater than 0');
      return;
    }
    if (activeReason.isDeduction && adjQty > currentStock) {
      toast.error(`Cannot adjust ${adjQty} ${selectedItem.baseUnit || 'pcs'}. Current available stock is only ${currentStock}.`);
      return;
    }

    setSubmitting(true);
    try {
      const fullReason = note.trim()
        ? `${activeReason.label}: ${note.trim()}`
        : activeReason.label;

      const res = await window.api?.insertAdjustment?.({
        itemId: selectedItem.id,
        type: reasonType,
        quantity: adjQty,
        unitType: 'base',
        reason: fullReason,
        date: new Date().toISOString().split('T')[0],
      });

      if (res?.success) {
        toast.success(`Stock adjusted for ${selectedItem.name}. New stock: ${newStock} ${selectedItem.baseUnit || 'pcs'}`);
        onSuccess?.();
        onClose();
      } else {
        toast.error('Failed to record stock adjustment');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Stock adjustment failed');
    } finally {
      setSubmitting(false);
    }
  };

  const coverImg = selectedItem ? parseProductImages(selectedItem.image).primary : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Stock Adjustment" size="md">
      <form onSubmit={handleConfirm} className="space-y-5">
        <div className="p-4 rounded-xl bg-muted/20 border border-border/50 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Wrench className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold">Record Damaged, Lost, or Discrepancy Stock</p>
            <p className="text-xs text-muted-foreground">Adjust inventory counts and record reason into audit history</p>
          </div>
        </div>

        {/* Product Picker */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product *</label>
          <Select value={selectedItemId} onValueChange={setSelectedItemId}>
            <SelectTrigger className="h-12 rounded-xl text-sm w-full">
              <SelectValue placeholder="Select product..." />
            </SelectTrigger>
            <SelectContent className="max-h-60 rounded-xl">
              {items.map((i) => (
                <SelectItem key={i.id} value={String(i.id)}>
                  {i.name} ({i.totalBaseQuantity} {i.baseUnit || 'pcs'} in stock)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedItem && (
          <div className="p-3.5 rounded-xl border border-border/60 bg-card/50 flex items-center gap-3">
            {coverImg ? (
              <img src={coverImg} className="h-12 w-12 rounded-lg object-cover shrink-0" />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate">{selectedItem.name}</p>
              <p className="text-xs text-muted-foreground">
                Current Stock: <span className="font-bold text-foreground">{currentStock} {selectedItem.baseUnit || 'pcs'}</span>
              </p>
            </div>
          </div>
        )}

        {/* Reason Type Grid */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Adjustment Reason *</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {REASON_OPTIONS.map((opt) => {
              const isSelected = reasonType === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setReasonType(opt.id)}
                  className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-left ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-muted/30 border-border/60 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quantity Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Quantity Adjusted ({selectedItem?.baseUnit || 'pcs'}) *
          </label>
          <Input
            type="number"
            min="1"
            placeholder="e.g. 5"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="h-11 font-bold text-base rounded-xl"
            required
          />
        </div>

        {/* Optional Note */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Note / Description (Optional)</label>
          <Input
            placeholder="e.g. 5 bottles damaged during handling"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="h-11 text-sm rounded-xl"
          />
        </div>

        {/* Stock Calculation Preview Box */}
        {selectedItem && adjQty > 0 && (
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2 text-xs">
            <div className="flex justify-between items-center text-muted-foreground">
              <span>Current Stock:</span>
              <span className="font-bold text-foreground">{currentStock} {selectedItem.baseUnit || 'pcs'}</span>
            </div>
            <div className={`flex justify-between items-center font-bold ${activeReason.isDeduction ? 'text-destructive' : 'text-green-600'}`}>
              <span>Adjustment ({activeReason.label}):</span>
              <span>{activeReason.isDeduction ? '-' : '+'}{adjQty} {selectedItem.baseUnit || 'pcs'}</span>
            </div>
            <div className="border-t border-border/40 pt-2 flex justify-between items-center text-sm font-bold">
              <span>New Available Stock:</span>
              <span className="text-primary text-base font-black">{newStock} {selectedItem.baseUnit || 'pcs'}</span>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={submitting || !selectedItem || !adjQty} className="flex-1 h-11 font-bold uppercase text-xs tracking-wider rounded-xl">
            <Check className="h-4 w-4 mr-1.5" />
            {submitting ? 'Saving...' : 'Confirm Stock Adjustment'}
          </Button>
          <Button type="button" variant="outline" onClick={onClose} className="h-11 px-6 rounded-xl text-xs font-semibold">
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default StockAdjustmentModal;
