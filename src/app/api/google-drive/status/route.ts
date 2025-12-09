export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { connected: false },
        { status: 200 }
      );
    }

    // Check if user has Drive connection
    const { data, error } = await supabase
      .from('user_google_drive')
      .select('id, root_folder_id')
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ connected: false });
    }

    return NextResponse.json({ 
      connected: true,
      rootFolderId: data.root_folder_id 
    });
  } catch (error) {
    console.error('Error checking Drive status:', error);
    return NextResponse.json({ connected: false });
  }
}
