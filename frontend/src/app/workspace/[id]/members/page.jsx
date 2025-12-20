import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin'; 
import { inviteMember, removeMember, revokeInvitation } from '@/actions/member';
import InviteMemberForm from '@/components/InviteMemberForm';
import { Trash2, Shield, User, Clock, Ban } from 'lucide-react';
import Image from 'next/image'; // Import Next Image

export default async function MembersPage({ params }) {
  const { id } = await params;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const supabaseAdmin = createAdminClient();

  // Fetch Current User's Role
  const { data: currentMember } = await supabaseAdmin
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', id)
    .eq('user_id', user.id)
    .single();

  const isAdmin = ['admin', 'owner'].includes(currentMember?.role);

  // 1. FETCH MEMBERS (Fixed: Added avatar_url to selection)
  const { data: members, error: memberError } = await supabaseAdmin
    .from('workspace_members')
    .select(`
      id, 
      role, 
      user_id,
      user:users!workspace_members_user_id_fkey (
        id, 
        email, 
        full_name, 
        avatar_url  
      )
    `)
    .eq('workspace_id', id)
    .order('role', { ascending: true });

  if (memberError) console.error("Member Fetch Error:", memberError);

  // Fetch Pending Invites
  let pendingInvites = [];
  if (isAdmin) {
    const { data: invites } = await supabaseAdmin
      .from('workspace_invitations')
      .select('*')
      .eq('workspace_id', id)
      .order('created_at', { ascending: false });
    pendingInvites = invites || [];
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-10">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Team Members</h1>
        <p className="text-gray-500 mt-2">
          {isAdmin ? "Manage who has access to this workspace." : "View your teammates in this workspace."}
        </p>
      </div>

      {isAdmin && <InviteMemberForm workspaceId={id} />}

      {/* Pending Invites Section... (Keep as is) */}
      {isAdmin && pendingInvites.length > 0 && (
         <div className="space-y-3">
           <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Pending Invitations</h3>
           <div className="grid gap-3 sm:grid-cols-2">
             {pendingInvites.map(invite => (
               <div key={invite.id} className="flex items-center justify-between p-4 bg-white/50 dark:bg-[#2B2D33]/50 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500">
                     <Clock size={14} />
                   </div>
                   <div>
                     <p className="text-sm font-medium text-gray-900 dark:text-white">{invite.email}</p>
                     <p className="text-xs text-gray-500 capitalize">{invite.role}</p>
                   </div>
                 </div>
                 <form action={async () => { 'use server'; await revokeInvitation(invite.id, id); }}>
                    <button className="text-xs font-medium text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded transition-colors flex items-center gap-1">
                      <Ban size={12} /> Revoke
                    </button>
                 </form>
               </div>
             ))}
           </div>
        </div>
      )}

      {/* Active Members List */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Active Members ({members?.length || 0})</h3>
        
        {(!members || members.length === 0) ? (
          <div className="p-8 text-center bg-gray-50 dark:bg-[#2B2D33] rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
             <p className="text-gray-500">No members found.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {members.map((m) => {
              // Logic: Use database avatar OR generate DiceBear fallback
              const displayName = m.user?.full_name || m.user?.email || 'User';
              const avatarSrc = m.user?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${displayName}`;

              return (
                <div key={m.id} className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white dark:bg-[#2B2D33] border border-gray-100 dark:border-gray-700/50 rounded-xl hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full overflow-hidden relative border border-gray-100 dark:border-gray-700 flex-shrink-0">
                      <Image 
                        src={avatarSrc} 
                        alt={displayName}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {m.user?.full_name || 'User'}
                        </p>
                        {m.user_id === user.id && (
                          <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">YOU</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{m.user?.email || 'No email'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-4 sm:mt-0 pl-14 sm:pl-0">
                    <span className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
                      m.role === 'owner' ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/10 dark:text-amber-400 dark:border-amber-900/30' :
                      m.role === 'admin' ? 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/10 dark:text-purple-400 dark:border-purple-900/30' :
                      'bg-gray-50 text-gray-600 border-gray-100 dark:bg-white/5 dark:text-gray-400 dark:border-white/5'
                    }`}>
                      <Shield size={12} /> {m.role}
                    </span>

                    {isAdmin && m.user_id !== user.id && m.role !== 'owner' && (
                      <form action={async () => { 'use server'; await removeMember(id, m.user_id); }}>
                        <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all">
                          <Trash2 size={18} />
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}