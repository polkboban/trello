import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function TaskCard({ task }) {
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

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className="bg-white dark:bg-[#2C2D31] rounded-lg p-3 shadow hover:shadow-md cursor-grab touch-none mb-3"
    >
      <h3 className="text-sm font-medium dark:text-gray-100">{task.title}</h3>
      {task.labels?.length > 0 && (
        <div className="flex gap-1 flex-wrap mt-2">
          {task.labels.map((label) => (
            <span
              key={label}
              className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
            >
              {label}
            </span>
          ))}
        </div>
      )}
      <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
        <span>{task.priority}</span>
        {task.due_date && <span>{new Date(task.due_date).toLocaleDateString()}</span>}
      </div>
    </div>
  );
}
