'use client';
import { useState } from 'react';
import Modal from './Modal';
import { AlignLeft, Flag, CheckCircle2, Clock, Trash2 } from 'lucide-react';
import { updateTask, deleteTask, createTask } from '@/actions/board';
import Loader from './Loader'; // Assumes you created the Loader component we discussed

export default function TaskModal({ isOpen, onClose, task, columnId, projectId, socket }) {
  const isEditing = !!task;
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData) => {
    setLoading(true);
    try {
      if (isEditing) {
        // 1. Run Server Action (Updates DB and returns the updated object)
        const updatedTaskData = await updateTask(formData);
        
        // 2. Broadcast to others via Socket
        if (socket) {
          socket.emit('task_updated', updatedTaskData);
        }
      } else {
        // 1. Run Server Action (Creates in DB and returns new object)
        const newTaskData = await createTask(formData);

        // 2. Broadcast to others via Socket
        if (socket) {
          socket.emit('task_created', newTaskData);
        }
      }
      onClose();
    } catch (error) {
      console.error("Failed to save task:", error);
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    setLoading(true);
    try {
      // 1. Run Server Action
      await deleteTask(task.id, projectId);

      // 2. Broadcast to others
      if (socket) {
        socket.emit('task_deleted', { taskId: task.id, projectId });
      }
      onClose();
    } catch (error) {
      console.error("Failed to delete task:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose} title={isEditing ? 'Edit Card' : 'New Card'}>
      <form action={handleSubmit} className="flex flex-col gap-6">
        <input type="hidden" name="projectId" value={projectId} />
        {isEditing && <input type="hidden" name="taskId" value={task.id} />}
        {!isEditing && <input type="hidden" name="status" value={columnId} />}

        {/* --- Title Section --- */}
        <div className="relative group">
           <input 
             name="title"
             autoComplete="off"
             defaultValue={task?.title || ''}
             placeholder="Enter task title..."
             className="w-full text-2xl font-bold bg-transparent border-none outline-none placeholder-gray-300 dark:placeholder-gray-600 text-gray-900 dark:text-white"
             required
             autoFocus
           />
        </div>

        {/* --- Metadata Grid --- */}
        <div className="grid grid-cols-2 gap-4">
          
          {/* Priority Select */}
          <div className="bg-gray-50 dark:bg-[#2B2D33] p-3 rounded-xl border border-gray-100 dark:border-gray-700/50 hover:border-blue-500/30 transition-colors group">
             <div className="flex items-center gap-2 mb-1.5">
                <Flag size={14} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Priority</label>
             </div>
             <select 
               name="priority" 
               defaultValue={task?.priority || 'medium'}
               className="w-full bg-transparent text-sm font-medium text-gray-700 dark:text-gray-200 outline-none cursor-pointer appearance-none"
             >
               <option value="low">Low Priority</option>
               <option value="medium">Medium Priority</option>
               <option value="high">High Priority</option>
             </select>
          </div>

          {/* Due Date Input */}
          <div className="bg-gray-50 dark:bg-[#2B2D33] p-3 rounded-xl border border-gray-100 dark:border-gray-700/50 hover:border-blue-500/30 transition-colors group">
             <div className="flex items-center gap-2 mb-1.5">
                <Clock size={14} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Due Date</label>
             </div>
             <input 
               type="date" 
               name="due_date"
               defaultValue={task?.due_date ? task.due_date.split('T')[0] : ''}
               className="w-full bg-transparent text-sm font-medium text-gray-700 dark:text-gray-200 outline-none p-0 cursor-pointer min-h-[20px]" 
             />
          </div>
        </div>

        {/* --- Description Section --- */}
        <div className="space-y-3">
           <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
             <AlignLeft size={18} className="text-gray-400" />
             Description
           </div>
           <textarea 
             name="description"
             defaultValue={task?.description || ''}
             placeholder="Add a more detailed description..."
             className="w-full h-32 p-4 rounded-xl bg-white dark:bg-[#1A1B1E] border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none transition-all text-sm text-gray-700 dark:text-gray-300 leading-relaxed custom-scrollbar"
           />
        </div>

        {/* --- Footer Actions --- */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-800">
          {isEditing ? (
             <button 
               type="button" 
               onClick={handleDelete}
               className="flex items-center gap-2 px-3 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm font-medium"
             >
               <Trash2 size={16} /> <span className="hidden sm:inline">Delete</span>
             </button>
          ) : <div />}
          
          <div className="flex gap-3">
             <button 
               type="button" 
               onClick={onClose}
               className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
             >
               Cancel
             </button>
             <button 
               type="submit" 
               disabled={loading}
               className="flex items-center gap-2 px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-black text-sm font-bold rounded-xl shadow-lg shadow-gray-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
             >
               {loading ? <Loader size="sm" className="border-t-current" /> : <CheckCircle2 size={16} />}
               {isEditing ? 'Save Changes' : 'Create Card'}
             </button>
          </div>
        </div>

      </form>
    </Modal>
  );
}