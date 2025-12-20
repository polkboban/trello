import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from './TaskCard';
import { Plus, MoreHorizontal } from 'lucide-react';

export default function BoardColumn({ id, title, tasks, onAddTask, onTaskClick }) {
  const { setNodeRef } = useDroppable({ id: id });

  return (
    <div ref={setNodeRef} className="w-[300px] flex-shrink-0 flex flex-col h-full mx-0">
      <div className="flex justify-between items-center mb-3 px-1 group">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-300">{title}</h2>
          <span className="text-xs text-gray-400 font-medium bg-white dark:bg-[#2B2D33] px-2 py-0.5 rounded-md border border-gray-100 dark:border-gray-700">
            {tasks.length}
          </span>
        </div>
        <button className="text-gray-400 opacity-0 group-hover:opacity-100 hover:text-gray-600 transition-opacity">
          <MoreHorizontal size={16} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-10">
        <SortableContext 
          items={tasks.map(t => t.id)} 
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2 min-h-[100px]">
            {tasks.map((task) => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onClick={() => onTaskClick(task)}
              />
            ))}
            
            <button 
              onClick={onAddTask}
              className="w-full py-2.5 flex items-center justify-start gap-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm font-medium hover:bg-white/50 dark:hover:bg-[#2B2D33]/50 rounded-lg transition-all pl-2"
            >
              <Plus size={16} /> 
              <span>New</span>
            </button>
          </div>
        </SortableContext>
      </div>
    </div>
  );
}