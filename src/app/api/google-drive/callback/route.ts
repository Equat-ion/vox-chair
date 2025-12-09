export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { storeDriveTokens, createRootFolder, createDriveClient } from '@/lib/google-drive';
import { baseUrl } from '@/lib/environment';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
          <head><title>Connection Failed</title></head>
          <body>
            <script>
              window.opener.postMessage('drive-connection-failed', '*');
              window.close();
            </script>
            <p>❌ Connection failed: ${error}</p>
          </body>
        </html>
        `,
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    if (!code || !state) {
      return NextResponse.json(
        { error: 'Missing authorization code or user ID' },
        { status: 400 }
      );
    }

    const userId = state;
    // ✅ USE DYNAMIC BASE URL
    const callbackUrl = `${baseUrl}/api/google-drive/callback`;
    console.log(`📍 OAuth Callback URL: ${callbackUrl}`);

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      callbackUrl
    );

    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.access_token || !tokens.refresh_token || !tokens.expiry_date) {
      throw new Error('Invalid tokens received from Google');
    }

    await storeDriveTokens(userId, {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
      scope: tokens.scope || '',
    });

    const drive = createDriveClient({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expiry: new Date(tokens.expiry_date).toISOString(),
      scope: tokens.scope || '',
    });

    const rootFolderId = await createRootFolder(drive);

    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    await supabase
      .from('user_google_drive')
      .update({ root_folder_id: rootFolderId })
      .eq('user_id', userId);

    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head><title>Connected</title></head>
        <body>
          <script>
            window.opener.postMessage('drive-connected', '*');
            window.close();
          </script>
          <p>✅ Google Drive connected! You can close this window.</p>
        </body>
      </html>
      `,
      { headers: { 'Content-Type': 'text/html' } }
    );
  } catch (error) {
    console.error('Google OAuth Error:', error);
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head><title>Connection Failed</title></head>
        <body>
          <script>
            window.opener.postMessage('drive-connection-failed', '*');
            window.close();
          </script>
          <p>❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}</p>
        </body>
      </html>
      `,
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
}