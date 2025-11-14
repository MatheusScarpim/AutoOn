import * as crypto from 'crypto';

/**
 * Gera uma string aleatória segura
 */
export function generateRandomString(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Gera um código único para certificado (ex: ABC123XYZ456)
 */
export function generateCertificateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 12; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
    if (i === 5) code += '-'; // ABC123-XYZ456
  }
  return code;
}

/**
 * Formata segundos para HH:MM:SS
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return [hours, minutes, secs]
    .map(v => v.toString().padStart(2, '0'))
    .join(':');
}

/**
 * Formata bytes para formato legível (KB, MB, GB)
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Calcula o tamanho ideal de parte para multipart upload
 * MinIO requer mínimo de 5MB por parte (exceto última)
 */
export function calculatePartSize(fileSizeBytes: number, maxParts: number = 10000): number {
  const minPartSize = 5 * 1024 * 1024; // 5MB
  const maxPartSize = 5 * 1024 * 1024 * 1024; // 5GB

  let partSize = Math.ceil(fileSizeBytes / maxParts);

  if (partSize < minPartSize) {
    partSize = minPartSize;
  }

  if (partSize > maxPartSize) {
    partSize = maxPartSize;
  }

  return partSize;
}

/**
 * Calcula o número de partes para multipart upload
 */
export function calculatePartsCount(fileSizeBytes: number, partSize: number): number {
  return Math.ceil(fileSizeBytes / partSize);
}

/**
 * Assina uma URL com expiração (simplificado, usar HMAC na prática)
 */
export function signUrl(url: string, secret: string, expiresIn: number = 300): string {
  const expiresAt = Date.now() + expiresIn * 1000;
  const data = `${url}:${expiresAt}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('hex');

  const urlObj = new URL(url);
  urlObj.searchParams.set('expires', expiresAt.toString());
  urlObj.searchParams.set('signature', signature);

  return urlObj.toString();
}

/**
 * Verifica se uma URL assinada é válida
 */
export function verifySignedUrl(url: string, secret: string): boolean {
  try {
    const urlObj = new URL(url);
    const expires = urlObj.searchParams.get('expires');
    const signature = urlObj.searchParams.get('signature');

    if (!expires || !signature) return false;

    const expiresAt = parseInt(expires);
    if (Date.now() > expiresAt) return false;

    // Remove signature params for verification
    urlObj.searchParams.delete('expires');
    urlObj.searchParams.delete('signature');

    const data = `${urlObj.toString()}:${expiresAt}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(data)
      .digest('hex');

    return signature === expectedSignature;
  } catch {
    return false;
  }
}

/**
 * Valida email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitiza string para nome de arquivo
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
}

/**
 * Calcula progresso percentual
 */
export function calculateProgress(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(100, Math.round((completed / total) * 100));
}

/**
 * Delay helper para retry logic
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry helper com backoff exponencial
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        const delayMs = baseDelay * Math.pow(2, i);
        await delay(delayMs);
      }
    }
  }

  throw lastError!;
}
