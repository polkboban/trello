'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '../../../lib/api';
import TaskColumn from '../../../components/BoardColumn';

export default function BoardPage() {
  const { id } = useParams(); 
  const [board, setBoard] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [columns, setColumns] = useState(['Todo', 'Doing', 'Completed']);

  useEffect(() => {
    loadBoard();
    loadTasks();
  }, [id]);

  const loadBoard = async () => {
    try {
        const res = await api.get(`/projects/${id}`);
        setBoard(res.data.project);
    } catch (err) {
        console.error('Error loading project:', err);
    }
    };

  const loadTasks = async () => {
    try {
        const res = await api.get(`/tasks/project/${id}`);
        setTasks(res.data.tasks);
    } catch (err) {
        console.error('Error loading tasks:', err);
    }
   };


  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#1E1F22] p-6">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold dark:text-white">{board?.name}</h1>
          <p className="text-gray-500 dark:text-gray-400">{board?.description}</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
          + Add Task
        </button>
      </header>

      <div className="flex gap-6 overflow-x-auto pb-4">
        {columns.map((col) => (
          <TaskColumn
            key={col}
            title={col}
            tasks={tasks.filter((t) => t.status === col)}
          />
        ))}
      </div>
    </div>
  );
}
