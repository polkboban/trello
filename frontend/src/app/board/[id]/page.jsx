import { getBoard } from '@/actions/board';
import BoardClient from './BoardClient';
import { redirect } from 'next/navigation';

export default async function BoardPage({ params }) {
  // In Next.js 15+, params is a Promise
  const { id } = await params;
  
  const data = await getBoard(id);

  if (!data) {
    redirect('/dashboard');
  }

  return (
    <div className="h-screen bg-[#F9FAFC] dark:bg-[#1E1F22] flex flex-col">
      <div className="bg-white dark:bg-[#2B2D33] border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold dark:text-white">{data.project.name}</h1>
      </div>
      <BoardClient initialTasks={data.tasks} projectId={id} />
    </div>
  );
}