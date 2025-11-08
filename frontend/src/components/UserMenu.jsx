"use client";
import { useState, useEffect, useRef } from "react";
import { LogOut, Settings, User } from "lucide-react";
import Image from "next/image";
import api from "../lib/api";
import { useLogout } from "../lib/logout";

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const menuRef = useRef(null);
  const logout = useLogout();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/auth/me");
        setUser(res.data.user);
      } catch (err) {
        console.error("Failed to load user:", err);
      }
    };
    fetchUser();
  }, []);

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

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 rounded-full overflow-hidden border-2 border-transparent hover:border-blue-500 transition"
      >
        <Image
          src={user.avatar_url || "/default-avatar.png"}
          alt="User Avatar"
          width={40}
          height={40}
          className="object-cover"
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-52 rounded-xl bg-white dark:bg-dark-card shadow-lg border border-gray-200 dark:border-dark-border z-50">
          <div className="p-3 border-b dark:border-gray-700">
            <p className="font-semibold text-gray-800 dark:text-white">
              {user.full_name}
            </p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>

          <button className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800">
            <User className="h-4 w-4" /> Profile
          </button>

          <button className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800">
            <Settings className="h-4 w-4" /> Settings
          </button>

          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      )}
    </div>
  );
}
