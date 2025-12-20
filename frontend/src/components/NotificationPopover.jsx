'use client';
import { useState, useEffect } from 'react';
import { Bell, Check, X, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { acceptWorkspaceInvite, rejectWorkspaceInvite } from '@/actions/member'; // Import new actions
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const [invites, setInvites] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const supabase = createClient();

  // Fetch Invites directly
  const fetchInvites = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch invites where email == user.email
    const { data } = await supabase
      .from('workspace_invitations')
      .select(`
        id,
        role,
        created_at,
        workspace:workspaces ( id, name )
      `)
      .eq('email', user.email);
    
    setInvites(data || []);
    setUnreadCount(data?.length || 0);
  };

  useEffect(() => {
    fetchInvites();
    
    // Subscribe to changes in invitations table
    const channel = supabase
      .channel('invites_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workspace_invitations' }, 
        () => fetchInvites()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const handleAccept = async (id) => {
    // Optimistic UI
    setInvites(prev => prev.filter(i => i.id !== id));
    setUnreadCount(prev => Math.max(0, prev - 1));
    await acceptWorkspaceInvite(id);
  };

  const handleReject = async (id) => {
    setInvites(prev => prev.filter(i => i.id !== id));
    setUnreadCount(prev => Math.max(0, prev - 1));
    await rejectWorkspaceInvite(id);
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-[#1E1F22]" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#2B2D33] rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50"
            >
              <div className="p-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-white/5">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Pending Invitations
                </h3>
              </div>

              <div className="max-h-[300px] overflow-y-auto">
                {invites.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-sm">No new invitations</div>
                ) : (
                  invites.map(invite => (
                    <div key={invite.id} className="p-4 border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                      <div className="flex items-start gap-3 mb-3">
                         <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600">
                           <Mail size={16} />
                         </div>
                         <div>
                           <p className="text-sm font-semibold text-gray-900 dark:text-white">
                             {invite.workspace?.name || 'Unknown Workspace'}
                           </p>
                           <p className="text-xs text-gray-500">
                             Invited you to join as <span className="font-medium capitalize">{invite.role}</span>
                           </p>
                         </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleAccept(invite.id)}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition"
                        >
                          <Check size={12} /> Accept
                        </button>
                        <button 
                          onClick={() => handleReject(invite.id)}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-lg transition"
                        >
                          <X size={12} /> Reject
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}