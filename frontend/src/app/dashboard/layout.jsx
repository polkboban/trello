'use client';
import Link from 'next/link';
import Image from 'next/image';
import ThemeToggle from '../../components/ThemeToggle';
import {
  LayoutGrid,
  Users,
  Settings,
  Table,
  Calendar,
  Circle,
  ChevronDown,
  Plus,
} from 'lucide-react';

export default function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#1E1F22] text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-72 bg-white dark:bg-[#232428] shadow-sm dark:shadow-none flex flex-col p-4">
        {/* Logo Section */}
        <div className="flex items-center justify-between mb-9 mt-2">
          <div className="flex items-center gap-2">
            <Image
              src="/trello.svg"
              alt="Trello Logo"
              width={24}
              height={24}
              className="dark:invert-0"
            />
            <span className="text-lg font-semibold">Trello</span>
          </div>
          <button className="bg-blue-500 text-white rounded-md px-1 py-1 text-sm font-medium hover:bg-blue-600 transition">
            <Plus size={16} />
          </button>
        </div>

        {/* Workspace Dropdown */}
        <div className="bg-gray-100 dark:bg-[#2C2D31] px-3 py-2 rounded-lg mb-4 flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-2">
            <div className="bg-red-500 rounded-md w-6 h-6" />
            <span className="text-sm font-medium">Kettle Studio</span>
          </div>
          <ChevronDown size={16} className="opacity-60" />
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-3 text-sm font-medium mb-6 mt-2">
          <Link
            href="#"
            className="flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2C2D31] rounded-lg px-3 py-2 transition"
          >
            <LayoutGrid size={18} />
            Boards
          </Link>
          <Link
            href="#"
            className="flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2C2D31] rounded-lg px-3 py-2 transition"
          >
            <Users size={18} />
            Members
          </Link>
          <Link
            href="#"
            className="flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2C2D31] rounded-lg px-3 py-2 transition"
          >
            <Settings size={18} />
            Settings
          </Link>
        </nav>

        {/* Workspace Views */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
            Workspace Views
          </h2>
          <div className="flex flex-col gap-2 text-sm">
            <Link
              href="#"
              className="flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2C2D31] rounded-lg px-3 py-2 transition"
            >
              <Table size={18} />
              Table
            </Link>
            <Link
              href="#"
              className="flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2C2D31] rounded-lg px-3 py-2 transition"
            >
              <Calendar size={18} />
              Calendar
            </Link>
          </div>
        </div>

        {/* Your Boards */}
        <div className="mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
            Your Boards
          </h2>
          <div className="flex flex-col gap-2 text-sm">
            <Link
              href="#"
              className="flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2C2D31] rounded-lg px-3 py-2 transition"
            >
              <Circle size={12} className="text-purple-500" />
              Project Plan
            </Link>
            
          </div>
        </div>

        {/* Night Mode Toggle */}
        <div className="mt-auto pt-4 flex items-center justify-between">
          <span className="text-sm">Night Mode</span>
          <ThemeToggle />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#1E1F22] transition-colors duration-300">
        {children}
      </main>
    </div>
  );
}
