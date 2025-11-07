'use client';
import { useEffect, useState } from 'react';
import api from '../../lib/api';
import ProtectedRoute from '../../components/ProtectedRoute';

export default function DashboardPage() {
  const [workspaces, setWorkspaces] = useState([]);

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    try {
      const res = await api.get('/workspaces');
      setWorkspaces(res.data.workspaces || []);
    } catch (err) {
      console.error('Error loading workspaces:', err);
    }
  };

  return (
    <ProtectedRoute>
      <div className="p-8 space-y-6 bg-gray-50 dark:bg-dark-bg min-h-screen transition-colors">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Your Workspaces</h1>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
            + Create
          </button>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {workspaces.map((ws) => (
            <div
              key={ws.id}
              className="bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text p-4 rounded-xl shadow hover:shadow-lg transition cursor-pointer border border-transparent dark:border-dark-border"
            >
              <h2 className="text-lg dark:text-dark-text font-semibold">{ws.name}</h2>
              <p className="text-sm text-gray-600 dark:text-dark-muted">
                {ws.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </ProtectedRoute>
  );
}
