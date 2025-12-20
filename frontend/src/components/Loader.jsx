'use client';

export default function Loader({ size = 'medium', className = '', fullScreen = false, label }) {
  // Map size props to Tailwind classes
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',      // Tiny (for buttons)
    medium: 'w-8 h-8 border-[3px]', // Default
    lg: 'w-12 h-12 border-4',    // Section loading
    xl: 'w-16 h-16 border-4',    // Full screen
  };

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div 
        className={`
          ${sizeClasses[size] || sizeClasses.medium}
          rounded-full animate-spin
          border-gray-200 dark:border-gray-800
          border-t-blue-600 dark:border-t-blue-500
          ${className}
        `}
        role="status"
        aria-label="loading"
      />
      {label && (
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 animate-pulse">
          {label}
        </span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/60 dark:bg-[#121212]/60 backdrop-blur-md transition-all">
        {spinner}
      </div>
    );
  }

  return spinner;
}