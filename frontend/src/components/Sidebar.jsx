'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { 
  ChevronLeft, ChevronRight, Layout, Settings, 
  Users, ChevronDown, Plus, Kanban 
} from 'lucide-react';
import { getWorkspaces } from '@/actions/workspace';
import { getProjects } from '@/actions/project';
import { getBoard } from '@/actions/board';
import UserMenu from './UserMenu';
import WorkspaceModal from './WorkspaceModal';

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const [workspaces, setWorkspaces] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  
  const dropdownRef = useRef(null);
  const pathname = usePathname();
  const params = useParams(); 

  useEffect(() => {
    if (pathname.startsWith('/board')) {
      setIsCollapsed(true);
    } else {
      setIsCollapsed(false);
    }
  }, [pathname]);

  const loadWorkspaces = async () => {
    const data = await getWorkspaces();
    setWorkspaces(data || []);
  };

  useEffect(() => {
    loadWorkspaces();
  }, []);

  useEffect(() => {
    const syncSidebarState = async () => {
      if (!params.id || workspaces.length === 0) return;

      let targetWorkspaceId = null;

      if (pathname.startsWith('/board')) {
        try {
          const boardData = await getBoard(params.id);
          if (boardData?.project) {
            targetWorkspaceId = boardData.project.workspace_id;
          }
        } catch (err) {
          console.error("Failed to resolve board workspace", err);
        }
      } 
      else if (pathname.startsWith('/workspace')) {
        targetWorkspaceId = params.id;
      }

      if (targetWorkspaceId) {
        const workspace = workspaces.find(w => w.id === targetWorkspaceId);
        if (workspace && workspace.id !== activeWorkspace?.id) {
          setActiveWorkspace(workspace);
          const projectList = await getProjects(workspace.id);
          setProjects(projectList || []);
        } else if (workspace) {
           if (projects.length === 0) {
              const projectList = await getProjects(workspace.id);
              setProjects(projectList || []);
           }
        }
      }
    };

    syncSidebarState();
  }, [params.id, pathname, workspaces]); 

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (pathname === '/' || pathname === '/login' || pathname === '/register') return null;

  return (
    <>
      <aside 
        className={`
          relative h-screen bg-[#F7F8FA] dark:bg-[#1E1F22] border-r border-gray-200 dark:border-[#2B2D33]
          transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1.0)] flex flex-col z-40
          ${isCollapsed ? 'w-16' : 'w-64'}
        `}
      >
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-6 bg-white dark:bg-[#2B2D33] border border-gray-200 dark:border-gray-600 rounded-full p-1 text-gray-500 hover:text-blue-600 shadow-sm z-50 transition-transform hover:scale-110"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className={`flex items-center h-16 border-b border-gray-200 dark:border-gray-800 flex-shrink-0 ${isCollapsed ? 'justify-center' : 'px-4 gap-3'}`}>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
            <Kanban className="text-white w-5 h-5" />
          </div>
          {!isCollapsed && (
            <span className="font-bold text-lg text-gray-800 dark:text-white tracking-tight">
              KanBan
            </span>
          )}
        </div>

        <div className="p-3" ref={dropdownRef}>
          <div className="relative">
            <button 
              onClick={() => !isCollapsed && setIsDropdownOpen(!isDropdownOpen)}
              className={`
                w-full flex items-center p-2 rounded-xl transition-all duration-200 border border-transparent
                ${isCollapsed 
                  ? 'justify-center' 
                  : 'justify-between hover:bg-white dark:hover:bg-[#2B2D33] hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-sm'
                }
              `}
            >
              <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} overflow-hidden w-full`}>
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm flex-shrink-0 text-sm">
                  {activeWorkspace ? activeWorkspace.name.charAt(0).toUpperCase() : 'W'}
                </div>
                
                {!isCollapsed && (
                  <div className="text-left overflow-hidden flex-1">
                    <p className="font-semibold text-sm text-gray-700 dark:text-gray-200 truncate leading-tight">
                      {activeWorkspace ? activeWorkspace.name : 'Select Workspace'}
                    </p>
                  </div>
                )}
              </div>
              
              {!isCollapsed && (
                <ChevronDown 
                  size={14} 
                  className={`text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
                />
              )}
            </button>

            {isDropdownOpen && !isCollapsed && (
              <div className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-[#2B2D33] rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                 <p className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Switch Workspace</p>
                 {workspaces.map(ws => (
                   <Link 
                     key={ws.id} 
                     href={`/workspace/${ws.id}`}
                     onClick={() => setIsDropdownOpen(false)}
                     className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-[#3F4148] text-sm text-gray-700 dark:text-gray-200 transition-colors"
                   >
                     <div className="w-5 h-5 rounded bg-gray-100 dark:bg-gray-600 flex items-center justify-center text-[10px] font-bold text-gray-500 dark:text-gray-300">
                        {ws.name.charAt(0).toUpperCase()}
                     </div>
                     <span className="truncate">{ws.name}</span>
                   </Link>
                 ))}
                 <div className="h-px bg-gray-100 dark:bg-gray-700 my-1 mx-2"></div>
                 
                 <button 
                   onClick={() => {
                     setIsDropdownOpen(false);
                     setIsWorkspaceModalOpen(true);
                   }}
                   className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-2 transition-colors"
                 >
                   <Plus size={14} /> Create Workspace
                 </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-6">
          
          <div className="space-y-1">
            <NavItem 
              href={activeWorkspace ? `/workspace/${activeWorkspace.id}` : '#'} 
              icon={<Layout size={18} />} 
              label="Boards" 
              isCollapsed={isCollapsed}
              isActive={pathname === `/workspace/${activeWorkspace?.id}`}
            />
             <NavItem 
              href={activeWorkspace ? `/workspace/${activeWorkspace.id}/members` : '#'} 
              icon={<Users size={18} />} 
              label="Members" 
              isCollapsed={isCollapsed}
            />
            <NavItem 
              href={activeWorkspace ? `/workspace/${activeWorkspace.id}/settings` : '#'} 
              icon={<Settings size={18} />} 
              label="Settings" 
              isCollapsed={isCollapsed}
              isActive={pathname === `/workspace/${activeWorkspace?.id}/settings`}
            />
          </div>

          {!isCollapsed && activeWorkspace && (
            <div>
              <div className="flex items-center justify-between px-2 mb-2 mt-4">
                 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Your Boards</span>
                 <button className="text-gray-400 hover:text-blue-600 transition p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                   <Plus size={12}/>
                 </button>
              </div>
              <div className="space-y-0.5">
                {projects.length === 0 && (
                  <p className="text-xs text-gray-400 px-2 italic">No boards yet.</p>
                )}
                {projects.map(proj => (
                  <Link
                    key={proj.id}
                    href={`/board/${proj.id}`}
                    className={`
                      group flex items-center gap-3 px-2 py-1.5 rounded-lg text-sm transition-all
                      ${pathname === `/board/${proj.id}` 
                        ? 'bg-white dark:bg-[#2B2D33] text-gray-800 dark:text-gray-200 shadow-sm' 
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2B2D33]'}
                    `}
                  >
                    <span className={`w-2 h-2 rounded-full transition-colors ${pathname === `/board/${proj.id}` ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600 group-hover:bg-blue-400'}`}></span>
                    <span className="truncate">{proj.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-gray-200 dark:border-gray-800 mt-auto">
           <div className={`flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
              <UserMenu isCollapsed={isCollapsed} />
           </div>
        </div>
      </aside>

      <WorkspaceModal 
        isOpen={isWorkspaceModalOpen}
        onClose={() => setIsWorkspaceModalOpen(false)}
        onCreated={loadWorkspaces} 
      />
    </>
  );
}

function NavItem({ href, icon, label, isCollapsed, isActive }) {
  return (
    <Link 
      href={href}
      className={`
        group flex items-center gap-3 px-2 py-2 rounded-lg transition-all duration-200
        ${isActive 
          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium' 
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2B2D33] hover:text-gray-900 dark:hover:text-gray-200'}
        ${isCollapsed ? 'justify-center' : ''}
      `}
      title={isCollapsed ? label : ''}
    >
      <div className="transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-6 origin-center text-current">
        {icon}
      </div>
      
      {!isCollapsed && <span>{label}</span>}
    </Link>
  );
}