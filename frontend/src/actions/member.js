'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function inviteMember(formData) {
  const supabase = await createClient();
  const email = formData.get('email');
  const workspaceId = formData.get('workspaceId');
  const role = formData.get('role') || 'member';

  const { data: { user: currentUser } } = await supabase.auth.getUser();

  // 1. Check if user exists in the system
  const { data: targetUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (!targetUser) {
    throw new Error('User not found. They must register first.');
  }

  // 2. Check if already a member
  const { data: existingMember } = await supabase
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', targetUser.id)
    .single();

  if (existingMember) throw new Error('User is already a member.');

  // 3. Create Invitation Record
  const { data: invite, error: inviteError } = await supabase
    .from('workspace_invitations')
    .insert({
      workspace_id: workspaceId,
      email: email,
      role: role,
      invited_by: currentUser.id
    })
    .select()
    .single();

  if (inviteError) {
    if (inviteError.code === '23505') throw new Error('Invite already sent.');
    throw new Error(inviteError.message);
  }

  // 4. Create Notification for the user
  await supabase.from('notifications').insert({
    user_id: targetUser.id,
    type: 'invite',
    title: 'New Workspace Invitation',
    message: `You have been invited to join a workspace as a ${role}.`,
    resource_id: workspaceId,
    metadata: { invitation_id: invite.id, role: role }
  });

  revalidatePath(`/workspace/${workspaceId}/members`);
  return { success: true };
}

export async function respondToInvitation(notificationId, accept) {
  const supabase = await createClient();
  
  // 1. Fetch notification details
  const { data: notif } = await supabase
    .from('notifications')
    .select('*')
    .eq('id', notificationId)
    .single();

  if (!notif) throw new Error('Notification not found');

  if (accept) {
    // 2. Verify Invitation still exists
    const { data: invite } = await supabase
      .from('workspace_invitations')
      .select('*')
      .eq('id', notif.metadata.invitation_id)
      .single();

    if (!invite) throw new Error('Invitation is no longer valid.');

    // 3. Add to Workspace Members
    await supabase.from('workspace_members').insert({
      workspace_id: invite.workspace_id,
      user_id: notif.user_id,
      role: invite.role
    });

    // 4. Delete Invitation record
    await supabase.from('workspace_invitations').delete().eq('id', invite.id);
  }

  // 5. Delete the notification (or mark read)
  await supabase.from('notifications').delete().eq('id', notificationId);

  revalidatePath('/'); // Refresh to show new workspace in sidebar
}

export async function removeMember(workspaceId, userId) {
  const supabase = await createClient();
  
  // Security Check: Only admins can remove
  const { data: { user } } = await supabase.auth.getUser();
  const { data: currentUserRole } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single();

  if (currentUserRole?.role !== 'admin' && currentUserRole?.role !== 'owner') {
    throw new Error('Unauthorized');
  }

  await supabase
    .from('workspace_members')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId);
    
  revalidatePath(`/workspace/${workspaceId}/members`);
}