export const id = 9437;
export const ids = [9437];
export const modules = {

/***/ 48349:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   u: () => (/* binding */ u)
/* harmony export */ });
/* harmony import */ var _index_js_Bpk4pd78_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(46706);
/* harmony import */ var _attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(89831);



/* empty css                                           */function u(m,t){m.component(l=>{let a=(0,_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.M)(t.show,false),i=(0,_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.M)(t.title,"Confirm Action"),o=(0,_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.M)(t.message,"Are you sure you want to proceed?"),c=(0,_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.M)(t.confirmText,"Confirm"),d=(0,_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.M)(t.cancelText,"Cancel"),n=(0,_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.M)(t.danger,false);a?l.push(`<!--[0--><div class="confirm-backdrop svelte-193t4hn" role="dialog" aria-modal="true"><div class="confirm-dialog svelte-193t4hn"><div class="confirm-header svelte-193t4hn"><h3 class="svelte-193t4hn">${(0,_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.P)(i)}</h3></div> <div class="confirm-body svelte-193t4hn"><p class="svelte-193t4hn">${(0,_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.P)(o)}</p></div> <div class="confirm-actions svelte-193t4hn"><button class="btn btn-cancel svelte-193t4hn">${(0,_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.P)(d)}</button> <button${(0,_index_js_Bpk4pd78_js__WEBPACK_IMPORTED_MODULE_0__.ab)("btn svelte-193t4hn",void 0,{"btn-danger":n,"btn-primary":!n})}>${(0,_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.P)(c)}</button></div></div></div>`):l.push("<!--[-1-->"),l.push("<!--]-->"),(0,_index_js_Bpk4pd78_js__WEBPACK_IMPORTED_MODULE_0__.a9)(t,{show:a,title:i,message:o,confirmText:c,cancelText:d,danger:n});});}


//# sourceMappingURL=ConfirmDialog.js-Dz1DU4Fg.js.map


/***/ }),

/***/ 51975:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   S: () => (/* binding */ S)
/* harmony export */ });
/* harmony import */ var _index_js_Bpk4pd78_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(46706);
/* harmony import */ var _licenseStore_js_B9Y9XKDa_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(25607);
/* harmony import */ var _attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(89831);
/* harmony import */ var _exports_js_CSfjgVlQ_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(42623);
/* harmony import */ var _utils_js_be9Tdq2_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(71621);
/* harmony import */ var _utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(26765);
/* harmony import */ var _root_js_DaHDhESc_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(49860);
/* harmony import */ var _state_svelte_js_enuA4RlU_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(97012);









function S(n$1,t){n$1.component(e=>{var s;let o$1,a=(0,_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_2__.M)(t.feature,""),c=(0,_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_2__.M)(t.showUpgradePrompt,true),m=(0,_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_2__.M)(t.compact,false);const r={voice:"Voice Dictation",ai_polish:"AI Report Polish",chat:"Inter-User Chat",templates:"Templates",macros:"Macros"};o$1=!a||(0,_licenseStore_js_B9Y9XKDa_js__WEBPACK_IMPORTED_MODULE_1__.p)(a),(0,_index_js_Bpk4pd78_js__WEBPACK_IMPORTED_MODULE_0__.a4)(s??={},"$isLicenseActive",_licenseStore_js_B9Y9XKDa_js__WEBPACK_IMPORTED_MODULE_1__.f)&&o$1?(e.push("<!--[0--><!--[-->"),(0,_index_js_Bpk4pd78_js__WEBPACK_IMPORTED_MODULE_0__.ac)(e,t,"default",{}),e.push("<!--]-->")):c?(e.push(`<!--[1--><div${(0,_index_js_Bpk4pd78_js__WEBPACK_IMPORTED_MODULE_0__.ab)("premium-gate svelte-hklmpl",void 0,{compact:m})}><div class="premium-icon svelte-hklmpl">${(0,_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_2__.P)((0,_index_js_Bpk4pd78_js__WEBPACK_IMPORTED_MODULE_0__.a4)(s??={},"$isLicenseExpired",_licenseStore_js_B9Y9XKDa_js__WEBPACK_IMPORTED_MODULE_1__.o)?"⏰":"🔒")}</div> <div class="premium-content svelte-hklmpl"><h4 class="svelte-hklmpl">${(0,_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_2__.P)(r[a]||"Premium Feature")}</h4> `),(0,_index_js_Bpk4pd78_js__WEBPACK_IMPORTED_MODULE_0__.a4)(s??={},"$isLicenseExpired",_licenseStore_js_B9Y9XKDa_js__WEBPACK_IMPORTED_MODULE_1__.o)?e.push('<!--[0--><p class="svelte-hklmpl">Your license has expired. Renew to continue using this feature.</p> <button class="upgrade-btn renew-btn svelte-hklmpl">Renew License</button>'):e.push(`<!--[-1--><p class="svelte-hklmpl">${(0,_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_2__.P)((0,_index_js_Bpk4pd78_js__WEBPACK_IMPORTED_MODULE_0__.a4)(s??={},"$licenseState",_licenseStore_js_B9Y9XKDa_js__WEBPACK_IMPORTED_MODULE_1__.n).error||"This feature requires a premium license.")}</p> <button class="upgrade-btn svelte-hklmpl">${(0,_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_2__.P)((0,_index_js_Bpk4pd78_js__WEBPACK_IMPORTED_MODULE_0__.a4)(s??={},"$licenseState",_licenseStore_js_B9Y9XKDa_js__WEBPACK_IMPORTED_MODULE_1__.n).license?"Review License":"Upgrade Now")}</button>`),e.push("<!--]--></div></div>")):e.push("<!--[-1-->"),e.push("<!--]-->"),s&&(0,_index_js_Bpk4pd78_js__WEBPACK_IMPORTED_MODULE_0__.a5)(s),(0,_index_js_Bpk4pd78_js__WEBPACK_IMPORTED_MODULE_0__.a9)(t,{feature:a,showUpgradePrompt:c,compact:m});});}


//# sourceMappingURL=PremiumGate.js-Bw-ap5oL.js.map


/***/ }),

/***/ 46111:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   t: () => (/* binding */ t)
/* harmony export */ });
function o(){return "solo"}const i=o(),t=i==="solo";


//# sourceMappingURL=edition.js-uvdNrYfQ.js.map


/***/ }),

/***/ 25607:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   d: () => (/* binding */ d),
/* harmony export */   f: () => (/* binding */ f),
/* harmony export */   n: () => (/* binding */ n),
/* harmony export */   o: () => (/* binding */ o),
/* harmony export */   p: () => (/* binding */ p),
/* harmony export */   w: () => (/* binding */ w)
/* harmony export */ });
/* harmony import */ var _index2_js_BVygkZUa_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(27247);


const c={isActivated:false,license:null,features:[],expiresAt:null,lastValidated:null,offlineGraceUntil:null,validationStatus:"inactive",error:null,isLoading:false,serverUrl:""},n=(0,_index2_js_BVygkZUa_js__WEBPACK_IMPORTED_MODULE_0__.z)(c),f=(0,_index2_js_BVygkZUa_js__WEBPACK_IMPORTED_MODULE_0__.B)(n,e=>!(!e.isActivated||!e.license||e.expiresAt&&new Date(e.expiresAt)<new Date||e.offlineGraceUntil&&new Date(e.offlineGraceUntil)<new Date)),o=(0,_index2_js_BVygkZUa_js__WEBPACK_IMPORTED_MODULE_0__.B)(n,e=>e.license?!!(e.expiresAt&&new Date(e.expiresAt)<new Date):false),w=(0,_index2_js_BVygkZUa_js__WEBPACK_IMPORTED_MODULE_0__.B)(n,e=>e.features||[]),p=e=>{const r=(0,_index2_js_BVygkZUa_js__WEBPACK_IMPORTED_MODULE_0__.E)(n);return !r.isActivated||r.expiresAt&&new Date(r.expiresAt)<new Date||r.offlineGraceUntil&&new Date(r.offlineGraceUntil)<new Date?false:r.features?.includes(e)||false},d={async initialize(){},setServerUrl(e){},async activate(e){return {success:false,error:"Not in browser"}},async validateOnline(){},async deactivate(){return {success:false}},clear(){},getDaysRemaining(){const e=(0,_index2_js_BVygkZUa_js__WEBPACK_IMPORTED_MODULE_0__.E)(n);if(!e.expiresAt)return null;const r=new Date(e.expiresAt)-new Date;return Math.max(0,Math.ceil(r/(1e3*60*60*24)))},async getSubscriptionStatus(){return null},async setupAutoRenew(e){return {success:false,error:"Not in browser"}},async changeAutoRenewPlan(e){return {success:false,error:"Not in browser"}},getTopUpUrl(e){const r=(0,_index2_js_BVygkZUa_js__WEBPACK_IMPORTED_MODULE_0__.E)(n);if(!r.serverUrl||!r.license?.key)return null;let i=r.serverUrl;const t=new URLSearchParams;return t.set("license_key",r.license.key),e&&t.set("plan_id",String(e)),`${i}?${t.toString()}`},async toggleAutoRenew(e){return {success:false,error:"Not in browser"}}};


//# sourceMappingURL=licenseStore.js-B9Y9XKDa.js.map


/***/ }),

/***/ 97012:
/***/ ((__unused_webpack___webpack_module__, __unused_webpack___webpack_exports__, __webpack_require__) => {

/* harmony import */ var _attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(89831);
/* harmony import */ var _exports_js_CSfjgVlQ_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(42623);
/* harmony import */ var _utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(26765);
/* harmony import */ var _root_js_DaHDhESc_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(49860);





const o=_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_0__.z.toString().includes("$$")||/function \w+\(\) \{\}/.test(_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_0__.z.toString()),r="a:";o&&new URL(r);
//# sourceMappingURL=state.svelte.js-enuA4RlU.js.map


/***/ }),

/***/ 49437:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ K)
/* harmony export */ });
/* harmony import */ var _chunks_index_js_Bpk4pd78_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(46706);
/* harmony import */ var _chunks_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(89831);
/* harmony import */ var _chunks_exports_js_CSfjgVlQ_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(42623);
/* harmony import */ var _chunks_utils_js_be9Tdq2_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(71621);
/* harmony import */ var _chunks_utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(26765);
/* harmony import */ var _chunks_root_js_DaHDhESc_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(49860);
/* harmony import */ var _chunks_state_svelte_js_enuA4RlU_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(97012);
/* harmony import */ var _chunks_ConfirmDialog_js_Dz1DU4Fg_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(48349);
/* harmony import */ var _chunks_PremiumGate_js_Bw_ap5oL_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(51975);
/* harmony import */ var _chunks_licenseStore_js_B9Y9XKDa_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(25607);
/* harmony import */ var _chunks_edition_js_uvdNrYfQ_js__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(46111);
/* harmony import */ var _chunks_index2_js_BVygkZUa_js__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(27247);













function K(c,T){c.component(t$1=>{let p$1,o,u$1,h=[],v="",g=false;p$1=(0,_chunks_licenseStore_js_B9Y9XKDa_js__WEBPACK_IMPORTED_MODULE_9__.p)("templates"),o=h,o.reduce((s,a)=>{const i=a.category||"general";return s[i]||(s[i]=[]),s[i].push(a),s},{}),u$1=_chunks_edition_js_uvdNrYfQ_js__WEBPACK_IMPORTED_MODULE_10__.t,(0,_chunks_index_js_Bpk4pd78_js__WEBPACK_IMPORTED_MODULE_0__.aa)("ubkcxg",t$1,s=>{s.title(a=>{a.push("<title>Report Templates - KrisPoint</title>");});}),p$1?(t$1.push(`<!--[-1--><div class="templates-page svelte-ubkcxg"><div class="page-header svelte-ubkcxg"><p class="svelte-ubkcxg">Professional radiology report templates for faster reporting</p> <div class="header-actions svelte-ubkcxg"><div class="search-box svelte-ubkcxg"><input type="text" placeholder="Search templates..."${(0,_chunks_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.k)("value",v)} class="search-input svelte-ubkcxg"/></div> `),u$1?t$1.push(`<!--[0--><button class="btn btn-primary svelte-ubkcxg"><span>+</span> Create ${(0,_chunks_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.P)("")}Template</button>`):t$1.push("<!--[-1-->"),t$1.push("<!--]--></div></div> "),t$1.push("<!--[-1-->"),t$1.push("<!--]--> "),t$1.push('<!--[0--><div class="loading-state svelte-ubkcxg"><div class="spinner svelte-ubkcxg"></div> <p>Loading templates...</p></div>'),t$1.push("<!--]--></div> "),t$1.push("<!--[-1-->"),t$1.push("<!--]--> "),t$1.push("<!--[-1-->"),t$1.push("<!--]--> "),(0,_chunks_ConfirmDialog_js_Dz1DU4Fg_js__WEBPACK_IMPORTED_MODULE_7__.u)(t$1,{show:g,title:"Delete Template",message:"Are you sure you want to delete this template? This action cannot be undone.",confirmText:"Delete",confirmClass:"danger"}),t$1.push("<!---->")):(t$1.push('<!--[0--><div class="templates-page svelte-ubkcxg">'),(0,_chunks_PremiumGate_js_Bw_ap5oL_js__WEBPACK_IMPORTED_MODULE_8__.S)(t$1,{feature:"templates"}),t$1.push("<!----></div>")),t$1.push("<!--]-->");});}


//# sourceMappingURL=_page.svelte.js-BOM5Zjww.js.map


/***/ })

};
