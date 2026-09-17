export const id = 5122;
export const ids = [5122];
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

/***/ 53964:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   g: () => (/* binding */ g)
/* harmony export */ });
/* harmony import */ var _exports_js_CSfjgVlQ_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(42623);
/* harmony import */ var _utils_js_be9Tdq2_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(71621);
/* harmony import */ var _utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(26765);
/* harmony import */ var _root_js_DaHDhESc_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(49860);
/* harmony import */ var _state_svelte_js_enuA4RlU_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(97012);






function g(o,r={}){throw new Error("Cannot call goto(...) on the server")}


//# sourceMappingURL=client.js-BASlsBwk.js.map


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

/***/ 15122:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ F)
/* harmony export */ });
/* harmony import */ var _chunks_index_js_Bpk4pd78_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(46706);
/* harmony import */ var _chunks_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(89831);
/* harmony import */ var _chunks_client_js_BASlsBwk_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(53964);
/* harmony import */ var _chunks_authStore_js_BkddknYm_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(57383);
/* harmony import */ var _chunks_utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(26765);
/* harmony import */ var _chunks_utils_js_be9Tdq2_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(71621);
/* harmony import */ var _chunks_exports_js_CSfjgVlQ_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(42623);
/* harmony import */ var _chunks_root_js_DaHDhESc_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(49860);
/* harmony import */ var _chunks_state_svelte_js_enuA4RlU_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(97012);
/* harmony import */ var _chunks_index2_js_BVygkZUa_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(27247);











function F(A,k$1){A.component(s$1=>{var h;let j,i=null,y=true,u="",m=false,g$1="",f="",w="";const x=["CT","MRI","X-Ray","Ultrasound","Mammography","Fluoroscopy","Nuclear Medicine","PET-CT"];function U(){const e=new Date;f=e.toISOString().split("T")[0],g$1=new Date(e.getTime()-720*60*60*1e3).toISOString().split("T")[0],B();}async function B(){y=true,u="";try{let e=`/api/admin/analytics?startDate=${g$1}&endDate=${f}`;const n=await(await fetch(e,{credentials:"include"})).json();n.success?i=n.analytics:u=n.error;}catch{u="Failed to load analytics";}finally{y=false;}}function p$1(e){if(!e||e===0)return "-";const r=Math.floor(e/(1e3*60)),n=Math.floor(e%(1e3*60)/1e3);if(r>60){const t=Math.floor(r/60),v=r%60;return `${t}h ${v}m`}return `${r}m ${n}s`}function C(e){switch(e){case "DRAFT":return "#6b7280";case "SUBMITTED":return "#d97706";case "SIGNED":return "#16a34a";default:return "#6b7280"}}if(j=(0,_chunks_index_js_Bpk4pd78_js__WEBPACK_IMPORTED_MODULE_0__.a4)(h??={},"$permissions",_chunks_authStore_js_BkddknYm_js__WEBPACK_IMPORTED_MODULE_3__.p).includes("analytics.view")||(0,_chunks_index_js_Bpk4pd78_js__WEBPACK_IMPORTED_MODULE_0__.a4)(h??={},"$permissions",_chunks_authStore_js_BkddknYm_js__WEBPACK_IMPORTED_MODULE_3__.p).includes("analytics.read"),!(0,_chunks_index_js_Bpk4pd78_js__WEBPACK_IMPORTED_MODULE_0__.a4)(h??={},"$authState",_chunks_authStore_js_BkddknYm_js__WEBPACK_IMPORTED_MODULE_3__.s).isLoading&&!m&&(m=true,(0,_chunks_index_js_Bpk4pd78_js__WEBPACK_IMPORTED_MODULE_0__.a4)(h??={},"$currentUser",_chunks_authStore_js_BkddknYm_js__WEBPACK_IMPORTED_MODULE_3__.l)?j?U():(0,_chunks_client_js_BASlsBwk_js__WEBPACK_IMPORTED_MODULE_2__.g)():(0,_chunks_client_js_BASlsBwk_js__WEBPACK_IMPORTED_MODULE_2__.g)()),(0,_chunks_index_js_Bpk4pd78_js__WEBPACK_IMPORTED_MODULE_0__.a4)(h??={},"$authState",_chunks_authStore_js_BkddknYm_js__WEBPACK_IMPORTED_MODULE_3__.s).isLoading||!m)s$1.push('<!--[0--><div class="auth-loading svelte-h1vjnr"><p>Loading...</p></div>');else if((0,_chunks_index_js_Bpk4pd78_js__WEBPACK_IMPORTED_MODULE_0__.a4)(h??={},"$currentUser",_chunks_authStore_js_BkddknYm_js__WEBPACK_IMPORTED_MODULE_3__.l)&&j){if(s$1.push(`<!--[1--><div class="analytics-page svelte-h1vjnr"><div class="page-header svelte-h1vjnr"><h1 class="svelte-h1vjnr">Reporting Analytics</h1> <p class="subtitle svelte-h1vjnr">Measure reporting efficiency and track performance trends</p></div> <div class="filters svelte-h1vjnr"><div class="filter-group svelte-h1vjnr"><label for="startDate" class="svelte-h1vjnr">Start Date</label> <input type="date" id="startDate"${(0,_chunks_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.k)("value",g$1)} class="svelte-h1vjnr"/></div> <div class="filter-group svelte-h1vjnr"><label for="endDate" class="svelte-h1vjnr">End Date</label> <input type="date" id="endDate"${(0,_chunks_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.k)("value",f)} class="svelte-h1vjnr"/></div> <div class="filter-group svelte-h1vjnr"><label for="modality" class="svelte-h1vjnr">Modality</label> `),s$1.select({id:"modality",value:w,class:""},e=>{e.option({value:""},n=>{n.push("All Modalities");}),e.push("<!--[-->");const r=(0,_chunks_index_js_Bpk4pd78_js__WEBPACK_IMPORTED_MODULE_0__.a6)(x);for(let n=0,t=r.length;n<t;n++){let v=r[n];e.option({value:v},a=>{a.push(`${(0,_chunks_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.P)(v)}`);});}e.push("<!--]-->");},"svelte-h1vjnr"),s$1.push("</div></div> "),u?s$1.push(`<!--[0--><div class="error-message svelte-h1vjnr">${(0,_chunks_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.P)(u)}</div>`):s$1.push("<!--[-1-->"),s$1.push("<!--]--> "),y)s$1.push('<!--[0--><div class="loading svelte-h1vjnr">Loading analytics...</div>');else if(i){s$1.push(`<!--[1--><div class="summary-cards svelte-h1vjnr"><div class="summary-card svelte-h1vjnr"><h3 class="svelte-h1vjnr">Total Reports</h3> <div class="value svelte-h1vjnr">${(0,_chunks_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.P)(i.summary.totalReports)}</div></div> <div class="summary-card svelte-h1vjnr"><h3 class="svelte-h1vjnr">Avg. Reporting Time</h3> <div class="value svelte-h1vjnr">${(0,_chunks_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.P)(p$1(i.summary.avgReportingTimeMs))}</div></div> <div class="summary-card svelte-h1vjnr"><h3 class="svelte-h1vjnr">Avg. Review Time</h3> <div class="value svelte-h1vjnr">${(0,_chunks_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.P)(p$1(i.summary.avgReviewTimeMs))}</div></div></div> <div class="charts-grid svelte-h1vjnr"><div class="chart-card svelte-h1vjnr"><h3 class="svelte-h1vjnr">Reports by Status</h3> <div class="status-bars svelte-h1vjnr"><!--[-->`);const e=(0,_chunks_index_js_Bpk4pd78_js__WEBPACK_IMPORTED_MODULE_0__.a6)(i.reportsByStatus);for(let t=0,v=e.length;t<v;t++){let a=e[t];s$1.push(`<div class="status-row svelte-h1vjnr"><span class="status-label svelte-h1vjnr">${(0,_chunks_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.P)(a.status)}</span> <div class="bar-container svelte-h1vjnr"><div class="bar svelte-h1vjnr"${(0,_chunks_index_js_Bpk4pd78_js__WEBPACK_IMPORTED_MODULE_0__.a7)(`width: ${(0,_chunks_index_js_Bpk4pd78_js__WEBPACK_IMPORTED_MODULE_0__.a8)(a.count/i.summary.totalReports*100)}%; background: ${(0,_chunks_index_js_Bpk4pd78_js__WEBPACK_IMPORTED_MODULE_0__.a8)(C(a.status))}`)}></div></div> <span class="status-count svelte-h1vjnr">${(0,_chunks_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.P)(a.count)}</span></div>`);}s$1.push('<!--]--></div></div> <div class="chart-card svelte-h1vjnr"><h3 class="svelte-h1vjnr">Reports by Modality</h3> <div class="modality-list svelte-h1vjnr"><!--[-->');const r=(0,_chunks_index_js_Bpk4pd78_js__WEBPACK_IMPORTED_MODULE_0__.a6)(i.reportsByModality);for(let t=0,v=r.length;t<v;t++){let a=r[t];s$1.push(`<div class="modality-row svelte-h1vjnr"><span class="modality-name svelte-h1vjnr">${(0,_chunks_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.P)(a.modality)}</span> <span class="modality-count svelte-h1vjnr">${(0,_chunks_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.P)(a.count)} reports</span> <span class="modality-time svelte-h1vjnr">Avg: ${(0,_chunks_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.P)(p$1(a.avgReportingTimeMs))}</span></div>`);}s$1.push('<!--]--></div></div></div> <div class="chart-card full-width svelte-h1vjnr"><h3 class="svelte-h1vjnr">Performance by User</h3> <table class="user-table svelte-h1vjnr"><thead><tr><th class="svelte-h1vjnr">User</th><th class="svelte-h1vjnr">Role</th><th class="svelte-h1vjnr">Reports</th><th class="svelte-h1vjnr">Avg. Reporting Time</th></tr></thead><tbody><!--[-->');const n=(0,_chunks_index_js_Bpk4pd78_js__WEBPACK_IMPORTED_MODULE_0__.a6)(i.reportsByUser);for(let t=0,v=n.length;t<v;t++){let a=n[t];s$1.push(`<tr><td class="svelte-h1vjnr">${(0,_chunks_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.P)(a.userName)}</td><td class="svelte-h1vjnr">${(0,_chunks_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.P)(a.userRole)}</td><td class="svelte-h1vjnr">${(0,_chunks_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.P)(a.count)}</td><td class="svelte-h1vjnr">${(0,_chunks_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.P)(p$1(a.avgReportingTimeMs))}</td></tr>`);}if(s$1.push("<!--]--></tbody></table></div> "),i.reviewMetrics&&i.reviewMetrics.length>0){s$1.push('<!--[0--><div class="chart-card full-width svelte-h1vjnr"><h3 class="svelte-h1vjnr">Review Performance by Specialist</h3> <table class="user-table svelte-h1vjnr"><thead><tr><th class="svelte-h1vjnr">Reviewer</th><th class="svelte-h1vjnr">Reviews Completed</th><th class="svelte-h1vjnr">Avg. Review Time</th></tr></thead><tbody><!--[-->');const t=(0,_chunks_index_js_Bpk4pd78_js__WEBPACK_IMPORTED_MODULE_0__.a6)(i.reviewMetrics);for(let v=0,a=t.length;v<a;v++){let c=t[v];s$1.push(`<tr><td class="svelte-h1vjnr">${(0,_chunks_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.P)(c.reviewerName)}</td><td class="svelte-h1vjnr">${(0,_chunks_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.P)(c.count)}</td><td class="svelte-h1vjnr">${(0,_chunks_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.P)(p$1(c.avgReviewTimeMs))}</td></tr>`);}s$1.push("<!--]--></tbody></table></div>");}else s$1.push("<!--[-1-->");if(s$1.push("<!--]--> "),i.dailyTrend&&i.dailyTrend.length>0){s$1.push('<!--[0--><div class="chart-card full-width svelte-h1vjnr"><h3 class="svelte-h1vjnr">Daily Report Volume</h3> <div class="trend-chart svelte-h1vjnr"><!--[-->');const t=(0,_chunks_index_js_Bpk4pd78_js__WEBPACK_IMPORTED_MODULE_0__.a6)(i.dailyTrend);for(let v=0,a=t.length;v<a;v++){let c=t[v];s$1.push(`<div class="trend-bar svelte-h1vjnr"><div class="trend-fill svelte-h1vjnr"${(0,_chunks_index_js_Bpk4pd78_js__WEBPACK_IMPORTED_MODULE_0__.a7)(`height: ${(0,_chunks_index_js_Bpk4pd78_js__WEBPACK_IMPORTED_MODULE_0__.a8)(Math.min(c.count/Math.max(...i.dailyTrend.map(I=>I.count))*100,100))}%`)}></div> <span class="trend-count svelte-h1vjnr">${(0,_chunks_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.P)(c.count)}</span> <span class="trend-date svelte-h1vjnr">${(0,_chunks_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.P)(new Date(c.date).toLocaleDateString("en-GB",{day:"numeric",month:"short"}))}</span></div>`);}s$1.push("<!--]--></div></div>");}else s$1.push("<!--[-1-->");s$1.push("<!--]-->");}else s$1.push("<!--[-1-->");s$1.push("<!--]--></div>");}else s$1.push("<!--[-1-->");s$1.push("<!--]-->"),h&&(0,_chunks_index_js_Bpk4pd78_js__WEBPACK_IMPORTED_MODULE_0__.a5)(h);});}


//# sourceMappingURL=_page.svelte.js-iSFuKDr7.js.map


/***/ })

};
