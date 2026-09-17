export const id = 5444;
export const ids = [5444];
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

/***/ 97012:
/***/ ((__unused_webpack___webpack_module__, __unused_webpack___webpack_exports__, __webpack_require__) => {

/* harmony import */ var _attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(89831);
/* harmony import */ var _exports_js_CSfjgVlQ_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(42623);
/* harmony import */ var _utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(26765);
/* harmony import */ var _root_js_DaHDhESc_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(49860);





const o=_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_0__.z.toString().includes("$$")||/function \w+\(\) \{\}/.test(_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_0__.z.toString()),r="a:";o&&new URL(r);
//# sourceMappingURL=state.svelte.js-enuA4RlU.js.map


/***/ }),

/***/ 15444:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _)
/* harmony export */ });
/* harmony import */ var _chunks_index_js_Bpk4pd78_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(46706);
/* harmony import */ var _chunks_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(89831);
/* harmony import */ var _chunks_exports_js_CSfjgVlQ_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(42623);
/* harmony import */ var _chunks_utils_js_be9Tdq2_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(71621);
/* harmony import */ var _chunks_utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(26765);
/* harmony import */ var _chunks_root_js_DaHDhESc_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(49860);
/* harmony import */ var _chunks_state_svelte_js_enuA4RlU_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(97012);
/* harmony import */ var _chunks_authStore_js_BkddknYm_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(57383);
/* harmony import */ var _chunks_index2_js_BVygkZUa_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(27247);










function _(o,m){o.component(a=>{var e;let l,t,i,d=0,u=0,h=0,n=0,g=0,p$1=0;l=(0,_chunks_index_js_Bpk4pd78_js__WEBPACK_IMPORTED_MODULE_0__.a4)(e??={},"$permissions",_chunks_authStore_js_BkddknYm_js__WEBPACK_IMPORTED_MODULE_7__.p)?.includes("reports.create"),t=(0,_chunks_index_js_Bpk4pd78_js__WEBPACK_IMPORTED_MODULE_0__.a4)(e??={},"$permissions",_chunks_authStore_js_BkddknYm_js__WEBPACK_IMPORTED_MODULE_7__.p)?.includes("templates.read"),i=!l&&!t,a.push('<div class="dashboard svelte-1uha8ag"><div class="welcome-section svelte-1uha8ag"><h1 class="svelte-1uha8ag">Welcome to KrisPoint</h1> '),i?a.push('<!--[0--><p class="svelte-1uha8ag">Patient registration and study management</p> <div class="quick-actions svelte-1uha8ag"><a href="/worklist" class="action-card primary svelte-1uha8ag"><div class="action-icon svelte-1uha8ag">📋</div> <div class="action-content svelte-1uha8ag"><h3 class="svelte-1uha8ag">Worklist</h3> <p class="svelte-1uha8ag">Register patients and manage studies</p></div></a> <a href="/settings" class="action-card svelte-1uha8ag"><div class="action-icon svelte-1uha8ag">⚙️</div> <div class="action-content svelte-1uha8ag"><h3 class="svelte-1uha8ag">Settings</h3> <p class="svelte-1uha8ag">Configure your preferences</p></div></a></div>'):(a.push('<!--[-1--><p class="svelte-1uha8ag">AI-powered voice dictation for professional radiology reporting</p> <div class="quick-actions svelte-1uha8ag"><button class="action-card primary svelte-1uha8ag"><div class="action-icon svelte-1uha8ag">📝</div> <div class="action-content svelte-1uha8ag"><h3 class="svelte-1uha8ag">New Report</h3> <p class="svelte-1uha8ag">Start dictating a new radiology report</p></div></button> <a href="/reporting" class="action-card svelte-1uha8ag"><div class="action-icon svelte-1uha8ag">⚡</div> <div class="action-content svelte-1uha8ag"><h3 class="svelte-1uha8ag">Continue Reporting</h3> <p class="svelte-1uha8ag">Resume your current report</p></div></a> '),t?a.push('<!--[0--><a href="/templates" class="action-card svelte-1uha8ag"><div class="action-icon svelte-1uha8ag">📋</div> <div class="action-content svelte-1uha8ag"><h3 class="svelte-1uha8ag">Templates</h3> <p class="svelte-1uha8ag">Manage report templates</p></div></a>'):a.push("<!--[-1-->"),a.push("<!--]--></div>")),a.push("<!--]--></div> "),i?a.push(`<!--[0--><div class="stats-section svelte-1uha8ag"><div class="stat-card svelte-1uha8ag"><div class="stat-number svelte-1uha8ag">${(0,_chunks_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.P)(d)}</div> <div class="stat-label svelte-1uha8ag">Pending Studies</div></div> <div class="stat-card svelte-1uha8ag"><div class="stat-number svelte-1uha8ag">${(0,_chunks_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.P)(u)}</div> <div class="stat-label svelte-1uha8ag">In Progress</div></div> <div class="stat-card svelte-1uha8ag"><div class="stat-number svelte-1uha8ag">${(0,_chunks_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.P)(h)}</div> <div class="stat-label svelte-1uha8ag">Completed Today</div></div></div>`):(a.push('<!--[-1--><div class="recent-section svelte-1uha8ag"><div class="section-header svelte-1uha8ag"><h2 class="svelte-1uha8ag">Recent Reports</h2> <a href="/reports" class="view-all-link svelte-1uha8ag">View all reports</a></div> '),a.push('<!--[0--><div class="loading-state svelte-1uha8ag"><div class="loading-spinner svelte-1uha8ag"></div> <p class="svelte-1uha8ag">Loading reports...</p></div>'),a.push(`<!--]--></div> <div class="stats-section svelte-1uha8ag"><div class="stat-card svelte-1uha8ag"><div class="stat-number svelte-1uha8ag">${(0,_chunks_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.P)(p$1)}</div> <div class="stat-label svelte-1uha8ag">Reports This Week</div></div> <div class="stat-card svelte-1uha8ag"><div class="stat-number svelte-1uha8ag">${(0,_chunks_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.P)(g)}</div> <div class="stat-label svelte-1uha8ag">Draft Reports</div></div> <div class="stat-card svelte-1uha8ag"><div class="stat-number svelte-1uha8ag">${(0,_chunks_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.P)(n)}</div> <div class="stat-label svelte-1uha8ag">Total Reports</div></div></div>`)),a.push("<!--]--></div>"),e&&(0,_chunks_index_js_Bpk4pd78_js__WEBPACK_IMPORTED_MODULE_0__.a5)(e);});}


//# sourceMappingURL=_page.svelte.js-DbP1-hAQ.js.map


/***/ })

};
