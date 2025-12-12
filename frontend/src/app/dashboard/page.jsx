'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';
import ProtectedRoute from '../../components/ProtectedRoute';
import { getWorkspaces, createWorkspace } from '../../actions/workspace'; // ✅ Import Server Actions

export default function DashboardPage() {
  const [workspaces, setWorkspaces] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newWorkspace, setNewWorkspace] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);

  // Load data when component mounts
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getWorkspaces();
        setWorkspaces(data || []);
      } catch (err) {
        console.error('Failed to load workspaces', err);
      }
    };
    loadData();
  }, []);

  const handleCreateWorkspace = async () => {
    if (!newWorkspace.name.trim()) return alert('Workspace name is required');
    setLoading(true);

    try {
      // 1. Prepare data for Server Action
      const formData = new FormData();
      formData.append('name', newWorkspace.name);
      formData.append('description', newWorkspace.description);

      // 2. Call Server Action instead of API
      await createWorkspace(formData);

      // 3. Refresh list and reset form
      const updatedList = await getWorkspaces();
      setWorkspaces(updatedList);
      
      setShowModal(false);
      setNewWorkspace({ name: '', description: '' });
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
        <Header title="Your Workspaces" />

        <div className="p-1 space-y-6">
          <header className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold dark:text-white">Your Workspaces</h1>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
            >
              + Create
            </button>
          </header>

          {/* Workspace Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {workspaces.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 col-span-full">
                No workspaces yet. Create one to get started!
              </p>
            ) : (
              workspaces.map((ws) => (
                <Link key={ws.id} href={`/workspace/${ws.id}`}>
                  <div
                    className="bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text p-4 rounded-xl shadow hover:shadow-lg transition cursor-pointer border border-transparent dark:border-dark-border h-32 flex flex-col justify-between"
                  >
                    <div>
                      <h2 className="text-lg dark:text-white font-semibold">{ws.name}</h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {ws.description}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Create Workspace Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
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
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#2E2F33] dark:bg-[#1E1F22] dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                  ></textarea>
                </div>

                <div className="flex justify-end mt-5 gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2C2D31] transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateWorkspace}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}