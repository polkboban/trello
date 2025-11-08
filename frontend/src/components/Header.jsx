"use client";

import { Star, Bell } from "lucide-react";
import { useState } from "react";
import UserMenu from "./UserMenu";

export default function Header({ title = "Workspace" }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header className="flex items-center justify-between bg-white dark:bg-dark-card border-b border-gray-200 dark:border-dark-border px-6 py-3 shadow-sm transition-colors rounded-[10px]">
      {/* Left Section */}
      <div className="flex items-center gap-3">
        <button className="hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-full transition">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-gray-700 dark:text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex items-center gap-1">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h1>
          <button className="hover:text-yellow-500 dark:hover:text-yellow-400 transition">
            <Star className="h-4 w-4 text-gray-500" fill="none" />
          </button>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="text-sm text-gray-500 dark:text-gray-400 hover:underline flex items-center"
          >
            ▼
          </button>
        </div>
      </div>

      {/* Center Section */}
      <div className="flex items-center flex-1 justify-center">
        <input
          type="text"
          placeholder="Search boards, cards, ..."
          className="w-1/2 max-w-md px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-[#1E1F22] text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        />
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        <button className="relative hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-full transition">
          <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          {/* Notification dot */}
          <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full"></span>
        </button>

        <UserMenu />
      </div>
    </header>
  );
}
