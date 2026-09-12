export const id = 4705;
export const ids = [4705];
export const modules = {

/***/ 4705:
/***/ ((__webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(__webpack_module__, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   handle: () => (/* binding */ E)
/* harmony export */ });
/* harmony import */ var dotenv_config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(52874);
/* harmony import */ var _validateEnvironment_DTn20BaS_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(38409);
/* harmony import */ var _seed_Dii_9_Vz_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(83456);
/* harmony import */ var _db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(35892);
/* harmony import */ var pg__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(83849);
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_seed_Dii_9_Vz_js__WEBPACK_IMPORTED_MODULE_2__, _db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_3__]);
([_seed_Dii_9_Vz_js__WEBPACK_IMPORTED_MODULE_2__, _db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_3__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);









(0,_validateEnvironment_DTn20BaS_js__WEBPACK_IMPORTED_MODULE_1__.c)();const s=process.env.VITE_KRISPOINT_EDITION==="solo",p=Number(process.env.KRISPOINT_PARENT_PID);s&&Number.isInteger(p)&&p>0&&setInterval(()=>{try{process.kill(p,0);}catch{process.exit(0);}},2e3).unref();const g=s?(0,_seed_Dii_9_Vz_js__WEBPACK_IMPORTED_MODULE_2__.C)():(0,_seed_Dii_9_Vz_js__WEBPACK_IMPORTED_MODULE_2__.T)();g.then(e=>{e.success&&e.synced&&e.synced>0&&console.log(`🔐 Permission sync: Added ${e.synced} missing role-permission links`);}).catch(e=>{console.error("Permission sync error:",e);});(0,_seed_Dii_9_Vz_js__WEBPACK_IMPORTED_MODULE_2__.A)().then(e=>{e.valid&&console.log(`📋 System content: ${e.templatesCount} templates, ${e.macrosCount} macros available`);}).catch(e=>{console.error("Template validation error:",e);});const I="http://localhost:3001",E=async({event:e,resolve:P})=>{const i=process.env.KRISPOINT_LAUNCH_SECRET,r=process.env.KRISPOINT_APP_ORIGIN,t=e.request.headers.get("origin"),c=e.url;if(s&&r&&t&&t!==r)return new Response("Forbidden",{status:403});if(s&&i&&e.url.pathname!=="/api/health/solo"){if(e.url.searchParams.get("desktop_token")===i){const n=new URL(e.url);return n.searchParams.delete("desktop_token"),new Response(null,{status:303,headers:{location:`${n.pathname}${n.search}`,"set-cookie":`krispoint_launch=${i}; Path=/; HttpOnly; SameSite=Strict`}})}if(e.cookies.get("krispoint_launch")!==i)return new Response("Not found",{status:404})}if(c.pathname.startsWith("/license-server/")||c.pathname==="/license-server"){const o=c.pathname.replace("/license-server","")||"/",n=`${I}${o}${c.search}`;try{const a={host:"localhost:3001"},h=e.request.headers.get("content-type");h&&(a["content-type"]=h);const m=e.request.headers.get("authorization");m&&(a.authorization=m);const f=e.request.headers.get("x-paystack-signature");f&&(a["x-paystack-signature"]=f);const w={method:e.request.method,headers:a,redirect:"manual"};["POST","PUT","PATCH"].includes(e.request.method)&&(w.body=await e.request.text());const d=await fetch(n,w),l=new Headers;return d.headers.forEach((T,A)=>{["transfer-encoding","connection"].includes(A.toLowerCase())||l.set(A,T);}),t&&(l.set("Access-Control-Allow-Origin",t),l.set("Access-Control-Allow-Credentials","true")),new Response(d.body,{status:d.status,headers:l})}catch{return new Response("License server unavailable",{status:502})}}if(await g,s&&O(e.url.pathname))return new Response("Not found",{status:404});if(s&&e.url.pathname==="/api/reports"){const o=e.url.searchParams.get("action");if(o&&["submit","return","request-review","addendum-submit","addendum-return","presence"].includes(o))return new Response("Not found",{status:404})}if(e.request.method==="OPTIONS")return new Response(null,{status:204,headers:{"Access-Control-Allow-Origin":s?r||"":t||"*","Access-Control-Allow-Methods":"GET, POST, PUT, DELETE, PATCH, OPTIONS","Access-Control-Allow-Headers":"Content-Type, Authorization","Access-Control-Allow-Credentials":"true","Access-Control-Max-Age":"86400"}});const u=await P(e);return t&&(!s||t===r)&&(u.headers.set("Access-Control-Allow-Origin",s?r:t),u.headers.set("Access-Control-Allow-Credentials","true")),u};function O(e){return e.startsWith("/api/chat")||e.startsWith("/api/worklist")||e.startsWith("/api/admin/users")||e==="/api/reports/pending-reviews"||e==="/api/reports/returned"||/^\/api\/reports\/\d+\/(submit|return|request-review)$/.test(e)||/^\/api\/reports\/\d+\/addendums\/\d+\/(submit|return)$/.test(e)}


//# sourceMappingURL=hooks.server-CMu5F0fr.js.map

__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ }),

/***/ 38409:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   c: () => (/* binding */ c),
/* harmony export */   t: () => (/* binding */ t)
/* harmony export */ });
const s=process.env.NODE_ENV==="production";function t(){const n=[],o=[],r=process.env.VITE_KRISPOINT_EDITION==="solo";!r&&!process.env.DATABASE_URL&&n.push("DATABASE_URL is required");const e=r?process.env.SOLO_ENCRYPTION_KEY||process.env.ENCRYPTION_KEY:process.env.ENCRYPTION_KEY||process.env.SOLO_ENCRYPTION_KEY,i=r?process.env.SOLO_AUDIT_KEY||process.env.AUDIT_SECRET||e:process.env.AUDIT_SECRET||process.env.ENCRYPTION_KEY||e;return e?e.length<32&&o.push("ENCRYPTION_KEY should be at least 32 characters for strong encryption"):s?n.push("ENCRYPTION_KEY is required in production for PHI encryption"):o.push("ENCRYPTION_KEY not set - using derived key (not recommended for production)"),i||s&&n.push("AUDIT_SECRET or ENCRYPTION_KEY is required in production for audit log integrity"),{valid:n.length===0,errors:n,warnings:o}}function c(){const n=t();if(n.warnings.length>0&&(console.warn("⚠️  Environment warnings:"),n.warnings.forEach(o=>console.warn(`   - ${o}`))),n.valid)console.log("✅ Environment validation passed");else if(console.error("❌ Environment validation failed:"),n.errors.forEach(o=>console.error(`   - ${o}`)),s)throw new Error("Cannot start in production mode with invalid environment configuration")}


//# sourceMappingURL=validateEnvironment-DTn20BaS.js.map


/***/ })

};
