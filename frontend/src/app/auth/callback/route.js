import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  console.log('\n--- 🔐 OAUTH CALLBACK TRIGGERED ---');
  console.log('Origin:', origin);
  console.log('Code exists:', !!code);

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch (error) {
              console.error('❌ Failed to set cookie:', error);
            }
          },
        },
      }
    );

    // Attempt to exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('❌ Supabase Exchange Error:', error.message);
      // Pass the error to the URL so you can see it on the screen
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
    }

    console.log('✅ Session generated for:', data?.session?.user?.email);
    return NextResponse.redirect(`${origin}${next}`);
  }

  console.error('❌ No OAuth code found in the URL');
  return NextResponse.redirect(`${origin}/login?error=no-code-found`);
}