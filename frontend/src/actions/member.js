'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function inviteMember(formData) {
  const supabase = await createClient();
  const email = formData.get('email');
  const workspaceId = formData.get('workspaceId');
  const role = formData.get('role') || 'member';

  const { data: { user: currentUser } } = await supabase.auth.getUser();

 
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
  
  const { data: currentMember } = await supabase.from('workspace_members').select('role').eq('workspace_id', workspaceId).eq('user_id', user.id).single();
  if (!['admin', 'owner'].includes(currentMember?.role)) throw new Error('Unauthorized');

  await supabase.from('workspace_members').delete().eq('workspace_id', workspaceId).eq('user_id', userId);
  revalidatePath(`/workspace/${workspaceId}/members`);
}

export async function acceptWorkspaceInvite(inviteId) {
  const supabase = await createClient();
  

  const { error } = await supabase.rpc('accept_invitation', {
    invite_id: inviteId
  });

  if (error) {
    console.error("Accept Error:", error);
    throw new Error(error.message);
  }

  revalidatePath('/'); 
  return { success: true };
}

export async function rejectWorkspaceInvite(inviteId) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('workspace_invitations')
    .delete()
    .eq('id', inviteId);

  if (error) throw new Error("Failed to reject invite");
  
  revalidatePath('/');
}

export async function kickMember(workspaceId, userId) {
  const supabase = await createClient();
  
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

  if (user.id === userId) {
    throw new Error('You cannot kick yourself. Leave the workspace instead.');
  }

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

  const { error } = await supabase
    .from('workspace_invitations')
    .delete()
    .eq('id', inviteId);

  if (error) throw new Error(error.message);

  revalidatePath(`/workspace/${workspaceId}/members`);
}