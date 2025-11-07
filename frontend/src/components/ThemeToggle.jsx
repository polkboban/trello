'use client';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="flex items-center gap-2 px-3 py-2 rounded-full bg-gray-200 dark:bg-[#2C2D31] hover:bg-gray-300 dark:hover:bg-[#34353A] transition"
    >
      <div
        className={`w-9 h-5 rounded-full relative ${
          isDark ? 'bg-gradient-to-r from-purple-600 to-pink-500' : 'bg-gray-300'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
            isDark ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </div>
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
