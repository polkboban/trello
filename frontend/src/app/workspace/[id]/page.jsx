import Link from 'next/link';
import { getWorkspace } from '@/actions/workspace';
import { getProjects, createProject } from '@/actions/project';
import { redirect } from 'next/navigation';
import Header from '@/components/Header'; // Adjust path if needed

export default async function WorkspacePage({ params }) {
  const { id } = await params;

  // Fetch data in parallel
  const [workspace, projects] = await Promise.all([
    getWorkspace(id),
    getProjects(id)
  ]);

  if (!workspace) {
    redirect('/dashboard');
  }

  return (
    <div className="flex flex-col h-screen bg-[#f2f2f2] dark:bg-dark-bg transition-colors">
      <div className="p-6">
        <Header title={workspace.name} />
        
        <main className="mt-8">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Boards</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Create New Board Card (Form) */}
            <form action={createProject} className="h-32">
              <input type="hidden" name="workspaceId" value={id} />
              <div className="relative group h-full">
                <input 
                  name="name" 
                  placeholder="New Board Title" 
                  className="absolute inset-0 w-full h-full p-4 rounded-xl bg-gray-200 dark:bg-[#232428] text-gray-700 dark:text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-center font-medium"
                  required 
                />
                <button 
                  type="submit" 
                  className="absolute bottom-3 right-3 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Create
                </button>
              </div>
            </form>

            {/* List Existing Boards */}
            {projects.map((project) => (
              <Link key={project.id} href={`/board/${project.id}`}>
                <div className="h-32 bg-white dark:bg-dark-card p-4 rounded-xl shadow hover:shadow-lg transition cursor-pointer border-l-4 border-blue-500 flex flex-col justify-between">
                  <h3 className="font-bold text-lg dark:text-white truncate">{project.name}</h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">View Board &rarr;</span>
                </div>
              </Link>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}