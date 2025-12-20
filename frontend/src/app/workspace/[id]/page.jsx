import { getWorkspace } from '@/actions/workspace';
import { getProjects } from '@/actions/project';
import { redirect } from 'next/navigation';
import BoardList from '@/components/BoardList';
import NotificationPopover from '@/components/NotificationPopover'; // 1. Import the component

export default async function WorkspacePage({ params }) {
  // Await params for Next.js 15+
  const { id } = await params;

  const [workspace, projects] = await Promise.all([
    getWorkspace(id),
    getProjects(id)
  ]);

  if (!workspace) {
    redirect('/');
  }

  return (
    // Dotted Matrix Background Container
    <div className="min-h-full bg-[#f8f9fc] dark:bg-[#1E1F22] relative">
      
      {/* CSS Pattern Overlay */}
      <div className="absolute inset-0 z-0 opacity-[0.4] dark:opacity-[0.15]" 
           style={{
             backgroundImage: 'radial-gradient(#a1a1aa 1px, transparent 1px)',
             backgroundSize: '24px 24px'
           }}
      ></div>

      <div className="relative z-10 p-8 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-10 mt-3 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {workspace.name}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">
              {workspace.description || 'Manage your projects and tasks efficiently'}
            </p>
          </div>
          
          {/* RIGHT SIDE ACTIONS: Notifications + Stats */}
          <div className="flex items-center gap-4 mb-6">
                         

             {/* Stats / Info Pill */}
             <div className="flex items-center gap-2 bg-white/80 dark:bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200 dark:border-white/10 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {projects.length} Active Board{projects.length !== 1 && 's'}
                </span>
             </div>
             <div className="bg-white/80 dark:bg-white/5 backdrop-blur-sm p-0.5 rounded-full border border-gray-200 dark:border-white/10 shadow-sm">
                <NotificationPopover />
             </div>
          </div>

        </div>
        
        {/* The Draggable Grid */}
        <main>
           <BoardList initialProjects={projects} workspaceId={id} />
        </main>
      </div>
    </div>
  );
}