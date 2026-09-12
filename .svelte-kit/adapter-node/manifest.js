export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["assets/branding/krispoint-logo-transparent.png","favicon.png","fonts/DejaVuSans-Bold.ttf","fonts/DejaVuSans-BoldOblique.ttf","fonts/DejaVuSans-Oblique.ttf","fonts/DejaVuSans.ttf","fonts/LiberationSans-Bold.ttf","fonts/LiberationSans-BoldItalic.ttf","fonts/LiberationSans-Italic.ttf","fonts/LiberationSans-Regular.ttf","fonts/NotoSans-Bold.ttf","fonts/NotoSans-BoldItalic.ttf","fonts/NotoSans-Italic.ttf","fonts/NotoSans-Regular.ttf","fonts/SourceSans3-Bold.ttf","fonts/SourceSans3-BoldIt.ttf","fonts/SourceSans3-It.ttf","fonts/SourceSans3-Regular.ttf","icons/icon-128.png","icons/icon-144.png","icons/icon-152.png","icons/icon-192.png","icons/icon-384.png","icons/icon-512.png","icons/icon-72.png","icons/icon-96.png","manifest.json","service-worker.js","splash.html","splash.png"]),
	mimeTypes: {".png":"image/png",".ttf":"font/ttf",".json":"application/json",".js":"text/javascript",".html":"text/html"},
	_: {
		client: {start:"_app/immutable/entry/start.BJmnvnSQ.js",app:"_app/immutable/entry/app.CEKEuPDZ.js",imports:["_app/immutable/entry/start.BJmnvnSQ.js","_app/immutable/chunks/CPF_VgrF.js","_app/immutable/chunks/D5gQvCjn.js","_app/immutable/chunks/Cr9GWNwF.js","_app/immutable/entry/app.CEKEuPDZ.js","_app/immutable/chunks/Ct5FWWRu.js","_app/immutable/chunks/D5gQvCjn.js","_app/immutable/chunks/DsnmJJEf.js","_app/immutable/chunks/TxzGf9kf.js","_app/immutable/chunks/thgaPqfa.js","_app/immutable/chunks/C4glEofd.js","_app/immutable/chunks/BZIGDFf3.js","_app/immutable/chunks/Cr9GWNwF.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js')),
			__memo(() => import('./nodes/3.js')),
			__memo(() => import('./nodes/4.js')),
			__memo(() => import('./nodes/5.js')),
			__memo(() => import('./nodes/6.js')),
			__memo(() => import('./nodes/7.js')),
			__memo(() => import('./nodes/8.js')),
			__memo(() => import('./nodes/9.js')),
			__memo(() => import('./nodes/10.js')),
			__memo(() => import('./nodes/11.js')),
			__memo(() => import('./nodes/13.js')),
			__memo(() => import('./nodes/14.js')),
			__memo(() => import('./nodes/15.js')),
			__memo(() => import('./nodes/16.js')),
			__memo(() => import('./nodes/17.js')),
			__memo(() => import('./nodes/18.js')),
			__memo(() => import('./nodes/19.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/admin/analytics",
				pattern: /^\/admin\/analytics\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			},
			{
				id: "/admin/audit-logs",
				pattern: /^\/admin\/audit-logs\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 4 },
				endpoint: null
			},
			{
				id: "/admin/sessions",
				pattern: /^\/admin\/sessions\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 5 },
				endpoint: null
			},
			{
				id: "/admin/training-data",
				pattern: /^\/admin\/training-data\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 6 },
				endpoint: null
			},
			{
				id: "/admin/users",
				pattern: /^\/admin\/users\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 7 },
				endpoint: null
			},
			{
				id: "/analytics",
				pattern: /^\/analytics\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 8 },
				endpoint: null
			},
			{
				id: "/api/admin/analytics",
				pattern: /^\/api\/admin\/analytics\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/admin/analytics/_server.ts.js'))
			},
			{
				id: "/api/admin/audit-logs",
				pattern: /^\/api\/admin\/audit-logs\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/admin/audit-logs/_server.ts.js'))
			},
			{
				id: "/api/admin/seed",
				pattern: /^\/api\/admin\/seed\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/admin/seed/_server.ts.js'))
			},
			{
				id: "/api/admin/sessions",
				pattern: /^\/api\/admin\/sessions\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/admin/sessions/_server.ts.js'))
			},
			{
				id: "/api/admin/users",
				pattern: /^\/api\/admin\/users\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/admin/users/_server.ts.js'))
			},
			{
				id: "/api/admin/users/[id]",
				pattern: /^\/api\/admin\/users\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/admin/users/_id_/_server.ts.js'))
			},
			{
				id: "/api/admin/users/[id]/reset-password",
				pattern: /^\/api\/admin\/users\/([^/]+?)\/reset-password\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/admin/users/_id_/reset-password/_server.ts.js'))
			},
			{
				id: "/api/admin/users/[id]/toggle-status",
				pattern: /^\/api\/admin\/users\/([^/]+?)\/toggle-status\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/admin/users/_id_/toggle-status/_server.ts.js'))
			},
			{
				id: "/api/ai/polish",
				pattern: /^\/api\/ai\/polish\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/ai/polish/_server.ts.js'))
			},
			{
				id: "/api/ai/status",
				pattern: /^\/api\/ai\/status\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/ai/status/_server.ts.js'))
			},
			{
				id: "/api/analytics/admin",
				pattern: /^\/api\/analytics\/admin\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/analytics/admin/_server.ts.js'))
			},
			{
				id: "/api/analytics/user",
				pattern: /^\/api\/analytics\/user\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/analytics/user/_server.ts.js'))
			},
			{
				id: "/api/analytics/user/details",
				pattern: /^\/api\/analytics\/user\/details\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/analytics/user/details/_server.ts.js'))
			},
			{
				id: "/api/auth/change-password",
				pattern: /^\/api\/auth\/change-password\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/auth/change-password/_server.ts.js'))
			},
			{
				id: "/api/auth/check-users",
				pattern: /^\/api\/auth\/check-users\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/auth/check-users/_server.ts.js'))
			},
			{
				id: "/api/auth/login",
				pattern: /^\/api\/auth\/login\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/auth/login/_server.ts.js'))
			},
			{
				id: "/api/auth/logout",
				pattern: /^\/api\/auth\/logout\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/auth/logout/_server.ts.js'))
			},
			{
				id: "/api/auth/register",
				pattern: /^\/api\/auth\/register\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/auth/register/_server.ts.js'))
			},
			{
				id: "/api/auth/reset-password",
				pattern: /^\/api\/auth\/reset-password\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/auth/reset-password/_server.ts.js'))
			},
			{
				id: "/api/auth/roles",
				pattern: /^\/api\/auth\/roles\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/auth/roles/_server.ts.js'))
			},
			{
				id: "/api/auth/security-question",
				pattern: /^\/api\/auth\/security-question\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/auth/security-question/_server.ts.js'))
			},
			{
				id: "/api/auth/session-events",
				pattern: /^\/api\/auth\/session-events\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/auth/session-events/_server.ts.js'))
			},
			{
				id: "/api/auth/session",
				pattern: /^\/api\/auth\/session\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/auth/session/_server.ts.js'))
			},
			{
				id: "/api/auth/update-security-question",
				pattern: /^\/api\/auth\/update-security-question\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/auth/update-security-question/_server.ts.js'))
			},
			{
				id: "/api/auth/verify-security-answer",
				pattern: /^\/api\/auth\/verify-security-answer\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/auth/verify-security-answer/_server.ts.js'))
			},
			{
				id: "/api/chat/messages",
				pattern: /^\/api\/chat\/messages\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/chat/messages/_server.ts.js'))
			},
			{
				id: "/api/chat/messages/[userId]",
				pattern: /^\/api\/chat\/messages\/([^/]+?)\/?$/,
				params: [{"name":"userId","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/chat/messages/_userId_/_server.ts.js'))
			},
			{
				id: "/api/chat/presence",
				pattern: /^\/api\/chat\/presence\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/chat/presence/_server.ts.js'))
			},
			{
				id: "/api/chat/unread",
				pattern: /^\/api\/chat\/unread\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/chat/unread/_server.ts.js'))
			},
			{
				id: "/api/chat/users",
				pattern: /^\/api\/chat\/users\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/chat/users/_server.ts.js'))
			},
			{
				id: "/api/health",
				pattern: /^\/api\/health\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/health/_server.ts.js'))
			},
			{
				id: "/api/health/solo",
				pattern: /^\/api\/health\/solo\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/health/solo/_server.ts.js'))
			},
			{
				id: "/api/macros",
				pattern: /^\/api\/macros\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/macros/_server.ts.js'))
			},
			{
				id: "/api/macros/[id]",
				pattern: /^\/api\/macros\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/macros/_id_/_server.ts.js'))
			},
			{
				id: "/api/organization",
				pattern: /^\/api\/organization\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/organization/_server.ts.js'))
			},
			{
				id: "/api/organization/letterhead",
				pattern: /^\/api\/organization\/letterhead\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/organization/letterhead/_server.ts.js'))
			},
			{
				id: "/api/organization/settings",
				pattern: /^\/api\/organization\/settings\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/organization/settings/_server.ts.js'))
			},
			{
				id: "/api/reports",
				pattern: /^\/api\/reports\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/reports/_server.ts.js'))
			},
			{
				id: "/api/reports/counts",
				pattern: /^\/api\/reports\/counts\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/reports/counts/_server.ts.js'))
			},
			{
				id: "/api/reports/events",
				pattern: /^\/api\/reports\/events\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/reports/events/_server.ts.js'))
			},
			{
				id: "/api/reports/pending-reviews",
				pattern: /^\/api\/reports\/pending-reviews\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/reports/pending-reviews/_server.ts.js'))
			},
			{
				id: "/api/reports/returned",
				pattern: /^\/api\/reports\/returned\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/reports/returned/_server.ts.js'))
			},
			{
				id: "/api/reports/[id]",
				pattern: /^\/api\/reports\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/reports/_id_/_server.ts.js'))
			},
			{
				id: "/api/reports/[id]/addendums",
				pattern: /^\/api\/reports\/([^/]+?)\/addendums\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/reports/_id_/addendums/_server.ts.js'))
			},
			{
				id: "/api/reports/[id]/addendums/[addendumId]",
				pattern: /^\/api\/reports\/([^/]+?)\/addendums\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false},{"name":"addendumId","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/reports/_id_/addendums/_addendumId_/_server.ts.js'))
			},
			{
				id: "/api/reports/[id]/addendums/[addendumId]/claim",
				pattern: /^\/api\/reports\/([^/]+?)\/addendums\/([^/]+?)\/claim\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false},{"name":"addendumId","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/reports/_id_/addendums/_addendumId_/claim/_server.ts.js'))
			},
			{
				id: "/api/reports/[id]/addendums/[addendumId]/return",
				pattern: /^\/api\/reports\/([^/]+?)\/addendums\/([^/]+?)\/return\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false},{"name":"addendumId","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/reports/_id_/addendums/_addendumId_/return/_server.ts.js'))
			},
			{
				id: "/api/reports/[id]/addendums/[addendumId]/sign",
				pattern: /^\/api\/reports\/([^/]+?)\/addendums\/([^/]+?)\/sign\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false},{"name":"addendumId","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/reports/_id_/addendums/_addendumId_/sign/_server.ts.js'))
			},
			{
				id: "/api/reports/[id]/addendums/[addendumId]/submit",
				pattern: /^\/api\/reports\/([^/]+?)\/addendums\/([^/]+?)\/submit\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false},{"name":"addendumId","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/reports/_id_/addendums/_addendumId_/submit/_server.ts.js'))
			},
			{
				id: "/api/reports/[id]/cancel",
				pattern: /^\/api\/reports\/([^/]+?)\/cancel\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/reports/_id_/cancel/_server.ts.js'))
			},
			{
				id: "/api/reports/[id]/claim",
				pattern: /^\/api\/reports\/([^/]+?)\/claim\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/reports/_id_/claim/_server.ts.js'))
			},
			{
				id: "/api/reports/[id]/presence",
				pattern: /^\/api\/reports\/([^/]+?)\/presence\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/reports/_id_/presence/_server.ts.js'))
			},
			{
				id: "/api/reports/[id]/request-review",
				pattern: /^\/api\/reports\/([^/]+?)\/request-review\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/reports/_id_/request-review/_server.ts.js'))
			},
			{
				id: "/api/reports/[id]/return",
				pattern: /^\/api\/reports\/([^/]+?)\/return\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/reports/_id_/return/_server.ts.js'))
			},
			{
				id: "/api/reports/[id]/sign-off",
				pattern: /^\/api\/reports\/([^/]+?)\/sign-off\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/reports/_id_/sign-off/_server.ts.js'))
			},
			{
				id: "/api/reports/[id]/sign",
				pattern: /^\/api\/reports\/([^/]+?)\/sign\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/reports/_id_/sign/_server.ts.js'))
			},
			{
				id: "/api/reports/[id]/submit",
				pattern: /^\/api\/reports\/([^/]+?)\/submit\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/reports/_id_/submit/_server.ts.js'))
			},
			{
				id: "/api/reports/[id]/undo-sign",
				pattern: /^\/api\/reports\/([^/]+?)\/undo-sign\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/reports/_id_/undo-sign/_server.ts.js'))
			},
			{
				id: "/api/setup/complete",
				pattern: /^\/api\/setup\/complete\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/setup/complete/_server.ts.js'))
			},
			{
				id: "/api/setup/generate-key",
				pattern: /^\/api\/setup\/generate-key\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/setup/generate-key/_server.ts.js'))
			},
			{
				id: "/api/setup/status",
				pattern: /^\/api\/setup\/status\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/setup/status/_server.ts.js'))
			},
			{
				id: "/api/specialists",
				pattern: /^\/api\/specialists\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/specialists/_server.ts.js'))
			},
			{
				id: "/api/templates",
				pattern: /^\/api\/templates\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/templates/_server.ts.js'))
			},
			{
				id: "/api/templates/[id]",
				pattern: /^\/api\/templates\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/templates/_id_/_server.ts.js'))
			},
			{
				id: "/api/user-settings",
				pattern: /^\/api\/user-settings\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/user-settings/_server.ts.js'))
			},
			{
				id: "/api/users",
				pattern: /^\/api\/users\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/users/_server.ts.js'))
			},
			{
				id: "/api/users/signature",
				pattern: /^\/api\/users\/signature\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/users/signature/_server.ts.js'))
			},
			{
				id: "/api/users/specialists",
				pattern: /^\/api\/users\/specialists\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/users/specialists/_server.ts.js'))
			},
			{
				id: "/api/users/[id]",
				pattern: /^\/api\/users\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/users/_id_/_server.ts.js'))
			},
			{
				id: "/api/voice-training/audio/[id]",
				pattern: /^\/api\/voice-training\/audio\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/voice-training/audio/_id_/_server.ts.js'))
			},
			{
				id: "/api/voice-training/export",
				pattern: /^\/api\/voice-training\/export\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/voice-training/export/_server.ts.js'))
			},
			{
				id: "/api/voice-training/samples",
				pattern: /^\/api\/voice-training\/samples\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/voice-training/samples/_server.ts.js'))
			},
			{
				id: "/api/voice-training/samples/[id]",
				pattern: /^\/api\/voice-training\/samples\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/voice-training/samples/_id_/_server.ts.js'))
			},
			{
				id: "/api/voice-training/samples/[id]/correction",
				pattern: /^\/api\/voice-training\/samples\/([^/]+?)\/correction\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/voice-training/samples/_id_/correction/_server.ts.js'))
			},
			{
				id: "/api/voice/ticket",
				pattern: /^\/api\/voice\/ticket\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/voice/ticket/_server.ts.js'))
			},
			{
				id: "/api/worklist",
				pattern: /^\/api\/worklist\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/worklist/_server.ts.js'))
			},
			{
				id: "/api/worklist/create-with-report",
				pattern: /^\/api\/worklist\/create-with-report\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/worklist/create-with-report/_server.ts.js'))
			},
			{
				id: "/api/worklist/[id]",
				pattern: /^\/api\/worklist\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/worklist/_id_/_server.ts.js'))
			},
			{
				id: "/api/worklist/[id]/pickup",
				pattern: /^\/api\/worklist\/([^/]+?)\/pickup\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/worklist/_id_/pickup/_server.ts.js'))
			},
			{
				id: "/auth",
				pattern: /^\/auth\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 9 },
				endpoint: null
			},
			{
				id: "/macros",
				pattern: /^\/macros\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 10 },
				endpoint: null
			},
			{
				id: "/reporting",
				pattern: /^\/reporting\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 11 },
				endpoint: null
			},
			{
				id: "/reports/pending-reviews",
				pattern: /^\/reports\/pending-reviews\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 12 },
				endpoint: null
			},
			{
				id: "/reports/returned",
				pattern: /^\/reports\/returned\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 13 },
				endpoint: null
			},
			{
				id: "/settings",
				pattern: /^\/settings\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 14 },
				endpoint: null
			},
			{
				id: "/setup",
				pattern: /^\/setup\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 15 },
				endpoint: null
			},
			{
				id: "/templates",
				pattern: /^\/templates\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 16 },
				endpoint: null
			},
			{
				id: "/voice-test",
				pattern: /^\/voice-test\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 17 },
				endpoint: null
			},
			{
				id: "/worklist",
				pattern: /^\/worklist\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 18 },
				endpoint: null
			}
		],
		prerendered_routes: new Set(["/reports"]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();

export const prerendered = new Set(["/reports"]);

export const base = "";