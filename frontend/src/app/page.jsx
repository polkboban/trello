import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getWorkspaces, createWorkspace } from '@/actions/workspace';
import Link from 'next/link';
import { ArrowRight, Layout, Users, Zap } from 'lucide-react';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const workspaces = await getWorkspaces();

    if (workspaces && workspaces.length > 0) {
      redirect(`/workspace/${workspaces[0].id}`);
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f2f2f2] dark:bg-dark-bg p-4">
        <div className="max-w-md w-full bg-white dark:bg-dark-card p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800">
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

  return (
    <div className="min-h-screen bg-[#0B0C10] text-white selection:bg-blue-500 selection:text-white overflow-hidden">
      
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-[#0B0C10]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Layout className="text-white w-5 h-5" />
            </div>
            <span>KanBan</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
              Log in
            </Link>
            <Link 
              href="/register" 
              className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all shadow-lg shadow-blue-900/20 hover:shadow-blue-600/40"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <div className="relative pt-32 pb-20 sm:pt-40 sm:pb-24">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] -z-10"></div>
        <div className="absolute top-40 right-0 w-[300px] h-[300px] bg-indigo-600/10 rounded-full blur-[80px] -z-10"></div>

        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-wider mb-6">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            github.com/polboban
          </div>
          
          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-gray-500">
            Manage projects with <br className="hidden sm:block" />
            <span className="text-blue-500">liquid precision.</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            The project management tool designed for modern teams. 
            Experience a fluid, glass-morphic interface that makes organizing tasks feel effortless.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/register" 
              className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-lg transition-all shadow-lg shadow-blue-900/40 hover:shadow-blue-600/50 hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              Start for free <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </div>

      {/* --- Features Grid (Glassmorphism) --- */}
      <div id="features" className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard 
            icon={<Layout className="text-blue-400" size={32} />}
            title="Kanban Boards"
            description="Drag and drop tasks through stages with our ultra-smooth, physics-based dnd engine."
          />
          <FeatureCard 
            icon={<Users className="text-indigo-400" size={32} />}
            title="Team Collaboration"
            description="Invite members to your workspace and collaborate on tasks in real-time."
          />
          <FeatureCard 
            icon={<Zap className="text-purple-400" size={32} />}
            title="Lightning Fast"
            description="Built on Next.js 14 and Supabase for instant updates and zero lag."
          />
        </div>
      </div>

      {/* --- Footer --- */}
      <footer className="border-t border-white/10 py-10 text-center text-gray-500 text-sm">
        <p>© 2025 Trello Clone. By polkboban</p>
      </footer>
    </div>
  );
}

// Helper Component for the Feature Cards
function FeatureCard({ icon, title, description }) {
  return (
    <div className="group p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 backdrop-blur-xl">
      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}