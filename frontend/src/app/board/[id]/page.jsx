import { getBoard } from '@/actions/board';
import BoardClient from './BoardClient';
import { redirect } from 'next/navigation';
import { Settings2, Filter, Share } from 'lucide-react';

export default async function BoardPage({ params }) {
  const { id } = await params;
  const data = await getBoard(id);

  if (!data) redirect('/dashboard');

  return (
    <div className="h-full flex flex-col bg-[#F7F8FA] dark:bg-[#1E1F22] relative">
      <div 
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: 'radial-gradient(circle, #E5E7EB 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px',
          opacity: 0.8 
        }}
      ></div>
      <div 
        className="absolute inset-0 pointer-events-none z-0 hidden dark:block"
        style={{
          backgroundImage: 'radial-gradient(circle, #2B2D33 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px',
        }}
      ></div>

      <div className="relative z-10 px-8 py-6 flex justify-between items-end flex-shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-1 ml-5">
             <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
               {data.project.name}
             </h1>
             <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[11px] font-bold uppercase tracking-wider">
               Board
             </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-[#2B2D33] text-gray-500 transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
            <Filter size={18} />
          </button>
          <button className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-[#2B2D33] text-gray-500 transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
            <Settings2 size={18} />
          </button>
          <button className="h-9 px-4 flex items-center gap-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-black text-sm font-medium hover:opacity-90 transition-opacity shadow-lg shadow-gray-500/10">
            <Share size={16} /> Share
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden relative z-10 px-6 pb-4">
        <BoardClient initialTasks={data.tasks} projectId={id} />
      </div>
    </div>
  );
}