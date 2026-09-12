const manifest = (() => {
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
			__memo(() => import('./chunks/0-BKA_-wV8.js')),
			__memo(() => import('./chunks/1-DJKUeyM_.js')),
			__memo(() => import('./chunks/2-Mns5T3YT.js')),
			__memo(() => import('./chunks/3-0TpnxhCN.js')),
			__memo(() => import('./chunks/4-Dbe3DEhB.js')),
			__memo(() => import('./chunks/5-C9LCFKOP.js')),
			__memo(() => import('./chunks/6-D4-IEw_M.js')),
			__memo(() => import('./chunks/7-CxDZBQMj.js')),
			__memo(() => import('./chunks/8-CUXoKyue.js')),
			__memo(() => import('./chunks/9-Byba7aPU.js')),
			__memo(() => import('./chunks/10-27uTxAYb.js')),
			__memo(() => import('./chunks/11-CtGFNCJW.js')),
			__memo(() => import('./chunks/13-BUSJg14K.js')),
			__memo(() => import('./chunks/14-BWh8Iwhe.js')),
			__memo(() => import('./chunks/15-DoIU2IeN.js')),
			__memo(() => import('./chunks/16-Bi8qq1YN.js')),
			__memo(() => import('./chunks/17-B0z1MYKy.js')),
			__memo(() => import('./chunks/18-BtxdRI2B.js')),
			__memo(() => import('./chunks/19-BcEkwUn0.js'))
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
				endpoint: __memo(() => import('./chunks/_server.ts-DHmcp17A.js'))
			},
			{
				id: "/api/admin/audit-logs",
				pattern: /^\/api\/admin\/audit-logs\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CNxJ3cxi.js'))
			},
			{
				id: "/api/admin/seed",
				pattern: /^\/api\/admin\/seed\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CTPem2Ab.js'))
			},
			{
				id: "/api/admin/sessions",
				pattern: /^\/api\/admin\/sessions\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-D6HKU0DP.js'))
			},
			{
				id: "/api/admin/users",
				pattern: /^\/api\/admin\/users\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DLEy1Ghb.js'))
			},
			{
				id: "/api/admin/users/[id]",
				pattern: /^\/api\/admin\/users\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DVZ0Pw8n.js'))
			},
			{
				id: "/api/admin/users/[id]/reset-password",
				pattern: /^\/api\/admin\/users\/([^/]+?)\/reset-password\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-D8I1wl9R.js'))
			},
			{
				id: "/api/admin/users/[id]/toggle-status",
				pattern: /^\/api\/admin\/users\/([^/]+?)\/toggle-status\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-H5SYAP-2.js'))
			},
			{
				id: "/api/ai/polish",
				pattern: /^\/api\/ai\/polish\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-D1uCMcml.js'))
			},
			{
				id: "/api/ai/status",
				pattern: /^\/api\/ai\/status\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Bf60OFrN.js'))
			},
			{
				id: "/api/analytics/admin",
				pattern: /^\/api\/analytics\/admin\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DDVH4Bz6.js'))
			},
			{
				id: "/api/analytics/user",
				pattern: /^\/api\/analytics\/user\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Bu0i9D5m.js'))
			},
			{
				id: "/api/analytics/user/details",
				pattern: /^\/api\/analytics\/user\/details\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-kOyQMHYG.js'))
			},
			{
				id: "/api/auth/change-password",
				pattern: /^\/api\/auth\/change-password\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Dh3ZmHMX.js'))
			},
			{
				id: "/api/auth/check-users",
				pattern: /^\/api\/auth\/check-users\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DSzFHc2f.js'))
			},
			{
				id: "/api/auth/login",
				pattern: /^\/api\/auth\/login\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BIgULSmW.js'))
			},
			{
				id: "/api/auth/logout",
				pattern: /^\/api\/auth\/logout\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-nnuTacVt.js'))
			},
			{
				id: "/api/auth/register",
				pattern: /^\/api\/auth\/register\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DVH-tzeq.js'))
			},
			{
				id: "/api/auth/reset-password",
				pattern: /^\/api\/auth\/reset-password\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DOVhAd5Q.js'))
			},
			{
				id: "/api/auth/roles",
				pattern: /^\/api\/auth\/roles\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BILwJEfh.js'))
			},
			{
				id: "/api/auth/security-question",
				pattern: /^\/api\/auth\/security-question\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-2JV2BNSP.js'))
			},
			{
				id: "/api/auth/session-events",
				pattern: /^\/api\/auth\/session-events\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-B21Cc33I.js'))
			},
			{
				id: "/api/auth/session",
				pattern: /^\/api\/auth\/session\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DENGsYHU.js'))
			},
			{
				id: "/api/auth/update-security-question",
				pattern: /^\/api\/auth\/update-security-question\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BG_yFesY.js'))
			},
			{
				id: "/api/auth/verify-security-answer",
				pattern: /^\/api\/auth\/verify-security-answer\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BXH823Z0.js'))
			},
			{
				id: "/api/chat/messages",
				pattern: /^\/api\/chat\/messages\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-VYpJAv5r.js'))
			},
			{
				id: "/api/chat/messages/[userId]",
				pattern: /^\/api\/chat\/messages\/([^/]+?)\/?$/,
				params: [{"name":"userId","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DLBkxplh.js'))
			},
			{
				id: "/api/chat/presence",
				pattern: /^\/api\/chat\/presence\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CzhtyimK.js'))
			},
			{
				id: "/api/chat/unread",
				pattern: /^\/api\/chat\/unread\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-LGOL_CQK.js'))
			},
			{
				id: "/api/chat/users",
				pattern: /^\/api\/chat\/users\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BxUI9WJT.js'))
			},
			{
				id: "/api/health",
				pattern: /^\/api\/health\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Dkoy-xRb.js'))
			},
			{
				id: "/api/health/solo",
				pattern: /^\/api\/health\/solo\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CkaHz054.js'))
			},
			{
				id: "/api/macros",
				pattern: /^\/api\/macros\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Bj43_SIh.js'))
			},
			{
				id: "/api/macros/[id]",
				pattern: /^\/api\/macros\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-0yYLAJTj.js'))
			},
			{
				id: "/api/organization",
				pattern: /^\/api\/organization\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-fImsWzwU.js'))
			},
			{
				id: "/api/organization/letterhead",
				pattern: /^\/api\/organization\/letterhead\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-C804T5Il.js'))
			},
			{
				id: "/api/organization/settings",
				pattern: /^\/api\/organization\/settings\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-C6Ga0uhY.js'))
			},
			{
				id: "/api/reports",
				pattern: /^\/api\/reports\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DhBA35oG.js'))
			},
			{
				id: "/api/reports/counts",
				pattern: /^\/api\/reports\/counts\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Dq7CYR8I.js'))
			},
			{
				id: "/api/reports/events",
				pattern: /^\/api\/reports\/events\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-9c9jcP0J.js'))
			},
			{
				id: "/api/reports/pending-reviews",
				pattern: /^\/api\/reports\/pending-reviews\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-7Wz4BUS0.js'))
			},
			{
				id: "/api/reports/returned",
				pattern: /^\/api\/reports\/returned\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BV6O92S6.js'))
			},
			{
				id: "/api/reports/[id]",
				pattern: /^\/api\/reports\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BdR2XdsY.js'))
			},
			{
				id: "/api/reports/[id]/addendums",
				pattern: /^\/api\/reports\/([^/]+?)\/addendums\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Dm7-E5nU.js'))
			},
			{
				id: "/api/reports/[id]/addendums/[addendumId]",
				pattern: /^\/api\/reports\/([^/]+?)\/addendums\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false},{"name":"addendumId","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CpehqLcS.js'))
			},
			{
				id: "/api/reports/[id]/addendums/[addendumId]/claim",
				pattern: /^\/api\/reports\/([^/]+?)\/addendums\/([^/]+?)\/claim\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false},{"name":"addendumId","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-7MbUbEHJ.js'))
			},
			{
				id: "/api/reports/[id]/addendums/[addendumId]/return",
				pattern: /^\/api\/reports\/([^/]+?)\/addendums\/([^/]+?)\/return\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false},{"name":"addendumId","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CuXPMCWA.js'))
			},
			{
				id: "/api/reports/[id]/addendums/[addendumId]/sign",
				pattern: /^\/api\/reports\/([^/]+?)\/addendums\/([^/]+?)\/sign\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false},{"name":"addendumId","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-FSPT7D8W.js'))
			},
			{
				id: "/api/reports/[id]/addendums/[addendumId]/submit",
				pattern: /^\/api\/reports\/([^/]+?)\/addendums\/([^/]+?)\/submit\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false},{"name":"addendumId","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BION1sZs.js'))
			},
			{
				id: "/api/reports/[id]/cancel",
				pattern: /^\/api\/reports\/([^/]+?)\/cancel\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-NDVWjE1g.js'))
			},
			{
				id: "/api/reports/[id]/claim",
				pattern: /^\/api\/reports\/([^/]+?)\/claim\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BYm93eUb.js'))
			},
			{
				id: "/api/reports/[id]/presence",
				pattern: /^\/api\/reports\/([^/]+?)\/presence\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-UZucz8t1.js'))
			},
			{
				id: "/api/reports/[id]/request-review",
				pattern: /^\/api\/reports\/([^/]+?)\/request-review\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CtuJoK8h.js'))
			},
			{
				id: "/api/reports/[id]/return",
				pattern: /^\/api\/reports\/([^/]+?)\/return\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CDUgAhdH.js'))
			},
			{
				id: "/api/reports/[id]/sign-off",
				pattern: /^\/api\/reports\/([^/]+?)\/sign-off\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DEo5vH3-.js'))
			},
			{
				id: "/api/reports/[id]/sign",
				pattern: /^\/api\/reports\/([^/]+?)\/sign\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BN8RMhCK.js'))
			},
			{
				id: "/api/reports/[id]/submit",
				pattern: /^\/api\/reports\/([^/]+?)\/submit\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-mmgvhpNr.js'))
			},
			{
				id: "/api/reports/[id]/undo-sign",
				pattern: /^\/api\/reports\/([^/]+?)\/undo-sign\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CunajQJf.js'))
			},
			{
				id: "/api/setup/complete",
				pattern: /^\/api\/setup\/complete\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DwHMuLRQ.js'))
			},
			{
				id: "/api/setup/generate-key",
				pattern: /^\/api\/setup\/generate-key\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DRIQXb3Z.js'))
			},
			{
				id: "/api/setup/status",
				pattern: /^\/api\/setup\/status\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-D90XnyGr.js'))
			},
			{
				id: "/api/specialists",
				pattern: /^\/api\/specialists\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Bw-b2GcK.js'))
			},
			{
				id: "/api/templates",
				pattern: /^\/api\/templates\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-C8pUHSr-.js'))
			},
			{
				id: "/api/templates/[id]",
				pattern: /^\/api\/templates\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Tnb3HduG.js'))
			},
			{
				id: "/api/user-settings",
				pattern: /^\/api\/user-settings\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CLbC1KW2.js'))
			},
			{
				id: "/api/users",
				pattern: /^\/api\/users\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-B9jE30KE.js'))
			},
			{
				id: "/api/users/signature",
				pattern: /^\/api\/users\/signature\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-3d1KFNo0.js'))
			},
			{
				id: "/api/users/specialists",
				pattern: /^\/api\/users\/specialists\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BAnNWPOW.js'))
			},
			{
				id: "/api/users/[id]",
				pattern: /^\/api\/users\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CLeHgEQc.js'))
			},
			{
				id: "/api/voice-training/audio/[id]",
				pattern: /^\/api\/voice-training\/audio\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CUbyfbhO.js'))
			},
			{
				id: "/api/voice-training/export",
				pattern: /^\/api\/voice-training\/export\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BafuxBip.js'))
			},
			{
				id: "/api/voice-training/samples",
				pattern: /^\/api\/voice-training\/samples\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-6wkn3_IN.js'))
			},
			{
				id: "/api/voice-training/samples/[id]",
				pattern: /^\/api\/voice-training\/samples\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-7nSMYExe.js'))
			},
			{
				id: "/api/voice-training/samples/[id]/correction",
				pattern: /^\/api\/voice-training\/samples\/([^/]+?)\/correction\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BbTslcS0.js'))
			},
			{
				id: "/api/voice/ticket",
				pattern: /^\/api\/voice\/ticket\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Ch0gGEjT.js'))
			},
			{
				id: "/api/worklist",
				pattern: /^\/api\/worklist\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-O50hFgvi.js'))
			},
			{
				id: "/api/worklist/create-with-report",
				pattern: /^\/api\/worklist\/create-with-report\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-B7ILU-Ea.js'))
			},
			{
				id: "/api/worklist/[id]",
				pattern: /^\/api\/worklist\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BeIARnYz.js'))
			},
			{
				id: "/api/worklist/[id]/pickup",
				pattern: /^\/api\/worklist\/([^/]+?)\/pickup\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-D4GU4ktd.js'))
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

const prerendered = new Set(["/reports"]);

const base = "";

export { base, manifest, prerendered };
//# sourceMappingURL=manifest.js.map
