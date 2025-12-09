export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getUserDriveTokens,
  createDriveClient,
  deleteDocumentMetadata,
  deleteFileFromDrive,
} from '@/lib/google-drive';


export async function GET(
  request: Request,
  { params }: { params: { id: string; documentId: string } }
) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', params.documentId)
      .eq('committee_id', params.id)
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching document:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  try {
    const { documentId, id: _committeeId } = await params;
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

    // Delete document metadata and get drive file ID
    const driveFileId = await deleteDocumentMetadata(user.id, documentId);

    // Delete file from Drive
    try {
      await deleteFileFromDrive(drive, driveFileId);
    } catch (error) {
      console.error('Error deleting file from Drive:', error);
      // Continue even if Drive deletion fails (file might already be deleted)
    }

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}
