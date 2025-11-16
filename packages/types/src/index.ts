// Enums
export enum UserRole {
  ADMIN = 'ADMIN',
  INSTRUCTOR = 'INSTRUCTOR',
  STUDENT = 'STUDENT',
}

export enum VideoStatus {
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  READY = 'READY',
  ERROR = 'ERROR',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  PENDING = 'PENDING',
}

export type StorageProvider = 's3' | 'azure';

export enum QuestionType {
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE',
}

// Entities
export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  role: UserRole;
  agreedToTerms: boolean;
  agreedToPrivacy: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  status: SubscriptionStatus;
  planId: string;
  planName: string;
  planPrice: number;
  autoRenew: boolean;
  startDate?: Date;
  endDate?: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  workloadHours: number;
  isPublished: boolean;
  createdById: string;
  createdBy?: User;
  createdAt: Date;
  updatedAt: Date;
}

export interface Module {
  id: string;
  courseId: string;
  course?: Course;
  title: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Lesson {
  id: string;
  moduleId: string;
  module?: Module;
  title: string;
  order: number;
  videoId?: string;
  video?: Video;
  minWatchPercent: number; // 0-100
  createdAt: Date;
  updatedAt: Date;
}

export interface Video {
  id: string;
  originalKey: string;
  hlsKeyPrefix?: string;
  durationSec?: number;
  status: VideoStatus;
  sizeBytes: number;
  thumbnails: string[];
  subtitles: Subtitle[];
  uploadId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subtitle {
  language: string;
  url: string;
  label: string;
}

export interface Enrollment {
  id: string;
  userId: string;
  user?: User;
  courseId: string;
  course?: Course;
  progressPercent: number;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface LessonProgress {
  id: string;
  enrollmentId: string;
  enrollment?: Enrollment;
  lessonId: string;
  lesson?: Lesson;
  watchedSeconds: number;
  lastPositionSec: number;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Quiz {
  id: string;
  moduleId: string;
  module?: Module;
  title: string;
  description?: string;
  minScore: number; // 0-100
  attemptsAllowed: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Question {
  id: string;
  quizId: string;
  quiz?: Quiz;
  type: QuestionType;
  statement: string;
  options: QuestionOption[];
  answerKey: string[]; // IDs of correct options
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuestionOption {
  id: string;
  text: string;
  order: number;
}

export interface Attempt {
  id: string;
  quizId: string;
  quiz?: Quiz;
  enrollmentId: string;
  enrollment?: Enrollment;
  score: number;
  answers: AttemptAnswer[];
  startedAt: Date;
  finishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttemptAnswer {
  questionId: string;
  selectedOptions: string[];
  isCorrect: boolean;
}

export interface Certificate {
  id: string;
  enrollmentId: string;
  enrollment?: Enrollment;
  code: string;
  pdfKey: string;
  issuedAt: Date;
}

export interface AuditLog {
  id: string;
  userId?: string;
  user?: User;
  action: string;
  entity: string;
  entityId?: string;
  meta?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// DTOs
export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  agreedToTerms: boolean;
  agreedToPrivacy: boolean;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: Omit<User, 'passwordHash'>;
}

export interface CreateCourseDto {
  title: string;
  description: string;
  workloadHours: number;
  coverImage?: string;
}

export interface UpdateCourseDto {
  title?: string;
  description?: string;
  workloadHours?: number;
  coverImage?: string;
  isPublished?: boolean;
}

export interface CreateModuleDto {
  courseId: string;
  title: string;
  order: number;
}

export interface CreateLessonDto {
  moduleId: string;
  title: string;
  order: number;
  minWatchPercent?: number;
}

export interface InitiateUploadDto {
  fileName: string;
  fileSize: number;
  contentType: string;
}

export interface InitiateUploadResponse {
  uploadId: string;
  videoId: string;
  key: string;
  partSize: number;
  partsCount: number;
  storageProvider: StorageProvider;
  uploadUrls: {
    partNumber: number;
    uploadUrl: string;
    blockId?: string;
  }[];
}

export interface CompleteUploadDto {
  uploadId: string;
  parts: {
    partNumber: number;
    etag?: string;
    blockId?: string;
  }[];
}

export interface StreamUrlResponse {
  masterPlaylistUrl: string;
  expiresAt: Date;
}

export interface ProgressHeartbeatDto {
  lessonId: string;
  positionSec: number;
  watchedDeltaSec: number;
}

export interface CreateQuizDto {
  moduleId: string;
  title: string;
  description?: string;
  minScore: number;
  attemptsAllowed: number;
}

export interface CreateQuestionDto {
  quizId: string;
  type: QuestionType;
  statement: string;
  options: Omit<QuestionOption, 'id'>[];
  answerKey: number[]; // indices of correct options
  order: number;
}

export interface SubmitQuizDto {
  answers: {
    questionId: string;
    selectedOptions: string[];
  }[];
}

export interface QuizResultDto {
  attemptId: string;
  score: number;
  passed: boolean;
  correctAnswers: number;
  totalQuestions: number;
  answers: {
    questionId: string;
    isCorrect: boolean;
    correctAnswer: string[];
  }[];
}

export interface CreateSubscriptionDto extends Record<string, unknown> {
  userId: string;
  planId: string;
  planName?: string;
  planPrice?: number;
  autoRenew?: boolean;
}

export interface UpdateSubscriptionDto extends Record<string, unknown> {
  status?: SubscriptionStatus;
  autoRenew?: boolean;
}

// Pagination
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  query?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}
