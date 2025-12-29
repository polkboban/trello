'use client';
import { useState } from 'react';
import Modal from './Modal';
import { Briefcase, CheckCircle2 } from 'lucide-react';
import { createWorkspace } from '@/actions/workspace';
import { useRouter } from 'next/navigation';

export default function WorkspaceModal({ isOpen, onClose, onCreated }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (formData) => {
    setLoading(true);
    try {
      const result = await createWorkspace(formData);
      
      if (onCreated) await onCreated();
      
      if (result && result.id) {
        router.push(`/workspace/${result.id}`);
      } else {
        router.refresh(); 
      }
      
      onClose();
    } catch (error) {
      console.error("Failed to create workspace:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose} title="Create New Workspace">
      <form action={handleSubmit} className="flex flex-col gap-6">
        
        <div className="flex justify-center my-2">
           <div className="h-16 w-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Briefcase size={32} />
           </div>
        </div>

        <div className="space-y-2">
           <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">
             Workspace Name
           </label>
           <input 
             name="name"
             placeholder="e.g. Acme Corp, Engineering Team"
             className="w-full text-lg font-medium bg-gray-50 dark:bg-[#2B2D33] border border-gray-100 dark:border-gray-700/50 rounded-xl p-4 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 dark:text-white"
             required
             autoFocus
           />
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
           <button 
             type="button" 
             onClick={onClose}
             className="flex-1 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-colors"
           >
             Cancel
           </button>
           <button 
             type="submit" 
             disabled={loading}
             className="flex-[2] flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transition-all disabled:opacity-50 disabled:scale-100"
           >
             {loading ? 'Creating...' : (
               <>
                 <CheckCircle2 size={18} /> Create Workspace
               </>
             )}
           </button>
        </div>

      </form>
    </Modal>
  );
}