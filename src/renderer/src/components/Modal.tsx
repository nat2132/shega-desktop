import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-retail-black/60 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className={`${sizeClasses[size]} w-full bg-white/90 backdrop-blur-3xl saturate-150 rounded-[32px] overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] z-10 flex flex-col max-h-[90vh] border border-white`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-8 border-b border-retail-gray-100">
              <h3 className="text-2xl font-black tracking-tighter text-retail-black uppercase">{title}</h3>
              <button 
                onClick={onClose}
                className="w-12 h-12 rounded-2xl flex items-center justify-center hover:bg-retail-gray-100 transition-all text-retail-gray-300 hover:text-retail-black active:scale-90"
              >
                <X size={24} strokeWidth={3} />
              </button>
            </div>

            {/* Body */}
            <div className="p-8 overflow-y-auto custom-scrollbar">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
