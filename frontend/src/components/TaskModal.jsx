'use client';
import { useState } from 'react';
import Modal from './Modal';
import { Calendar, Tag, Trash2, AlignLeft, Flag } from 'lucide-react';
import { updateTask, deleteTask, createTask } from '@/actions/board';

export default function TaskModal({ isOpen, onClose, task, columnId, projectId }) {
  const isEditing = !!task;
  
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData) => {
    setLoading(true);
    if (isEditing) {
      await updateTask(formData);
    } else {
      await createTask(formData);
    }
    setLoading(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    setLoading(true);
    await deleteTask(task.id, projectId);
    setLoading(false);
    onClose();
  };

  return (
    <Modal open={isOpen} onClose={onClose} title={isEditing ? 'Edit Task' : 'New Task'}>
      <form action={handleSubmit} className="space-y-6">
        <input type="hidden" name="projectId" value={projectId} />
        {isEditing && <input type="hidden" name="taskId" value={task.id} />}
        {!isEditing && <input type="hidden" name="status" value={columnId} />}

        <div>
           <input 
             name="title"
             defaultValue={task?.title || ''}
             placeholder="Task title..."
             className="w-full text-xl font-bold bg-transparent border-none outline-none placeholder-gray-400 text-gray-800 dark:text-white"
             required
             autoFocus
           />
        </div>

        <div className="space-y-2">
           <div className="flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400">
             <AlignLeft size={16} /> Description
           </div>
           <textarea 
             name="description"
             defaultValue={task?.description || ''}
             placeholder="Add more details..."
             className="w-full h-32 p-3 rounded-lg bg-gray-50 dark:bg-[#1E1F22] border border-transparent focus:border-blue-500 outline-none resize-none transition text-sm text-gray-700 dark:text-gray-200"
           />
        </div>

        <div className="grid grid-cols-2 gap-4">
          
          <div className="space-y-1">
             <label className="text-xs font-bold text-gray-400 uppercase">Priority</label>
             <div className="relative">
               <Flag className="absolute left-3 top-2.5 text-gray-400" size={14} />
               <select 
                 name="priority" 
                 defaultValue={task?.priority || 'medium'}
                 className="w-full pl-9 pr-3 py-2 rounded-lg bg-gray-50 dark:bg-[#1E1F22] text-sm appearance-none outline-none border border-transparent focus:border-blue-500 cursor-pointer"
               >
                 <option value="low">Low</option>
                 <option value="medium">Medium</option>
                 <option value="high">High</option>
               </select>
             </div>
          </div>

          <div className="space-y-1">
             <label className="text-xs font-bold text-gray-400 uppercase">Due Date</label>
             <div className="relative">
               <Calendar className="absolute left-3 top-2.5 text-gray-400" size={14} />
               <input 
                 type="date" 
                 name="due_date"
                 defaultValue={task?.due_date ? task.due_date.split('T')[0] : ''}
                 className="w-full pl-9 pr-3 py-2 rounded-lg bg-gray-50 dark:bg-[#1E1F22] text-sm outline-none border border-transparent focus:border-blue-500 dark:text-white" // Added text-white for dark mode
               />
             </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-800">
          {isEditing ? (
            <button 
              type="button" 
              onClick={handleDelete}
              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
            >
              <Trash2 size={18} />
            </button>
          ) : <div></div>}
          
          <div className="flex gap-3">
             <button 
               type="button" 
               onClick={onClose}
               className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
             >
               Cancel
             </button>
             <button 
               type="submit" 
               disabled={loading}
               className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-lg shadow-blue-500/30 transition disabled:opacity-50"
             >
               {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Task'}
             </button>
          </div>
        </div>

      </form>
    </Modal>
  );
}