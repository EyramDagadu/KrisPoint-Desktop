export const id = 8532;
export const ids = [8532];
export const modules = {

/***/ 18532:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ b)
/* harmony export */ });
/* harmony import */ var _index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(98579);
/* harmony import */ var _client_UEuKvGvq_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(12847);
/* harmony import */ var _authStore_wTOTagk_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(88609);
/* harmony import */ var _utils_Ca_EoiSx_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(79936);
/* harmony import */ var _index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(72912);
/* harmony import */ var _state_svelte_xhjpmOz7_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(25781);







function b(t,m){(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__._)();var s;let i=false;function r(e){const n=e?.includes("reports.create"),c=e?.includes("templates.read");return !n&&!c?"/worklist":"/"}(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s??={},"$isAuthenticated",_authStore_wTOTagk_js__WEBPACK_IMPORTED_MODULE_2__.l)&&!i&&(0,_client_UEuKvGvq_js__WEBPACK_IMPORTED_MODULE_1__.u)(r((0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s??={},"$permissions",_authStore_wTOTagk_js__WEBPACK_IMPORTED_MODULE_2__.h))),(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.J)(t,e=>{e.title="<title>KrisPoint - Authentication</title>";}),t.out.push(`<div${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.H)("auth-page svelte-ic1p21",void 0,{"wizard-mode":i})}><div${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.H)("auth-container svelte-ic1p21",void 0,{"wizard-container":i})}>`),t.out.push("<!--[-->"),t.out.push('<div class="loading-state svelte-ic1p21"><div class="loading-spinner svelte-ic1p21"></div> <p class="svelte-ic1p21">Connecting to server...</p></div>'),t.out.push("<!--]--></div></div>"),s&&(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.l)(s),(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.f)();}


//# sourceMappingURL=_page.svelte-B8VrwP9m.js.map


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
