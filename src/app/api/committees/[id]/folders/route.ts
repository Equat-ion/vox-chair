export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getUserDriveTokens,
  createDriveClient,
  getRootFolderId,
  createCommitteeFolders,
  storeCommitteeFolders,
} from '@/lib/google-drive';

/**
 * Initialize Google Drive folders for a committee
 * This should be called after a committee is created
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: committeeId } = await params;
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's Drive tokens
    const tokens = await getUserDriveTokens(user.id);
    if (!tokens) {
      return NextResponse.json(
        { error: 'Google Drive not connected' },
        { status: 400 }
      );
    }

    // Get root folder ID
    const rootFolderId = await getRootFolderId(user.id);
    if (!rootFolderId) {
      return NextResponse.json(
        { error: 'Root folder not found. Please reconnect Google Drive.' },
        { status: 400 }
      );
    }

    // Create Drive client
    const drive = createDriveClient(tokens);

    // Create committee folder structure using committee ID as UUID
    const folderInfo = await createCommitteeFolders(drive, rootFolderId, committeeId);

    // Store folder info in database
    await storeCommitteeFolders(user.id, committeeId, folderInfo);

    return NextResponse.json({
      success: true,
      folders: {
        committeeFolderId: folderInfo.committeeFolderId,
        documentsFolderId: folderInfo.documentsFolderId,
      },
    });
  } catch (error) {
    console.error('Error initializing committee folders:', error);
    return NextResponse.json(
      { error: 'Failed to initialize committee folders' },
      { status: 500 }
    );
  }
}

/**
 * Get committee folder information
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: committeeId } = await params;
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get committee folders from database
    const { data, error } = await supabase
      .from('committee_drive_folders')
      .select('folder_id, documents_folder_id, created_at')
      .eq('user_id', user.id)
      .eq('committee_id', committeeId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { initialized: false },
        { status: 200 }
      );
    }

    return NextResponse.json({
      initialized: true,
      folders: {
        committeeFolderId: data.folder_id,
        documentsFolderId: data.documents_folder_id,
        createdAt: data.created_at,
      },
    });
  } catch (error) {
    console.error('Error getting committee folders:', error);
    return NextResponse.json(
      { error: 'Failed to get committee folders' },
      { status: 500 }
    );
  }
}
