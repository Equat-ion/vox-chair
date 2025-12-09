import { google } from 'googleapis';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Don't create client at module level - create it in each function
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing Supabase environment variables. ' +
      'Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
    );
  }
  
  return createSupabaseClient(supabaseUrl, supabaseServiceKey);
}

export interface DriveTokens {
  access_token: string;
  refresh_token: string;
  token_expiry: string;
  scope: string;
}

export interface DriveFolderInfo {
  rootFolderId: string;
  committeeFolderId: string;
  documentsFolderId: string;
}

/**
 * Create OAuth2 client with tokens
 */
export function createDriveClient(tokens: DriveTokens) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/google-drive/callback`
  );

  oauth2Client.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: new Date(tokens.token_expiry).getTime(),
  });

  // Handle token refresh
  oauth2Client.on('tokens', async (newTokens) => {
    if (newTokens.refresh_token) {
      const supabase = getSupabaseClient();
      // Update tokens in database
      await supabase
        .from('user_google_drive')
        .update({
          access_token: newTokens.access_token,
          refresh_token: newTokens.refresh_token,
          token_expiry: new Date(newTokens.expiry_date!).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('access_token', tokens.access_token);
    }
  });

  return google.drive({ version: 'v3', auth: oauth2Client });
}

/**
 * Get user's Drive tokens from database
 */
export async function getUserDriveTokens(userId: string): Promise<DriveTokens | null> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('user_google_drive')
    .select('access_token, refresh_token, token_expiry, scope')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as DriveTokens;
}

/**
 * Store user's Drive tokens in database
 */
export async function storeDriveTokens(
  userId: string,
  tokens: {
    access_token: string;
    refresh_token: string;
    expiry_date: number;
    scope: string;
  }
) {
  const supabase = getSupabaseClient();
  
  const { error } = await supabase
    .from('user_google_drive')
    .upsert({
      user_id: userId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expiry: new Date(tokens.expiry_date).toISOString(),
      scope: tokens.scope,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    throw new Error(`Failed to store Drive tokens: ${error.message}`);
  }
}

/**
 * Create root .vox-chair-assist folder in user's Drive
 * The folder is marked as hidden by setting properties
 */
export async function createRootFolder(drive: ReturnType<typeof createDriveClient>): Promise<string> {
  const response = await drive.files.create({
    requestBody: {
      name: '.vox-chair-assist',
      mimeType: 'application/vnd.google-apps.folder',
      description: 'Vox Chair Assist data folder - Do not delete',
      properties: {
        hidden: 'true',
      },
    },
    fields: 'id',
  });

  if (!response.data.id) {
    throw new Error('Failed to create root folder: No ID returned');
  }

  return response.data.id;
}

/**
 * Create committee folder structure
 */
export async function createCommitteeFolders(
  drive: ReturnType<typeof createDriveClient>,
  rootFolderId: string,
  committeeUuid: string
): Promise<DriveFolderInfo> {
  // Create committee folder
  const committeeFolder = await drive.files.create({
    requestBody: {
      name: committeeUuid,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [rootFolderId],
    },
    fields: 'id',
  });

  if (!committeeFolder.data.id) {
    throw new Error('Failed to create committee folder: No ID returned');
  }

  const committeeFolderId = committeeFolder.data.id;

  // Create documents subfolder
  const documentsFolder = await drive.files.create({
    requestBody: {
      name: 'documents',
      mimeType: 'application/vnd.google-apps.folder',
      parents: [committeeFolderId],
    },
    fields: 'id',
  });

  if (!documentsFolder.data.id) {
    throw new Error('Failed to create documents folder: No ID returned');
  }

  return {
    rootFolderId,
    committeeFolderId,
    documentsFolderId: documentsFolder.data.id,
  };
}

/**
 * Store committee folder info in database
 */
export async function storeCommitteeFolders(
  userId: string,
  committeeId: string,
  folderInfo: DriveFolderInfo
) {
  const supabase = getSupabaseClient();
  
  const { error } = await supabase
    .from('committee_drive_folders')
    .upsert({
      committee_id: committeeId,
      user_id: userId,
      folder_id: folderInfo.committeeFolderId,
      documents_folder_id: folderInfo.documentsFolderId,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    throw new Error(`Failed to store committee folders: ${error.message}`);
  }
}

/**
 * Get committee folder info from database
 */
export async function getCommitteeFolders(userId: string, committeeId: string) {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('committee_drive_folders')
    .select('folder_id, documents_folder_id')
    .eq('user_id', userId)
    .eq('committee_id', committeeId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

/**
 * Upload file to Google Drive
 */
export async function uploadFileToDrive(
  drive: ReturnType<typeof createDriveClient>,
  folderId: string,
  fileName: string,
  fileContent: Buffer | string,
  mimeType: string
) {
  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
      mimeType,
    },
    media: {
      mimeType,
      body: fileContent,
    },
    fields: 'id, name, webViewLink',
  });

  return response.data;
}

/**
 * List files in a folder
 */
export async function listDriveFiles(drive: ReturnType<typeof createDriveClient>, folderId: string) {
  const response = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: 'files(id, name, mimeType, createdTime, modifiedTime, size, webViewLink)',
    orderBy: 'modifiedTime desc',
  });

  return response.data.files || [];
}

/**
 * Delete file from Drive
 */
export async function deleteFileFromDrive(drive: ReturnType<typeof createDriveClient>, fileId: string) {
  await drive.files.delete({
    fileId,
  });
}

/**
 * Get root folder ID for user
 */
export async function getRootFolderId(userId: string): Promise<string | null> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('user_google_drive')
    .select('root_folder_id')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data.root_folder_id;
}

/**
 * Store document metadata in database
 */
export async function storeDocumentMetadata(
  userId: string,
  committeeId: string,
  fileData: {
    driveFileId: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    webViewLink?: string;
  }
) {
  const supabase = getSupabaseClient();
  
  const { error } = await supabase
    .from('committee_documents')
    .insert({
      committee_id: committeeId,
      user_id: userId,
      drive_file_id: fileData.driveFileId,
      file_name: fileData.fileName,
      file_size: fileData.fileSize,
      mime_type: fileData.mimeType,
      drive_web_view_link: fileData.webViewLink,
    });

  if (error) {
    throw new Error(`Failed to store document metadata: ${error.message}`);
  }
}

/**
 * Get documents for a committee
 */
export async function getCommitteeDocuments(userId: string, committeeId: string) {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('committee_documents')
    .select('*')
    .eq('user_id', userId)
    .eq('committee_id', committeeId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get committee documents: ${error.message}`);
  }

  return data || [];
}

/**
 * Delete document metadata from database
 */
export async function deleteDocumentMetadata(userId: string, documentId: string) {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('committee_documents')
    .delete()
    .eq('user_id', userId)
    .eq('id', documentId)
    .select('drive_file_id')
    .single();

  if (error || !data) {
    throw new Error(`Failed to delete document metadata: ${error?.message || 'Document not found'}`);
  }

  return data.drive_file_id;
}