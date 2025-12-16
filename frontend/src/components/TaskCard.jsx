import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
    opacity: isDragging ? 0.3 : 1, 
  };

  // Priority Colors
  const priorityColors = {
    high: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
    medium: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
    low: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      onClick={onClick} 
      className="group bg-white dark:bg-[#2C2D31] rounded-xl p-4 shadow-sm hover:shadow-md border border-gray-100 dark:border-gray-700 cursor-pointer transition-all relative"
    >
      <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-orange-400' : 'bg-blue-400'}`}></div>

      <div className="pl-3">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-tight mb-2">{task.title}</h3>
        
        <div className="flex justify-between items-center mt-3">
           <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${priorityColors[task.priority || 'medium']}`}>
             {task.priority || 'medium'}
           </span>

           {task.due_date && (
             <span className="text-[10px] font-medium text-gray-400">
               {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
             </span>
           )}
        </div>
      </div>
    </div>
  );
}