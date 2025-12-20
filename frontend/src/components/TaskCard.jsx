import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Clock } from 'lucide-react';

export default function TaskCard({ task, onClick }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id, data: { type: 'Task', task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1, 
  };

  const priorityColor = {
    high: 'bg-red-500',
    medium: 'bg-orange-400',
    low: 'bg-blue-400',
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      onClick={onClick} 
      className="group bg-white dark:bg-[#2B2D33] rounded-lg p-3.5 shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-gray-100 dark:border-gray-700/50 cursor-pointer transition-all duration-200 select-none"
    >
      {/* Tags & Priority */}
      <div className="flex items-center justify-between mb-2">
         <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${priorityColor[task.priority || 'medium']}`} />
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
              {task.priority || 'Normal'}
            </span>
         </div>
      </div>

      <h3 className="text-[13px] font-medium text-gray-800 dark:text-gray-200 leading-snug mb-3">
        {task.title}
      </h3>
      
      {/* Footer Meta */}
      {(task.due_date || task.assignee) && (
        <div className="flex items-center justify-between pt-2 border-t border-gray-50 dark:border-gray-700/50">
           {task.due_date && (
             <div className={`flex items-center gap-1.5 text-[11px] font-medium ${new Date(task.due_date) < new Date() ? 'text-red-500' : 'text-gray-400'}`}>
               <Clock size={12} />
               <span>
                 {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
               </span>
             </div>
           )}
           
           {/* Tiny avatar placeholder */}
           <div className="w-5 h-5 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700" />
        </div>
      )}
    </div>
  );
}