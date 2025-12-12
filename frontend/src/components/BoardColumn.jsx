import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from './TaskCard';

export default function BoardColumn({ id, title, tasks }) {
  const { setNodeRef } = useDroppable({ id: id });

  return (
    <div ref={setNodeRef} className="w-72 bg-gray-50 dark:bg-[#232428] rounded-xl p-3 flex-shrink-0 shadow-sm h-fit">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-sm font-semibold dark:text-gray-100">{title}</h2>
        <span className="text-xs text-gray-500">{tasks.length}</span>
      </div>
      
      <SortableContext 
        items={tasks.map(t => t.id)} 
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3 min-h-[50px]">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      </SortableContext>

      <button className="w-full mt-3 text-sm text-gray-500 hover:text-blue-600 dark:hover:text-blue-400">
        + Add a card
      </button>
    </div>
  );
}