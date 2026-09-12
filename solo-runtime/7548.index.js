export const id = 7548;
export const ids = [7548];
export const modules = {

/***/ 7548:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ V)
/* harmony export */ });
/* harmony import */ var _index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(98579);
/* harmony import */ var _client_UEuKvGvq_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(12847);
/* harmony import */ var _authStore_wTOTagk_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(88609);
/* harmony import */ var _utils_Ca_EoiSx_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(79936);
/* harmony import */ var _index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(72912);
/* harmony import */ var _state_svelte_xhjpmOz7_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(25781);







function V(e$1,F){(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__._)();var n;let m,a=null,g=true,d="",f=false,b="",w="",R="";const x=["CT","MRI","X-Ray","Ultrasound","Mammography","Fluoroscopy","Nuclear Medicine","PET-CT"];function B(){const i=new Date;w=i.toISOString().split("T")[0],b=new Date(i.getTime()-720*60*60*1e3).toISOString().split("T")[0],I();}async function I(){g=true,d="";try{let i=`/api/admin/analytics?startDate=${b}&endDate=${w}`;const c=await(await fetch(i,{credentials:"include"})).json();c.success?a=c.analytics:d=c.error;}catch{d="Failed to load analytics";}finally{g=false;}}function p$1(i){if(!i||i===0)return "-";const r=Math.floor(i/(1e3*60)),c=Math.floor(i%(1e3*60)/1e3);if(r>60){const v=Math.floor(r/60),t=r%60;return `${v}h ${t}m`}return `${r}m ${c}s`}function C(i){switch(i){case "DRAFT":return "#6b7280";case "SUBMITTED":return "#d97706";case "SIGNED":return "#16a34a";default:return "#6b7280"}}if(m=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(n??={},"$permissions",_authStore_wTOTagk_js__WEBPACK_IMPORTED_MODULE_2__.h).includes("analytics.view")||(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(n??={},"$permissions",_authStore_wTOTagk_js__WEBPACK_IMPORTED_MODULE_2__.h).includes("analytics.read"),!(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(n??={},"$authState",_authStore_wTOTagk_js__WEBPACK_IMPORTED_MODULE_2__.e).isLoading&&!f&&(f=true,(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(n??={},"$currentUser",_authStore_wTOTagk_js__WEBPACK_IMPORTED_MODULE_2__.p)?m?B():(0,_client_UEuKvGvq_js__WEBPACK_IMPORTED_MODULE_1__.u)():(0,_client_UEuKvGvq_js__WEBPACK_IMPORTED_MODULE_1__.u)()),(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(n??={},"$authState",_authStore_wTOTagk_js__WEBPACK_IMPORTED_MODULE_2__.e).isLoading||!f)e$1.out.push("<!--[-->"),e$1.out.push('<div class="auth-loading svelte-1kal33k"><p>Loading...</p></div>');else {if(e$1.out.push("<!--[!-->"),(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(n??={},"$currentUser",_authStore_wTOTagk_js__WEBPACK_IMPORTED_MODULE_2__.p)&&m){e$1.out.push("<!--[-->");const i=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.z)(x);e$1.out.push(`<div class="analytics-page svelte-1kal33k"><div class="page-header svelte-1kal33k"><h1 class="svelte-1kal33k">Reporting Analytics</h1> <p class="subtitle svelte-1kal33k">Measure reporting efficiency and track performance trends</p></div> <div class="filters svelte-1kal33k"><div class="filter-group svelte-1kal33k"><label for="startDate" class="svelte-1kal33k">Start Date</label> <input type="date" id="startDate"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("value",b)} class="svelte-1kal33k"/></div> <div class="filter-group svelte-1kal33k"><label for="endDate" class="svelte-1kal33k">End Date</label> <input type="date" id="endDate"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("value",w)} class="svelte-1kal33k"/></div> <div class="filter-group svelte-1kal33k"><label for="modality" class="svelte-1kal33k">Modality</label> <select id="modality" class="svelte-1kal33k">`),e$1.select_value=R,e$1.out.push(`<option value=""${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.Z)(e$1,"")}>All Modalities</option><!--[-->`);for(let r=0,c=i.length;r<c;r++){let v=i[r];e$1.out.push(`<option${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("value",v)}${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.Z)(e$1,v)}>${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(v)}</option>`);}if(e$1.out.push("<!--]-->"),e$1.select_value=void 0,e$1.out.push("</select></div></div> "),d?(e$1.out.push("<!--[-->"),e$1.out.push(`<div class="error-message svelte-1kal33k">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(d)}</div>`)):e$1.out.push("<!--[!-->"),e$1.out.push("<!--]--> "),g)e$1.out.push("<!--[-->"),e$1.out.push('<div class="loading svelte-1kal33k">Loading analytics...</div>');else {if(e$1.out.push("<!--[!-->"),a){e$1.out.push("<!--[-->");const r=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.z)(a.reportsByStatus),c=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.z)(a.reportsByModality),v=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.z)(a.reportsByUser);e$1.out.push(`<div class="summary-cards svelte-1kal33k"><div class="summary-card svelte-1kal33k"><h3 class="svelte-1kal33k">Total Reports</h3> <div class="value svelte-1kal33k">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(a.summary.totalReports)}</div></div> <div class="summary-card svelte-1kal33k"><h3 class="svelte-1kal33k">Avg. Reporting Time</h3> <div class="value svelte-1kal33k">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(p$1(a.summary.avgReportingTimeMs))}</div></div> <div class="summary-card svelte-1kal33k"><h3 class="svelte-1kal33k">Avg. Review Time</h3> <div class="value svelte-1kal33k">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(p$1(a.summary.avgReviewTimeMs))}</div></div></div> <div class="charts-grid svelte-1kal33k"><div class="chart-card svelte-1kal33k"><h3 class="svelte-1kal33k">Reports by Status</h3> <div class="status-bars svelte-1kal33k"><!--[-->`);for(let t=0,u=r.length;t<u;t++){let l=r[t];e$1.out.push(`<div class="status-row svelte-1kal33k"><span class="status-label svelte-1kal33k">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(l.status)}</span> <div class="bar-container svelte-1kal33k"><div class="bar svelte-1kal33k"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.K)(`width: ${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.U)(l.count/a.summary.totalReports*100)}%; background: ${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.U)(C(l.status))}`)}></div></div> <span class="status-count svelte-1kal33k">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(l.count)}</span></div>`);}e$1.out.push('<!--]--></div></div> <div class="chart-card svelte-1kal33k"><h3 class="svelte-1kal33k">Reports by Modality</h3> <div class="modality-list svelte-1kal33k"><!--[-->');for(let t=0,u=c.length;t<u;t++){let l=c[t];e$1.out.push(`<div class="modality-row svelte-1kal33k"><span class="modality-name svelte-1kal33k">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(l.modality)}</span> <span class="modality-count svelte-1kal33k">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(l.count)} reports</span> <span class="modality-time svelte-1kal33k">Avg: ${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(p$1(l.avgReportingTimeMs))}</span></div>`);}e$1.out.push('<!--]--></div></div></div> <div class="chart-card full-width svelte-1kal33k"><h3 class="svelte-1kal33k">Performance by User</h3> <table class="user-table svelte-1kal33k"><thead><tr><th class="svelte-1kal33k">User</th><th class="svelte-1kal33k">Role</th><th class="svelte-1kal33k">Reports</th><th class="svelte-1kal33k">Avg. Reporting Time</th></tr></thead><tbody><!--[-->');for(let t=0,u=v.length;t<u;t++){let l=v[t];e$1.out.push(`<tr><td class="svelte-1kal33k">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(l.userName)}</td><td class="svelte-1kal33k">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(l.userRole)}</td><td class="svelte-1kal33k">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(l.count)}</td><td class="svelte-1kal33k">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(p$1(l.avgReportingTimeMs))}</td></tr>`);}if(e$1.out.push("<!--]--></tbody></table></div> "),a.reviewMetrics&&a.reviewMetrics.length>0){e$1.out.push("<!--[-->");const t=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.z)(a.reviewMetrics);e$1.out.push('<div class="chart-card full-width svelte-1kal33k"><h3 class="svelte-1kal33k">Review Performance by Specialist</h3> <table class="user-table svelte-1kal33k"><thead><tr><th class="svelte-1kal33k">Reviewer</th><th class="svelte-1kal33k">Reviews Completed</th><th class="svelte-1kal33k">Avg. Review Time</th></tr></thead><tbody><!--[-->');for(let u=0,l=t.length;u<l;u++){let o=t[u];e$1.out.push(`<tr><td class="svelte-1kal33k">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(o.reviewerName)}</td><td class="svelte-1kal33k">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(o.count)}</td><td class="svelte-1kal33k">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(p$1(o.avgReviewTimeMs))}</td></tr>`);}e$1.out.push("<!--]--></tbody></table></div>");}else e$1.out.push("<!--[!-->");if(e$1.out.push("<!--]--> "),a.dailyTrend&&a.dailyTrend.length>0){e$1.out.push("<!--[-->");const t=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.z)(a.dailyTrend);e$1.out.push('<div class="chart-card full-width svelte-1kal33k"><h3 class="svelte-1kal33k">Daily Report Volume</h3> <div class="trend-chart svelte-1kal33k"><!--[-->');for(let u=0,l=t.length;u<l;u++){let o=t[u];e$1.out.push(`<div class="trend-bar svelte-1kal33k"><div class="trend-fill svelte-1kal33k"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.K)(`height: ${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.U)(Math.min(o.count/Math.max(...a.dailyTrend.map(L=>L.count))*100,100))}%`)}></div> <span class="trend-count svelte-1kal33k">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(o.count)}</span> <span class="trend-date svelte-1kal33k">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(new Date(o.date).toLocaleDateString("en-GB",{day:"numeric",month:"short"}))}</span></div>`);}e$1.out.push("<!--]--></div></div>");}else e$1.out.push("<!--[!-->");e$1.out.push("<!--]-->");}else e$1.out.push("<!--[!-->");e$1.out.push("<!--]-->");}e$1.out.push("<!--]--></div>");}else e$1.out.push("<!--[!-->");e$1.out.push("<!--]-->");}e$1.out.push("<!--]-->"),n&&(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.l)(n),(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.f)();}


//# sourceMappingURL=_page.svelte-DCPDgAD6.js.map


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

/***/ 12847:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   u: () => (/* binding */ u)
/* harmony export */ });
/* harmony import */ var _utils_Ca_EoiSx_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(79936);
/* harmony import */ var _index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(72912);
/* harmony import */ var _state_svelte_xhjpmOz7_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(25781);




function e(){const{set:o,subscribe:t}=(0,_index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_1__.z)(false);return {subscribe:t,check:async()=>false}}({updated:e()});function u(o,t={}){throw new Error("Cannot call goto(...) on the server")}


//# sourceMappingURL=client-UEuKvGvq.js.map


/***/ }),

/***/ 25781:
/***/ ((__unused_webpack___webpack_module__, __unused_webpack___webpack_exports__, __webpack_require__) => {

/* harmony import */ var _index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(98579);


const o=_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.g.toString().includes("$$")||/function \w+\(\) \{\}/.test(_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.g.toString());o&&new URL("https://example.com");
//# sourceMappingURL=state.svelte-xhjpmOz7.js.map


/***/ })

};
