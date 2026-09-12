export const id = 4667;
export const ids = [4667];
export const modules = {

/***/ 89000:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   _: () => (/* binding */ _)
/* harmony export */ });
/* harmony import */ var _index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(98579);


function _(e,l){(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__._)();let a=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.o)(l.startDate,""),r=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.o)(l.endDate,""),s=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.o)(l.selectedPreset,"all");const i=[{value:"all",label:"All Time"},{value:"today",label:"Today"},{value:"7days",label:"Last 7 Days"},{value:"30days",label:"Last 30 Days"},{value:"3months",label:"Past 3 Months"},{value:"year",label:"Past Year"},{value:"custom-day",label:"Custom Day"},{value:"custom-range",label:"Custom Range"}];function h(){return s==="custom-day"&&a?n(a):s==="custom-range"&&a&&r?`${n(a)} - ${n(r)}`:i.find(u=>u.value===s)?.label||"All Time"}function n(t){return t?new Date(t).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}):""}h();const v=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.z)(i);e.out.push('<div class="date-filter-dropdown svelte-hd729a"><select class="preset-select svelte-hd729a">'),e.select_value=s,e.out.push("<!--[-->");for(let t=0,u=v.length;t<u;t++){let o=v[t];e.out.push(`<option${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("value",o.value)}${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.Z)(e,o.value)} class="svelte-hd729a">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(o.label)}</option>`);}e.out.push("<!--]-->"),e.select_value=void 0,e.out.push("</select> "),e.out.push("<!--[!-->"),e.out.push("<!--]--></div>"),(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.t)(l,{startDate:a,endDate:r,selectedPreset:s}),(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.f)();}


//# sourceMappingURL=DateFilterDropdown-CmsvNQjW.js.map


/***/ }),

/***/ 26421:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   t: () => (/* binding */ t)
/* harmony export */ });
let o=new Map;const t={register(e,n){this.unregister(e),o.set(e,n),console.log(`[SSE] Registered connection: ${e}, total: ${o.size}`);},unregister(e){const n=o.get(e);n&&(n.close(),o.delete(e),console.log(`[SSE] Unregistered connection: ${e}, total: ${o.size}`));},closeAll(){console.log(`[SSE] Closing all ${o.size} connections`),o.forEach((e,n)=>{try{e.close(),console.log(`[SSE] Closed connection: ${n}`);}catch(s){console.error(`[SSE] Error closing ${n}:`,s);}}),o.clear();},getCount(){return o.size}};


//# sourceMappingURL=SSEManager-DiJ-NMik.js.map


/***/ }),

/***/ 64667:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ q)
/* harmony export */ });
/* harmony import */ var _index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(98579);
/* harmony import */ var _index_server_B0jzk0X3_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(83230);
/* harmony import */ var _utils_Ca_EoiSx_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(79936);
/* harmony import */ var _state_svelte_xhjpmOz7_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(25781);
/* harmony import */ var _authStore_wTOTagk_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(88609);
/* harmony import */ var _DateFilterDropdown_CmsvNQjW_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(89000);
/* harmony import */ var _SSEManager_DiJ_NMik_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(26421);
/* harmony import */ var _index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(72912);









function v(e){return e?{ct:"CT",mri:"MRI",xray:"X-Ray",us:"Ultrasound",mg:"Mammography",fl:"Fluoroscopy",nm:"Nuclear Medicine"}[e.toLowerCase()]||P(e):""}function P(e){return e?e.charAt(0).toUpperCase()+e.slice(1).toLowerCase():""}function q(e$1,m){(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__._)();var r;let o,l;const p="pending-reviews";let d=[],h$1=[],g="mine",f="",M="",_$1="",b="all",n="card";const j=["CT","MRI","X-Ray","Ultrasound","Mammography","Fluoroscopy","Nuclear Medicine","PET-CT"];(0,_index_server_B0jzk0X3_js__WEBPACK_IMPORTED_MODULE_1__.e)(()=>{_SSEManager_DiJ_NMik_js__WEBPACK_IMPORTED_MODULE_6__.t.unregister(p);}),(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(r??={},"$permissions",_authStore_wTOTagk_js__WEBPACK_IMPORTED_MODULE_4__.h).includes("reports.review"),o=d.filter(t=>(v(t.modality),true)),l=h$1.filter(t=>(v(t.modality),true)),o.length+l.length;const a=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.z)(j);e$1.out.push('<div class="pending-reviews-page svelte-nj9uru"><div class="page-controls svelte-nj9uru"><select class="filter-select svelte-nj9uru">'),e$1.select_value=g,e$1.out.push(`<option value="mine"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.Z)(e$1,"mine")} class="svelte-nj9uru">Assigned to Me</option><option value="all"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.Z)(e$1,"all")} class="svelte-nj9uru">All Pending Reviews</option>`),e$1.select_value=void 0,e$1.out.push("</select> "),(0,_DateFilterDropdown_CmsvNQjW_js__WEBPACK_IMPORTED_MODULE_5__._)(e$1,{startDate:M,endDate:_$1,selectedPreset:b}),e$1.out.push('<!----> <select class="modality-filter svelte-nj9uru">'),e$1.select_value=f,e$1.out.push(`<option value=""${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.Z)(e$1,"")} class="svelte-nj9uru">All Modalities</option><!--[-->`);for(let t=0,u=a.length;t<u;t++){let i=a[t];e$1.out.push(`<option${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("value",i)}${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.Z)(e$1,i)} class="svelte-nj9uru">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(i)}</option>`);}e$1.out.push("<!--]-->"),e$1.select_value=void 0,e$1.out.push("</select> "),e$1.out.push("<!--[!-->"),e$1.out.push(`<!--]--> <div class="view-toggle svelte-nj9uru"><button${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.H)("toggle-btn svelte-nj9uru",void 0,{active:n==="card"})} title="Card View">▦</button> <button${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.H)("toggle-btn svelte-nj9uru",void 0,{active:n==="table"})} title="Table View">☰</button></div></div> `),e$1.out.push("<!--[!-->"),e$1.out.push("<!--]--> "),e$1.out.push("<!--[-->"),e$1.out.push('<div class="loading svelte-nj9uru">Loading pending reviews...</div>'),e$1.out.push("<!--]--></div> "),e$1.out.push("<!--[!-->"),e$1.out.push("<!--]-->"),r&&(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.l)(r),(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.f)();}


//# sourceMappingURL=_page.svelte-D1ZcnhBX.js.map


/***/ }),

/***/ 88609:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   d: () => (/* binding */ d),
/* harmony export */   e: () => (/* binding */ e),
/* harmony export */   f: () => (/* binding */ f),
/* harmony export */   h: () => (/* binding */ h),
/* harmony export */   l: () => (/* binding */ l),
/* harmony export */   p: () => (/* binding */ p)
/* harmony export */ });
/* harmony import */ var _index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(72912);


const n={pendingReviews:0,returnedReports:0,loading:false,lastFetched:null};function i(){const{subscribe:t,set:a,update:c}=(0,_index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_0__.z)(n);return {subscribe:t,async loadCounts(){},async refreshAfterAction(){await this.loadCounts();},reset(){a(n);}}}const d=i(),o={isAuthenticated:false,currentUser:null,permissions:[],isLoading:false,error:null},e=(0,_index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_0__.z)(o),l=(0,_index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_0__.E)(e,t=>t.isAuthenticated),p=(0,_index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_0__.E)(e,t=>t.currentUser),h=(0,_index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_0__.E)(e,t=>t.permissions);(0,_index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_0__.E)(e,t=>t.error);const f=(0,_index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_0__.E)(e,t=>t.isLoading);


//# sourceMappingURL=authStore-_wTOTagk.js.map


/***/ }),

/***/ 83230:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   e: () => (/* binding */ e)
/* harmony export */ });
/* harmony import */ var _index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(98579);


function e(o){var t=_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.w;(t.d??=[]).push(o);}


//# sourceMappingURL=index-server-B0jzk0X3.js.map


/***/ }),

/***/ 25781:
/***/ ((__unused_webpack___webpack_module__, __unused_webpack___webpack_exports__, __webpack_require__) => {

/* harmony import */ var _index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(98579);


const o=_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.g.toString().includes("$$")||/function \w+\(\) \{\}/.test(_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.g.toString());o&&new URL("https://example.com");
//# sourceMappingURL=state.svelte-xhjpmOz7.js.map


/***/ })

};
