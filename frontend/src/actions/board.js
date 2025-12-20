'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getBoard(boardId) {
  const supabase = await createClient();
  const { data: project } = await supabase.from('projects').select('*').eq('id', boardId).single();
  if (!project) return null;
  const { data: tasks } = await supabase.from('tasks').select('*').eq('project_id', boardId).order('position', { ascending: true });
  return { project, tasks: tasks || [] };
}

export async function updateTaskPosition(taskId, newStatus, newPosition) {
  const supabase = await createClient();
  await supabase.from('tasks').update({ status: newStatus, position: newPosition }).eq('id', taskId);
  revalidatePath(`/board/${taskId}`);
}

export async function createTask(formData) {
  const supabase = await createClient();
  const title = formData.get('title');
  const projectId = formData.get('projectId');
  const status = formData.get('status') || 'todo';
  const priority = formData.get('priority') || 'medium';

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase.from('tasks').insert({
    title,
    project_id: projectId,
    status,
    priority,
    created_by: user.id,
    position: new Date().getTime()
  }).select().single();

  if (error) throw new Error(error.message);

  revalidatePath(`/board/${projectId}`);
  return data; // Return the new task object
}

export async function updateTask(formData) {
  const supabase = await createClient();
  const taskId = formData.get('taskId');
  const projectId = formData.get('projectId');
  
  const updates = {
    title: formData.get('title'),
    description: formData.get('description'),
    priority: formData.get('priority'),
    due_date: formData.get('due_date') || null,
  };

  const { data, error } = await supabase.from('tasks')
    .update(updates)
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath(`/board/${projectId}`);
  return data; // Return the updated task object
}

export async function deleteTask(taskId, projectId) {
  const supabase = await createClient();
  await supabase.from('tasks').delete().eq('id', taskId);
  revalidatePath(`/board/${projectId}`);
  return taskId; // Return the ID so we know what to remove
}