/**
 * OneDrive Integration Examples
 * Shows how to integrate document uploads into your existing workflows
 */

// ============================================
// Example 1: Customer Registration with Documents
// ============================================

// app/auth/register-customer/page.tsx

import { DocumentUpload } from '@/components/documents/document-upload';
import { useState } from 'react';

export function CustomerRegistrationForm() {
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [aadhaarUploaded, setAadhaarUploaded] = useState(false);
  const [bikeImages, setBikeImages] = useState<string[]>([]);

  const handleRegistrationSubmit = async (formData: FormData) => {
    // First, register the customer
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      setCustomerId(data.customerId);
      // Now customer can upload documents
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleRegistrationSubmit(new FormData(e.currentTarget));
    }}>
      {/* Basic registration fields */}
      <input type="email" name="email" required />
      <input type="password" name="password" required />
      <input type="text" name="name" required />

      {/* Show document uploads after registration */}
      {customerId && (
        <div className="space-y-6 mt-6">
          <h2 className="text-lg font-semibold">Upload Documents</h2>

          {/* Aadhaar Card */}
          <DocumentUpload
            type="aadhaar"
            resourceId={customerId}
            label="Upload Your Aadhaar Card (Required)"
            onUploadSuccess={() => setAadhaarUploaded(true)}
          />

          {aadhaarUploaded && (
            <div className="p-3 bg-green-50 border border-green-200 rounded">
              ✓ Aadhaar card uploaded successfully
            </div>
          )}

          {/* Bike Images - could be added during booking */}
        </div>
      )}

      <button type="submit">Register</button>
    </form>
  );
}

// ============================================
// Example 2: Owner/Shop Registration
// ============================================

// app/auth/register-shop/step2-documents.tsx

import { DocumentUpload } from '@/components/documents/document-upload';

interface ShopRegistrationStep2Props {
  ownerId: number;
  shopId: number;
}

export function ShopRegistrationStep2({ ownerId, shopId }: ShopRegistrationStep2Props) {
  const [aadhaarUploaded, setAadhaarUploaded] = useState(false);
  const [shopImagesCount, setShopImagesCount] = useState(0);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Upload Required Documents</h2>

      {/* Owner's Aadhaar */}
      <div>
        <h3 className="font-medium mb-3">Your Aadhaar Card</h3>
        <DocumentUpload
          type="aadhaar"
          resourceId={ownerId}
          label="Upload Your Aadhaar Card"
          onUploadSuccess={() => setAadhaarUploaded(true)}
        />
      </div>

      {/* Shop Images */}
      <div>
        <h3 className="font-medium mb-3">Shop Profile Photos</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Upload 2-5 photos of your shop interior and exterior for credibility
        </p>
        <DocumentUpload
          type="shop-image"
          resourceId={shopId}
          label="Upload Shop Photo"
          onUploadSuccess={() => setShopImagesCount((c) => c + 1)}
        />
        <p className="text-xs text-muted-foreground mt-2">
          {shopImagesCount} photos uploaded
        </p>
      </div>

      {/* Verification Status */}
      {aadhaarUploaded && shopImagesCount >= 2 && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900">
            Documents Under Review
          </h4>
          <p className="text-sm text-blue-800 mt-1">
            Your shop will be verified within 24 hours. You'll receive an email
            confirmation.
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================
// Example 3: Bike Registration
// ============================================

// app/customer/bikes/register/page.tsx

import { DocumentUpload } from '@/components/documents/document-upload';

interface BikeRegistrationProps {
  customerId: number;
  bikeId: number;
}

export function BikeRegistrationForm({ customerId, bikeId }: BikeRegistrationProps) {
  const [bikeImages, setBikeImages] = useState<string[]>([]);

  const handleImageUpload = (url: string) => {
    setBikeImages((prev) => [...prev, url]);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Bike Details</h2>

      {/* Basic bike info form */}
      <input placeholder="Registration Number" required />
      <input placeholder="Model" required />
      <input placeholder="Color" required />

      {/* Bike Images */}
      <div className="mt-6">
        <h3 className="font-medium mb-3">Bike Photos</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Upload clear photos of all sides of your bike
        </p>

        <DocumentUpload
          type="bike-image"
          resourceId={bikeId}
          label="Add Photo (Front, Side, Back)"
          onUploadSuccess={handleImageUpload}
        />

        {/* Show uploaded images */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          {bikeImages.map((url, index) => (
            <img
              key={index}
              src={url}
              alt={`Bike photo ${index + 1}`}
              className="w-full h-24 object-cover rounded-lg"
            />
          ))}
        </div>

        {bikeImages.length > 0 && (
          <p className="text-sm text-muted-foreground mt-2">
            {bikeImages.length} photos uploaded
          </p>
        )}
      </div>

      <button
        className="w-full bg-brand-blue text-white py-2 rounded-lg"
        disabled={bikeImages.length === 0}
      >
        Complete Registration
      </button>
    </div>
  );
}

// ============================================
// Example 4: Multi-step Upload in Modal
// ============================================

// components/documents/bulk-document-upload-modal.tsx

import { DocumentUpload } from './document-upload';
import { useState } from 'react';

interface BulkUploadModalProps {
  userId: number;
  role: 'owner' | 'worker' | 'customer';
  shopId?: number;
  bikeId?: number;
  onComplete?: () => void;
}

export function BulkDocumentUploadModal({
  userId,
  role,
  shopId,
  bikeId,
  onComplete,
}: BulkUploadModalProps) {
  const [step, setStep] = useState<'initial' | 'aadhaar' | 'images' | 'complete'>(
    'initial'
  );
  const [uploadedCount, setUploadedCount] = useState(0);

  const handleNextStep = () => {
    if (step === 'initial') setStep('aadhaar');
    if (step === 'aadhaar') setStep(role === 'customer' || role === 'owner' ? 'images' : 'complete');
    if (step === 'images') setStep('complete');
  };

  const handleImageUpload = () => {
    setUploadedCount((c) => c + 1);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
        {/* Step: Initial */}
        {step === 'initial' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Upload Documents</h2>
            <p className="text-muted-foreground">
              Let's verify your identity and information
            </p>
            <button
              onClick={handleNextStep}
              className="w-full bg-brand-blue text-white py-2 rounded-lg"
            >
              Get Started
            </button>
          </div>
        )}

        {/* Step: Aadhaar */}
        {step === 'aadhaar' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Verify Your Identity</h2>
            <DocumentUpload
              type="aadhaar"
              resourceId={userId}
              onUploadSuccess={handleNextStep}
            />
          </div>
        )}

        {/* Step: Images */}
        {step === 'images' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">
              {role === 'owner' ? 'Shop Photos' : 'Bike Photos'}
            </h2>
            <DocumentUpload
              type={role === 'owner' ? 'shop-image' : 'bike-image'}
              resourceId={shopId || bikeId || userId}
              onUploadSuccess={handleImageUpload}
            />
            <button
              onClick={handleNextStep}
              disabled={uploadedCount === 0}
              className="w-full bg-brand-blue text-white py-2 rounded-lg disabled:opacity-50"
            >
              Continue ({uploadedCount}/3)
            </button>
          </div>
        )}

        {/* Step: Complete */}
        {step === 'complete' && (
          <div className="space-y-4 text-center">
            <div className="text-4xl">✓</div>
            <h2 className="text-lg font-semibold">All Set!</h2>
            <p className="text-muted-foreground">
              Your documents have been uploaded successfully
            </p>
            <button
              onClick={onComplete}
              className="w-full bg-brand-blue text-white py-2 rounded-lg"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Example 5: Admin Dashboard - View Documents
// ============================================

// app/admin/documents/page.tsx

import { useEffect, useState } from 'react';

type DocumentType = 'aadhaar' | 'shop-image' | 'bike-image';

export function AdminDocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<DocumentType | 'all'>('all');

  useEffect(() => {
    fetchDocuments();
  }, [filterType]);

  const fetchDocuments = async () => {
    const response = await fetch(`/api/admin/documents?type=${filterType}`);
    const data = await response.json();
    setDocuments(data.documents);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">User Documents</h1>

      {/* Filter */}
      <div className="flex gap-2">
        {(['all', 'aadhaar', 'shop-image', 'bike-image'] as const).map(
          (type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-lg ${
                filterType === type
                  ? 'bg-brand-blue text-white'
                  : 'bg-muted text-foreground'
              }`}
            >
              {type === 'all' ? 'All' : type.replace('-', ' ')}
            </button>
          )
        )}
      </div>

      {/* Document List */}
      <div className="grid gap-4">
        {documents.map((doc) => (
          <div key={doc.id} className="p-4 border rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{doc.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {doc.type} • {doc.uploadedAt}
                </p>
              </div>
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-blue-100 text-blue-600 rounded text-sm"
              >
                View
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// Export all examples
// ============================================

export {
  CustomerRegistrationForm,
  ShopRegistrationStep2,
  BikeRegistrationForm,
  BulkDocumentUploadModal,
  AdminDocumentsPage,
};
