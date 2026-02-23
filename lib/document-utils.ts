/**
 * Document handling utilities
 * Helper functions for working with OneDrive documents
 */

export interface DocumentInfo {
  id: string;
  name: string;
  url: string;
  size: number;
  createdAt: string;
  type: 'aadhaar' | 'shop-image' | 'bike-image';
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Check if file is valid document type
 */
export function isValidDocumentFile(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  return validTypes.includes(file.type) && file.size <= 10 * 1024 * 1024; // 10MB max
}

/**
 * Get file extension
 */
export function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || '';
}

/**
 * Validate file for upload
 */
export function validateFileUpload(
  file: File,
  maxSizeMB: number = 10
): { valid: boolean; error?: string } {
  const maxBytes = maxSizeMB * 1024 * 1024;

  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit (${formatFileSize(file.size)})`,
    };
  }

  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Only JPEG, PNG, WebP, and PDF files are allowed',
    };
  }

  return { valid: true };
}

/**
 * Generate unique file name
 */
export function generateUniqueFileName(originalName: string, prefix: string = ''): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  const extension = getFileExtension(originalName);
  return `${prefix}_${timestamp}_${random}.${extension}`;
}

/**
 * Map document type to folder path
 */
export function getDocumentFolderPath(
  type: 'aadhaar' | 'shop-image' | 'bike-image',
  role?: string,
  id?: number
): string {
  const root = 'moto-service-hub';

  switch (type) {
    case 'aadhaar':
      return `${root}/Aadhaar%20Card%20profile_pic/${role}/${id}`;
    case 'shop-image':
      return `${root}/shop_profiles/${id}`;
    case 'bike-image':
      return `${root}/bike_img/${role === 'customer' ? id : 'unknown'}`;
    default:
      return root;
  }
}

/**
 * Extract user-friendly name from OneDrive metadata
 */
export function formatDocumentName(fileName: string): string {
  // Remove timestamps and random suffixes added by the upload process
  return fileName.replace(/_\d+_[a-z0-9]+\./g, '.');
}

/**
 * Check if document URL is valid and accessible
 */
export async function validateDocumentUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get document type from file name pattern
 */
export function getDocumentTypeFromName(fileName: string): 'aadhaar' | 'shop-image' | 'bike-image' | null {
  if (fileName.toLowerCase().includes('aadhaar')) return 'aadhaar';
  if (fileName.toLowerCase().includes('shop')) return 'shop-image';
  if (fileName.toLowerCase().includes('bike')) return 'bike-image';
  return null;
}

/**
 * Batch validate multiple files
 */
export function validateMultipleFiles(
  files: File[],
  maxSizeMB: number = 10
): { valid: File[]; invalid: { file: File; error: string }[] } {
  const valid: File[] = [];
  const invalid: { file: File; error: string }[] = [];

  for (const file of files) {
    const validation = validateFileUpload(file, maxSizeMB);
    if (validation.valid) {
      valid.push(file);
    } else {
      invalid.push({ file, error: validation.error || 'Unknown error' });
    }
  }

  return { valid, invalid };
}
