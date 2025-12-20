import { createClient } from '@/lib/supabase/server';
import { inviteMember, removeMember } from '@/actions/member';
import { UserPlus, Trash2, Shield, User, Mail, Clock } from 'lucide-react';

export default async function MembersPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();
  
  // 1. Get Current User Info & Role
  const { data: { user } } = await supabase.auth.getUser();
  const { data: currentMember } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', id)
    .eq('user_id', user.id)
    .single();

  const isAdmin = currentMember?.role === 'admin' || currentMember?.role === 'owner';

  // 2. Fetch Active Members
  const { data: members } = await supabase
    .from('workspace_members')
    .select(`id, role, user:users(id, email, full_name)`)
    .eq('workspace_id', id);

  // 3. Fetch Pending Invitations (Only if Admin)
  let pendingInvites = [];
  if (isAdmin) {
    const { data: invites } = await supabase
      .from('workspace_invitations')
      .select('*')
      .eq('workspace_id', id);
    pendingInvites = invites || [];
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Team Members</h1>
        <p className="text-gray-500">
          {isAdmin 
            ? "Manage access and roles for your workspace." 
            : "View the team members in this workspace."}
        </p>
      </div>

      {/* --- INVITE SECTION (ADMIN ONLY) --- */}
      {isAdmin && (
        <div className="bg-white dark:bg-[#2B2D33] p-6 rounded-2xl border border-gray-200 dark:border-gray-700/50 shadow-sm">
          <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide mb-4">
            <Mail size={16} className="text-blue-500" /> Invite New Member
          </h3>
          <form action={inviteMember} className="flex flex-col sm:flex-row gap-4">
            <input type="hidden" name="workspaceId" value={id} />
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
            <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20">
              <UserPlus size={18} /> Send Invite
            </button>
          </form>
        </div>
      )}

      {/* --- PENDING INVITES (ADMIN ONLY) --- */}
      {isAdmin && pendingInvites.length > 0 && (
        <div>
           <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 pl-1">Pending Invitations</h3>
           <div className="space-y-3">
             {pendingInvites.map(invite => (
               <div key={invite.id} className="flex items-center justify-between p-4 bg-white/50 dark:bg-[#2B2D33]/50 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
                 <div className="flex items-center gap-3 opacity-70">
                   <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500">
                     <Clock size={14} />
                   </div>
                   <div>
                     <p className="text-sm font-medium text-gray-900 dark:text-white">{invite.email}</p>
                     <p className="text-xs text-gray-500 capitalize">{invite.role} • Invited just now</p>
                   </div>
                 </div>
                 <button className="text-xs text-red-500 hover:underline">Revoke</button>
               </div>
             ))}
           </div>
        </div>
      )}

      {/* --- ACTIVE MEMBERS LIST --- */}
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 pl-1">Active Members</h3>
        <div className="grid gap-3">
          {members?.map((m) => (
            <div key={m.id} className="group flex items-center justify-between p-4 bg-white dark:bg-[#2B2D33] border border-gray-100 dark:border-gray-700/50 rounded-xl hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-sm">
                  {m.user?.full_name?.charAt(0).toUpperCase() || <User size={18} />}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    {m.user?.full_name || 'Unknown User'}
                    {m.user?.id === user.id && <span className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">You</span>}
                  </p>
                  <p className="text-sm text-gray-500">{m.user?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${m.role === 'admin' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                  <Shield size={12} /> {m.role}
                </span>
                
                {/* Only Admin can kick, but cannot kick themselves */}
                {isAdmin && m.user.id !== user.id && (
                  <form action={async () => {
                    'use server';
                    await removeMember(id, m.user.id);
                  }}>
                    <button 
                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                      title="Remove Member"
                    >
                      <Trash2 size={18} />
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}