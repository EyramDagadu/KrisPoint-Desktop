export const id = 2240;
export const ids = [2240];
export const modules = {

/***/ 42240:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ U)
/* harmony export */ });
/* harmony import */ var _index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(98579);
/* harmony import */ var _utils_Ca_EoiSx_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(79936);
/* harmony import */ var _state_svelte_xhjpmOz7_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(25781);
/* harmony import */ var _authStore_wTOTagk_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(88609);
/* harmony import */ var _index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(72912);






function U(s,d){(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__._)();var t;let m=[],c="",h$1="";(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(t??={},"$permissions",_authStore_wTOTagk_js__WEBPACK_IMPORTED_MODULE_3__.h)?.includes("users.manage"),(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(t??={},"$permissions",_authStore_wTOTagk_js__WEBPACK_IMPORTED_MODULE_3__.h)?.includes("users.delete");const i=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.z)(m);(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.J)(s,e=>{e.title="<title>User Management - KrisPoint Admin</title>";}),s.out.push('<div class="admin-container svelte-1tjm7uo"><div class="page-header svelte-1tjm7uo"><button class="btn-primary svelte-1tjm7uo"><span class="btn-icon svelte-1tjm7uo">+</span> Add New User</button></div> '),s.out.push("<!--[!-->"),s.out.push(`<!--]--> <div class="filters-bar svelte-1tjm7uo"><div class="search-box svelte-1tjm7uo"><input type="text" placeholder="Search users..."${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("value",c)} class="svelte-1tjm7uo"/></div> <select class="filter-select svelte-1tjm7uo">`),s.select_value=h$1,s.out.push(`<option value=""${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.Z)(s,"")}>All Roles</option><!--[-->`);for(let e=0,p=i.length;e<p;e++){let u=i[e];s.out.push(`<option${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("value",u.name)}${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.Z)(s,u.name)}>${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(u.displayName)}</option>`);}s.out.push("<!--]-->"),s.select_value=void 0,s.out.push("</select></div> "),s.out.push("<!--[-->"),s.out.push('<div class="loading-state svelte-1tjm7uo"><div class="spinner svelte-1tjm7uo"></div> <p>Loading users...</p></div>'),s.out.push("<!--]--></div> "),s.out.push("<!--[!-->"),s.out.push("<!--]--> "),s.out.push("<!--[!-->"),s.out.push("<!--]--> "),s.out.push("<!--[!-->"),s.out.push("<!--]--> "),s.out.push("<!--[!-->"),s.out.push("<!--]-->"),t&&(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.l)(t),(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.f)();}


//# sourceMappingURL=_page.svelte-BnvPhqgw.js.map


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
