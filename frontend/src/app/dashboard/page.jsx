'use client';
import { useEffect, useState } from 'react';
import api from '../../lib/api';
import ProtectedRoute from '../../components/ProtectedRoute';
import Link from 'next/link';

export default function DashboardPage() {
  const [workspaces, setWorkspaces] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newWorkspace, setNewWorkspace] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);

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

  const handleCreateWorkspace = async () => {
    if (!newWorkspace.name.trim()) return alert('Workspace name is required');
    setLoading(true);
    try {
      const res = await api.post('/workspaces', newWorkspace);
      console.log('Created workspace:', res.data);
      setShowModal(false);
      setNewWorkspace({ name: '', description: '' });
      await loadWorkspaces(); // refresh list
    } catch (err) {
      console.error('Error creating workspace:', err);
      alert('Failed to create workspace.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="p-8 space-y-6 bg-[#f2f2f2] dark:bg-dark-bg min-h-screen transition-colors">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Your Workspaces</h1>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
          >
            + Create
          </button>
        </header>

        {/* Workspace Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {workspaces.map((ws) => (
            <Link key={ws.id} href={`/board/${ws.id}`}>
              <div
                className="bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text p-4 rounded-xl shadow hover:shadow-lg transition cursor-pointer border border-transparent dark:border-dark-border"
                role="link"
                tabIndex={0}
              >
                <h2 className="text-lg dark:text-dark-text font-semibold">{ws.name}</h2>
                <p className="text-sm text-gray-600 dark:text-dark-muted">
                  {ws.description}
                </p>
              </div>
            </Link>
          ))}
        </div>


        {/* Create Workspace Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-[#232428] p-6 rounded-xl shadow-xl w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4 dark:text-gray-100">
                Create New Workspace
              </h2>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Workspace Name"
                  value={newWorkspace.name}
                  onChange={(e) =>
                    setNewWorkspace({ ...newWorkspace, name: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#2E2F33] dark:bg-[#1E1F22] dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <textarea
                  placeholder="Description (optional)"
                  value={newWorkspace.description}
                  onChange={(e) =>
                    setNewWorkspace({
                      ...newWorkspace,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#2E2F33] dark:bg-[#1E1F22] dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              <div className="flex justify-end mt-5 gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-[#2C2D31] transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateWorkspace}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
