"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.retryWithBackoff = exports.delay = exports.calculateProgress = exports.sanitizeFilename = exports.isValidEmail = exports.verifySignedUrl = exports.signUrl = exports.calculatePartsCount = exports.calculatePartSize = exports.formatBytes = exports.formatDuration = exports.generateCertificateCode = exports.generateRandomString = void 0;
const crypto = __importStar(require("crypto"));
function generateRandomString(length = 32) {
    return crypto.randomBytes(length).toString('hex');
}
exports.generateRandomString = generateRandomString;
function generateCertificateCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 12; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
        if (i === 5)
            code += '-';
    }
    return code;
}
exports.generateCertificateCode = generateCertificateCode;
function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return [hours, minutes, secs]
        .map(v => v.toString().padStart(2, '0'))
        .join(':');
}
exports.formatDuration = formatDuration;
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0)
        return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
exports.formatBytes = formatBytes;
function calculatePartSize(fileSizeBytes, maxParts = 10000) {
    const minPartSize = 5 * 1024 * 1024;
    const maxPartSize = 5 * 1024 * 1024 * 1024;
    let partSize = Math.ceil(fileSizeBytes / maxParts);
    if (partSize < minPartSize) {
        partSize = minPartSize;
    }
    if (partSize > maxPartSize) {
        partSize = maxPartSize;
    }
    return partSize;
}
exports.calculatePartSize = calculatePartSize;
function calculatePartsCount(fileSizeBytes, partSize) {
    return Math.ceil(fileSizeBytes / partSize);
}
exports.calculatePartsCount = calculatePartsCount;
function signUrl(url, secret, expiresIn = 300) {
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
exports.signUrl = signUrl;
function verifySignedUrl(url, secret) {
    try {
        const urlObj = new URL(url);
        const expires = urlObj.searchParams.get('expires');
        const signature = urlObj.searchParams.get('signature');
        if (!expires || !signature)
            return false;
        const expiresAt = parseInt(expires);
        if (Date.now() > expiresAt)
            return false;
        urlObj.searchParams.delete('expires');
        urlObj.searchParams.delete('signature');
        const data = `${urlObj.toString()}:${expiresAt}`;
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(data)
            .digest('hex');
        return signature === expectedSignature;
    }
    catch {
        return false;
    }
}
exports.verifySignedUrl = verifySignedUrl;
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
exports.isValidEmail = isValidEmail;
function sanitizeFilename(filename) {
    return filename
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .replace(/_{2,}/g, '_')
        .toLowerCase();
}
exports.sanitizeFilename = sanitizeFilename;
function calculateProgress(completed, total) {
    if (total === 0)
        return 0;
    return Math.min(100, Math.round((completed / total) * 100));
}
exports.calculateProgress = calculateProgress;
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
exports.delay = delay;
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            if (i < maxRetries - 1) {
                const delayMs = baseDelay * Math.pow(2, i);
                await delay(delayMs);
            }
        }
    }
    throw lastError;
}
exports.retryWithBackoff = retryWithBackoff;
//# sourceMappingURL=index.js.map