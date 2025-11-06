'use client';
import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/login');
    else {
      setUser(JSON.parse(localStorage.getItem('user')));
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
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Welcome, {user?.full_name}</h1>
      <h2 className="text-xl mb-2">Your Workspaces</h2>
      <div className="grid grid-cols-2 gap-4">
        {workspaces.map((ws) => (
          <div key={ws.id} className="border rounded-lg p-4 shadow-sm bg-white">
            <h3 className="font-medium text-lg">{ws.name}</h3>
            <p className="text-sm text-gray-600">{ws.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
