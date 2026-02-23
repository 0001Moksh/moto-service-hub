# OneDrive Integration Guide

## Overview

The Moto Service Hub uses Microsoft OneDrive to store and manage user documents including Aadhaar cards, shop images, worker profiles, and bike images. This provides secure, organized, cloud-based document storage with automatic backup and sharing capabilities.

## Architecture

### Folder Structure

```
moto-service-hub/
├── Aadhaar Card profile_pic/
│   ├── owner/
│   │   └── {owner_id}/
│   ├── worker/
│   │   └── {worker_id}/
│   └── customer/
│       └── {customer_id}/
├── shop_profiles/
│   └── {shop_id}/
│       ├── shop_1_0_timestamp_image1.jpg
│       ├── shop_1_1_timestamp_image2.jpg
│       └── ...
└── bike_img/
    └── {customer_id}/
        └── {bike_id}/
            ├── front_view.jpg
            ├── side_view.jpg
            └── ...
```

## Setup

### 1. Azure App Registration (Already Done ✓)

Your `.env.local` already contains:
```
AZURE_TENANT_ID=5960c264-86cd-4e40-a555-093eeab34ff5
AZURE_CLIENT_ID=f1cabd59-26d7-4622-a6bd-736003ff82e6
AZURE_CLIENT_SECRET=xIQ8Q~sg2KG...
GRAPH_SCOPE=https://graph.microsoft.com/.default
GRAPH_TOKEN_URL=https://login.microsoftonline.com/.../oauth2/v2.0/token
ONEDRIVE_ROOT_FOLDER=moto-service-hub
ONEDRIVE_DRIVE_ID=7ba027ac-90b7-4065-8bc2-a9b235fdb7b8
```

### 2. Install Dependencies

```bash
npm install axios
```

## Core Modules

### 1. OneDrive Service (`lib/onedrive.ts`)

Main service for OneDrive operations:

```typescript
import { oneDriveService } from '@/lib/onedrive';

// Upload Aadhaar card
const result = await oneDriveService.uploadAadhaarCard(
  fileBuffer,
  'aadhaar.jpg',
  'customer',
  123
);

// Upload shop image
const shopResult = await oneDriveService.uploadShopImage(
  fileBuffer,
  'shop.jpg',
  4
);

// Upload bike image
const bikeResult = await oneDriveService.uploadBikeImage(
  fileBuffer,
  'bike.jpg',
  5,
  123
);

// List files in a folder
const files = await oneDriveService.listFolderContents(
  'moto-service-hub/shop_profiles/4'
);

// Delete a file
await oneDriveService.deleteFile(fileId);
```

**Key Methods:**
- `getAccessToken()` - Get valid access token (auto-refreshes)
- `uploadAadhaarCard()` - Upload Aadhaar card
- `uploadShopImage()` - Upload shop images
- `uploadBikeImage()` - Upload bike images
- `getFolderIdByPath()` - Get/create folder
- `listFolderContents()` - List files in folder
- `deleteFile()` - Delete a file
- `getFileUrl()` - Get shareable URL

### 2. API Routes

#### Upload Aadhaar Card

**Endpoint:** `POST /api/documents/aadhaar`

```bash
curl -X POST http://localhost:3000/api/documents/aadhaar \
  -H "Authorization: Bearer {token}" \
  -F "file=@aadhaar.jpg" \
  -F "role=customer" \
  -F "userId=123"
```

**Response:**
```json
{
  "success": true,
  "file": {
    "id": "...",
    "name": "aadhaar.jpg",
    "url": "https://...",
    "size": 12345
  }
}
```

#### Upload Shop Image

**Endpoint:** `POST /api/documents/shop-images`

```bash
curl -X POST http://localhost:3000/api/documents/shop-images \
  -H "Authorization: Bearer {token}" \
  -F "file=@shop.jpg" \
  -F "shopId=4"
```

#### Get Shop Images

**Endpoint:** `GET /api/documents/shop-images?shopId=4`

```bash
curl http://localhost:3000/api/documents/shop-images?shopId=4 \
  -H "Authorization: Bearer {token}"
```

#### Upload Bike Image

**Endpoint:** `POST /api/documents/bike-images`

```bash
curl -X POST http://localhost:3000/api/documents/bike-images \
  -H "Authorization: Bearer {token}" \
  -F "file=@bike.jpg" \
  -F "bikeId=5"
```

#### Get Bike Images

**Endpoint:** `GET /api/documents/bike-images?bikeId=5`

### 3. React Hook (`hooks/use-document-upload.ts`)

Client-side hook for document uploads:

```typescript
import { useDocumentUpload } from '@/hooks/use-document-upload';

function MyComponent() {
  const {
    uploadAadhaarCard,
    uploadShopImage,
    uploadBikeImage,
    getShopImages,
    getBikeImages,
    isLoading,
    error,
  } = useDocumentUpload({
    onSuccess: (response) => {
      console.log('Upload successful:', response);
    },
    onError: (error) => {
      console.error('Upload failed:', error);
    },
  });

  const handleAadhaarUpload = async (file: File) => {
    const result = await uploadAadhaarCard(file);
    if (result) {
      console.log('Aadhaar uploaded:', result.file.url);
    }
  };

  const handleShopImageUpload = async (file: File) => {
    const result = await uploadShopImage(file, 4);
    if (result) {
      console.log('Shop image uploaded:', result.file.url);
    }
  };

  return (
    <div>
      {error && <p>{error}</p>}
      <button onClick={() => handleAadhaarUpload(file)} disabled={isLoading}>
        {isLoading ? 'Uploading...' : 'Upload Aadhaar'}
      </button>
    </div>
  );
}
```

### 4. Upload Component (`components/documents/document-upload.tsx`)

Reusable UI component:

```typescript
import { DocumentUpload } from '@/components/documents/document-upload';

export function ShopProfileForm() {
  return (
    <DocumentUpload
      type="shop-image"
      resourceId={4}
      label="Upload Shop Photos"
      onUploadSuccess={(fileUrl) => {
        console.log('File uploaded:', fileUrl);
      }}
    />
  );
}
```

**Props:**
- `type` - 'aadhaar' | 'shop-image' | 'bike-image'
- `resourceId` - The ID (userId, shopId, or bikeId)
- `onUploadSuccess` - Callback on successful upload
- `label` - Custom label text
- `accept` - File type filter (default: 'image/*')
- `className` - CSS classes

### 5. Utilities (`lib/document-utils.ts`)

Helper functions:

```typescript
import {
  formatFileSize,
  isValidDocumentFile,
  validateFileUpload,
  generateUniqueFileName,
  getDocumentFolderPath,
  formatDocumentName,
} from '@/lib/document-utils';

// Validate file before upload
const validation = validateFileUpload(file, 10); // 10MB max
if (!validation.valid) {
  console.error(validation.error);
}

// Format file size
console.log(formatFileSize(1024 * 1024)); // "1 MB"

// Generate unique name
const name = generateUniqueFileName('photo.jpg', 'shop_1');
// Output: "shop_1_1708612345_abc123.jpg"
```

## Usage Examples

### For Customers (Aadhaar + Bike Images)

```typescript
import { DocumentUpload } from '@/components/documents/document-upload';

export function CustomerProfileSetup() {
  return (
    <div className="space-y-6">
      <DocumentUpload
        type="aadhaar"
        resourceId={userId}
        label="Upload Your Aadhaar Card"
      />

      <DocumentUpload
        type="bike-image"
        resourceId={bikeId}
        label="Upload Bike Photos"
      />
    </div>
  );
}
```

### For Shop Owners (Aadhaar + Shop Images)

```typescript
export function ShopProfileSetup() {
  return (
    <div className="space-y-6">
      <DocumentUpload
        type="aadhaar"
        resourceId={ownerId}
        label="Upload Your Aadhaar Card"
      />

      <DocumentUpload
        type="shop-image"
        resourceId={shopId}
        label="Upload Shop Photos"
      />
    </div>
  );
}
```

### For Workers (Aadhaar Cards)

```typescript
export function WorkerProfileSetup() {
  return (
    <DocumentUpload
      type="aadhaar"
      resourceId={workerId}
      label="Upload Your Aadhaar Card"
    />
  );
}
```

## Database Integration

Upload endpoints automatically update Supabase:

- **Aadhaar uploads** → Updates `picture` column for owner/worker/customer
- **Shop images** → Appends to `picture_array` in shop table
- **Bike images** → Appends to `picture_array` in bike table

## Security Features

✓ **Token-based authentication** - All endpoints require JWT token  
✓ **Role-based access control** - Users can only upload their own documents  
✓ **Ownership verification** - Owners can only upload for their shops/bikes  
✓ **File validation** - Type and size checks before upload  
✓ **Secure URLs** - OneDrive generates secure shareable links  

## Error Handling

Common errors and solutions:

| Error | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Missing/invalid token | Ensure auth token is passed |
| 403 Forbidden | User doesn't own resource | Verify user ID matches resource owner |
| 400 Bad Request | Missing file or invalid data | Check request format |
| 500 ServerError | OneDrive connection issue | Check Azure credentials |

## Rate Limiting

OneDrive Graph API limits:
- 200 requests per 60 seconds per user
- Implemented with exponential backoff in token refreshes

## Testing

Test uploads locally:

```bash
# Start dev server
npm run dev

# Upload test file
curl -X POST http://localhost:3000/api/documents/aadhaar \
  -H "Authorization: Bearer your_test_token" \
  -F "file=@test.jpg" \
  -F "role=customer" \
  -F "userId=1"
```

## Troubleshooting

### Issue: "Failed to authenticate with OneDrive"

**Solution:** Verify Azure credentials in `.env.local`:
```
AZURE_TENANT_ID=...
AZURE_CLIENT_ID=...
AZURE_CLIENT_SECRET=...
```

### Issue: "Folder not found"

**Solution:** Check `ONEDRIVE_DRIVE_ID` and `ONEDRIVE_ROOT_FOLDER` in `.env.local`

### Issue: "Access denied"

**Solution:** Ensure the service role has Files.ReadWrite.All permission

## Next Steps

1. ✓ Complete basic OneDrive integration
2. → Add document verification/OCR for Aadhaar cards
3. → Add document expiration tracking
4. → Create document management dashboard
5. → Add bulk upload capability
6. → Integrate with verification workflow

---

**For Support:** Contact the development team or check Azure Graph API documentation at https://docs.microsoft.com/en-us/graph/api/resources/driveitem
