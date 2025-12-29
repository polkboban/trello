import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Clock, CheckSquare, MoreHorizontal, MessageSquare } from 'lucide-react';

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

  // Mock tags based on priority/status
  const getTags = () => {
    if (task.priority === 'high') return [{ text: 'Inception', color: 'bg-[#D1FADF] text-[#027A48]' }, { text: 'Trigger', color: 'bg-[#E0F2FE] text-[#026AA2]' }];
    if (task.priority === 'medium') return [{ text: 'Goals', color: 'bg-[#FEF0C7] text-[#B54708]' }];
    return [];
  };

  const tags = getTags();

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      onClick={onClick} 
      className="group bg-[#26272F] hover:bg-[#2E303A] rounded-xl p-4 mb-3 border border-[#3E414C] cursor-pointer transition-all duration-200 select-none shadow-sm hover:border-gray-600"
    >
      <div className="flex justify-between items-start mb-2">
         <h3 className="text-[14px] font-semibold text-gray-100 leading-snug line-clamp-2">
          {task.title}
        </h3>
        <button className="text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity -mr-2 -mt-2 p-1">
          <MoreHorizontal size={16} />
        </button>
      </div>

      <p className="text-gray-400 text-[12px] mb-3 line-clamp-2">
        {task.description || "No description provided..."}
      </p>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map((tag, i) => (
            <span key={i} className={`px-2 py-0.5 rounded text-[10px] font-bold ${tag.color}`}>
              {tag.text}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-[#3E414C]">
         <div className="flex items-center gap-4">
            {task.due_date && (
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400">
                <Clock size={12} />
                <span>
                  {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </div>
            )}
            
             <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400">
                <MessageSquare size={12} />
                <span>3</span>
             </div>
         </div>

         <div className="flex items-center gap-1.5">
           {task.priority === 'high' && <span className="text-[10px] font-bold text-red-400">Highest</span>}
           {task.priority === 'medium' && <span className="text-[10px] font-bold text-orange-400">Medium</span>}
           {task.priority === 'low' && <span className="text-[10px] font-bold text-blue-400">Low</span>}
           
           <div className="flex -space-x-2 ml-2">
              <div className="w-5 h-5 rounded-full bg-indigo-500 border border-[#26272F]" />
              <div className="w-5 h-5 rounded-full bg-purple-500 border border-[#26272F]" />
           </div>
         </div>
      </div>
    </div>
  );
}