export const id = 6639;
export const ids = [6639];
export const modules = {

/***/ 15542:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   E: () => (/* binding */ E),
/* harmony export */   a: () => (/* binding */ a),
/* harmony export */   c: () => (/* binding */ c),
/* harmony export */   l: () => (/* binding */ l)
/* harmony export */ });
const a="https://license.krispoint.com.gh";function E(){const n=[],s=[],o=process.env.NODE_ENV==="production",e=process.env.VITE_KRISPOINT_EDITION==="solo";!e&&!process.env.DATABASE_URL&&n.push("DATABASE_URL is required");const r=e?process.env.SOLO_ENCRYPTION_KEY||process.env.ENCRYPTION_KEY:process.env.ENCRYPTION_KEY||process.env.SOLO_ENCRYPTION_KEY,i=e?process.env.SOLO_AUDIT_KEY||process.env.AUDIT_SECRET||r:process.env.AUDIT_SECRET||process.env.ENCRYPTION_KEY||r;if(r?r.length<32&&s.push("ENCRYPTION_KEY should be at least 32 characters for strong encryption"):o?n.push("ENCRYPTION_KEY is required in production for PHI encryption"):s.push("ENCRYPTION_KEY not set - using derived key (not recommended for production)"),i||o&&n.push("AUDIT_SECRET or ENCRYPTION_KEY is required in production for audit log integrity"),!e){const t=process.env.LICENSE_SERVER_URL?.trim();t?c(t,o)||n.push(o?"LICENSE_SERVER_URL must be an HTTPS URL and must not point to localhost":"LICENSE_SERVER_URL must be a valid HTTP or HTTPS URL"):o?n.push("LICENSE_SERVER_URL is required for Hospital production"):s.push("LICENSE_SERVER_URL is not configured");}return {valid:n.length===0,errors:n,warnings:s}}function c(n,s=process.env.NODE_ENV==="production"){try{const o=new URL(n),e=o.hostname.toLowerCase();return (e==="localhost"||e.endsWith(".localhost")||e==="::1"||e==="0.0.0.0"||/^127(?:\.\d{1,3}){3}$/.test(e))&&s||!o.hostname||o.username||o.password||s&&o.protocol!=="https:"?!1:o.protocol==="https:"||!s&&o.protocol==="http:"}catch{return  false}}function l(){const n=E(),s=process.env.NODE_ENV==="production";if(n.warnings.length>0&&(console.warn("⚠️  Environment warnings:"),n.warnings.forEach(o=>console.warn(`   - ${o}`))),n.valid)console.log("✅ Environment validation passed");else if(console.error("❌ Environment validation failed:"),n.errors.forEach(o=>console.error(`   - ${o}`)),s)throw new Error("Cannot start in production mode with invalid environment configuration")}


//# sourceMappingURL=validateEnvironment.js-DffXPr5z.js.map


/***/ }),

/***/ 6639:
/***/ ((__webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(__webpack_module__, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   handle: () => (/* binding */ k)
/* harmony export */ });
/* harmony import */ var dotenv_config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(63281);
/* harmony import */ var _chunks_validateEnvironment_js_DffXPr5z_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(15542);
/* harmony import */ var _chunks_seed_js_BtIy_4Ar_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(49897);
/* harmony import */ var _chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(32411);
/* harmony import */ var pg__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(99556);
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_chunks_seed_js_BtIy_4Ar_js__WEBPACK_IMPORTED_MODULE_1__, _chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_2__]);
([_chunks_seed_js_BtIy_4Ar_js__WEBPACK_IMPORTED_MODULE_1__, _chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_2__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);









(0,_chunks_validateEnvironment_js_DffXPr5z_js__WEBPACK_IMPORTED_MODULE_4__.l)();const s=process.env.VITE_KRISPOINT_EDITION==="solo",d=Number(process.env.KRISPOINT_PARENT_PID);s&&Number.isInteger(d)&&d>0&&setInterval(()=>{try{process.kill(d,0);}catch{process.exit(0);}},2e3).unref();const g=s?(0,_chunks_seed_js_BtIy_4Ar_js__WEBPACK_IMPORTED_MODULE_1__.C)():(0,_chunks_seed_js_BtIy_4Ar_js__WEBPACK_IMPORTED_MODULE_1__.T)();g.then(e=>{e.success&&e.synced&&e.synced>0&&console.log(`🔐 Permission sync: Added ${e.synced} missing role-permission links`);}).catch(e=>{console.error("Permission sync error:",e);});(0,_chunks_seed_js_BtIy_4Ar_js__WEBPACK_IMPORTED_MODULE_1__.A)().then(e=>{e.valid&&console.log(`📋 System content: ${e.templatesCount} templates, ${e.macrosCount} macros available`);}).catch(e=>{console.error("Template validation error:",e);});const w=process.env.LICENSE_SERVER_URL||(process.env.NODE_ENV==="production"?_chunks_validateEnvironment_js_DffXPr5z_js__WEBPACK_IMPORTED_MODULE_4__.a:"http://localhost:3001"),k=async({event:e,resolve:E})=>{const i=process.env.KRISPOINT_LAUNCH_SECRET,r=process.env.KRISPOINT_APP_ORIGIN,t=e.request.headers.get("origin"),c=e.url;if(s&&r&&t&&t!==r)return new Response("Forbidden",{status:403});if(s&&i&&e.url.pathname!=="/api/health/solo"){if(e.url.searchParams.get("desktop_token")===i){const n=new URL(e.url);return n.searchParams.delete("desktop_token"),new Response(null,{status:303,headers:{location:`${n.pathname}${n.search}`,"set-cookie":`krispoint_launch=${i}; Path=/; HttpOnly; SameSite=Strict`}})}if(e.cookies.get("krispoint_launch")!==i)return new Response("Not found",{status:404})}if(c.pathname.startsWith("/license-server/")||c.pathname==="/license-server"){const o=c.pathname.replace("/license-server","")||"/",n=`${w}${o}${c.search}`;try{const a={host:new URL(w).host},h=e.request.headers.get("content-type");h&&(a["content-type"]=h);const m=e.request.headers.get("authorization");m&&(a.authorization=m);const f=e.request.headers.get("x-paystack-signature");f&&(a["x-paystack-signature"]=f);const A={method:e.request.method,headers:a,redirect:"manual"};["POST","PUT","PATCH"].includes(e.request.method)&&(A.body=await e.request.text());const p=await fetch(n,A),l=new Headers;return p.headers.forEach((P,R)=>{["transfer-encoding","connection"].includes(R.toLowerCase())||l.set(R,P);}),t&&(l.set("Access-Control-Allow-Origin",t),l.set("Access-Control-Allow-Credentials","true")),new Response(p.body,{status:p.status,headers:l})}catch{return new Response("License server unavailable",{status:502})}}if(await g,s&&N(e.url.pathname))return new Response("Not found",{status:404});if(s&&e.url.pathname==="/api/reports"){const o=e.url.searchParams.get("action");if(o&&["submit","return","request-review","addendum-submit","addendum-return","presence"].includes(o))return new Response("Not found",{status:404})}if(e.request.method==="OPTIONS")return new Response(null,{status:204,headers:{"Access-Control-Allow-Origin":s?r||"":t||"*","Access-Control-Allow-Methods":"GET, POST, PUT, DELETE, PATCH, OPTIONS","Access-Control-Allow-Headers":"Content-Type, Authorization","Access-Control-Allow-Credentials":"true","Access-Control-Max-Age":"86400"}});const u=await E(e);return t&&(!s||t===r)&&(u.headers.set("Access-Control-Allow-Origin",s?r:t),u.headers.set("Access-Control-Allow-Credentials","true")),u};function N(e){return e.startsWith("/api/chat")||e.startsWith("/api/admin/users")||e==="/api/reports/pending-reviews"||e==="/api/reports/returned"||/^\/api\/reports\/\d+\/(submit|return|request-review)$/.test(e)||/^\/api\/reports\/\d+\/addendums\/\d+\/(submit|return)$/.test(e)}


//# sourceMappingURL=hooks.server.js-Bbi24JO4.js.map

__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ })

};
