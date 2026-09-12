export const id = 3939;
export const ids = [3939];
export const modules = {

/***/ 81561:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   p: () => (/* binding */ p)
/* harmony export */ });
/* harmony import */ var _index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(98579);


/* empty css                                           */function p(t,e){(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__._)();let a=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.o)(e.show,false),n=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.o)(e.title,"Confirm Action"),o=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.o)(e.message,"Are you sure you want to proceed?"),c=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.o)(e.confirmText,"Confirm"),d=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.o)(e.cancelText,"Cancel"),l=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.o)(e.danger,false);a?(t.out.push("<!--[-->"),t.out.push(`<div class="confirm-backdrop svelte-1dsi18p" role="dialog" aria-modal="true"><div class="confirm-dialog svelte-1dsi18p"><div class="confirm-header svelte-1dsi18p"><h3 class="svelte-1dsi18p">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(n)}</h3></div> <div class="confirm-body svelte-1dsi18p"><p class="svelte-1dsi18p">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(o)}</p></div> <div class="confirm-actions svelte-1dsi18p"><button class="btn btn-cancel svelte-1dsi18p">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(d)}</button> <button${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.H)("btn svelte-1dsi18p",void 0,{"btn-danger":l,"btn-primary":!l})}>${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(c)}</button></div></div></div>`)):t.out.push("<!--[!-->"),t.out.push("<!--]-->"),(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.t)(e,{show:a,title:n,message:o,confirmText:c,cancelText:d,danger:l}),(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.f)();}


//# sourceMappingURL=ConfirmDialog-CDS_zF2t.js.map


/***/ }),

/***/ 17613:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   U: () => (/* binding */ U)
/* harmony export */ });
/* harmony import */ var _index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(98579);
/* harmony import */ var _licenseStore_CrqxulK0_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(55056);
/* harmony import */ var _utils_Ca_EoiSx_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(79936);
/* harmony import */ var _state_svelte_xhjpmOz7_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(25781);





function U(s,e){(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__._)();var t;let o$1,i=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.o)(e.feature,""),c=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.o)(e.showUpgradePrompt,true),p$1=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.o)(e.compact,false);const a={voice:"Voice Dictation",ai_polish:"AI Report Polish",chat:"Inter-User Chat",templates:"Templates",macros:"Macros"};o$1=!i||(0,_licenseStore_CrqxulK0_js__WEBPACK_IMPORTED_MODULE_1__.p)(i),(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(t??={},"$isLicenseActive",_licenseStore_CrqxulK0_js__WEBPACK_IMPORTED_MODULE_1__.o)&&o$1?(s.out.push("<!--[-->"),s.out.push("<!---->"),(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.W)(s,e,"default",{}),s.out.push("<!---->")):(s.out.push("<!--[!-->"),c?(s.out.push("<!--[-->"),s.out.push(`<div${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.H)("premium-gate svelte-zskbsf",void 0,{compact:p$1})}><div class="premium-icon svelte-zskbsf">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)((0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(t??={},"$isLicenseExpired",_licenseStore_CrqxulK0_js__WEBPACK_IMPORTED_MODULE_1__.f)?"⏰":"🔒")}</div> <div class="premium-content svelte-zskbsf"><h4 class="svelte-zskbsf">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(a[i]||"Premium Feature")}</h4> `),(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(t??={},"$isLicenseExpired",_licenseStore_CrqxulK0_js__WEBPACK_IMPORTED_MODULE_1__.f)?(s.out.push("<!--[-->"),s.out.push('<p class="svelte-zskbsf">Your license has expired. Renew to continue using this feature.</p> <button class="upgrade-btn renew-btn svelte-zskbsf">Renew License</button>')):(s.out.push("<!--[!-->"),s.out.push('<p class="svelte-zskbsf">This feature requires a premium license.</p> <button class="upgrade-btn svelte-zskbsf">Upgrade Now</button>')),s.out.push("<!--]--></div></div>")):s.out.push("<!--[!-->"),s.out.push("<!--]-->")),s.out.push("<!--]-->"),t&&(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.l)(t),(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.t)(e,{feature:i,showUpgradePrompt:c,compact:p$1}),(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.f)();}


//# sourceMappingURL=PremiumGate-C8BMj57k.js.map


/***/ }),

/***/ 73939:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ G)
/* harmony export */ });
/* harmony import */ var _index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(98579);
/* harmony import */ var _ConfirmDialog_CDS_zF2t_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(81561);
/* harmony import */ var _PremiumGate_C8BMj57k_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(17613);
/* harmony import */ var _licenseStore_CrqxulK0_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(55056);
/* harmony import */ var _utils_Ca_EoiSx_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(79936);
/* harmony import */ var _state_svelte_xhjpmOz7_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(25781);
/* harmony import */ var _index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(72912);








function G(e,A){(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__._)();let u,a,v=[],h="All",c="",b=false,p$2=false,l="system";const d=[{id:"All",label:"All",icon:"📋"},{id:"General",label:"General",icon:"📝"},{id:"Neuro",label:"Neuro",icon:"🧠"},{id:"Chest",label:"Chest",icon:"🫁"},{id:"Abdomen",label:"Abdomen",icon:"🫃"},{id:"MSK",label:"MSK",icon:"🦴"},{id:"Procedures",label:"Procedures",icon:"💉"},{id:"Impressions",label:"Impressions",icon:"💭"}];if(u=(0,_licenseStore_CrqxulK0_js__WEBPACK_IMPORTED_MODULE_3__.p)("macros"),(()=>{let t=v;if(c.trim()){const s=c.toLowerCase();t=t.filter(o=>o.name?.toLowerCase().includes(s)||o.voiceCommand?.toLowerCase().includes(s)||o.content?.toLowerCase().includes(s));}return t.sort((s,o)=>(s.name||"").localeCompare(o.name||""))})(),a=p$2,(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.J)(e,t=>{t.title="<title>Voice Macros - KrisPoint</title>",t.out.push('<meta name="description" content="Manage voice-activated macros for faster radiology reporting"/>');}),!u)e.out.push("<!--[-->"),e.out.push('<div class="macros-page svelte-1uo79cb">'),(0,_PremiumGate_C8BMj57k_js__WEBPACK_IMPORTED_MODULE_2__.U)(e,{feature:"macros"}),e.out.push("<!----></div>");else {e.out.push("<!--[!-->");const t=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.z)(d);e.out.push(`<div class="macros-page svelte-1uo79cb"><div class="page-header svelte-1uo79cb"><p class="svelte-1uo79cb">Voice-activated text snippets for faster reporting</p> <div class="header-actions svelte-1uo79cb"><div class="search-box svelte-1uo79cb"><input type="text" placeholder="Search macros..."${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("value",c)} class="search-input svelte-1uo79cb"/></div> <select class="category-filter svelte-1uo79cb">`),e.select_value=h,e.out.push("<!--[-->");for(let s=0,o=t.length;s<o;s++){let i=t[s];e.out.push(`<option${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("value",i.id)}${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.Z)(e,i.id)}>${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(i.icon)} ${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(i.label)}</option>`);}e.out.push("<!--]-->"),e.select_value=void 0,e.out.push("</select> "),a?(e.out.push("<!--[-->"),e.out.push(`<button class="btn btn-primary svelte-1uo79cb"><span>+</span> Create ${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)("System")} Macro</button>`)):e.out.push("<!--[!-->"),e.out.push(`<!--]--></div></div> <div class="tabs svelte-1uo79cb"><button${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.H)("tab svelte-1uo79cb",void 0,{active:l==="system"})}>System Macros</button> <button${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.H)("tab svelte-1uo79cb",void 0,{active:l==="personal"})}>My Macros</button></div> `),e.out.push("<!--[-->"),e.out.push('<div class="loading-state svelte-1uo79cb"><div class="spinner svelte-1uo79cb"></div> <p>Loading macros...</p></div>'),e.out.push("<!--]--></div> "),e.out.push("<!--[!-->"),e.out.push("<!--]--> "),(0,_ConfirmDialog_CDS_zF2t_js__WEBPACK_IMPORTED_MODULE_1__.p)(e,{show:b,title:"Delete Macro",message:"Are you sure you want to delete this macro? This action cannot be undone.",confirmText:"Delete",confirmClass:"danger"}),e.out.push("<!---->");}e.out.push("<!--]-->"),(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.f)();}


//# sourceMappingURL=_page.svelte-Bnm5RWSV.js.map


/***/ }),

/***/ 55056:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (/* binding */ A),
/* harmony export */   f: () => (/* binding */ f),
/* harmony export */   o: () => (/* binding */ o),
/* harmony export */   p: () => (/* binding */ p),
/* harmony export */   s: () => (/* binding */ s),
/* harmony export */   w: () => (/* binding */ w)
/* harmony export */ });
/* harmony import */ var _index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(72912);


const c={isActivated:false,license:null,features:[],expiresAt:null,lastValidated:null,error:null,isLoading:false,serverUrl:""},s=(0,_index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_0__.z)(c),o=(0,_index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_0__.E)(s,e=>!(!e.isActivated||!e.license||e.expiresAt&&new Date(e.expiresAt)<new Date)),f=(0,_index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_0__.E)(s,e=>e.license?!!(e.expiresAt&&new Date(e.expiresAt)<new Date):false),w=(0,_index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_0__.E)(s,e=>e.features||[]),p=e=>{const r=(0,_index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_0__.v)(s);return !r.isActivated||r.expiresAt&&new Date(r.expiresAt)<new Date?false:r.features?.includes(e)||false},A={async initialize(){},setServerUrl(e){},async activate(e){return {success:false,error:"Not in browser"}},async validateOnline(){},async deactivate(){return {success:false}},clear(){},getDaysRemaining(){const e=(0,_index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_0__.v)(s);if(!e.expiresAt)return null;const r=new Date(e.expiresAt)-new Date;return Math.max(0,Math.ceil(r/(1e3*60*60*24)))},async getSubscriptionStatus(){return null},async setupAutoRenew(e){return {success:false,error:"Not in browser"}},async changeAutoRenewPlan(e){return {success:false,error:"Not in browser"}},getTopUpUrl(e){const r=(0,_index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_0__.v)(s);if(!r.serverUrl||!r.license?.key)return null;let i=r.serverUrl;const t=new URLSearchParams;return t.set("license_key",r.license.key),e&&t.set("plan_id",String(e)),`${i}?${t.toString()}`},async toggleAutoRenew(e){return {success:false,error:"Not in browser"}}};


//# sourceMappingURL=licenseStore-CrqxulK0.js.map


/***/ }),

/***/ 25781:
/***/ ((__unused_webpack___webpack_module__, __unused_webpack___webpack_exports__, __webpack_require__) => {

/* harmony import */ var _index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(98579);


const o=_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.g.toString().includes("$$")||/function \w+\(\) \{\}/.test(_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.g.toString());o&&new URL("https://example.com");
//# sourceMappingURL=state.svelte-xhjpmOz7.js.map


/***/ })

};
