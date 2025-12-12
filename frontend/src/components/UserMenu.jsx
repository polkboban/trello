'use client';
import { useState, useEffect, useRef } from "react";
import { LogOut, Settings, User } from "lucide-react";
import Image from "next/image";
import { createClient } from '@/lib/supabase/client'; // Use the client we made earlier
import { useRouter } from "next/navigation";

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const menuRef = useRef(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUser(user);
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh(); // Clear server cache
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  // Use metadata or fallback
  const fullName = user.user_metadata?.full_name || user.email;
  const avatarUrl = user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${fullName}`;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 rounded-full overflow-hidden border-2 border-transparent hover:border-blue-500 transition"
      >
        <Image
          src={avatarUrl}
          alt="User Avatar"
          width={40}
          height={40}
          className="object-cover"
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-52 rounded-xl bg-white dark:bg-dark-card shadow-lg border border-gray-200 dark:border-dark-border z-50">
          <div className="p-3 border-b dark:border-gray-700">
            <p className="font-semibold text-gray-800 dark:text-white truncate">
              {fullName}
            </p>
            <p className="text-sm text-gray-500 truncate">{user.email}</p>
          </div>

          <button className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            <User className="h-4 w-4" /> Profile
          </button>

          <button className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            <Settings className="h-4 w-4" /> Settings
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      )}
    </div>
  );
}