'use client';
import { useEffect, useState } from 'react';
import api from '../../lib/api';

export default function DashboardPage() {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const res = await api.get('/workspaces');
        setWorkspaces(res.data.workspaces || []);
      } catch (err) {
        console.error('Failed to load workspaces:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkspaces();
  }, []);

  if (loading) return <p className="text-center mt-10">Loading workspaces...</p>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6">My Workspaces</h1>
      <div className="grid grid-cols-3 gap-4">
        {workspaces.map(w => (
          <div key={w.id} className="p-4 bg-white shadow rounded-xl">
            <h2 className="font-medium text-lg">{w.name}</h2>
            <p className="text-sm text-gray-500">{w.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
