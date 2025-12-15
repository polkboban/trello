'use server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';

export async function deleteAccount() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return;
  
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const adminAuthClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );
    await adminAuthClient.auth.admin.deleteUser(user.id);
  } else {
    console.warn("Missing SUPABASE_SERVICE_ROLE_KEY, cannot fully delete auth user.");
  }
  
  await supabase.auth.signOut();
  redirect('/login');
}