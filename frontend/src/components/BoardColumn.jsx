import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from './TaskCard';
import { Plus } from 'lucide-react';

export default function BoardColumn({ id, title, tasks, onAddTask, onTaskClick }) {
  const { setNodeRef } = useDroppable({ id: id });

  return (
    <div ref={setNodeRef} className="w-72 bg-gray-50 dark:bg-[#232428] rounded-xl p-3 flex-shrink-0 shadow-sm h-fit border border-gray-100 dark:border-gray-800">
      <div className="flex justify-between items-center mb-3 px-1">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{title}</h2>
        <span className="text-xs font-medium text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">{tasks.length}</span>
      </div>
      
      <SortableContext 
        items={tasks.map(t => t.id)} 
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3 min-h-[10px]">
          {tasks.map((task) => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onClick={() => onTaskClick(task)}
            />
          ))}
        </div>
      </SortableContext>

      <button 
        onClick={onAddTask}
        className="w-full mt-3 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-200/50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700/50 transition"
      >
        <Plus size={16} /> Add Card
      </button>
    </div>
  );
}