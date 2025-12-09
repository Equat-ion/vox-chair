export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getUserDriveTokens,
  createDriveClient,
  getCommitteeFolders,
  getRootFolderId,
  createCommitteeFolders,
  storeCommitteeFolders,
  uploadFileToDrive,
  storeDocumentMetadata,
} from '@/lib/google-drive';

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

    // Create Drive client
    const drive = createDriveClient(tokens);

    // Get or create committee folders
    let committeeFolders = await getCommitteeFolders(user.id, committeeId);
    
    if (!committeeFolders) {
      // Need to create committee folder structure
      const rootFolderId = await getRootFolderId(user.id);
      
      if (!rootFolderId) {
        return NextResponse.json(
          { error: 'Root folder not found. Please reconnect Google Drive.' },
          { status: 400 }
        );
      }

      // Use committee ID as UUID for folder name
      const committeeUuid = committeeId;
      const folderInfo = await createCommitteeFolders(drive, rootFolderId, committeeUuid);
      await storeCommitteeFolders(user.id, committeeId, folderInfo);
      
      committeeFolders = {
        folder_id: folderInfo.committeeFolderId,
        documents_folder_id: folderInfo.documentsFolderId,
      };
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 100MB limit' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Drive
    const uploadedFile = await uploadFileToDrive(
      drive,
      committeeFolders.documents_folder_id,
      file.name,
      buffer,
      file.type
    );

    if (!uploadedFile.id) {
      throw new Error('Failed to upload file to Google Drive');
    }

    // Store metadata in database
    await storeDocumentMetadata(user.id, committeeId, {
      driveFileId: uploadedFile.id,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      webViewLink: uploadedFile.webViewLink || undefined,
    });

    return NextResponse.json({
      success: true,
      file: {
        id: uploadedFile.id,
        name: uploadedFile.name,
        webViewLink: uploadedFile.webViewLink,
      },
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    
    // Return more specific error message
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
