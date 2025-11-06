'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import ProtectedRoute from '../../components/ProtectedRoute';

export default function DashboardPage() {
  const [workspaces, setWorkspaces] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      loadWorkspaces();
    }
  }, []);

  const loadWorkspaces = async () => {
    try {
      const res = await api.get('/workspaces');
      setWorkspaces(res.data.workspaces);
    } catch (err) {
      console.error('Error loading workspaces:', err);
    }
  };

  return (
    <ProtectedRoute>
      <div className="p-8 min-h-screen bg-gray-50">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">
            Welcome, {user?.full_name || 'User'}
          </h1>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.location.href = '/login';
            }}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm"
          >
            Logout
          </button>
        </header>

        <h2 className="text-lg font-medium mb-4">Your Workspaces</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {workspaces.length > 0 ? (
            workspaces.map((ws) => (
              <div
                key={ws.id}
                className="bg-white p-4 rounded-xl shadow hover:shadow-md transition"
              >
                <h3 className="font-medium text-lg">{ws.name}</h3>
                <p className="text-sm text-gray-600">{ws.description}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No workspaces yet.</p>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
