# Overview

KrisPoint is a multi-user, hospital-grade radiology reporting system designed for teaching hospitals. It aims to streamline radiology workflows through intelligent templates, advanced macro systems, and robust role-based access control. Key capabilities include comprehensive template and macro management, professional PDF export, and secure data management with search and analytics. The system prioritizes HIPAA compliance and features AES-256-GCM field-level encryption for Protected Health Information (PHI), tamper-proof audit logging, and a streamlined report workflow (DRAFT → SUBMITTED → SIGNED) tailored for teaching environments, including addendum management. It also incorporates a multi-user worklist and an extensive analytics dashboard to monitor productivity and performance.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend
The frontend is built with SvelteKit 2.x and Svelte 5.x, utilizing TypeScript for type safety and CSS custom properties for styling. Svelte stores manage application state, and SvelteKit's file-based routing is employed.

## Voice Recognition System
The system integrates `faster-whisper` for medical-grade speech recognition via a Python-based WebSocket server (`vosk-server/`). This server supports GPU acceleration (CUDA) and custom grammar, including medical terms and voice commands, for enhanced accuracy. It operates entirely offline and supports specific date normalization formats (DD/MM/YYYY) to ensure HIPAA compliance. An opt-in voice training data collection system allows users to contribute audio and transcripts to improve accuracy, particularly for Ghanaian accents, with admin tools for managing and exporting training data.

## Report Management
Report objects, including patient information, findings, and impressions, are stored in PostgreSQL with field-level encryption. `pdf-lib` handles client-side PDF generation, ensuring professional, searchable PDF output with embedded TrueType fonts and multi-level list formatting. A `CompletionService` evaluates report completeness, and `CustomOptionsService` allows users to create modality-linked custom body regions.

## Report Workflow
A flexible three-stage workflow (DRAFT → SUBMITTED → SIGNED) is implemented:
- **Residents/Report Creators:** Save drafts, submit for specialist review, or self-sign reports using the "Sign Off" button (`reports.sign_own` permission).
- **Specialists/Radiologists:** Return reports to residents for revision or sign and finalize.
- **Resident Self-Sign-Off:** Residents can sign their own reports (single signature PDF). After signing, they can optionally "Request Specialist Review" to obtain a specialist co-signature (dual signature PDF).
- **Co-Signature Flow:** When a specialist reviews a resident-signed report, both signatures appear on the PDF - resident on the left, specialist on the right.
- **All Users (on SIGNED reports):** Export PDF with appropriate signature layout. Print button available in PDF preview modal.
- **24-Hour Edit Window:** Report authors (creator, signer, reviewer) can edit signed reports within 24 hours of signing. The footer bar displays remaining time. After 24 hours, reports become read-only.
- **Exclusive Edit Locks:** Only one user can edit a report at a time. Locks expire after 75 seconds without a heartbeat (15-second intervals). A red warning banner shows when another user holds the lock, and the report becomes read-only until released. Re-signing within the 24-hour window preserves all original metadata (signedBy, reviewedBy, reportingDurationMs, reviewDurationMs).
- **Addendums:** Can be added to SIGNED reports by participants, following the same workflow, without altering prior report text.
- **Red Text Emphasis:** TipTap editor includes red text toggle (color #dc2626) for highlighting critical findings. Red text is preserved in PDF exports.
- **Table Support:** TipTap editor supports inserting and editing tables for structured data (measurements, comparisons). Tables are rendered in PDF exports with header styling and proper borders.

## Template & Macro System
The system features a dual-scope architecture for templates and macros (System and Personal):
- **Database-Only Architecture:** All templates and macros are stored in PostgreSQL and managed via the admin interface. There are no hardcoded fallbacks - the database is the single source of truth.
- **System Seeds:** On first startup, the system seeds comprehensive templates (13 covering CT, MRI, X-ray, Ultrasound, Trauma, and Fluoroscopy) and macros (23 across Chest, Neuro, Abdomen, MSK, and General categories).
- **Voice Commands:** Users invoke templates and macros by voice command (e.g., "load template ct head normal", "insert macro normal lungs"). The system fetches from the database based on user's scope preference (system or personal).
- **Scope Toggle:** Users can toggle between "System" and "Personal" voice command pools to prevent conflicts, with preferences stored per user.
- **Admin Control:** Permissions (`templates.manage_system`, `macros.manage_system`) control access to system-wide items. Admins have full control over all templates and macros.

## UI/UX Decisions
The application features a professional dark theme, smooth animations, a professional notification system, smart tooltips, and searchable dropdowns. It includes an in-app voice command reference and consistent branding. KrisPoint is a Progressive Web App (PWA), allowing installation as a standalone application with offline capabilities via a service worker.

## Server Authentication and Security
The system uses PostgreSQL-backed server authentication with JWT session tokens, bcrypt password hashing, and role-based access control (RBAC) with granular permissions. Security features include first-user bootstrap, HttpOnly secure cookies, comprehensive session management (including idle timeout and single active session per user), AES-256-GCM field-level encryption for PHI, tamper-proof audit logging with HMAC-SHA256 signatures, and robust password policies. The voice WebSocket is bound to localhost for security, and user deletion is exclusive to the System Owner.

## Production Deployment
Deployment uses `@sveltejs/adapter-node`. Startup validates required secrets like `DATABASE_URL` and `ENCRYPTION_KEY`, failing fast in production if critical environment variables are missing. A health check endpoint (`/api/health`) verifies database connectivity and encryption status. A first-time setup wizard assists IT admins in generating and configuring the `ENCRYPTION_KEY`.

## Subscription & Licensing System

KrisPoint includes a monetization system with a separate self-hosted license server (`license-server/`):

### License Server Features
- **Paystack Integration:** Accepts payments via Paystack (Ghana Cedis support)
- **Cryptographic Licenses:** License keys are cryptographically signed for offline validation
- **Admin Dashboard:** Web-based dashboard at `/admin` for managing licenses, customers, and payments
- **Email Delivery:** Automatic license key delivery via SMTP
- **Subscription Support:** Monthly and yearly recurring subscription plans

### Premium Features (Require License)
The following features require an active premium license:
- Voice Dictation
- AI Report Polish
- Inter-User Chat
- Templates Management
- Macros Management

### Auto-Renewal & Top-Up
- **Auto-Renewal:** Users can set up a Paystack subscription that automatically charges when their license expires. Auto-renewal is tied to a specific plan (monthly or yearly) and can be toggled on/off.
- **Plan Switching:** Users can change their auto-renewal plan (e.g., from monthly to yearly) from Settings. The old Paystack subscription is cancelled and a new one created.
- **Top-Up:** Users can manually purchase additional time with any plan at any point, extending their existing license. This is separate from auto-renewal.
- **Ownership Verification:** All subscription endpoints require email matching the license owner to prevent abuse.
- **Admin Sync:** Admin must sync plans to Paystack first (Admin Dashboard → Plans → "Sync with Paystack") before auto-renewal can work.
- **Device Policy:** License allows re-activation on a new device (replaces old device). Expiry is not reset on device switch.

### License Store Integration
- `src/lib/stores/licenseStore.js` - Manages license state, activation, validation, auto-renewal, and top-up
- `src/lib/components/ui/PremiumGate.svelte` - Component for gating premium features
- Settings → License tab for activation, status viewing, auto-renewal management, and top-up

### Deployment
The license server is a separate Node.js application meant to be deployed independently on your own server. See `license-server/README.md` for setup instructions.

# External Dependencies

## Core Framework
- `@sveltejs/kit`
- `svelte`
- `vite`
- `typescript`

## Document Processing
- `pdf-lib`

## Voice Recognition
- `faster-whisper` (Python backend)
- `websockets` (Python)
- `numpy` (Python)
- `python-dotenv` (Python)

## Browser APIs
- `Web Audio API`
- `WebSocket API`
- `LocalStorage`
- `Service Worker` (PWA offline support)