/**
 * MinIO integration stub for bid document management.
 * Full implementation deferred to Sprint 4.
 * 
 * For now, provides placeholder methods that accept file metadata
 * and return stub presigned URLs. Actual upload/download will use
 * minio client library with encryption.
 */

interface DocumentUploadResult {
  key: string;
  presignedUrl: string;
}

/**
 * Stub: Upload bid document to MinIO.
 * In production: Use minioClient.putObject with encrypted stream.
 */
export async function uploadBidDocument(
  tenderId: string,
  bidId: string,
  fileName: string,
  _fileData?: Buffer,
): Promise<DocumentUploadResult> {
  // Stub: Generate MinIO-like key path
  const key = `tenders/${tenderId}/bids/${bidId}/${fileName}`;
  const presignedUrl = `https://minio-stub.example.com/presigned/${key}?token=stub`;

  console.log(`[MinIO Stub] Document uploaded: ${key}`);

  return {
    key,
    presignedUrl,
  };
}

/**
 * Stub: Get presigned download URL for bid document.
 * In production: Use minioClient.presignedGetObject.
 */
export function getBidDocumentUrl(key: string): string {
  return `https://minio-stub.example.com/download/${key}?token=stub`;
}

/**
 * Stub: Delete bid document.
 * In production: Use minioClient.removeObject.
 */
export async function deleteBidDocument(key: string): Promise<void> {
  console.log(`[MinIO Stub] Document deleted: ${key}`);
}
