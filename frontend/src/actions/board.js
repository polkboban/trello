'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getBoard(boardId) {
  const supabase = await createClient();
  
  // 1. Get Project
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', boardId)
    .single();

  if (!project) return null;

  // 2. Get Tasks
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', boardId)
    .order('position', { ascending: true });

  return { project, tasks: tasks || [] };
}

export async function updateTaskPosition(taskId, newStatus, newPosition) {
  const supabase = await createClient();
  
  await supabase
    .from('tasks')
    .update({ status: newStatus, position: newPosition })
    .eq('id', taskId);
    
  revalidatePath(`/board/${taskId}`); // Refresh cache
}

export async function createTask(formData) {
  const supabase = await createClient();
  const title = formData.get('title');
  const projectId = formData.get('projectId');
  const status = formData.get('status') || 'todo';

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  await supabase.from('tasks').insert({
    title,
    project_id: projectId,
    status,
    created_by: user.id,
    position: new Date().getTime() // Simple default sort
  });

  revalidatePath(`/board/${projectId}`);
}