'use client';

import { inviteMember } from '@/actions/member';
import { useState, useRef } from 'react';
import { UserPlus, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import Loader from './Loader'; 

export default function InviteMemberForm({ workspaceId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const formRef = useRef(null);

  async function handleSubmit(formData) {
    setLoading(true);
    setError('');
    setSuccess(false);
    
    try {
      await inviteMember(formData);
      setSuccess(true);
      formRef.current?.reset();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white dark:bg-[#2B2D33] p-6 rounded-2xl border border-gray-200 dark:border-gray-700/50 shadow-sm">
      <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide mb-4">
        <Mail size={16} className="text-blue-500" /> Invite New Member
      </h3>
      
      <form ref={formRef} action={handleSubmit} className="flex flex-col sm:flex-row gap-4">
        <input type="hidden" name="workspaceId" value={workspaceId} />
        
        <div className="flex-1">
          <input 
            name="email" 
            type="email" 
            placeholder="colleague@example.com" 
            className="w-full bg-gray-50 dark:bg-[#1E1F22] border border-transparent focus:border-blue-500 rounded-xl px-4 py-3 outline-none transition-all text-gray-900 dark:text-white"
            required
          />
        </div>
        
        <select name="role" className="bg-gray-50 dark:bg-[#1E1F22] border border-transparent focus:border-blue-500 rounded-xl px-4 py-3 outline-none cursor-pointer dark:text-white min-w-[140px]">
          <option value="member">Member</option>
          <option value="admin">Admin</option>
        </select>
        
        <button 
          type="submit" 
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]"
        >
          {loading ? <Loader size="sm" className="border-t-white" /> : <UserPlus size={18} />}
          {loading ? 'Sending...' : 'Send Invite'}
        </button>
      </form>

      {/* Feedback Messages */}
      {error && (
        <div className="mt-3 flex items-center gap-2 text-sm text-red-500 animate-in slide-in-from-top-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}
      {success && (
        <div className="mt-3 flex items-center gap-2 text-sm text-green-500 animate-in slide-in-from-top-2">
          <CheckCircle2 size={16} /> Invitation sent successfully!
        </div>
      )}
    </div>
  );
}