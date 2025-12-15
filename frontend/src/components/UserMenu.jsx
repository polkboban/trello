'use client';
import { useState, useEffect, useRef } from "react";
import { LogOut, Moon, Sun } from "lucide-react";
import Image from "next/image";
import { createClient } from '@/lib/supabase/client';
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes"; 

export default function UserMenu({ isCollapsed }) {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false); 
  
  const menuRef = useRef(null);
  const router = useRouter();
  const supabase = createClient();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUser(user);
    };
    fetchUser();

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  if (!user || !mounted) return null;

  const fullName = user.user_metadata?.full_name || user.email;
  const avatarUrl = user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${fullName}`;
  const isDark = theme === 'dark';

  return (
    <div className="relative w-full" ref={menuRef}>
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-3 w-full min-w-[220px] rounded-xl bg-white dark:bg-[#2B2D33] shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
          
          <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-[#232428]">
            <p className="font-semibold text-gray-800 dark:text-white truncate text-sm">
              {fullName}
            </p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>

          <div className="p-2 space-y-1">
            <div className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#3F4148] transition cursor-pointer" onClick={() => setTheme(isDark ? 'light' : 'dark')}>
              <div className="flex items-center gap-3">
                {isDark ? <Moon size={16} className="text-blue-400"/> : <Sun size={16} className="text-orange-500"/>}
                <span className="text-sm font-medium dark:text-gray-200">Dark Mode</span>
              </div>
              
              <div className={`w-10 h-5 flex items-center bg-gray-300 dark:bg-gray-600 rounded-full p-1 duration-300 ease-in-out ${isDark ? 'bg-blue-600 dark:bg-blue-600' : ''}`}>
                <div className={`bg-white w-3 h-3 rounded-full shadow-md transform duration-300 ease-in-out ${isDark ? 'translate-x-5' : ''}`}></div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
            >
              <LogOut size={16} />
              <span className="font-medium">Log out</span>
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-3 w-full hover:bg-gray-100 dark:hover:bg-[#2B2D33] rounded-lg p-2 transition ${isCollapsed ? 'justify-center' : ''}`}
      >
        <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 dark:border-gray-600 flex-shrink-0 shadow-sm">
           <Image src={avatarUrl} alt="User" width={32} height={32} className="object-cover w-full h-full" />
        </div>
        
        {!isCollapsed && (
           <div className="text-left overflow-hidden flex-1">
             <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{fullName}</p>
           </div>
        )}
      </button>
    </div>
  );
}