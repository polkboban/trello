import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getWorkspaces, createWorkspace } from '@/actions/workspace';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const workspaces = await getWorkspaces();

  if (workspaces && workspaces.length > 0) {
    redirect(`/workspace/${workspaces[0].id}`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f2f2f2] dark:bg-dark-bg p-4">
      <div className="max-w-md w-full bg-white dark:bg-dark-card p-8 rounded-2xl shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold dark:text-white mb-2">Welcome to Kanban!</h1>
          <p className="text-gray-500">Let's create your first workspace to get started.</p>
        </div>

        <form action={async (formData) => {
          'use server';
          await createWorkspace(formData);
          redirect('/'); 
        }} className="space-y-4">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Workspace Name</label>
            <input 
              name="name" 
              type="text" 
              placeholder="e.g. My Company, Personal Projects" 
              className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-dark-bg dark:text-white dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition"
              required 
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-blue-500/30"
          >
            Create Workspace
          </button>
        </form>
      </div>
    </div>
  );
}