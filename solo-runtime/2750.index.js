export const id = 2750;
export const ids = [2750];
export const modules = {

/***/ 50586:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   u: () => (/* binding */ u)
/* harmony export */ });
/* harmony import */ var _index_js_BPHC9uE5_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(34899);
/* harmony import */ var _attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(89831);



/* empty css                                           */function u(d,t){d.component(l=>{let a=(0,_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.M)(t.show,false),i=(0,_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.M)(t.title,"Confirm Action"),o=(0,_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.M)(t.message,"Are you sure you want to proceed?"),c=(0,_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.M)(t.confirmText,"Confirm"),m=(0,_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.M)(t.cancelText,"Cancel"),n=(0,_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.M)(t.danger,false);a?l.push(`<!--[0--><div class="confirm-backdrop svelte-193t4hn" role="dialog" aria-modal="true"><div class="confirm-dialog svelte-193t4hn"><div class="confirm-header svelte-193t4hn"><h3 class="svelte-193t4hn">${(0,_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.P)(i)}</h3></div> <div class="confirm-body svelte-193t4hn"><p class="svelte-193t4hn">${(0,_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.P)(o)}</p></div> <div class="confirm-actions svelte-193t4hn"><button class="btn btn-cancel svelte-193t4hn">${(0,_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.P)(m)}</button> <button${(0,_index_js_BPHC9uE5_js__WEBPACK_IMPORTED_MODULE_0__.a4)("btn svelte-193t4hn",void 0,{"btn-danger":n,"btn-primary":!n})}>${(0,_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.P)(c)}</button></div></div></div>`):l.push("<!--[-1-->"),l.push("<!--]-->"),(0,_index_js_BPHC9uE5_js__WEBPACK_IMPORTED_MODULE_0__.a5)(t,{show:a,title:i,message:o,confirmText:c,cancelText:m,danger:n});});}


//# sourceMappingURL=ConfirmDialog.js-B_ufL4xb.js.map


/***/ }),

/***/ 32837:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   R: () => (/* binding */ R)
/* harmony export */ });
/* harmony import */ var _index_js_BPHC9uE5_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(34899);
/* harmony import */ var _licenseStore_js_CSOu6edw_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(19976);
/* harmony import */ var _attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(89831);
/* harmony import */ var _exports_js_CSfjgVlQ_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(42623);
/* harmony import */ var _utils_js_be9Tdq2_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(71621);
/* harmony import */ var _utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(26765);
/* harmony import */ var _root_js_CksVe0PM_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(22967);
/* harmony import */ var _state_svelte_js_Cm6uwfjG_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(42299);









function R(h,s){h.component(e=>{var t;let p$1,i=(0,_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_2__.M)(s.feature,""),o$1=(0,_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_2__.M)(s.showUpgradePrompt,true),m=(0,_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_2__.M)(s.compact,false);const r={voice:"Voice Dictation",ai_polish:"AI Report Polish",chat:"Inter-User Chat",templates:"Templates",macros:"Macros"};p$1=!i||(0,_licenseStore_js_CSOu6edw_js__WEBPACK_IMPORTED_MODULE_1__.p)(i),(0,_index_js_BPHC9uE5_js__WEBPACK_IMPORTED_MODULE_0__.a6)(t??={},"$isLicenseActive",_licenseStore_js_CSOu6edw_js__WEBPACK_IMPORTED_MODULE_1__.o)&&p$1?(e.push("<!--[0--><!--[-->"),(0,_index_js_BPHC9uE5_js__WEBPACK_IMPORTED_MODULE_0__.a8)(e,s,"default",{}),e.push("<!--]-->")):o$1?(e.push(`<!--[1--><div${(0,_index_js_BPHC9uE5_js__WEBPACK_IMPORTED_MODULE_0__.a4)("premium-gate svelte-hklmpl",void 0,{compact:m})}><div class="premium-icon svelte-hklmpl">${(0,_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_2__.P)((0,_index_js_BPHC9uE5_js__WEBPACK_IMPORTED_MODULE_0__.a6)(t??={},"$isLicenseExpired",_licenseStore_js_CSOu6edw_js__WEBPACK_IMPORTED_MODULE_1__.f)?"⏰":"🔒")}</div> <div class="premium-content svelte-hklmpl"><h4 class="svelte-hklmpl">${(0,_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_2__.P)(r[i]||"Premium Feature")}</h4> `),(0,_index_js_BPHC9uE5_js__WEBPACK_IMPORTED_MODULE_0__.a6)(t??={},"$isLicenseExpired",_licenseStore_js_CSOu6edw_js__WEBPACK_IMPORTED_MODULE_1__.f)?e.push('<!--[0--><p class="svelte-hklmpl">Your license has expired. Renew to continue using this feature.</p> <button class="upgrade-btn renew-btn svelte-hklmpl">Renew License</button>'):e.push('<!--[-1--><p class="svelte-hklmpl">This feature requires a premium license.</p> <button class="upgrade-btn svelte-hklmpl">Upgrade Now</button>'),e.push("<!--]--></div></div>")):e.push("<!--[-1-->"),e.push("<!--]-->"),t&&(0,_index_js_BPHC9uE5_js__WEBPACK_IMPORTED_MODULE_0__.a7)(t),(0,_index_js_BPHC9uE5_js__WEBPACK_IMPORTED_MODULE_0__.a5)(s,{feature:i,showUpgradePrompt:o$1,compact:m});});}


//# sourceMappingURL=PremiumGate.js-BLeDgiE7.js.map


/***/ }),

/***/ 48878:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   c: () => (/* binding */ c),
/* harmony export */   o: () => (/* binding */ o)
/* harmony export */ });
function i(){return "solo"}const t=i(),o=t==="solo",c=Object.freeze({collaboration:!o,multiUserAdministration:!o,sharedWorklist:!o,localVoiceLifecycle:o,localBackupRestore:o});


//# sourceMappingURL=edition.js-CeyRA7nO.js.map


/***/ }),

/***/ 19976:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (/* binding */ A),
/* harmony export */   f: () => (/* binding */ f),
/* harmony export */   o: () => (/* binding */ o),
/* harmony export */   p: () => (/* binding */ p),
/* harmony export */   s: () => (/* binding */ s),
/* harmony export */   w: () => (/* binding */ w)
/* harmony export */ });
/* harmony import */ var _index2_js_B91mjNiV_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(12144);


const c={isActivated:false,license:null,features:[],expiresAt:null,lastValidated:null,error:null,isLoading:false,serverUrl:""},s=(0,_index2_js_B91mjNiV_js__WEBPACK_IMPORTED_MODULE_0__.z)(c),o=(0,_index2_js_B91mjNiV_js__WEBPACK_IMPORTED_MODULE_0__.B)(s,e=>!(!e.isActivated||!e.license||e.expiresAt&&new Date(e.expiresAt)<new Date)),f=(0,_index2_js_B91mjNiV_js__WEBPACK_IMPORTED_MODULE_0__.B)(s,e=>e.license?!!(e.expiresAt&&new Date(e.expiresAt)<new Date):false),w=(0,_index2_js_B91mjNiV_js__WEBPACK_IMPORTED_MODULE_0__.B)(s,e=>e.features||[]),p=e=>{const r=(0,_index2_js_B91mjNiV_js__WEBPACK_IMPORTED_MODULE_0__.E)(s);return !r.isActivated||r.expiresAt&&new Date(r.expiresAt)<new Date?false:r.features?.includes(e)||false},A={async initialize(){},setServerUrl(e){},async activate(e){return {success:false,error:"Not in browser"}},async validateOnline(){},async deactivate(){return {success:false}},clear(){},getDaysRemaining(){const e=(0,_index2_js_B91mjNiV_js__WEBPACK_IMPORTED_MODULE_0__.E)(s);if(!e.expiresAt)return null;const r=new Date(e.expiresAt)-new Date;return Math.max(0,Math.ceil(r/(1e3*60*60*24)))},async getSubscriptionStatus(){return null},async setupAutoRenew(e){return {success:false,error:"Not in browser"}},async changeAutoRenewPlan(e){return {success:false,error:"Not in browser"}},getTopUpUrl(e){const r=(0,_index2_js_B91mjNiV_js__WEBPACK_IMPORTED_MODULE_0__.E)(s);if(!r.serverUrl||!r.license?.key)return null;let i=r.serverUrl;const t=new URLSearchParams;return t.set("license_key",r.license.key),e&&t.set("plan_id",String(e)),`${i}?${t.toString()}`},async toggleAutoRenew(e){return {success:false,error:"Not in browser"}}};


//# sourceMappingURL=licenseStore.js-CSOu6edw.js.map


/***/ }),

/***/ 42299:
/***/ ((__unused_webpack___webpack_module__, __unused_webpack___webpack_exports__, __webpack_require__) => {

/* harmony import */ var _attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(89831);
/* harmony import */ var _exports_js_CSfjgVlQ_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(42623);
/* harmony import */ var _utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(26765);
/* harmony import */ var _root_js_CksVe0PM_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(22967);





const o=_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_0__.z.toString().includes("$$")||/function \w+\(\) \{\}/.test(_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_0__.z.toString()),r="a:";o&&new URL(r);
//# sourceMappingURL=state.svelte.js-Cm6uwfjG.js.map


/***/ }),

/***/ 42750:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ K)
/* harmony export */ });
/* harmony import */ var _chunks_index_js_BPHC9uE5_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(34899);
/* harmony import */ var _chunks_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(89831);
/* harmony import */ var _chunks_exports_js_CSfjgVlQ_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(42623);
/* harmony import */ var _chunks_utils_js_be9Tdq2_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(71621);
/* harmony import */ var _chunks_utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(26765);
/* harmony import */ var _chunks_root_js_CksVe0PM_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(22967);
/* harmony import */ var _chunks_state_svelte_js_Cm6uwfjG_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(42299);
/* harmony import */ var _chunks_ConfirmDialog_js_B_ufL4xb_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(50586);
/* harmony import */ var _chunks_PremiumGate_js_BLeDgiE7_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(32837);
/* harmony import */ var _chunks_licenseStore_js_CSOu6edw_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(19976);
/* harmony import */ var _chunks_edition_js_CeyRA7nO_js__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(48878);
/* harmony import */ var _chunks_index2_js_B91mjNiV_js__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(12144);













function K(c,T){c.component(t=>{let p$1,o$1,u$1,h=[],v="",g=false;p$1=(0,_chunks_licenseStore_js_CSOu6edw_js__WEBPACK_IMPORTED_MODULE_9__.p)("templates"),o$1=h,o$1.reduce((s,a)=>{const i=a.category||"general";return s[i]||(s[i]=[]),s[i].push(a),s},{}),u$1=_chunks_edition_js_CeyRA7nO_js__WEBPACK_IMPORTED_MODULE_10__.o,(0,_chunks_index_js_BPHC9uE5_js__WEBPACK_IMPORTED_MODULE_0__.ac)("ubkcxg",t,s=>{s.title(a=>{a.push("<title>Report Templates - KrisPoint</title>");});}),p$1?(t.push(`<!--[-1--><div class="templates-page svelte-ubkcxg"><div class="page-header svelte-ubkcxg"><p class="svelte-ubkcxg">Professional radiology report templates for faster reporting</p> <div class="header-actions svelte-ubkcxg"><div class="search-box svelte-ubkcxg"><input type="text" placeholder="Search templates..."${(0,_chunks_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.k)("value",v)} class="search-input svelte-ubkcxg"/></div> `),u$1?t.push(`<!--[0--><button class="btn btn-primary svelte-ubkcxg"><span>+</span> Create ${(0,_chunks_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.P)("")}Template</button>`):t.push("<!--[-1-->"),t.push("<!--]--></div></div> "),t.push("<!--[-1-->"),t.push("<!--]--> "),t.push('<!--[0--><div class="loading-state svelte-ubkcxg"><div class="spinner svelte-ubkcxg"></div> <p>Loading templates...</p></div>'),t.push("<!--]--></div> "),t.push("<!--[-1-->"),t.push("<!--]--> "),t.push("<!--[-1-->"),t.push("<!--]--> "),(0,_chunks_ConfirmDialog_js_B_ufL4xb_js__WEBPACK_IMPORTED_MODULE_7__.u)(t,{show:g,title:"Delete Template",message:"Are you sure you want to delete this template? This action cannot be undone.",confirmText:"Delete",confirmClass:"danger"}),t.push("<!---->")):(t.push('<!--[0--><div class="templates-page svelte-ubkcxg">'),(0,_chunks_PremiumGate_js_BLeDgiE7_js__WEBPACK_IMPORTED_MODULE_8__.R)(t,{feature:"templates"}),t.push("<!----></div>")),t.push("<!--]-->");});}


//# sourceMappingURL=_page.svelte.js-Dw-zgMBH.js.map


/***/ })

};
