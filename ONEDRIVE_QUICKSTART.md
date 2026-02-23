# OneDrive Integration - Quick Start ✓

## What Was Set Up

Your Moto Service Hub now has complete OneDrive integration for document management!

### Files Created

**Core Module:**
- `lib/onedrive.ts` - Main OneDrive service class
- `lib/document-utils.ts` - Helper utilities

**API Routes:**
- `app/api/documents/aadhaar/route.ts` - Aadhaar upload
- `app/api/documents/shop-images/route.ts` - Shop image upload/list
- `app/api/documents/bike-images/route.ts` - Bike image upload/list

**React Hooks & Components:**
- `hooks/use-document-upload.ts` - React hook for uploads
- `components/documents/document-upload.tsx` - Reusable upload component

**Documentation:**
- `ONEDRIVE_INTEGRATION.md` - Complete integration guide
- `ONEDRIVE_EXAMPLES.md` - Code examples and patterns

## Quick Usage

### 1. Upload Aadhaar (For Any User)

```typescript
import { DocumentUpload } from '@/components/documents/document-upload';

<DocumentUpload
  type="aadhaar"
  resourceId={userId}
  label="Upload Your Aadhaar Card"
  onUploadSuccess={(url) => console.log('Uploaded:', url)}
/>
```

### 2. Upload Shop Images (For Owners Only)

```typescript
<DocumentUpload
  type="shop-image"
  resourceId={shopId}
  label="Upload Shop Photos"
/>
```

### 3. Upload Bike Images (For Customers Only)

```typescript
<DocumentUpload
  type="bike-image"
  resourceId={bikeId}
/>
```

### 4. Use the Hook Directly

```typescript
import { useDocumentUpload } from '@/hooks/use-document-upload';

const { uploadAadhaarCard, isLoading, error } = useDocumentUpload();

const handleUpload = async (file: File) => {
  const result = await uploadAadhaarCard(file);
  if (result?.file) {
    console.log('Uploaded to:', result.file.url);
  }
};
```

## Folder Structure in OneDrive

```
moto-service-hub/
├── Aadhaar Card profile_pic/
│   ├── owner/1/  → Owner Aadhaar cards
│   ├── worker/1/  → Worker Aadhaar cards
│   └── customer/1/  → Customer Aadhaar cards
├── shop_profiles/4/  → Shop images
└── bike_img/1/5/  → Bike images (customer_id/bike_id)
```

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/documents/aadhaar` | Upload Aadhaar |
| POST | `/api/documents/shop-images` | Upload shop image |
| GET | `/api/documents/shop-images?shopId=X` | List shop images |
| POST | `/api/documents/bike-images` | Upload bike image |
| GET | `/api/documents/bike-images?bikeId=X` | List bike images |

## Database Integration

Uploads automatically update your Supabase database:

- **Aadhaar** → `owner/worker/customer.picture`
- **Shop images** → `shop.picture_array`
- **Bike images** → `bike.picture_array`

## Features Included

✅ Auto-refreshing authentication tokens  
✅ Automatic folder creation  
✅ Role-based access control  
✅ File validation (size, type)  
✅ Progress tracking  
✅ Error handling  
✅ Secure file URLs  
✅ Batch operations

## Security

- ✓ JWT token verification on all endpoints
- ✓ User ownership validation
- ✓ Role-based permissions
- ✓ File type and size validation
- ✓ Azure OAuth 2.0 authentication

## Integration Points

### Registration Flows
Add document uploads after user creates account:
- Customers: Aadhaar + Bike photos
- Shop owners: Aadhaar + Shop photos
- Workers: Aadhaar

### Profile Setup
Add document management to profile pages:
- View uploaded documents
- Replace documents
- Delete old documents

### Verification Workflows
Use uploaded documents for verification:
- Admin can view all documents
- Manual verification for Aadhaar
- Automatic verification for consistency

## Next Steps (Optional)

1. **OCR Verification** - Extract text from Aadhaar cards
2. **Document Expiration** - Track validity dates
3. **Bulk Operations** - Upload multiple files at once
4. **Document History** - Track all uploads with timestamps
5. **Sharing** - Share documents with admins/shops

## Environment Variables

These should be configured in your `.env.local` file (do not commit to git):

- `AZURE_TENANT_ID` - Your Azure tenant ID
- `AZURE_CLIENT_ID` - Your Azure application ID  
- `AZURE_CLIENT_SECRET` - Your Azure application secret (keep confidential)
- `GRAPH_TOKEN_URL` - Microsoft Graph token endpoint
- `ONEDRIVE_ROOT_FOLDER` - Root folder name in OneDrive
- `ONEDRIVE_DRIVE_ID` - Your OneDrive drive ID

## Testing

Test the integration:

```bash
# Upload test file
curl -X POST http://localhost:3000/api/documents/aadhaar \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test.jpg" \
  -F "role=customer" \
  -F "userId=1"

# Response: { success: true, file: { id, name, url, size } }
```

## Troubleshooting

**Issue: "Failed to authenticate"**
- Check Azure credentials in `.env.local`
- Verify AZURE_CLIENT_SECRET is not expired

**Issue: "Folder not found"**
- Check ONEDRIVE_DRIVE_ID value
- Verify root folder name matches

**Issue: "Access denied"**
- Ensure service principal has file upload permissions
- Check token hasn't expired

## Support

For detailed documentation, see:
- [`ONEDRIVE_INTEGRATION.md`](./ONEDRIVE_INTEGRATION.md) - Full technical guide
- [`ONEDRIVE_EXAMPLES.md`](./ONEDRIVE_EXAMPLES.md) - Code examples
- Azure Documentation: https://docs.microsoft.com/en-us/graph

---

**Status:** ✅ Ready to use  
**Installation:** Complete - axios already installed  
**Tests:** Ready for integration testing
