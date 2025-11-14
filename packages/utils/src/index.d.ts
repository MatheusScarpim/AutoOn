export declare function generateRandomString(length?: number): string;
export declare function generateCertificateCode(): string;
export declare function formatDuration(seconds: number): string;
export declare function formatBytes(bytes: number, decimals?: number): string;
export declare function calculatePartSize(fileSizeBytes: number, maxParts?: number): number;
export declare function calculatePartsCount(fileSizeBytes: number, partSize: number): number;
export declare function signUrl(url: string, secret: string, expiresIn?: number): string;
export declare function verifySignedUrl(url: string, secret: string): boolean;
export declare function isValidEmail(email: string): boolean;
export declare function sanitizeFilename(filename: string): string;
export declare function calculateProgress(completed: number, total: number): number;
export declare function delay(ms: number): Promise<void>;
export declare function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries?: number, baseDelay?: number): Promise<T>;
//# sourceMappingURL=index.d.ts.map