export const id = 3423;
export const ids = [3423];
export const modules = {

/***/ 57383:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   d: () => (/* binding */ d),
/* harmony export */   l: () => (/* binding */ l),
/* harmony export */   p: () => (/* binding */ p),
/* harmony export */   s: () => (/* binding */ s)
/* harmony export */ });
/* harmony import */ var _index2_js_BVygkZUa_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(27247);


const r={pendingReviews:0,returnedReports:0,loading:false,lastFetched:null};function a(){const{subscribe:t,set:i,update:c}=(0,_index2_js_BVygkZUa_js__WEBPACK_IMPORTED_MODULE_0__.z)(r);return {subscribe:t,async loadCounts(){},async refreshAfterAction(){await this.loadCounts();},reset(){i(r);}}}a();const o={isAuthenticated:false,currentUser:null,permissions:[],isLoading:false,error:null},s=(0,_index2_js_BVygkZUa_js__WEBPACK_IMPORTED_MODULE_0__.z)(o),d=(0,_index2_js_BVygkZUa_js__WEBPACK_IMPORTED_MODULE_0__.B)(s,t=>t.isAuthenticated),l=(0,_index2_js_BVygkZUa_js__WEBPACK_IMPORTED_MODULE_0__.B)(s,t=>t.currentUser),p=(0,_index2_js_BVygkZUa_js__WEBPACK_IMPORTED_MODULE_0__.B)(s,t=>t.permissions);(0,_index2_js_BVygkZUa_js__WEBPACK_IMPORTED_MODULE_0__.B)(s,t=>t.error);(0,_index2_js_BVygkZUa_js__WEBPACK_IMPORTED_MODULE_0__.B)(s,t=>t.isLoading);


//# sourceMappingURL=authStore.js-BkddknYm.js.map


/***/ }),

/***/ 24396:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   n: () => (/* binding */ n)
/* harmony export */ });
/* harmony import */ var _index_js_Bpk4pd78_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(46706);


function n(o){_index_js_Bpk4pd78_js__WEBPACK_IMPORTED_MODULE_0__.a2.r.on_destroy(o);}


//# sourceMappingURL=index-server.js-C4u4QcZj.js.map


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

/***/ 93423:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* binding */ q)
});

// EXTERNAL MODULE: ./build/server/chunks/chunks/index.js-Bpk4pd78.js
var index_js_Bpk4pd78 = __webpack_require__(46706);
// EXTERNAL MODULE: ./build/server/chunks/chunks/index-server.js-C4u4QcZj.js
var index_server_js_C4u4QcZj = __webpack_require__(24396);
// EXTERNAL MODULE: ./build/server/chunks/chunks/exports.js-CSfjgVlQ.js
var exports_js_CSfjgVlQ = __webpack_require__(42623);
// EXTERNAL MODULE: ./build/server/chunks/chunks/utils.js-_be9Tdq2.js
var utils_js_be9Tdq2 = __webpack_require__(71621);
// EXTERNAL MODULE: ./build/server/chunks/chunks/utils2.js-2HFXsNTe.js
var utils2_js_2HFXsNTe = __webpack_require__(26765);
// EXTERNAL MODULE: ./build/server/chunks/chunks/root.js-DaHDhESc.js
var root_js_DaHDhESc = __webpack_require__(49860);
// EXTERNAL MODULE: ./build/server/chunks/chunks/state.svelte.js-enuA4RlU.js
var state_svelte_js_enuA4RlU = __webpack_require__(97012);
;// CONCATENATED MODULE: ./build/server/chunks/chunks/stores.js-CFZzEZI8.js







const r=()=>{const t=(0,index_js_Bpk4pd78.a3)("__svelte__");return {page:{subscribe:t.page.subscribe},navigating:{subscribe:t.navigating.subscribe},updated:t.updated}},u={subscribe(t){return r().page.subscribe(t)}};


//# sourceMappingURL=stores.js-CFZzEZI8.js.map

// EXTERNAL MODULE: ./build/server/chunks/chunks/authStore.js-BkddknYm.js
var authStore_js_BkddknYm = __webpack_require__(57383);
// EXTERNAL MODULE: ./build/server/chunks/chunks/licenseStore.js-B9Y9XKDa.js
var licenseStore_js_B9Y9XKDa = __webpack_require__(25607);
// EXTERNAL MODULE: ./build/server/chunks/chunks/attributes.js-BJlrMZid.js
var attributes_js_BJlrMZid = __webpack_require__(89831);
// EXTERNAL MODULE: ./build/server/chunks/chunks/index2.js-BVygkZUa.js
var index2_js_BVygkZUa = __webpack_require__(27247);
;// CONCATENATED MODULE: ./build/server/chunks/entries/pages/_layout.svelte.js-Dtgm8aYK.js













function e(s,i){s.component(t=>{t.push('<!--[0--><div class="terms-loading svelte-lq5joc" aria-label="Loading KrisPoint"></div>'),t.push("<!--]-->");});}function q(s$1,i){s$1.component(t=>{var o;(0,index_server_js_C4u4QcZj.n)(()=>{}),(0,index_js_Bpk4pd78.a4)(o??={},"$authState",authStore_js_BkddknYm.s).isAuthenticated,(0,index_js_Bpk4pd78.a4)(o??={},"$authState",authStore_js_BkddknYm.s).currentUser?.id,(0,index_js_Bpk4pd78.a4)(o??={},"$page",u)?.url?.pathname,t.push("<!--[-1-->"),t.push("<!--]--> "),e(t),t.push("<!---->"),o&&(0,index_js_Bpk4pd78.a5)(o);});}


//# sourceMappingURL=_layout.svelte.js-Dtgm8aYK.js.map


/***/ })

};
