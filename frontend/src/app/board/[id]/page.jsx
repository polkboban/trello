import { getBoard } from '@/actions/board';
import BoardClient from './BoardClient';
import { redirect } from 'next/navigation';
import { Settings2, Filter, Share, ChevronDown } from 'lucide-react';

export default async function BoardPage({ params }) {
  const { id } = await params;
  const data = await getBoard(id);

  if (!data) redirect('/dashboard');

  return (
    <div className="h-full flex flex-col bg-[#1E1F22] text-gray-200 relative">
    
      <div 
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: 'radial-gradient(circle, #32343A 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px',
        }}
      ></div>

      <div className="relative z-10 px-6 py-5 flex justify-between items-center border-b border-[#2B2D33] bg-[#1E1F22]/80 backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-3">
             <h1 className="text-xl font-bold text-white tracking-tight">
               {data.project.name}
             </h1>
             <div className="px-2.5 py-1 rounded-full bg-[#2B2D33] border border-[#3E414C] text-gray-400 text-xs font-medium flex items-center gap-1">
               Board
             </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-[#2B2D33] text-gray-400 transition-all border border-transparent hover:border-[#3E414C]">
            <Filter size={18} />
          </button>
          <button className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-[#2B2D33] text-gray-400 transition-all border border-transparent hover:border-[#3E414C]">
            <Settings2 size={18} />
          </button>
          <button className="h-9 px-4 flex items-center gap-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20">
            <Share size={16} /> Share
          </button>
        </div>
      </div>

      <div className="relative z-10 flex-1 overflow-x-auto overflow-y-hidden px-6 pt-6 pb-4">
        <BoardClient initialTasks={data.tasks} projectId={id} />
      </div>
    </div>
  );
}