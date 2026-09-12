export const id = 5887;
export const ids = [5887];
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

/***/ 75887:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ X)
/* harmony export */ });
/* harmony import */ var _index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(98579);
/* harmony import */ var _utils_Ca_EoiSx_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(79936);
/* harmony import */ var _state_svelte_xhjpmOz7_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(25781);
/* harmony import */ var _authStore_wTOTagk_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(88609);
/* harmony import */ var _DateFilterDropdown_CmsvNQjW_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(89000);
/* harmony import */ var _index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(72912);







function X(e,C){(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__._)();var s;let l,o,c=[],v=[],u="card",m="",p="",h$1="all",b="";const g=["CT","MRI","X-Ray","Ultrasound","Mammography","Fluoroscopy","Nuclear Medicine","PET-CT"];(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s??={},"$permissions",_authStore_wTOTagk_js__WEBPACK_IMPORTED_MODULE_3__.h).includes("reports.submit"),l=c.filter(t=>true),o=v.filter(t=>true),l.length>0||o.length>0;const a=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.z)(g);e.out.push('<div class="returned-reports-page svelte-eesdbk">'),e.out.push("<!--[!-->"),e.out.push('<!--]--> <div class="page-controls svelte-eesdbk">'),(0,_DateFilterDropdown_CmsvNQjW_js__WEBPACK_IMPORTED_MODULE_4__._)(e,{startDate:m,endDate:p,selectedPreset:h$1}),e.out.push('<!----> <select class="modality-filter svelte-eesdbk">'),e.select_value=b,e.out.push(`<option value=""${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.Z)(e,"")} class="svelte-eesdbk">All Modalities</option><!--[-->`);for(let t=0,r=a.length;t<r;t++){let i=a[t];e.out.push(`<option${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("value",i)}${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.Z)(e,i)} class="svelte-eesdbk">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(i)}</option>`);}e.out.push("<!--]-->"),e.select_value=void 0,e.out.push("</select> "),e.out.push("<!--[!-->"),e.out.push(`<!--]--> <div class="view-toggle svelte-eesdbk"><button${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.H)("toggle-btn svelte-eesdbk",void 0,{active:u==="card"})} title="Card View">▦</button> <button${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.H)("toggle-btn svelte-eesdbk",void 0,{active:u==="table"})} title="Table View">☰</button></div></div> `),e.out.push("<!--[-->"),e.out.push('<div class="loading svelte-eesdbk">Loading returned items...</div>'),e.out.push("<!--]--></div>"),s&&(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.l)(s),(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.f)();}


//# sourceMappingURL=_page.svelte-CROritCV.js.map


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

/***/ 25781:
/***/ ((__unused_webpack___webpack_module__, __unused_webpack___webpack_exports__, __webpack_require__) => {

/* harmony import */ var _index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(98579);


const o=_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.g.toString().includes("$$")||/function \w+\(\) \{\}/.test(_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.g.toString());o&&new URL("https://example.com");
//# sourceMappingURL=state.svelte-xhjpmOz7.js.map


/***/ })

};
