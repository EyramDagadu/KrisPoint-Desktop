export const id = 742;
export const ids = [742];
export const modules = {

/***/ 30742:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ P)
/* harmony export */ });
/* harmony import */ var _index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(98579);
/* harmony import */ var _utils_Ca_EoiSx_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(79936);
/* harmony import */ var _state_svelte_xhjpmOz7_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(25781);
/* harmony import */ var _authStore_wTOTagk_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(88609);
/* harmony import */ var _index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(72912);






function P(s,h$1){(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__._)();var e;let a,t,l,c=0,o=0,r=0,d=0,n=0,p=0;a=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(e??={},"$permissions",_authStore_wTOTagk_js__WEBPACK_IMPORTED_MODULE_3__.h)?.includes("reports.create"),t=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(e??={},"$permissions",_authStore_wTOTagk_js__WEBPACK_IMPORTED_MODULE_3__.h)?.includes("templates.read"),l=!a&&!t,s.out.push('<div class="dashboard svelte-qiiuwj"><div class="welcome-section svelte-qiiuwj"><h1 class="svelte-qiiuwj">Welcome to KrisPoint</h1> '),l?(s.out.push("<!--[-->"),s.out.push('<p class="svelte-qiiuwj">Patient registration and study management</p> <div class="quick-actions svelte-qiiuwj"><a href="/worklist" class="action-card primary svelte-qiiuwj"><div class="action-icon svelte-qiiuwj">📋</div> <div class="action-content svelte-qiiuwj"><h3 class="svelte-qiiuwj">Worklist</h3> <p class="svelte-qiiuwj">Register patients and manage studies</p></div></a> <a href="/settings" class="action-card svelte-qiiuwj"><div class="action-icon svelte-qiiuwj">⚙️</div> <div class="action-content svelte-qiiuwj"><h3 class="svelte-qiiuwj">Settings</h3> <p class="svelte-qiiuwj">Configure your preferences</p></div></a></div>')):(s.out.push("<!--[!-->"),s.out.push('<p class="svelte-qiiuwj">AI-powered voice dictation for professional radiology reporting</p> <div class="quick-actions svelte-qiiuwj"><button class="action-card primary svelte-qiiuwj"><div class="action-icon svelte-qiiuwj">📝</div> <div class="action-content svelte-qiiuwj"><h3 class="svelte-qiiuwj">New Report</h3> <p class="svelte-qiiuwj">Start dictating a new radiology report</p></div></button> <a href="/reporting" class="action-card svelte-qiiuwj"><div class="action-icon svelte-qiiuwj">⚡</div> <div class="action-content svelte-qiiuwj"><h3 class="svelte-qiiuwj">Continue Reporting</h3> <p class="svelte-qiiuwj">Resume your current report</p></div></a> '),t?(s.out.push("<!--[-->"),s.out.push('<a href="/templates" class="action-card svelte-qiiuwj"><div class="action-icon svelte-qiiuwj">📋</div> <div class="action-content svelte-qiiuwj"><h3 class="svelte-qiiuwj">Templates</h3> <p class="svelte-qiiuwj">Manage report templates</p></div></a>')):s.out.push("<!--[!-->"),s.out.push("<!--]--></div>")),s.out.push("<!--]--></div> "),l?(s.out.push("<!--[-->"),s.out.push(`<div class="stats-section svelte-qiiuwj"><div class="stat-card svelte-qiiuwj"><div class="stat-number svelte-qiiuwj">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(c)}</div> <div class="stat-label svelte-qiiuwj">Pending Studies</div></div> <div class="stat-card svelte-qiiuwj"><div class="stat-number svelte-qiiuwj">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(o)}</div> <div class="stat-label svelte-qiiuwj">In Progress</div></div> <div class="stat-card svelte-qiiuwj"><div class="stat-number svelte-qiiuwj">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(r)}</div> <div class="stat-label svelte-qiiuwj">Completed Today</div></div></div>`)):(s.out.push("<!--[!-->"),s.out.push('<div class="recent-section svelte-qiiuwj"><div class="section-header svelte-qiiuwj"><h2 class="svelte-qiiuwj">Recent Reports</h2> <a href="/reports" class="view-all-link svelte-qiiuwj">View all reports</a></div> '),s.out.push("<!--[-->"),s.out.push('<div class="loading-state svelte-qiiuwj"><div class="loading-spinner svelte-qiiuwj"></div> <p class="svelte-qiiuwj">Loading reports...</p></div>'),s.out.push(`<!--]--></div> <div class="stats-section svelte-qiiuwj"><div class="stat-card svelte-qiiuwj"><div class="stat-number svelte-qiiuwj">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(p)}</div> <div class="stat-label svelte-qiiuwj">Reports This Week</div></div> <div class="stat-card svelte-qiiuwj"><div class="stat-number svelte-qiiuwj">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(n)}</div> <div class="stat-label svelte-qiiuwj">Draft Reports</div></div> <div class="stat-card svelte-qiiuwj"><div class="stat-number svelte-qiiuwj">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(d)}</div> <div class="stat-label svelte-qiiuwj">Total Reports</div></div></div>`)),s.out.push("<!--]--></div>"),e&&(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.l)(e),(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.f)();}


//# sourceMappingURL=_page.svelte-CfyhsLKS.js.map


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
