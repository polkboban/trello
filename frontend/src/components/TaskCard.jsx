export default function TaskCard({ task }) {
  return (
    <div className="bg-white dark:bg-[#2C2D31] rounded-lg p-3 shadow hover:shadow-md transition cursor-pointer">
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
