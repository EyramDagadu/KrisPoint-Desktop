// Database schema for KrisPoint Medical - Multi-User Hospital System
import { pgTable, text, serial, timestamp, boolean, integer, varchar, jsonb, real } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ==================== ROLES & PERMISSIONS ====================

// Roles table - Admin, Radiologist, Resident, FrontDesk
export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  displayName: varchar('display_name', { length: 100 }).notNull(),
  description: text('description'),
  level: integer('level').notNull().default(0), // Higher = more access
  isSystem: boolean('is_system').default(false), // System roles can't be deleted
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Permissions table - granular access control
export const permissions = pgTable('permissions', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  displayName: varchar('display_name', { length: 150 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 50 }).notNull(), // reports, users, settings, etc.
  createdAt: timestamp('created_at').defaultNow()
});

// Role-Permission junction table
export const rolePermissions = pgTable('role_permissions', {
  id: serial('id').primaryKey(),
  roleId: integer('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: integer('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow()
});

// ==================== USERS (formerly doctors) ====================

// Users table - supports multiple roles (Admin, Radiologist, Resident, FrontDesk)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  email: varchar('email', { length: 255 }),
  password: text('password').notNull(), // Hashed password (bcrypt)
  
  // Profile information
  fullName: text('full_name').notNull(),
  title: varchar('title', { length: 50 }), // Dr., Prof., Mr., Mrs., etc.
  licenseNumber: varchar('license_number', { length: 100 }),
  specialty: varchar('specialty', { length: 100 }),
  department: varchar('department', { length: 100 }),
  institution: varchar('institution', { length: 255 }), // Hospital/facility name
  designation: varchar('designation', { length: 100 }), // Consultant, Registrar, Senior Resident, etc.
  
  // Role assignment
  roleId: integer('role_id').notNull().references(() => roles.id),
  
  // Signature for reports
  signatureUrl: text('signature_url'),
  signatureName: varchar('signature_name', { length: 255 }),
  
  // Security
  securityQuestion: text('security_question'),
  securityAnswer: text('security_answer'), // Hashed
  failedLoginAttempts: integer('failed_login_attempts').default(0),
  lockedUntil: timestamp('locked_until'),
  lastLoginAt: timestamp('last_login_at'),
  lastPasswordChangeAt: timestamp('last_password_change_at'),
  mustChangePassword: boolean('must_change_password').default(false),
  
  // Status
  isActive: boolean('is_active').default(true),
  isVerified: boolean('is_verified').default(false),
  deletedAt: timestamp('deleted_at'), // Soft delete timestamp (System Owner only)
  
  // Metadata
  createdBy: integer('created_by'), // Admin who created this user
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// ==================== SESSIONS ====================

// Session table with enhanced security
export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sessionToken: text('session_token').notNull().unique(),
  refreshToken: text('refresh_token'),
  
  // Session metadata
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  deviceInfo: text('device_info'),
  
  // Expiration
  expiresAt: timestamp('expires_at').notNull(),
  refreshExpiresAt: timestamp('refresh_expires_at'),
  
  // Status
  isValid: boolean('is_valid').default(true),
  revokedAt: timestamp('revoked_at'),
  revokedReason: varchar('revoked_reason', { length: 255 }),
  
  createdAt: timestamp('created_at').defaultNow()
});

// ==================== AUDIT LOGGING ====================

// Comprehensive audit log for HIPAA compliance
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  
  // Who
  userId: integer('user_id').references(() => users.id),
  username: varchar('username', { length: 100 }), // Denormalized for persistence
  userRole: varchar('user_role', { length: 50 }),
  
  // What
  action: varchar('action', { length: 100 }).notNull(), // LOGIN, LOGOUT, VIEW_REPORT, CREATE_REPORT, etc.
  category: varchar('category', { length: 50 }).notNull(), // AUTH, REPORTS, USERS, SETTINGS, etc.
  severity: varchar('severity', { length: 20 }).default('INFO'), // INFO, WARNING, ERROR, CRITICAL
  
  // Details
  resourceType: varchar('resource_type', { length: 50 }), // REPORT, USER, PATIENT, etc.
  resourceId: varchar('resource_id', { length: 100 }),
  description: text('description'),
  oldValue: jsonb('old_value'), // Previous state for changes
  newValue: jsonb('new_value'), // New state for changes
  metadata: jsonb('metadata'), // Additional context
  
  // Where
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  
  // When
  createdAt: timestamp('created_at').defaultNow(),
  
  // Integrity (for tamper detection)
  checksum: varchar('checksum', { length: 64 }) // SHA-256 of log entry
});

// ==================== PATIENTS (with encrypted PHI) ====================

// Patients table - PHI fields will be encrypted at application level
export const patients = pgTable('patients', {
  id: serial('id').primaryKey(),
  
  // Identifiers (encrypted at application level)
  mrn: text('mrn').notNull(), // Medical Record Number - ENCRYPTED
  hashedMrn: varchar('hashed_mrn', { length: 64 }), // SHA-256 hash for lookups
  
  // Demographics (encrypted at application level)
  firstName: text('first_name').notNull(), // ENCRYPTED
  lastName: text('last_name').notNull(), // ENCRYPTED
  middleName: text('middle_name'), // ENCRYPTED
  dateOfBirth: text('date_of_birth'), // ENCRYPTED - stored as encrypted string
  gender: varchar('gender', { length: 20 }),
  
  // Contact (encrypted at application level)
  phone: text('phone'), // ENCRYPTED
  email: text('email'), // ENCRYPTED
  address: text('address'), // ENCRYPTED
  
  // Non-sensitive metadata
  isActive: boolean('is_active').default(true),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// ==================== REPORTS ====================

// Radiology reports
export const reports = pgTable('reports', {
  id: serial('id').primaryKey(),
  
  // Patient reference
  patientId: integer('patient_id').references(() => patients.id),
  
  // Report metadata
  accessionNumber: varchar('accession_number', { length: 100 }),
  modality: varchar('modality', { length: 50 }).notNull(), // CT, MRI, X-Ray, etc.
  bodyRegion: varchar('body_region', { length: 100 }),
  studyDate: timestamp('study_date'),
  
  // Patient age (for when DOB is not available)
  patientAge: integer('patient_age'), // Manually entered age
  patientAgeUnit: varchar('patient_age_unit', { length: 20 }).default('years'), // days, months, years
  
  // Clinical context
  indication: text('indication'),
  referringPhysician: varchar('referring_physician', { length: 255 }),
  technique: text('technique'),
  comparison: text('comparison'),
  
  // Report content
  content: text('content'), // Raw HTML content from editor (preserves exact formatting)
  findings: text('findings'),
  impressions: text('impressions'),
  recommendations: text('recommendations'),
  
  // Workflow
  status: varchar('status', { length: 50 }).default('DRAFT'), // DRAFT, SUBMITTED, SIGNED, AMENDED
  priority: varchar('priority', { length: 20 }).default('ROUTINE'), // STAT, URGENT, ROUTINE
  
  // Worklist source - null means ad-hoc report
  isFromWorklist: boolean('is_from_worklist').default(false),
  
  // Authorship
  createdBy: integer('created_by').notNull().references(() => users.id),
  
  // Reporting workflow - tracking who opened and when
  openedBy: integer('opened_by').references(() => users.id),
  openedAt: timestamp('opened_at'),
  
  // Submit to specialist workflow
  assignedSpecialistId: integer('assigned_specialist_id').references(() => users.id),
  submittedBy: integer('submitted_by').references(() => users.id),
  submittedAt: timestamp('submitted_at'),
  
  // Review and sign-off
  reviewedBy: integer('reviewed_by').references(() => users.id),
  signedBy: integer('signed_by').references(() => users.id),
  signedAt: timestamp('signed_at'),
  statusBeforeSign: varchar('status_before_sign', { length: 50 }), // Stores status before signing for accurate undo
  
  // Calculated timing (in milliseconds) for quick queries
  reportingDurationMs: integer('reporting_duration_ms'), // From open to submit/sign
  reviewDurationMs: integer('review_duration_ms'), // From submit to sign (if reviewed)
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Report amendments/addenda with workflow
export const reportAmendments = pgTable('report_amendments', {
  id: serial('id').primaryKey(),
  reportId: integer('report_id').notNull().references(() => reports.id, { onDelete: 'cascade' }),
  
  amendmentType: varchar('amendment_type', { length: 50 }).notNull(), // ADDENDUM, CORRECTION, CLARIFICATION
  reason: text('reason').notNull(),
  content: text('content').notNull(),
  
  // Workflow status - same as reports
  status: varchar('status', { length: 50 }).default('DRAFT'), // DRAFT, SUBMITTED, SIGNED
  
  // Creator
  createdBy: integer('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  
  // Submission workflow
  assignedSpecialistId: integer('assigned_specialist_id').references(() => users.id),
  submittedAt: timestamp('submitted_at'),
  
  // Sign-off
  signedBy: integer('signed_by').references(() => users.id),
  signedAt: timestamp('signed_at')
});

// ==================== REPORT WORKFLOWS (for analytics) ====================

// Track report lifecycle events for timing metrics
export const reportWorkflows = pgTable('report_workflows', {
  id: serial('id').primaryKey(),
  reportId: integer('report_id').notNull().references(() => reports.id, { onDelete: 'cascade' }),
  
  // Event tracking
  event: varchar('event', { length: 50 }).notNull(), // OPENED, SUBMITTED, SIGNED, REOPENED
  
  // Who performed the action
  userId: integer('user_id').notNull().references(() => users.id),
  userRole: varchar('user_role', { length: 50 }), // Denormalized for analytics
  
  // Timing
  occurredAt: timestamp('occurred_at').defaultNow().notNull(),
  
  // For SUBMITTED events - who it was submitted to
  assignedToId: integer('assigned_to_id').references(() => users.id),
  
  // Additional metadata
  metadata: jsonb('metadata')
});

// Daily aggregated metrics for efficient analytics queries
export const reportMetricsDaily = pgTable('report_metrics_daily', {
  id: serial('id').primaryKey(),
  
  // Dimensions
  date: timestamp('date').notNull(),
  userId: integer('user_id').references(() => users.id),
  userRole: varchar('user_role', { length: 50 }),
  modality: varchar('modality', { length: 50 }),
  department: varchar('department', { length: 100 }),
  
  // Metrics
  reportCount: integer('report_count').default(0),
  totalReportingTimeMs: integer('total_reporting_time_ms').default(0), // Time from open to submit/sign
  avgReportingTimeMs: integer('avg_reporting_time_ms').default(0),
  minReportingTimeMs: integer('min_reporting_time_ms'),
  maxReportingTimeMs: integer('max_reporting_time_ms'),
  
  // Review metrics (for specialists)
  reviewCount: integer('review_count').default(0),
  totalReviewTimeMs: integer('total_review_time_ms').default(0),
  avgReviewTimeMs: integer('avg_review_time_ms').default(0),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// ==================== WORKLIST ====================

// Worklist items created by front desk for radiologists/residents to pick up
export const worklist = pgTable('worklist', {
  id: serial('id').primaryKey(),
  
  // Patient reference
  patientId: integer('patient_id').notNull().references(() => patients.id),
  
  // Study information
  modality: varchar('modality', { length: 50 }).notNull(), // CT, MRI, X-Ray, etc.
  bodyRegion: varchar('body_region', { length: 100 }),
  studyDescription: text('study_description'),
  accessionNumber: varchar('accession_number', { length: 100 }),
  studyDate: timestamp('study_date'),
  
  // Priority
  priority: varchar('priority', { length: 20 }).default('ROUTINE'), // STAT, URGENT, ROUTINE
  
  // Clinical context
  indication: text('indication'),
  referringPhysician: varchar('referring_physician', { length: 255 }),
  
  // Status
  status: varchar('status', { length: 50 }).default('PENDING'), // PENDING, IN_PROGRESS, COMPLETED, CANCELLED
  
  // Linked report (once picked up)
  reportId: integer('report_id').references(() => reports.id),
  
  // Who picked it up
  pickedUpBy: integer('picked_up_by').references(() => users.id),
  pickedUpAt: timestamp('picked_up_at'),
  
  // Created by front desk
  createdBy: integer('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// ==================== TEMPLATES & MACROS ====================

// Templates - System (admin-managed) and Personal (user-owned)
export const templates = pgTable('templates', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }),
  modality: varchar('modality', { length: 50 }),
  bodyRegion: varchar('body_region', { length: 100 }),
  
  // Separate section fields for voice navigation support
  comparisonHtml: text('comparison_html'),  // COMPARISON section
  techniqueHtml: text('technique_html'),     // TECHNIQUE section
  findingsHtml: text('findings_html'),       // FINDINGS section
  impressionHtml: text('impression_html'),   // IMPRESSION section
  
  // Legacy content field - computed from sections or used for backward compatibility
  content: text('content').notNull(),
  variables: jsonb('variables'), // Variable placeholders
  voiceCommand: varchar('voice_command', { length: 255 }), // Voice activation phrase
  
  // Scope: System templates are admin-managed and visible to all
  isSystem: boolean('is_system').default(false), // true = system/admin template, false = personal
  isGlobal: boolean('is_global').default(false), // Legacy - use isSystem instead
  departmentId: varchar('department_id', { length: 100 }), // Restrict to department
  
  // For personal templates, createdBy is the owner
  // For system templates, createdBy is the admin who created it
  createdBy: integer('created_by').notNull().references(() => users.id),
  
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Macros - System (admin-managed) and Personal (user-owned)
export const macros = pgTable('macros', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  voiceCommand: varchar('voice_command', { length: 255 }),
  category: varchar('category', { length: 100 }),
  
  content: text('content').notNull(),
  variables: jsonb('variables'),
  
  // Scope: System macros are admin-managed and visible to all
  isSystem: boolean('is_system').default(false), // true = system/admin macro, false = personal
  isGlobal: boolean('is_global').default(false), // Legacy - use isSystem instead
  
  // For personal macros, createdBy is the owner
  // For system macros, createdBy is the admin who created it
  createdBy: integer('created_by').notNull().references(() => users.id),
  
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// ==================== USER SETTINGS ====================

// User preferences including voice command pool selection
export const userSettings = pgTable('user_settings', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  
  // Voice command preference: 'system' or 'personal'
  voiceCommandPool: varchar('voice_command_pool', { length: 20 }).default('system'),
  
  // Additional user preferences can be added here
  preferences: jsonb('preferences'), // Generic JSON for future preferences
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// ==================== RELATIONS ====================

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
  rolePermissions: many(rolePermissions)
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions)
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, { fields: [rolePermissions.roleId], references: [roles.id] }),
  permission: one(permissions, { fields: [rolePermissions.permissionId], references: [permissions.id] })
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  role: one(roles, { fields: [users.roleId], references: [roles.id] }),
  sessions: many(sessions),
  createdReports: many(reports),
  auditLogs: many(auditLogs)
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] })
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, { fields: [auditLogs.userId], references: [users.id] })
}));

export const patientsRelations = relations(patients, ({ one, many }) => ({
  createdByUser: one(users, { fields: [patients.createdBy], references: [users.id] }),
  reports: many(reports)
}));

export const reportsRelations = relations(reports, ({ one, many }) => ({
  patient: one(patients, { fields: [reports.patientId], references: [patients.id] }),
  creator: one(users, { fields: [reports.createdBy], references: [users.id] }),
  opener: one(users, { fields: [reports.openedBy], references: [users.id] }),
  submitter: one(users, { fields: [reports.submittedBy], references: [users.id] }),
  assignedSpecialist: one(users, { fields: [reports.assignedSpecialistId], references: [users.id] }),
  reviewer: one(users, { fields: [reports.reviewedBy], references: [users.id] }),
  signer: one(users, { fields: [reports.signedBy], references: [users.id] }),
  amendments: many(reportAmendments),
  workflows: many(reportWorkflows)
}));

export const reportWorkflowsRelations = relations(reportWorkflows, ({ one }) => ({
  report: one(reports, { fields: [reportWorkflows.reportId], references: [reports.id] }),
  user: one(users, { fields: [reportWorkflows.userId], references: [users.id] }),
  assignedTo: one(users, { fields: [reportWorkflows.assignedToId], references: [users.id] })
}));

export const reportMetricsDailyRelations = relations(reportMetricsDaily, ({ one }) => ({
  user: one(users, { fields: [reportMetricsDaily.userId], references: [users.id] })
}));

export const worklistRelations = relations(worklist, ({ one }) => ({
  patient: one(patients, { fields: [worklist.patientId], references: [patients.id] }),
  report: one(reports, { fields: [worklist.reportId], references: [reports.id] }),
  pickedUpByUser: one(users, { fields: [worklist.pickedUpBy], references: [users.id] }),
  creator: one(users, { fields: [worklist.createdBy], references: [users.id] })
}));

export const reportAmendmentsRelations = relations(reportAmendments, ({ one }) => ({
  report: one(reports, { fields: [reportAmendments.reportId], references: [reports.id] }),
  creator: one(users, { fields: [reportAmendments.createdBy], references: [users.id] })
}));

export const templatesRelations = relations(templates, ({ one }) => ({
  creator: one(users, { fields: [templates.createdBy], references: [users.id] })
}));

export const macrosRelations = relations(macros, ({ one }) => ({
  creator: one(users, { fields: [macros.createdBy], references: [users.id] })
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, { fields: [userSettings.userId], references: [users.id] })
}));

// ==================== CHAT SYSTEM ====================

// User online presence tracking
export const userPresence = pgTable('user_presence', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  isOnline: boolean('is_online').default(false),
  lastSeenAt: timestamp('last_seen_at').defaultNow(),
  status: varchar('status', { length: 50 }).default('available'), // available, busy, away
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Direct messages between users
export const chatMessages = pgTable('chat_messages', {
  id: serial('id').primaryKey(),
  senderId: integer('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  receiverId: integer('receiver_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  isRead: boolean('is_read').default(false),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').defaultNow()
});

// Chat message relations
export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  sender: one(users, { fields: [chatMessages.senderId], references: [users.id], relationName: 'sentMessages' }),
  receiver: one(users, { fields: [chatMessages.receiverId], references: [users.id], relationName: 'receivedMessages' })
}));

export const userPresenceRelations = relations(userPresence, ({ one }) => ({
  user: one(users, { fields: [userPresence.userId], references: [users.id] })
}));

// ==================== VOICE TRAINING DATA ====================

// Training samples for voice recognition model improvement
export const voiceTrainingSamples = pgTable('voice_training_samples', {
  id: serial('id').primaryKey(),
  
  // Speaker identification
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Audio data
  audioPath: text('audio_path').notNull(), // Path to stored audio file
  audioDuration: integer('audio_duration'), // Duration in milliseconds
  audioFormat: varchar('audio_format', { length: 20 }).default('wav'), // wav, webm, etc.
  
  // Transcripts - simplified flow
  rawTranscript: text('raw_transcript').notNull(), // Exact Whisper output
  verifiedTranscript: text('verified_transcript'), // Admin-typed ground truth for training
  
  // Legacy fields (kept for compatibility)
  formattedTranscript: text('formatted_transcript'),
  correctedTranscript: text('corrected_transcript'),
  adminEditedTranscript: text('admin_edited_transcript'),
  finalTranscript: text('final_transcript'),
  
  // Report context
  reportId: integer('report_id').references(() => reports.id, { onDelete: 'set null' }),
  reportType: varchar('report_type', { length: 100 }), // e.g., "CT Chest", "X-ray Abdomen"
  
  // Metadata
  sessionId: varchar('session_id', { length: 100 }), // Links related audio chunks
  wordCount: integer('word_count'),
  
  // Quality indicators (auto-calculated)
  avgVolume: real('avg_volume'), // RMS volume level
  silencePercent: real('silence_percent'), // Percentage of audio that's silence
  
  // Review status
  isReviewed: boolean('is_reviewed').default(false),
  reviewedBy: integer('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at'),
  
  // Quality flags
  isUsable: boolean('is_usable').default(true), // Admin can mark as unusable
  qualityNotes: text('quality_notes'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Voice training samples relations
export const voiceTrainingSamplesRelations = relations(voiceTrainingSamples, ({ one }) => ({
  user: one(users, { fields: [voiceTrainingSamples.userId], references: [users.id] }),
  reviewer: one(users, { fields: [voiceTrainingSamples.reviewedBy], references: [users.id] })
}));

// ==================== ORGANIZATION SETTINGS ====================

// Organization-wide settings (shared across all users)
export const organizationSettings = pgTable('organization_settings', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 100 }).notNull().unique(),
  value: text('value'), // JSON stringified value
  description: text('description'),
  updatedBy: integer('updated_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const organizationSettingsRelations = relations(organizationSettings, ({ one }) => ({
  updatedByUser: one(users, { fields: [organizationSettings.updatedBy], references: [users.id] })
}));

// ==================== REPORT EDITING PRESENCE ====================

// Tracks who is currently editing a report (for concurrency control)
export const reportEditors = pgTable('report_editors', {
  id: serial('id').primaryKey(),
  reportId: integer('report_id').notNull().references(() => reports.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  lastHeartbeat: timestamp('last_heartbeat').notNull().defaultNow(),
  createdAt: timestamp('created_at').defaultNow()
});

export const reportEditorsRelations = relations(reportEditors, ({ one }) => ({
  report: one(reports, { fields: [reportEditors.reportId], references: [reports.id] }),
  user: one(users, { fields: [reportEditors.userId], references: [users.id] })
}));

// ==================== REPORT EDIT LOCKS ====================

// Exclusive edit locks for reports (only one user can edit at a time)
export const reportEditLocks = pgTable('report_edit_locks', {
  id: serial('id').primaryKey(),
  reportId: integer('report_id').notNull().references(() => reports.id, { onDelete: 'cascade' }).unique(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  acquiredAt: timestamp('acquired_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

export const reportEditLocksRelations = relations(reportEditLocks, ({ one }) => ({
  report: one(reports, { fields: [reportEditLocks.reportId], references: [reports.id] }),
  user: one(users, { fields: [reportEditLocks.userId], references: [users.id] })
}));

// ==================== TYPES ====================

export type OrganizationSetting = typeof organizationSettings.$inferSelect;
export type InsertOrganizationSetting = typeof organizationSettings.$inferInsert;
export type Role = typeof roles.$inferSelect;
export type InsertRole = typeof roles.$inferInsert;
export type Permission = typeof permissions.$inferSelect;
export type InsertPermission = typeof permissions.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;
export type Patient = typeof patients.$inferSelect;
export type InsertPatient = typeof patients.$inferInsert;
export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;
export type Template = typeof templates.$inferSelect;
export type InsertTemplate = typeof templates.$inferInsert;
export type Macro = typeof macros.$inferSelect;
export type InsertMacro = typeof macros.$inferInsert;
export type ReportWorkflow = typeof reportWorkflows.$inferSelect;
export type InsertReportWorkflow = typeof reportWorkflows.$inferInsert;
export type ReportMetricsDaily = typeof reportMetricsDaily.$inferSelect;
export type InsertReportMetricsDaily = typeof reportMetricsDaily.$inferInsert;
export type Worklist = typeof worklist.$inferSelect;
export type InsertWorklist = typeof worklist.$inferInsert;

export type UserPresence = typeof userPresence.$inferSelect;
export type InsertUserPresence = typeof userPresence.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;
export type UserSetting = typeof userSettings.$inferSelect;
export type InsertUserSetting = typeof userSettings.$inferInsert;

export type VoiceTrainingSample = typeof voiceTrainingSamples.$inferSelect;
export type InsertVoiceTrainingSample = typeof voiceTrainingSamples.$inferInsert;

export type ReportEditor = typeof reportEditors.$inferSelect;
export type InsertReportEditor = typeof reportEditors.$inferInsert;

export type ReportEditLock = typeof reportEditLocks.$inferSelect;
export type InsertReportEditLock = typeof reportEditLocks.$inferInsert;

// Legacy alias for compatibility
export const doctors = users;
export type Doctor = User;
export type InsertDoctor = InsertUser;
