'use server';
import { createClient } from '@/lib/supabase/server'; // We will create this next

export async function getWorkspaces() {
  const supabase = await createClient();
  
  // 1. Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // 2. Fetch workspaces directly from DB
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

  // 3. Format the data to match what your UI expects
  return data.map(row => row.workspaces);
}

export async function createWorkspace(formData) {
  const supabase = await createClient();
  const name = formData.get('name');
  const description = formData.get('description');
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Not authenticated');

  // 1. Create Workspace
  const { data: workspace, error } = await supabase
    .from('workspaces')
    .insert({ name, description, created_by: user.id })
    .select()
    .single();

  if (error) throw error;

  // 2. Add creator as a member
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