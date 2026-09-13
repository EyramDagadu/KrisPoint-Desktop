export const id = 8873;
export const ids = [8873];
export const modules = {

/***/ 32657:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   w: () => (/* binding */ w)
/* harmony export */ });
/* harmony import */ var _index_js_BPHC9uE5_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(34899);
/* harmony import */ var _attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(89831);



function w(h,u){h.component(a=>{let t=(0,_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.M)(u.startDate,""),o=(0,_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.M)(u.endDate,""),l=(0,_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.M)(u.selectedPreset,"all");const r=[{value:"all",label:"All Time"},{value:"today",label:"Today"},{value:"7days",label:"Last 7 Days"},{value:"30days",label:"Last 30 Days"},{value:"3months",label:"Past 3 Months"},{value:"year",label:"Past Year"},{value:"custom-day",label:"Custom Day"},{value:"custom-range",label:"Custom Range"}];function p(){return l==="custom-day"&&t?n(t):l==="custom-range"&&t&&o?`${n(t)} - ${n(o)}`:r.find(s=>s.value===l)?.label||"All Time"}function n(e){return e?new Date(e).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}):""}p(),a.push('<div class="date-filter-dropdown svelte-mw7fh5">'),a.select({class:"preset-select",value:l},e=>{e.push("<!--[-->");const s=(0,_index_js_BPHC9uE5_js__WEBPACK_IMPORTED_MODULE_0__.a9)(r);for(let i=0,f=s.length;i<f;i++){let m=s[i];e.option({value:m.value,class:""},v=>{v.push(`${(0,_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.P)(m.label)}`);},"svelte-mw7fh5");}e.push("<!--]-->");},"svelte-mw7fh5"),a.push(" "),a.push("<!--[-1-->"),a.push("<!--]--></div>"),(0,_index_js_BPHC9uE5_js__WEBPACK_IMPORTED_MODULE_0__.a5)(u,{startDate:t,endDate:o,selectedPreset:l});});}


//# sourceMappingURL=DateFilterDropdown.js-Cczn1uce.js.map


/***/ }),

/***/ 39777:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   t: () => (/* binding */ t)
/* harmony export */ });
let o=new Map;const t={register(e,n){this.unregister(e),o.set(e,n),console.log(`[SSE] Registered connection: ${e}, total: ${o.size}`);},unregister(e){const n=o.get(e);n&&(n.close(),o.delete(e),console.log(`[SSE] Unregistered connection: ${e}, total: ${o.size}`));},closeAll(){console.log(`[SSE] Closing all ${o.size} connections`),o.forEach((e,n)=>{try{e.close(),console.log(`[SSE] Closed connection: ${n}`);}catch(s){console.error(`[SSE] Error closing ${n}:`,s);}}),o.clear();},getCount(){return o.size}};


//# sourceMappingURL=SSEManager.js-DiJ-NMik.js.map


/***/ }),

/***/ 40298:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   d: () => (/* binding */ d),
/* harmony export */   e: () => (/* binding */ e),
/* harmony export */   f: () => (/* binding */ f),
/* harmony export */   h: () => (/* binding */ h),
/* harmony export */   l: () => (/* binding */ l),
/* harmony export */   p: () => (/* binding */ p)
/* harmony export */ });
/* harmony import */ var _index2_js_B91mjNiV_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(12144);


const n={pendingReviews:0,returnedReports:0,loading:false,lastFetched:null};function i(){const{subscribe:t,set:a,update:c}=(0,_index2_js_B91mjNiV_js__WEBPACK_IMPORTED_MODULE_0__.z)(n);return {subscribe:t,async loadCounts(){},async refreshAfterAction(){await this.loadCounts();},reset(){a(n);}}}const d=i(),o={isAuthenticated:false,currentUser:null,permissions:[],isLoading:false,error:null},e=(0,_index2_js_B91mjNiV_js__WEBPACK_IMPORTED_MODULE_0__.z)(o),l=(0,_index2_js_B91mjNiV_js__WEBPACK_IMPORTED_MODULE_0__.B)(e,t=>t.isAuthenticated),p=(0,_index2_js_B91mjNiV_js__WEBPACK_IMPORTED_MODULE_0__.B)(e,t=>t.currentUser),h=(0,_index2_js_B91mjNiV_js__WEBPACK_IMPORTED_MODULE_0__.B)(e,t=>t.permissions);(0,_index2_js_B91mjNiV_js__WEBPACK_IMPORTED_MODULE_0__.B)(e,t=>t.error);const f=(0,_index2_js_B91mjNiV_js__WEBPACK_IMPORTED_MODULE_0__.B)(e,t=>t.isLoading);


//# sourceMappingURL=authStore.js-Bl2ko8Kh.js.map


/***/ }),

/***/ 50152:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   n: () => (/* binding */ n)
/* harmony export */ });
/* harmony import */ var _index_js_BPHC9uE5_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(34899);


function n(o){_index_js_BPHC9uE5_js__WEBPACK_IMPORTED_MODULE_0__.a2.r.on_destroy(o);}


//# sourceMappingURL=index-server.js-DHhxyrTW.js.map


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

/***/ 18873:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ H)
/* harmony export */ });
/* harmony import */ var _chunks_index_js_BPHC9uE5_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(34899);
/* harmony import */ var _chunks_index_server_js_DHhxyrTW_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(50152);
/* harmony import */ var _chunks_exports_js_CSfjgVlQ_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(42623);
/* harmony import */ var _chunks_utils_js_be9Tdq2_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(71621);
/* harmony import */ var _chunks_utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(26765);
/* harmony import */ var _chunks_root_js_CksVe0PM_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(22967);
/* harmony import */ var _chunks_state_svelte_js_Cm6uwfjG_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(42299);
/* harmony import */ var _chunks_authStore_js_Bl2ko8Kh_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(40298);
/* harmony import */ var _chunks_DateFilterDropdown_js_Cczn1uce_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(32657);
/* harmony import */ var _chunks_SSEManager_js_DiJ_NMik_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(39777);
/* harmony import */ var _chunks_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(89831);
/* harmony import */ var _chunks_index2_js_B91mjNiV_js__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(12144);













function m(s){return s?{ct:"CT",mri:"MRI",xray:"X-Ray",us:"Ultrasound",mg:"Mammography",fl:"Fluoroscopy",nm:"Nuclear Medicine"}[s.toLowerCase()]||L(s):""}function L(s){return s?s.charAt(0).toUpperCase()+s.slice(1).toLowerCase():""}function H(s,r){s.component(t$1=>{var l;let a,p;const g="pending-reviews";let v=[],d=[],h$1="mine",y="",b="",f="",M="all",u="card";const k=["CT","MRI","X-Ray","Ultrasound","Mammography","Fluoroscopy","Nuclear Medicine","PET-CT"];(0,_chunks_index_server_js_DHhxyrTW_js__WEBPACK_IMPORTED_MODULE_1__.n)(()=>{_chunks_SSEManager_js_DiJ_NMik_js__WEBPACK_IMPORTED_MODULE_9__.t.unregister(g);}),(0,_chunks_index_js_BPHC9uE5_js__WEBPACK_IMPORTED_MODULE_0__.a6)(l??={},"$permissions",_chunks_authStore_js_Bl2ko8Kh_js__WEBPACK_IMPORTED_MODULE_7__.h).includes("reports.review"),a=v.filter(e=>(m(e.modality),true)),p=d.filter(e=>(m(e.modality),true)),a.length+p.length,t$1.push('<div class="pending-reviews-page svelte-ikbyog"><div class="page-controls svelte-ikbyog">'),t$1.select({class:"filter-select",value:h$1},e=>{e.option({value:"mine",class:""},i=>{i.push("Assigned to Me");},"svelte-ikbyog"),e.option({value:"all",class:""},i=>{i.push("All Pending Reviews");},"svelte-ikbyog");},"svelte-ikbyog"),t$1.push(" "),(0,_chunks_DateFilterDropdown_js_Cczn1uce_js__WEBPACK_IMPORTED_MODULE_8__.w)(t$1,{startDate:b,endDate:f,selectedPreset:M}),t$1.push("<!----> "),t$1.select({class:"modality-filter",value:y},e=>{e.option({value:"",class:""},o=>{o.push("All Modalities");},"svelte-ikbyog"),e.push("<!--[-->");const i=(0,_chunks_index_js_BPHC9uE5_js__WEBPACK_IMPORTED_MODULE_0__.a9)(k);for(let o=0,w=i.length;o<w;o++){let c=i[o];e.option({value:c,class:""},D=>{D.push(`${(0,_chunks_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_10__.P)(c)}`);},"svelte-ikbyog");}e.push("<!--]-->");},"svelte-ikbyog"),t$1.push(" "),t$1.push("<!--[-1-->"),t$1.push(`<!--]--> <div class="view-toggle svelte-ikbyog"><button${(0,_chunks_index_js_BPHC9uE5_js__WEBPACK_IMPORTED_MODULE_0__.a4)("toggle-btn svelte-ikbyog",void 0,{active:u==="card"})} title="Card View">▦</button> <button${(0,_chunks_index_js_BPHC9uE5_js__WEBPACK_IMPORTED_MODULE_0__.a4)("toggle-btn svelte-ikbyog",void 0,{active:u==="table"})} title="Table View">☰</button></div></div> `),t$1.push("<!--[-1-->"),t$1.push("<!--]--> "),t$1.push('<!--[0--><div class="loading svelte-ikbyog">Loading pending reviews...</div>'),t$1.push("<!--]--></div> "),t$1.push("<!--[-1-->"),t$1.push("<!--]-->"),l&&(0,_chunks_index_js_BPHC9uE5_js__WEBPACK_IMPORTED_MODULE_0__.a7)(l);});}


//# sourceMappingURL=_page.svelte.js-Ba2YmFuO.js.map


/***/ })

};
