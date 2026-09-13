export const id = 3541;
export const ids = [3541];
export const modules = {

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

/***/ 56783:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   g: () => (/* binding */ g)
/* harmony export */ });
/* harmony import */ var _exports_js_CSfjgVlQ_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(42623);
/* harmony import */ var _utils_js_be9Tdq2_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(71621);
/* harmony import */ var _utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(26765);
/* harmony import */ var _root_js_CksVe0PM_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(22967);
/* harmony import */ var _state_svelte_js_Cm6uwfjG_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(42299);






function g(o,r={}){throw new Error("Cannot call goto(...) on the server")}


//# sourceMappingURL=client.js-CYuuon9D.js.map


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

/***/ 13541:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ w)
/* harmony export */ });
/* harmony import */ var _chunks_index_js_BPHC9uE5_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(34899);
/* harmony import */ var _chunks_client_js_CYuuon9D_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(56783);
/* harmony import */ var _chunks_authStore_js_Bl2ko8Kh_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(40298);
/* harmony import */ var _chunks_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(89831);
/* harmony import */ var _chunks_utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(26765);
/* harmony import */ var _chunks_utils_js_be9Tdq2_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(71621);
/* harmony import */ var _chunks_exports_js_CSfjgVlQ_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(42623);
/* harmony import */ var _chunks_root_js_CksVe0PM_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(22967);
/* harmony import */ var _chunks_state_svelte_js_Cm6uwfjG_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(42299);
/* harmony import */ var _chunks_index2_js_B91mjNiV_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(12144);











function w(r,m){r.component(s=>{var t;let i=false;function l$1(e){const a=e?.includes("reports.create"),c=e?.includes("templates.read");return !a&&!c?"/worklist":"/"}(0,_chunks_index_js_BPHC9uE5_js__WEBPACK_IMPORTED_MODULE_0__.a6)(t??={},"$isAuthenticated",_chunks_authStore_js_Bl2ko8Kh_js__WEBPACK_IMPORTED_MODULE_2__.l)&&!i&&(0,_chunks_client_js_CYuuon9D_js__WEBPACK_IMPORTED_MODULE_1__.g)(l$1((0,_chunks_index_js_BPHC9uE5_js__WEBPACK_IMPORTED_MODULE_0__.a6)(t??={},"$permissions",_chunks_authStore_js_Bl2ko8Kh_js__WEBPACK_IMPORTED_MODULE_2__.h))),(0,_chunks_index_js_BPHC9uE5_js__WEBPACK_IMPORTED_MODULE_0__.ac)("1s728sz",s,e=>{e.title(a=>{a.push("<title>KrisPoint - Authentication</title>");});}),s.push(`<div${(0,_chunks_index_js_BPHC9uE5_js__WEBPACK_IMPORTED_MODULE_0__.a4)("auth-page svelte-1s728sz",void 0,{"wizard-mode":i})}><div${(0,_chunks_index_js_BPHC9uE5_js__WEBPACK_IMPORTED_MODULE_0__.a4)("auth-container svelte-1s728sz",void 0,{"wizard-container":i})}>`),s.push('<!--[0--><div class="loading-state svelte-1s728sz"><div class="loading-spinner svelte-1s728sz"></div> <p class="svelte-1s728sz">Connecting to server...</p></div>'),s.push("<!--]--></div></div>"),t&&(0,_chunks_index_js_BPHC9uE5_js__WEBPACK_IMPORTED_MODULE_0__.a7)(t);});}


//# sourceMappingURL=_page.svelte.js-CvYk_hEe.js.map


/***/ })

};
