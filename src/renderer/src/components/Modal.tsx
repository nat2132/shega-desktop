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
        className={`${sizeClasses[size]} w-full bg-background rounded-[32px] shadow-2xl border-border flex flex-col max-h-[90vh] p-0 gap-0 sm:rounded-[32px]`}
      >
        <DialogHeader className="p-8 border-b border-border/50 shrink-0">
          <DialogTitle className="text-2xl font-black tracking-tighter text-foreground uppercase">
            {title}
          </DialogTitle>
          <DialogDescription className="hidden">Dialog</DialogDescription>
        </DialogHeader>
        
        <div className="p-8 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Modal;
