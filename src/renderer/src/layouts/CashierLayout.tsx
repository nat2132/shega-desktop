import React, { useState } from 'react';
import { CashierHeader } from '../components/cashier/CashierHeader';
import { CashierNav } from '../components/cashier/CashierNav';
import { ShiftOpenModal } from '../components/cashier/ShiftOpenModal';
import { ShiftCloseModal } from '../components/cashier/ShiftCloseModal';
import { CashierProvider } from '../context/CashierContext';

export function CashierLayout({ children }: { children: React.ReactNode }) {
  const [shiftModal, setShiftModal] = useState<'open' | 'close' | null>(null);

  return (
    <CashierProvider>
      <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
        <CashierHeader
          onOpenShiftUi={() => setShiftModal('open')}
          onCloseShiftUi={() => setShiftModal('close')}
        />
        <div className="flex flex-1 overflow-hidden">
          <CashierNav />
          <main className="flex-1 overflow-y-auto scrollbar-apple pb-16 md:pb-0">
            {children}
          </main>
        </div>
        <ShiftOpenModal open={shiftModal === 'open'} onClose={() => setShiftModal(null)} />
        <ShiftCloseModal open={shiftModal === 'close'} onClose={() => setShiftModal(null)} />
      </div>
    </CashierProvider>
  );
}

export default CashierLayout;