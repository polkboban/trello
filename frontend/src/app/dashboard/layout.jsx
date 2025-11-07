'use client';
import Link from 'next/link';
import ThemeToggle from '../../components/ThemeToggle';

export default function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#1E1F22] text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-[#232428] shadow-md dark:shadow-none flex flex-col p-4">
        <h1 className="text-xl font-semibold mb-6 text-center">Trello Clone</h1>

        <nav className="flex flex-col gap-3 text-sm font-medium">
          <Link
            href="/dashboard"
            className="hover:bg-gray-200 dark:hover:bg-[#2C2D31] rounded-lg px-3 py-2 transition"
          >
            Boards
          </Link>
          <Link
            href="/dashboard/members"
            className="hover:bg-gray-200 dark:hover:bg-[#2C2D31] rounded-lg px-3 py-2 transition"
          >
            Members
          </Link>
          <Link
            href="/dashboard/settings"
            className="hover:bg-gray-200 dark:hover:bg-[#2C2D31] rounded-lg px-3 py-2 transition"
          >
            Settings
          </Link>
        </nav>

        <div className="mt-auto pt-4 border-t border-gray-200 dark:border-[#2E2F33] flex items-center justify-between">
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
