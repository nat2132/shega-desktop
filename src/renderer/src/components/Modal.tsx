import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl'
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={`${sizeClasses[size]} w-full bg-card border-border/50 p-0 gap-0 sm:rounded-2xl shadow-2xl flex flex-col max-h-[85vh]`}
      >
        <DialogHeader className="px-6 py-5 border-b border-border/30 shrink-0">
          <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
            {title}
          </DialogTitle>
          <DialogDescription className="hidden">Dialog</DialogDescription>
        </DialogHeader>

        <div className="p-6 overflow-y-auto scrollbar-apple">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Modal;
