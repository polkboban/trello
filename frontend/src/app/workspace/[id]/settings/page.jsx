'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getWorkspace, updateWorkspace, deleteWorkspace } from '@/actions/workspace';
import { deleteAccount } from '@/actions/user';
import { Save, Trash2, AlertTriangle, Loader2 } from 'lucide-react';

export default function SettingsPage({ params }) {
  const router = useRouter();
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [unwrappedParams, setUnwrappedParams] = useState(null);

  useEffect(() => {
    Promise.resolve(params).then(setUnwrappedParams);
  }, [params]);

  useEffect(() => {
    if (!unwrappedParams?.id) return;
    
    getWorkspace(unwrappedParams.id).then((data) => {
      if (data) setWorkspace(data);
      setLoading(false);
    });
  }, [unwrappedParams]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData(e.target);
      formData.append('workspaceId', workspace.id);
      await updateWorkspace(formData);
      alert('Workspace updated successfully!');
      router.refresh();
    } catch (err) {
      alert('Failed to update workspace.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!confirm('Are you sure? This will delete all boards and tasks permanently.')) return;
    
    try {
      await deleteWorkspace(workspace.id);
      router.push('/'); 
      router.refresh();
    } catch (err) {
      console.error(err);
      alert('Failed to delete workspace.');
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = prompt('Type "DELETE" to confirm account deletion. This cannot be undone.');
    if (confirmation === 'DELETE') {
      await deleteAccount();
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-blue-600"/></div>;
  if (!workspace) return <div className="p-8">Workspace not found</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 mt-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Workspace Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Manage your workspace preferences and danger zones.</p>
      </div>

      <div className="bg-white dark:bg-[#2B2D33] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
            <Save size={20} className="text-blue-500" /> General Information
          </h2>
        </div>
        
        <form onSubmit={handleUpdate} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Workspace Name</label>
            <input 
              name="name" 
              defaultValue={workspace.name}
              className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-[#1E1F22] dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
            <textarea 
              name="description" 
              defaultValue={workspace.description || ''}
              rows="3"
              className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-[#1E1F22] dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>

          <div className="flex justify-end">
            <button 
              type="submit" 
              disabled={saving}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-4">

        <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl overflow-hidden divide-y divide-red-100 dark:divide-red-900/30">
          
          <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-red-100">Delete this Workspace</h4>
              <p className="text-sm text-gray-500 dark:text-red-200/60 mt-1">
                Once deleted, all boards and tasks in <strong>{workspace.name}</strong> will be lost forever.
              </p>
            </div>
            <button 
              onClick={handleDeleteWorkspace}
              className="px-4 py-2 bg-white dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/40 rounded-lg transition font-medium text-sm flex-shrink-0"
            >
              Delete Workspace
            </button>
          </div>

          <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-red-100">Delete Your Account</h4>
              <p className="text-sm text-gray-500 dark:text-red-200/60 mt-1">
                Permanently remove your account and all associated data.
              </p>
            </div>
            <button 
              onClick={handleDeleteAccount}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium text-sm flex items-center gap-2 flex-shrink-0"
            >
              <Trash2 size={16} /> Delete Account
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}