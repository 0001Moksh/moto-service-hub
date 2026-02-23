# OneDrive Integration - Implementation Summary

## 📁 Project Structure

```
moto-servicehub-system/
├── lib/
│   ├── onedrive.ts                 ✅ Core OneDrive service
│   └── document-utils.ts           ✅ Helper utilities
│
├── hooks/
│   └── use-document-upload.ts      ✅ React hook for uploads
│
├── components/
│   └── documents/
│       └── document-upload.tsx     ✅ Reusable UI component
│
├── app/api/documents/
│   ├── aadhaar/
│   │   └── route.ts               ✅ POST/GET Aadhaar upload
│   ├── shop-images/
│   │   └── route.ts               ✅ POST/GET shop images
│   └── bike-images/
│       └── route.ts               ✅ POST/GET bike images
│
├── ONEDRIVE_QUICKSTART.md          ✅ Quick reference
├── ONEDRIVE_INTEGRATION.md         ✅ Complete guide
└── ONEDRIVE_EXAMPLES.md            ✅ Code examples
```

## 🎯 Components Breakdown

### 1. Core Service (`lib/onedrive.ts`)

**Class:** `OneDriveService`

**Methods:**
- `getAccessToken()` - Get/refresh JWT token
- `getFolderIdByPath()` - Get or create folder
- `uploadFile()` - Base file upload
- `uploadAadhaarCard()` - Upload Aadhaar
- `uploadShopImage()` - Upload shop photo
- `uploadBikeImage()` - Upload bike photo
- `listFolderContents()` - List files
- `deleteFile()` - Delete file
- `getFileUrl()` - Get shareable URL

**Features:**
- ✅ Automatic token refresh
- ✅ Recursive folder creation
- ✅ Error handling & logging
- ✅ Singleton pattern

### 2. API Routes

#### `POST /api/documents/aadhaar`
```json
Request:
{
  Authorization: "Bearer {token}",
  FormData: {
    file: File,
    role: "owner|worker|customer",
    userId: number
  }
}

Response:
{
  success: true,
  file: {
    id: string,
    name: string,
    url: string,
    size: number
  }
}
```

**Actions:**
- ✅ Validate JWT token
- ✅ Verify user ownership
- ✅ Upload to OneDrive
- ✅ Update Supabase picture column

#### `POST /api/documents/shop-images`
```json
Request:
{
  Authorization: "Bearer {token}",
  FormData: {
    file: File,
    shopId: number
  }
}

Response:
{
  success: true,
  file: { id, name, url, size }
}
```

**Actions:**
- ✅ Verify shop ownership
- ✅ Upload to OneDrive
- ✅ Append to picture_array

#### `GET /api/documents/shop-images?shopId=4`
- ✅ List all shop images
- ✅ Return file metadata

#### Similar for `/api/documents/bike-images`

### 3. React Hook (`hooks/use-document-upload.ts`)

**Exports:**
```typescript
useDocumentUpload(options?: UseDocumentUploadOptions) => {
  uploadAadhaarCard(file: File): Promise<UploadResponse | null>
  uploadShopImage(file: File, shopId: number): Promise<UploadResponse | null>
  uploadBikeImage(file: File, bikeId: number): Promise<UploadResponse | null>
  getShopImages(shopId: number): Promise<any>
  getBikeImages(bikeId: number): Promise<any>
  isLoading: boolean
  error: string | null
}
```

**Features:**
- ✅ Role-based validation
- ✅ Success/error callbacks
- ✅ Token management
- ✅ Error state handling

### 4. UI Component (`components/documents/document-upload.tsx`)

**Props:**
```typescript
{
  type: 'aadhaar' | 'shop-image' | 'bike-image'
  resourceId: number
  onUploadSuccess?: (fileUrl: string) => void
  label?: string
  accept?: string
  className?: string
}
```

**Features:**
- ✅ Drag & drop support
- ✅ Progress indicator
- ✅ File validation
- ✅ Error display
- ✅ Success feedback

### 5. Utilities (`lib/document-utils.ts`)

**Functions:**
- `formatFileSize()` - Format bytes to readable size
- `isValidDocumentFile()` - Check file validity
- `validateFileUpload()` - Validate with size check
- `generateUniqueFileName()` - Generate unique names
- `getDocumentFolderPath()` - Get OneDrive path
- `formatDocumentName()` - Clean up display names
- `validateDocumentUrl()` - Verify URL accessibility
- `getDocumentTypeFromName()` - Identify document type
- `validateMultipleFiles()` - Batch validation

## 📊 Data Flow

### Upload Flow

```
User selects file
        ↓
DocumentUpload component validates
        ↓
useDocumentUpload hook prepares FormData
        ↓
POST /api/documents/{type}
        ↓
API verifies JWT & ownership
        ↓
OneDriveService.upload{Type}()
        ↓
Get/create OneDrive folder
        ↓
Upload file to OneDrive
        ↓
Get file URL
        ↓
Update Supabase database
        ↓
Return file metadata to client
        ↓
Component displays success & URL
```

### Retrieval Flow

```
GET /api/documents/shop-images?shopId=4
        ↓
API verifies JWT
        ↓
OneDriveService.listFolderContents()
        ↓
Get folder by path
        ↓
List all files in folder
        ↓
Return file metadata array
        ↓
Client displays files
```

## 🔐 Security Layers

1. **Authentication (JWT)**
   - All endpoints require valid token
   - Token verification before processing

2. **Authorization (Role-based)**
   - Owners can upload for shops
   - Customers can upload for bikes
   - Users can only upload their Aadhaar

3. **File Validation**
   - Type checking (JPEG, PNG, WebP, PDF)
   - Size limits (10MB default)
   - Client-side validation

4. **Ownership Verification**
   - Verify user owns resource
   - Check shop ownership
   - Validate bike ownership

5. **OneDrive Security**
   - OAuth 2.0 tokens
   - Auto-refresh mechanism
   - Secure file storage

## 🗂️ OneDrive Folder Structure

```
moto-service-hub/ (root)
│
├── Aadhaar Card profile_pic/
│   ├── owner/
│   │   ├── 1/
│   │   │   └── aadhaar.jpg
│   │   └── 2/
│   │       └── aadhaar.jpg
│   │
│   ├── worker/
│   │   └── 1/
│   │       └── aadhaar.jpg
│   │
│   └── customer/
│       └── 1/
│           └── aadhaar.jpg
│
├── shop_profiles/
│   ├── 1/
│   │   ├── shop_1_0_1708612345_xyz.jpg
│   │   └── shop_1_1_1708612346_abc.jpg
│   │
│   ├── 2/
│   │   ├── shop_2_0_1708612347_def.jpg
│   │   └── shop_2_1_1708612348_ghi.jpg
│   │
│   └── 3/
│       └── shop_3_0_1708612349_jkl.jpg
│
└── bike_img/
    ├── 1/ (customer_id)
    │   ├── 1/ (bike_id)
    │   │   ├── front_view.jpg
    │   │   └── side_view.jpg
    │   │
    │   └── 2/ (bike_id)
    │       ├── front_view.jpg
    │       └── rear_view.jpg
    │
    └── 2/ (customer_id)
        └── 1/ (bike_id)
            └── bike.jpg
```

## 📝 Database Updates

### On Aadhaar Upload
```sql
UPDATE owner SET picture = 'https://...' WHERE owner_id = X
-- or
UPDATE worker SET picture = 'https://...' WHERE worker_id = X
-- or
UPDATE customer SET picture = 'https://...' WHERE customer_id = X
```

### On Shop Image Upload
```sql
UPDATE shop SET picture_array = array_append(picture_array, 'https://...')
WHERE shop_id = X
```

### On Bike Image Upload
```sql
UPDATE bike SET picture_array = array_append(picture_array, 'https://...')
WHERE bike_id = X
```

## 🧪 Testing Checklist

- [ ] Upload Aadhaar card for customer
- [ ] Upload Aadhaar card for shop owner
- [ ] Upload shop images (multiple)
- [ ] Upload bike images (multiple)
- [ ] Verify Supabase updates
- [ ] Test error handling (invalid file)
- [ ] Test auth failure (no token)
- [ ] Test ownership (wrong user)
- [ ] List shop images via GET
- [ ] List bike images via GET
- [ ] Verify OneDrive folder structure
- [ ] Test file deletion
- [ ] Verify token refresh

## 🚀 Deployment Checklist

- [ ] Verify `.env.local` has all Azure credentials
- [ ] Run `npm install axios` ✓ (already done)
- [ ] Test in development: `npm run dev`
- [ ] Build for production: `npm run build`
- [ ] Deploy to production
- [ ] Verify OneDrive access from production
- [ ] Monitor error logs

## 📈 Performance Optimization

**Implemented:**
- ✅ Token caching with expiry check
- ✅ Folder ID caching
- ✅ Streaming file upload
- ✅ Progress indication

**Future:**
- [ ] Image compression before upload
- [ ] Parallel uploads
- [ ] Upload queue management
- [ ] CDN caching for retrieved images

## 🔄 Integration Points Ready

1. **Registration Flows**
   - Add DocumentUpload after user creates account

2. **Profile Pages**
   - Display uploaded documents
   - Allow updates/replacements

3. **Verification Workflow**
   - Admin can review documents
   - Automatic verification checks

4. **Shop Management**
   - Upload shop branding
   - Manage profile images

5. **Bike Management**
   - Upload bike photos during registration
   - Gallery view for bike images

---

**Status:** ✅ Complete and Ready for Integration  
**Installed Dependencies:** axios ✓  
**Documentation:** Complete ✓  
**Code Examples:** Provided ✓  
**Security Implemented:** ✓
