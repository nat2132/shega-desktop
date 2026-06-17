import React from 'react';
import { CheckCircle, Printer, ShoppingCart, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from './ui/dialog';
import { Button } from './ui/button';
import { useSettings } from '../context/SettingsContext';

interface SaleSuccessModalProps {
  open: boolean;
  onClose: () => void;
  sale: any;
}

const SaleSuccessModal: React.FC<SaleSuccessModalProps> = ({ open, onClose, sale }) => {
  const { t } = useSettings();

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-3xl bg-background border-border shadow-2xl max-w-sm p-8">
        <DialogClose className="absolute right-4 top-4 rounded-full opacity-70 hover:opacity-100 transition-opacity">
          <X className="h-5 w-5" />
        </DialogClose>

        <div className="flex flex-col items-center text-center space-y-6 pt-4">
          <CheckCircle className="h-16 w-16 text-green-500" strokeWidth={1.5} />

          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight">Sale Complete</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground font-medium">
              The sale has been recorded successfully
            </DialogDescription>
          </DialogHeader>

          <div className="w-full space-y-3 bg-muted/30 rounded-2xl p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground font-medium">Item</span>
              <span className="font-bold">{sale?.name || sale?.item_name || '-'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground font-medium">Quantity</span>
              <span className="font-bold">{sale?.quantity ?? '-'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground font-medium">Total</span>
              <span className="font-black text-lg">{t('common.etb')} {(sale?.total_price ?? sale?.amount ?? 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground font-medium">Payment</span>
              <span className="font-bold capitalize">{sale?.payment_method || '-'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground font-medium">Customer</span>
              <span className="font-bold">{sale?.customer_name || 'Walk-in'}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-3 sm:flex-col">
          <Button
            onClick={() => window.api?.printReceipt(sale)}
            className="w-full py-6 text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-lg"
          >
            <Printer className="w-4 h-4 mr-2" /> Print Receipt
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full py-6 text-xs font-black uppercase tracking-[0.2em] rounded-2xl border-border"
          >
            <ShoppingCart className="w-4 h-4 mr-2" /> New Sale
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaleSuccessModal;
