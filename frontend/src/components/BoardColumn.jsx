import TaskCard from './TaskCard';

export default function BoardColumn({ title, tasks = [] }) {
  return (
    <div className="w-72 bg-gray-50 dark:bg-[#232428] rounded-xl p-3 flex-shrink-0 shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-sm font-semibold dark:text-gray-100">{title}</h2>
        <span className="text-xs text-gray-500">{tasks.length}</span>
      </div>
      <div className="space-y-3">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
      <button className="w-full mt-3 text-sm text-gray-500 hover:text-blue-600 dark:hover:text-blue-400">
        + Add a card
      </button>
    </div>
  );
}
