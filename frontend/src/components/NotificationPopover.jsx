'use client';
import { useState, useEffect } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { respondToInvitation } from '@/actions/member';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const supabase = createClient();

  // Fetch notifications
  useEffect(() => {
    const fetchNotifs = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      setNotifications(data || []);
      setUnreadCount(data?.length || 0);
    };

    fetchNotifs();
    
    // Optional: Realtime subscription here
    const channel = supabase
      .channel('notifs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, 
        () => fetchNotifs()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const handleResponse = async (id, accept) => {
    // Optimistic UI update
    setNotifications(prev => prev.filter(n => n.id !== id));
    setUnreadCount(prev => Math.max(0, prev - 1));
    
    await respondToInvitation(id, accept);
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
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Notifications</h3>
              </div>

              <div className="max-h-[300px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-sm">No new notifications</div>
                ) : (
                  notifications.map(notif => (
                    <div key={notif.id} className="p-4 border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{notif.title}</p>
                      <p className="text-xs text-gray-500 mt-1 mb-3 leading-relaxed">{notif.message}</p>
                      
                      {notif.type === 'invite' && (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleResponse(notif.id, true)}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition"
                          >
                            <Check size={12} /> Accept
                          </button>
                          <button 
                            onClick={() => handleResponse(notif.id, false)}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-lg transition"
                          >
                            <X size={12} /> Reject
                          </button>
                        </div>
                      )}
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