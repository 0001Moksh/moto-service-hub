import { useState, useCallback } from 'react';
import { useAuth } from './use-auth';

interface UploadResponse {
  success: boolean;
  file?: {
    id: string;
    name: string;
    url: string;
    size: number;
  };
  error?: string;
}

interface UseDocumentUploadOptions {
  onSuccess?: (response: UploadResponse) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for uploading documents to OneDrive
 */
export function useDocumentUpload(options?: UseDocumentUploadOptions) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Upload Aadhaar card
   */
  const uploadAadhaarCard = useCallback(
    async (file: File): Promise<UploadResponse | null> => {
      if (!user) {
        setError('You must be logged in to upload documents');
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('role', user.role);
        formData.append('userId', user.id.toString());

        const token = localStorage.getItem('auth_token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch('/api/documents/aadhaar', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Upload failed');
        }

        const data = await response.json();
        options?.onSuccess?.(data);
        return data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error.message);
        options?.onError?.(error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [user, options]
  );

  /**
   * Upload shop image
   */
  const uploadShopImage = useCallback(
    async (file: File, shopId: number): Promise<UploadResponse | null> => {
      if (!user || user.role !== 'owner') {
        setError('Only shop owners can upload shop images');
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('shopId', shopId.toString());

        const token = localStorage.getItem('auth_token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch('/api/documents/shop-images', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Upload failed');
        }

        const data = await response.json();
        options?.onSuccess?.(data);
        return data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error.message);
        options?.onError?.(error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [user, options]
  );

  /**
   * Upload bike image
   */
  const uploadBikeImage = useCallback(
    async (file: File, bikeId: number): Promise<UploadResponse | null> => {
      if (!user || user.role !== 'customer') {
        setError('Only customers can upload bike images');
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bikeId', bikeId.toString());

        const token = localStorage.getItem('auth_token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch('/api/documents/bike-images', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Upload failed');
        }

        const data = await response.json();
        options?.onSuccess?.(data);
        return data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error.message);
        options?.onError?.(error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [user, options]
  );

  /**
   * Get shop images
   */
  const getShopImages = useCallback(async (shopId: number) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `/api/documents/shop-images?shopId=${shopId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch shop images');
      }

      return await response.json();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error.message);
      return null;
    }
  }, []);

  /**
   * Get bike images
   */
  const getBikeImages = useCallback(async (bikeId: number) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `/api/documents/bike-images?bikeId=${bikeId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch bike images');
      }

      return await response.json();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error.message);
      return null;
    }
  }, []);

  return {
    uploadAadhaarCard,
    uploadShopImage,
    uploadBikeImage,
    getShopImages,
    getBikeImages,
    isLoading,
    error,
  };
}
