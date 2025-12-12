'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getProjects(workspaceId) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
  
  return data;
}

export async function createProject(formData) {
  const supabase = await createClient();
  const name = formData.get('name');
  const workspaceId = formData.get('workspaceId');
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('projects')
    .insert({
      name,
      workspace_id: workspaceId,
      created_by: user.id
    });

  if (error) throw error;

  revalidatePath(`/workspace/${workspaceId}`);
}