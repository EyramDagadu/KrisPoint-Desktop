
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	export interface AppTypes {
		RouteId(): "/" | "/admin" | "/admin/analytics" | "/admin/audit-logs" | "/admin/sessions" | "/admin/training-data" | "/admin/users" | "/analytics" | "/api" | "/api/admin" | "/api/admin/analytics" | "/api/admin/audit-logs" | "/api/admin/seed" | "/api/admin/sessions" | "/api/admin/users" | "/api/admin/users/[id]" | "/api/admin/users/[id]/reset-password" | "/api/admin/users/[id]/toggle-status" | "/api/ai" | "/api/ai/polish" | "/api/ai/status" | "/api/analytics" | "/api/analytics/admin" | "/api/analytics/user" | "/api/analytics/user/details" | "/api/auth" | "/api/auth/change-password" | "/api/auth/check-users" | "/api/auth/login" | "/api/auth/logout" | "/api/auth/register" | "/api/auth/reset-password" | "/api/auth/roles" | "/api/auth/security-question" | "/api/auth/session-events" | "/api/auth/session" | "/api/auth/update-security-question" | "/api/auth/verify-security-answer" | "/api/chat" | "/api/chat/messages" | "/api/chat/messages/[userId]" | "/api/chat/presence" | "/api/chat/unread" | "/api/chat/users" | "/api/health" | "/api/health/solo" | "/api/macros" | "/api/macros/[id]" | "/api/organization" | "/api/organization/letterhead" | "/api/organization/settings" | "/api/reports" | "/api/reports/counts" | "/api/reports/events" | "/api/reports/pending-reviews" | "/api/reports/returned" | "/api/reports/[id]" | "/api/reports/[id]/addendums" | "/api/reports/[id]/addendums/[addendumId]" | "/api/reports/[id]/addendums/[addendumId]/claim" | "/api/reports/[id]/addendums/[addendumId]/return" | "/api/reports/[id]/addendums/[addendumId]/sign" | "/api/reports/[id]/addendums/[addendumId]/submit" | "/api/reports/[id]/cancel" | "/api/reports/[id]/claim" | "/api/reports/[id]/presence" | "/api/reports/[id]/request-review" | "/api/reports/[id]/return" | "/api/reports/[id]/sign-off" | "/api/reports/[id]/sign" | "/api/reports/[id]/submit" | "/api/reports/[id]/undo-sign" | "/api/setup" | "/api/setup/complete" | "/api/setup/generate-key" | "/api/setup/status" | "/api/specialists" | "/api/templates" | "/api/templates/[id]" | "/api/user-settings" | "/api/users" | "/api/users/signature" | "/api/users/specialists" | "/api/users/[id]" | "/api/voice-training" | "/api/voice-training/audio" | "/api/voice-training/audio/[id]" | "/api/voice-training/export" | "/api/voice-training/samples" | "/api/voice-training/samples/[id]" | "/api/voice-training/samples/[id]/correction" | "/api/voice" | "/api/voice/ticket" | "/api/worklist" | "/api/worklist/create-with-report" | "/api/worklist/[id]" | "/api/worklist/[id]/pickup" | "/auth" | "/macros" | "/reporting" | "/reports" | "/reports/pending-reviews" | "/reports/returned" | "/settings" | "/setup" | "/templates" | "/voice-test" | "/worklist";
		RouteParams(): {
			"/api/admin/users/[id]": { id: string };
			"/api/admin/users/[id]/reset-password": { id: string };
			"/api/admin/users/[id]/toggle-status": { id: string };
			"/api/chat/messages/[userId]": { userId: string };
			"/api/macros/[id]": { id: string };
			"/api/reports/[id]": { id: string };
			"/api/reports/[id]/addendums": { id: string };
			"/api/reports/[id]/addendums/[addendumId]": { id: string; addendumId: string };
			"/api/reports/[id]/addendums/[addendumId]/claim": { id: string; addendumId: string };
			"/api/reports/[id]/addendums/[addendumId]/return": { id: string; addendumId: string };
			"/api/reports/[id]/addendums/[addendumId]/sign": { id: string; addendumId: string };
			"/api/reports/[id]/addendums/[addendumId]/submit": { id: string; addendumId: string };
			"/api/reports/[id]/cancel": { id: string };
			"/api/reports/[id]/claim": { id: string };
			"/api/reports/[id]/presence": { id: string };
			"/api/reports/[id]/request-review": { id: string };
			"/api/reports/[id]/return": { id: string };
			"/api/reports/[id]/sign-off": { id: string };
			"/api/reports/[id]/sign": { id: string };
			"/api/reports/[id]/submit": { id: string };
			"/api/reports/[id]/undo-sign": { id: string };
			"/api/templates/[id]": { id: string };
			"/api/users/[id]": { id: string };
			"/api/voice-training/audio/[id]": { id: string };
			"/api/voice-training/samples/[id]": { id: string };
			"/api/voice-training/samples/[id]/correction": { id: string };
			"/api/worklist/[id]": { id: string };
			"/api/worklist/[id]/pickup": { id: string }
		};
		LayoutParams(): {
			"/": { id?: string; userId?: string; addendumId?: string };
			"/admin": Record<string, never>;
			"/admin/analytics": Record<string, never>;
			"/admin/audit-logs": Record<string, never>;
			"/admin/sessions": Record<string, never>;
			"/admin/training-data": Record<string, never>;
			"/admin/users": Record<string, never>;
			"/analytics": Record<string, never>;
			"/api": { id?: string; userId?: string; addendumId?: string };
			"/api/admin": { id?: string };
			"/api/admin/analytics": Record<string, never>;
			"/api/admin/audit-logs": Record<string, never>;
			"/api/admin/seed": Record<string, never>;
			"/api/admin/sessions": Record<string, never>;
			"/api/admin/users": { id?: string };
			"/api/admin/users/[id]": { id: string };
			"/api/admin/users/[id]/reset-password": { id: string };
			"/api/admin/users/[id]/toggle-status": { id: string };
			"/api/ai": Record<string, never>;
			"/api/ai/polish": Record<string, never>;
			"/api/ai/status": Record<string, never>;
			"/api/analytics": Record<string, never>;
			"/api/analytics/admin": Record<string, never>;
			"/api/analytics/user": Record<string, never>;
			"/api/analytics/user/details": Record<string, never>;
			"/api/auth": Record<string, never>;
			"/api/auth/change-password": Record<string, never>;
			"/api/auth/check-users": Record<string, never>;
			"/api/auth/login": Record<string, never>;
			"/api/auth/logout": Record<string, never>;
			"/api/auth/register": Record<string, never>;
			"/api/auth/reset-password": Record<string, never>;
			"/api/auth/roles": Record<string, never>;
			"/api/auth/security-question": Record<string, never>;
			"/api/auth/session-events": Record<string, never>;
			"/api/auth/session": Record<string, never>;
			"/api/auth/update-security-question": Record<string, never>;
			"/api/auth/verify-security-answer": Record<string, never>;
			"/api/chat": { userId?: string };
			"/api/chat/messages": { userId?: string };
			"/api/chat/messages/[userId]": { userId: string };
			"/api/chat/presence": Record<string, never>;
			"/api/chat/unread": Record<string, never>;
			"/api/chat/users": Record<string, never>;
			"/api/health": Record<string, never>;
			"/api/health/solo": Record<string, never>;
			"/api/macros": { id?: string };
			"/api/macros/[id]": { id: string };
			"/api/organization": Record<string, never>;
			"/api/organization/letterhead": Record<string, never>;
			"/api/organization/settings": Record<string, never>;
			"/api/reports": { id?: string; addendumId?: string };
			"/api/reports/counts": Record<string, never>;
			"/api/reports/events": Record<string, never>;
			"/api/reports/pending-reviews": Record<string, never>;
			"/api/reports/returned": Record<string, never>;
			"/api/reports/[id]": { id: string; addendumId?: string };
			"/api/reports/[id]/addendums": { id: string; addendumId?: string };
			"/api/reports/[id]/addendums/[addendumId]": { id: string; addendumId: string };
			"/api/reports/[id]/addendums/[addendumId]/claim": { id: string; addendumId: string };
			"/api/reports/[id]/addendums/[addendumId]/return": { id: string; addendumId: string };
			"/api/reports/[id]/addendums/[addendumId]/sign": { id: string; addendumId: string };
			"/api/reports/[id]/addendums/[addendumId]/submit": { id: string; addendumId: string };
			"/api/reports/[id]/cancel": { id: string };
			"/api/reports/[id]/claim": { id: string };
			"/api/reports/[id]/presence": { id: string };
			"/api/reports/[id]/request-review": { id: string };
			"/api/reports/[id]/return": { id: string };
			"/api/reports/[id]/sign-off": { id: string };
			"/api/reports/[id]/sign": { id: string };
			"/api/reports/[id]/submit": { id: string };
			"/api/reports/[id]/undo-sign": { id: string };
			"/api/setup": Record<string, never>;
			"/api/setup/complete": Record<string, never>;
			"/api/setup/generate-key": Record<string, never>;
			"/api/setup/status": Record<string, never>;
			"/api/specialists": Record<string, never>;
			"/api/templates": { id?: string };
			"/api/templates/[id]": { id: string };
			"/api/user-settings": Record<string, never>;
			"/api/users": { id?: string };
			"/api/users/signature": Record<string, never>;
			"/api/users/specialists": Record<string, never>;
			"/api/users/[id]": { id: string };
			"/api/voice-training": { id?: string };
			"/api/voice-training/audio": { id?: string };
			"/api/voice-training/audio/[id]": { id: string };
			"/api/voice-training/export": Record<string, never>;
			"/api/voice-training/samples": { id?: string };
			"/api/voice-training/samples/[id]": { id: string };
			"/api/voice-training/samples/[id]/correction": { id: string };
			"/api/voice": { id?: string };
			"/api/voice/ticket": Record<string, never>;
			"/api/worklist": { id?: string };
			"/api/worklist/create-with-report": Record<string, never>;
			"/api/worklist/[id]": { id: string };
			"/api/worklist/[id]/pickup": { id: string };
			"/auth": Record<string, never>;
			"/macros": Record<string, never>;
			"/reporting": Record<string, never>;
			"/reports": Record<string, never>;
			"/reports/pending-reviews": Record<string, never>;
			"/reports/returned": Record<string, never>;
			"/settings": Record<string, never>;
			"/setup": Record<string, never>;
			"/templates": Record<string, never>;
			"/voice-test": Record<string, never>;
			"/worklist": Record<string, never>
		};
		Pathname(): "/" | "/admin" | "/admin/" | "/admin/analytics" | "/admin/analytics/" | "/admin/audit-logs" | "/admin/audit-logs/" | "/admin/sessions" | "/admin/sessions/" | "/admin/training-data" | "/admin/training-data/" | "/admin/users" | "/admin/users/" | "/analytics" | "/analytics/" | "/api" | "/api/" | "/api/admin" | "/api/admin/" | "/api/admin/analytics" | "/api/admin/analytics/" | "/api/admin/audit-logs" | "/api/admin/audit-logs/" | "/api/admin/seed" | "/api/admin/seed/" | "/api/admin/sessions" | "/api/admin/sessions/" | "/api/admin/users" | "/api/admin/users/" | `/api/admin/users/${string}` & {} | `/api/admin/users/${string}/` & {} | `/api/admin/users/${string}/reset-password` & {} | `/api/admin/users/${string}/reset-password/` & {} | `/api/admin/users/${string}/toggle-status` & {} | `/api/admin/users/${string}/toggle-status/` & {} | "/api/ai" | "/api/ai/" | "/api/ai/polish" | "/api/ai/polish/" | "/api/ai/status" | "/api/ai/status/" | "/api/analytics" | "/api/analytics/" | "/api/analytics/admin" | "/api/analytics/admin/" | "/api/analytics/user" | "/api/analytics/user/" | "/api/analytics/user/details" | "/api/analytics/user/details/" | "/api/auth" | "/api/auth/" | "/api/auth/change-password" | "/api/auth/change-password/" | "/api/auth/check-users" | "/api/auth/check-users/" | "/api/auth/login" | "/api/auth/login/" | "/api/auth/logout" | "/api/auth/logout/" | "/api/auth/register" | "/api/auth/register/" | "/api/auth/reset-password" | "/api/auth/reset-password/" | "/api/auth/roles" | "/api/auth/roles/" | "/api/auth/security-question" | "/api/auth/security-question/" | "/api/auth/session-events" | "/api/auth/session-events/" | "/api/auth/session" | "/api/auth/session/" | "/api/auth/update-security-question" | "/api/auth/update-security-question/" | "/api/auth/verify-security-answer" | "/api/auth/verify-security-answer/" | "/api/chat" | "/api/chat/" | "/api/chat/messages" | "/api/chat/messages/" | `/api/chat/messages/${string}` & {} | `/api/chat/messages/${string}/` & {} | "/api/chat/presence" | "/api/chat/presence/" | "/api/chat/unread" | "/api/chat/unread/" | "/api/chat/users" | "/api/chat/users/" | "/api/health" | "/api/health/" | "/api/health/solo" | "/api/health/solo/" | "/api/macros" | "/api/macros/" | `/api/macros/${string}` & {} | `/api/macros/${string}/` & {} | "/api/organization" | "/api/organization/" | "/api/organization/letterhead" | "/api/organization/letterhead/" | "/api/organization/settings" | "/api/organization/settings/" | "/api/reports" | "/api/reports/" | "/api/reports/counts" | "/api/reports/counts/" | "/api/reports/events" | "/api/reports/events/" | "/api/reports/pending-reviews" | "/api/reports/pending-reviews/" | "/api/reports/returned" | "/api/reports/returned/" | `/api/reports/${string}` & {} | `/api/reports/${string}/` & {} | `/api/reports/${string}/addendums` & {} | `/api/reports/${string}/addendums/` & {} | `/api/reports/${string}/addendums/${string}` & {} | `/api/reports/${string}/addendums/${string}/` & {} | `/api/reports/${string}/addendums/${string}/claim` & {} | `/api/reports/${string}/addendums/${string}/claim/` & {} | `/api/reports/${string}/addendums/${string}/return` & {} | `/api/reports/${string}/addendums/${string}/return/` & {} | `/api/reports/${string}/addendums/${string}/sign` & {} | `/api/reports/${string}/addendums/${string}/sign/` & {} | `/api/reports/${string}/addendums/${string}/submit` & {} | `/api/reports/${string}/addendums/${string}/submit/` & {} | `/api/reports/${string}/cancel` & {} | `/api/reports/${string}/cancel/` & {} | `/api/reports/${string}/claim` & {} | `/api/reports/${string}/claim/` & {} | `/api/reports/${string}/presence` & {} | `/api/reports/${string}/presence/` & {} | `/api/reports/${string}/request-review` & {} | `/api/reports/${string}/request-review/` & {} | `/api/reports/${string}/return` & {} | `/api/reports/${string}/return/` & {} | `/api/reports/${string}/sign-off` & {} | `/api/reports/${string}/sign-off/` & {} | `/api/reports/${string}/sign` & {} | `/api/reports/${string}/sign/` & {} | `/api/reports/${string}/submit` & {} | `/api/reports/${string}/submit/` & {} | `/api/reports/${string}/undo-sign` & {} | `/api/reports/${string}/undo-sign/` & {} | "/api/setup" | "/api/setup/" | "/api/setup/complete" | "/api/setup/complete/" | "/api/setup/generate-key" | "/api/setup/generate-key/" | "/api/setup/status" | "/api/setup/status/" | "/api/specialists" | "/api/specialists/" | "/api/templates" | "/api/templates/" | `/api/templates/${string}` & {} | `/api/templates/${string}/` & {} | "/api/user-settings" | "/api/user-settings/" | "/api/users" | "/api/users/" | "/api/users/signature" | "/api/users/signature/" | "/api/users/specialists" | "/api/users/specialists/" | `/api/users/${string}` & {} | `/api/users/${string}/` & {} | "/api/voice-training" | "/api/voice-training/" | "/api/voice-training/audio" | "/api/voice-training/audio/" | `/api/voice-training/audio/${string}` & {} | `/api/voice-training/audio/${string}/` & {} | "/api/voice-training/export" | "/api/voice-training/export/" | "/api/voice-training/samples" | "/api/voice-training/samples/" | `/api/voice-training/samples/${string}` & {} | `/api/voice-training/samples/${string}/` & {} | `/api/voice-training/samples/${string}/correction` & {} | `/api/voice-training/samples/${string}/correction/` & {} | "/api/voice" | "/api/voice/" | "/api/voice/ticket" | "/api/voice/ticket/" | "/api/worklist" | "/api/worklist/" | "/api/worklist/create-with-report" | "/api/worklist/create-with-report/" | `/api/worklist/${string}` & {} | `/api/worklist/${string}/` & {} | `/api/worklist/${string}/pickup` & {} | `/api/worklist/${string}/pickup/` & {} | "/auth" | "/auth/" | "/macros" | "/macros/" | "/reporting" | "/reporting/" | "/reports" | "/reports/" | "/reports/pending-reviews" | "/reports/pending-reviews/" | "/reports/returned" | "/reports/returned/" | "/settings" | "/settings/" | "/setup" | "/setup/" | "/templates" | "/templates/" | "/voice-test" | "/voice-test/" | "/worklist" | "/worklist/";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/assets/branding/krispoint-logo-transparent.png" | "/favicon.png" | "/fonts/DejaVuSans-Bold.ttf" | "/fonts/DejaVuSans-BoldOblique.ttf" | "/fonts/DejaVuSans-Oblique.ttf" | "/fonts/DejaVuSans.ttf" | "/fonts/LiberationSans-Bold.ttf" | "/fonts/LiberationSans-BoldItalic.ttf" | "/fonts/LiberationSans-Italic.ttf" | "/fonts/LiberationSans-Regular.ttf" | "/fonts/NotoSans-Bold.ttf" | "/fonts/NotoSans-BoldItalic.ttf" | "/fonts/NotoSans-Italic.ttf" | "/fonts/NotoSans-Regular.ttf" | "/fonts/SourceSans3-Bold.ttf" | "/fonts/SourceSans3-BoldIt.ttf" | "/fonts/SourceSans3-It.ttf" | "/fonts/SourceSans3-Regular.ttf" | "/icons/icon-128.png" | "/icons/icon-144.png" | "/icons/icon-152.png" | "/icons/icon-192.png" | "/icons/icon-384.png" | "/icons/icon-512.png" | "/icons/icon-72.png" | "/icons/icon-96.png" | "/manifest.json" | "/service-worker.js" | "/splash.html" | "/splash.png" | string & {};
	}
}