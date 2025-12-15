'use server';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache'; 

export async function getWorkspaces() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('workspace_members')
    .select(`
      workspaces (
        id,
        name,
        description
      )
    `)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error fetching workspaces:', error);
    return [];
  }

  return data.map(row => row.workspaces);
}

export async function createWorkspace(formData) {
  const supabase = await createClient();
  const name = formData.get('name');
  const description = formData.get('description');
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Not authenticated');

  const { data: workspace, error } = await supabase
    .from('workspaces')
    .insert({ name, description, created_by: user.id })
    .select()
    .single();

  if (error) throw error;

  await supabase
    .from('workspace_members')
    .insert({ workspace_id: workspace.id, user_id: user.id, role: 'owner' });

  return workspace;
}

export async function getWorkspace(id) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

export async function updateWorkspace(formData) {
  const supabase = await createClient();
  const name = formData.get('name');
  const description = formData.get('description');
  const workspaceId = formData.get('workspaceId');

  const { error } = await supabase
    .from('workspaces')
    .update({ name, description })
    .eq('id', workspaceId);

  if (error) throw new Error('Failed to update workspace');

  revalidatePath(`/workspace/${workspaceId}`);
  revalidatePath(`/workspace/${workspaceId}/settings`);
  return { success: true };
}

export async function deleteWorkspace(workspaceId) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('workspaces')
    .delete()
    .eq('id', workspaceId);

  if (error) throw new Error('Failed to delete workspace');

  return { success: true };
}