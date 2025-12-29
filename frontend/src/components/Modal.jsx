'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children }) {
  if (typeof window !== 'undefined') {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
  }

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 10, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 10, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-[#1E1F22] w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700/50 flex flex-col max-h-[90vh]"
        >
          <div className="flex justify-between items-center p-6 pb-2">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/5"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-6 pt-2 overflow-y-auto custom-scrollbar">
            {children}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}