export const id = 8882;
export const ids = [8882];
export const modules = {

/***/ 73212:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   w: () => (/* binding */ w)
/* harmony export */ });
/* harmony import */ var _index_js_Bpk4pd78_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(46706);
/* harmony import */ var _attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(89831);



function w(h,u){h.component(a=>{let t=(0,_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.M)(u.startDate,""),o=(0,_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.M)(u.endDate,""),l=(0,_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.M)(u.selectedPreset,"all");const r=[{value:"all",label:"All Time"},{value:"today",label:"Today"},{value:"7days",label:"Last 7 Days"},{value:"30days",label:"Last 30 Days"},{value:"3months",label:"Past 3 Months"},{value:"year",label:"Past Year"},{value:"custom-day",label:"Custom Day"},{value:"custom-range",label:"Custom Range"}];function p(){return l==="custom-day"&&t?n(t):l==="custom-range"&&t&&o?`${n(t)} - ${n(o)}`:r.find(s=>s.value===l)?.label||"All Time"}function n(e){return e?new Date(e).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}):""}p(),a.push('<div class="date-filter-dropdown svelte-mw7fh5">'),a.select({class:"preset-select",value:l},e=>{e.push("<!--[-->");const s=(0,_index_js_Bpk4pd78_js__WEBPACK_IMPORTED_MODULE_0__.a6)(r);for(let i=0,d=s.length;i<d;i++){let m=s[i];e.option({value:m.value,class:""},v=>{v.push(`${(0,_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.P)(m.label)}`);},"svelte-mw7fh5");}e.push("<!--]-->");},"svelte-mw7fh5"),a.push(" "),a.push("<!--[-1-->"),a.push("<!--]--></div>"),(0,_index_js_Bpk4pd78_js__WEBPACK_IMPORTED_MODULE_0__.a9)(u,{startDate:t,endDate:o,selectedPreset:l});});}


//# sourceMappingURL=DateFilterDropdown.js-DCJTlqe0.js.map


/***/ }),

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

/***/ 97012:
/***/ ((__unused_webpack___webpack_module__, __unused_webpack___webpack_exports__, __webpack_require__) => {

/* harmony import */ var _attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(89831);
/* harmony import */ var _exports_js_CSfjgVlQ_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(42623);
/* harmony import */ var _utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(26765);
/* harmony import */ var _root_js_DaHDhESc_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(49860);





const o=_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_0__.z.toString().includes("$$")||/function \w+\(\) \{\}/.test(_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_0__.z.toString()),r="a:";o&&new URL(r);
//# sourceMappingURL=state.svelte.js-enuA4RlU.js.map


/***/ }),

/***/ 68882:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ z)
/* harmony export */ });
/* harmony import */ var _chunks_index_js_Bpk4pd78_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(46706);
/* harmony import */ var _chunks_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(89831);
/* harmony import */ var _chunks_exports_js_CSfjgVlQ_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(42623);
/* harmony import */ var _chunks_utils_js_be9Tdq2_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(71621);
/* harmony import */ var _chunks_utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(26765);
/* harmony import */ var _chunks_root_js_DaHDhESc_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(49860);
/* harmony import */ var _chunks_state_svelte_js_enuA4RlU_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(97012);
/* harmony import */ var _chunks_authStore_js_BkddknYm_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(57383);
/* harmony import */ var _chunks_DateFilterDropdown_js_DCJTlqe0_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(73212);
/* harmony import */ var _chunks_index2_js_BVygkZUa_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(27247);











function z(h,F){h.component(e=>{var p$1;let c={categories:[],actions:[],severities:[]},f="",n="",m="",x="",g="",d="",j="all";(0,_chunks_index_js_Bpk4pd78_js__WEBPACK_IMPORTED_MODULE_0__.a4)(p$1??={},"$permissions",_chunks_authStore_js_BkddknYm_js__WEBPACK_IMPORTED_MODULE_7__.p)?.includes("users.manage"),(0,_chunks_index_js_Bpk4pd78_js__WEBPACK_IMPORTED_MODULE_0__.aa)("j8xf1e",e,s=>{s.title(l=>{l.push("<title>Audit Logs - KrisPoint Admin</title>");});}),e.push('<div class="admin-container svelte-j8xf1e">'),e.push("<!--[-1-->"),e.push(`<!--]--> <div class="filters-section svelte-j8xf1e"><div class="filters-row svelte-j8xf1e"><div class="search-box svelte-j8xf1e"><input type="text" placeholder="Search logs..."${(0,_chunks_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.k)("value",f)} class="svelte-j8xf1e"/></div> `),e.select({value:n,class:"filter-select"},s=>{s.option({value:""},t=>{t.push("All Categories");}),s.push("<!--[-->");const l=(0,_chunks_index_js_Bpk4pd78_js__WEBPACK_IMPORTED_MODULE_0__.a6)(c.categories);for(let t=0,a=l.length;t<a;t++){let i=l[t];s.option({value:i},o=>{o.push(`${(0,_chunks_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.P)(i)}`);});}s.push("<!--]-->");},"svelte-j8xf1e"),e.push(" "),e.select({value:m,class:"filter-select"},s=>{s.option({value:""},t=>{t.push("All Severities");}),s.push("<!--[-->");const l=(0,_chunks_index_js_Bpk4pd78_js__WEBPACK_IMPORTED_MODULE_0__.a6)(c.severities);for(let t=0,a=l.length;t<a;t++){let i=l[t];s.option({value:i},o=>{o.push(`${(0,_chunks_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.P)(i)}`);});}s.push("<!--]-->");},"svelte-j8xf1e"),e.push(" "),e.select({value:x,class:"filter-select"},s=>{s.option({value:""},t=>{t.push("All Actions");}),s.push("<!--[-->");const l=(0,_chunks_index_js_Bpk4pd78_js__WEBPACK_IMPORTED_MODULE_0__.a6)(c.actions);for(let t=0,a=l.length;t<a;t++){let i=l[t];s.option({value:i},o=>{o.push(`${(0,_chunks_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.P)(i)}`);});}s.push("<!--]-->");},"svelte-j8xf1e"),e.push('</div> <div class="filters-row svelte-j8xf1e">'),(0,_chunks_DateFilterDropdown_js_DCJTlqe0_js__WEBPACK_IMPORTED_MODULE_8__.w)(e,{startDate:g,endDate:d,selectedPreset:j}),e.push('<!----> <button class="btn-primary svelte-j8xf1e">Apply Filters</button> <button class="btn-secondary svelte-j8xf1e">Clear</button></div></div> '),e.push('<!--[0--><div class="loading-state svelte-j8xf1e"><div class="spinner svelte-j8xf1e"></div> <p>Loading audit logs...</p></div>'),e.push("<!--]--></div>"),p$1&&(0,_chunks_index_js_Bpk4pd78_js__WEBPACK_IMPORTED_MODULE_0__.a5)(p$1);});}


//# sourceMappingURL=_page.svelte.js-EorDrrWM.js.map


/***/ })

};
