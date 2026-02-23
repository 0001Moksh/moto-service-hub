import axios from 'axios';

interface GraphTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface DriveItemMetadata {
  id: string;
  name: string;
  webUrl: string;
  size: number;
  createdDateTime: string;
}

/**
 * OneDrive Integration Service
 * Handles authentication, file uploads, and document management
 */
class OneDriveService {
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;
  private readonly tenantId = process.env.AZURE_TENANT_ID;
  private readonly clientId = process.env.AZURE_CLIENT_ID;
  private readonly clientSecret = process.env.AZURE_CLIENT_SECRET;
  private readonly graphTokenUrl = process.env.GRAPH_TOKEN_URL;
  private readonly driveId = process.env.ONEDRIVE_DRIVE_ID;
  private readonly rootFolder = process.env.ONEDRIVE_ROOT_FOLDER || 'moto-service-hub';

  /**
   * Get valid access token, refreshing if necessary
   */
  async getAccessToken(): Promise<string> {
    // Check if token is still valid
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry - 60000) {
      return this.accessToken;
    }

    try {
      const response = await axios.post<GraphTokenResponse>(
        this.graphTokenUrl!,
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.clientId!,
          client_secret: this.clientSecret!,
          scope: process.env.GRAPH_SCOPE || 'https://graph.microsoft.com/.default',
        }),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + response.data.expires_in * 1000;

      return this.accessToken;
    } catch (error) {
      console.error('Failed to get OneDrive access token:', error);
      throw new Error('Failed to authenticate with OneDrive');
    }
  }

  /**
   * Get folder ID by path, creating it if it doesn't exist
   */
  async getFolderIdByPath(folderPath: string): Promise<string> {
    const token = await this.getAccessToken();
    const pathParts = folderPath.split('/').filter(p => p);

    let currentFolderId = 'root';

    for (const part of pathParts) {
      try {
        // Try to get existing folder
        const response = await axios.get(
          `https://graph.microsoft.com/v1.0/drives/${this.driveId}/items/${currentFolderId}/children?$filter=name eq '${part}'`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.value.length > 0) {
          currentFolderId = response.data.value[0].id;
        } else {
          // Create folder if it doesn't exist
          const createResponse = await axios.post(
            `https://graph.microsoft.com/v1.0/drives/${this.driveId}/items/${currentFolderId}/children`,
            {
              name: part,
              folder: {},
              '@microsoft.graph.conflictBehavior': 'rename',
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          currentFolderId = createResponse.data.id;
        }
      } catch (error) {
        console.error(`Error accessing folder ${part}:`, error);
        throw error;
      }
    }

    return currentFolderId;
  }

  /**
   * Upload a file to OneDrive
   */
  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    folderPath: string
  ): Promise<DriveItemMetadata> {
    try {
      const token = await this.getAccessToken();
      const folderId = await this.getFolderIdByPath(folderPath);

      const response = await axios.put(
        `https://graph.microsoft.com/v1.0/drives/${this.driveId}/items/${folderId}:/${fileName}:/content`,
        fileBuffer,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/octet-stream',
          },
        }
      );

      return {
        id: response.data.id,
        name: response.data.name,
        webUrl: response.data.webUrl,
        size: response.data.size,
        createdDateTime: response.data.createdDateTime,
      };
    } catch (error) {
      console.error('Failed to upload file to OneDrive:', error);
      throw error;
    }
  }

  /**
   * Upload Aadhaar card for a user
   */
  async uploadAadhaarCard(
    fileBuffer: Buffer,
    fileName: string,
    role: 'owner' | 'worker' | 'customer',
    userId: number
  ): Promise<DriveItemMetadata> {
    const folderPath = `${this.rootFolder}/Aadhaar%20Card%20profile_pic/${role}/${userId}`;
    return this.uploadFile(fileBuffer, fileName, folderPath);
  }

  /**
   * Upload shop profile images
   */
  async uploadShopImage(
    fileBuffer: Buffer,
    fileName: string,
    shopId: number,
    imageIndex: number = 0
  ): Promise<DriveItemMetadata> {
    const folderPath = `${this.rootFolder}/shop_profiles/${shopId}`;
    const uniqueFileName = `shop_${shopId}_${imageIndex}_${Date.now()}_${fileName}`;
    return this.uploadFile(fileBuffer, uniqueFileName, folderPath);
  }

  /**
   * Upload bike images
   */
  async uploadBikeImage(
    fileBuffer: Buffer,
    fileName: string,
    bikeId: number,
    customerId: number
  ): Promise<DriveItemMetadata> {
    const folderPath = `${this.rootFolder}/bike_img/${customerId}/${bikeId}`;
    return this.uploadFile(fileBuffer, fileName, folderPath);
  }

  /**
   * Get file URL (web URL for sharing)
   */
  async getFileUrl(driveItemId: string): Promise<string> {
    try {
      const token = await this.getAccessToken();
      const response = await axios.get(
        `https://graph.microsoft.com/v1.0/drives/${this.driveId}/items/${driveItemId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      return response.data.webUrl;
    } catch (error) {
      console.error('Failed to get file URL:', error);
      throw error;
    }
  }

  /**
   * Delete a file from OneDrive
   */
  async deleteFile(driveItemId: string): Promise<void> {
    try {
      const token = await this.getAccessToken();
      await axios.delete(
        `https://graph.microsoft.com/v1.0/drives/${this.driveId}/items/${driveItemId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw error;
    }
  }

  /**
   * List files in a folder
   */
  async listFolderContents(folderPath: string): Promise<DriveItemMetadata[]> {
    try {
      const token = await this.getAccessToken();
      const folderId = await this.getFolderIdByPath(folderPath);

      const response = await axios.get(
        `https://graph.microsoft.com/v1.0/drives/${this.driveId}/items/${folderId}/children`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      return response.data.value.map((item: any) => ({
        id: item.id,
        name: item.name,
        webUrl: item.webUrl,
        size: item.size || 0,
        createdDateTime: item.createdDateTime,
      }));
    } catch (error) {
      console.error('Failed to list folder contents:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const oneDriveService = new OneDriveService();
