'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function inviteMember(formData) {
  const supabase = await createClient();
  const email = formData.get('email');
  const workspaceId = formData.get('workspaceId');
  const role = formData.get('role') || 'member';

  const { data: { user: currentUser } } = await supabase.auth.getUser();

  // 1. Check if this email is already a member
  // We need to look up the user ID first IF they exist, to check membership
  const { data: targetUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (targetUser) {
    const { data: existingMember } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', targetUser.id)
      .single();

    if (existingMember) {
      throw new Error('User is already a member of this workspace.');
    }
  }

  // 2. Create the Invitation (Store email, even if user doesn't exist yet)
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
    if (inviteError.code === '23505') throw new Error('Invite already sent to this email.');
    throw new Error(inviteError.message);
  }

  // 3. Send Notification (ONLY if user exists)
  if (targetUser) {
    await supabase.from('notifications').insert({
      user_id: targetUser.id,
      type: 'invite',
      title: 'New Workspace Invitation',
      message: `You have been invited to join a workspace as a ${role}.`,
      resource_id: workspaceId,
      metadata: { invitation_id: invite.id, role: role }
    });
  }

  revalidatePath(`/workspace/${workspaceId}/members`);
  return { success: true };
}

export async function removeMember(workspaceId, userId) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Verify Admin
  const { data: currentMember } = await supabase.from('workspace_members').select('role').eq('workspace_id', workspaceId).eq('user_id', user.id).single();
  if (!['admin', 'owner'].includes(currentMember?.role)) throw new Error('Unauthorized');

  await supabase.from('workspace_members').delete().eq('workspace_id', workspaceId).eq('user_id', userId);
  revalidatePath(`/workspace/${workspaceId}/members`);
}

export async function acceptWorkspaceInvite(inviteId) {
  const supabase = await createClient();
  
  // 1. Call the secure database function we created earlier
  // (Ensure you ran the 'accept_invitation' function SQL from the previous step)
  const { error } = await supabase.rpc('accept_invitation', {
    invite_id: inviteId
  });

  if (error) {
    console.error("Accept Error:", error);
    throw new Error(error.message);
  }

  revalidatePath('/'); // Refresh sidebar to show the new workspace
  return { success: true };
}

// --- NEW FUNCTION: Reject by ID ---
export async function rejectWorkspaceInvite(inviteId) {
  const supabase = await createClient();
  
  // Users can delete their own invites via the RLS policy if we add one, 
  // or we can use a secure function. For simplicity, let's use a secure function.
  
  // Quick SQL for this: 
  // CREATE OR REPLACE FUNCTION reject_invitation(invite_id UUID) RETURNS VOID LANGUAGE sql SECURITY DEFINER AS $$ DELETE FROM workspace_invitations WHERE id = invite_id; $$;
  
  // For now, let's just try direct delete (works if you add the DELETE policy below)
  const { error } = await supabase
    .from('workspace_invitations')
    .delete()
    .eq('id', inviteId);

  if (error) throw new Error("Failed to reject invite");
  
  revalidatePath('/');
}

export async function kickMember(workspaceId, userId) {
  const supabase = await createClient();
  
  // 1. Verify Admin Status
  const { data: { user } } = await supabase.auth.getUser();
  const { data: currentMember } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single();

  if (!['admin', 'owner'].includes(currentMember?.role)) {
    throw new Error('Unauthorized: Only admins can remove members.');
  }

  // 2. Prevent kicking yourself (optional safety)
  if (user.id === userId) {
    throw new Error('You cannot kick yourself. Leave the workspace instead.');
  }

  // 3. Delete the member
  const { error } = await supabase
    .from('workspace_members')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);

  revalidatePath(`/workspace/${workspaceId}/members`);
}

export async function revokeInvitation(inviteId, workspaceId) {
  const supabase = await createClient();

  // 1. Verify Admin Status (Re-using check logic for safety)
  const { data: { user } } = await supabase.auth.getUser();
  const { data: currentMember } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single();

  if (!['admin', 'owner'].includes(currentMember?.role)) {
    throw new Error('Unauthorized');
  }

  // 2. Delete the invitation
  const { error } = await supabase
    .from('workspace_invitations')
    .delete()
    .eq('id', inviteId);

  if (error) throw new Error(error.message);

  revalidatePath(`/workspace/${workspaceId}/members`);
}