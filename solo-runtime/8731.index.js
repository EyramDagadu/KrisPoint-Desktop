export const id = 8731;
export const ids = [8731];
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

/***/ 48731:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ M)
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










function M(u,_){u.component(s=>{var a;let v=[],h="",c="";(0,_chunks_index_js_Bpk4pd78_js__WEBPACK_IMPORTED_MODULE_0__.a4)(a??={},"$permissions",_chunks_authStore_js_BkddknYm_js__WEBPACK_IMPORTED_MODULE_7__.p)?.includes("users.manage"),(0,_chunks_index_js_Bpk4pd78_js__WEBPACK_IMPORTED_MODULE_0__.a4)(a??={},"$permissions",_chunks_authStore_js_BkddknYm_js__WEBPACK_IMPORTED_MODULE_7__.p)?.includes("users.delete"),(0,_chunks_index_js_Bpk4pd78_js__WEBPACK_IMPORTED_MODULE_0__.aa)("1p497kv",s,t=>{t.title(l=>{l.push("<title>User Management - KrisPoint Admin</title>");});}),s.push('<div class="admin-container svelte-1p497kv"><div class="page-header svelte-1p497kv"><button class="btn-primary svelte-1p497kv"><span class="btn-icon svelte-1p497kv">+</span> Add New User</button></div> '),s.push("<!--[-1-->"),s.push(`<!--]--> <div class="filters-bar svelte-1p497kv"><div class="search-box svelte-1p497kv"><input type="text" placeholder="Search users..."${(0,_chunks_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.k)("value",h)} class="svelte-1p497kv"/></div> `),s.select({value:c,class:"filter-select"},t=>{t.option({value:""},p=>{p.push("All Roles");}),t.push("<!--[-->");const l=(0,_chunks_index_js_Bpk4pd78_js__WEBPACK_IMPORTED_MODULE_0__.a6)(v);for(let p=0,m=l.length;p<m;p++){let i=l[p];t.option({value:i.name},n=>{n.push(`${(0,_chunks_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.P)(i.displayName)}`);});}t.push("<!--]-->");},"svelte-1p497kv"),s.push("</div> "),s.push('<!--[0--><div class="loading-state svelte-1p497kv"><div class="spinner svelte-1p497kv"></div> <p>Loading users...</p></div>'),s.push("<!--]--></div> "),s.push("<!--[-1-->"),s.push("<!--]--> "),s.push("<!--[-1-->"),s.push("<!--]--> "),s.push("<!--[-1-->"),s.push("<!--]--> "),s.push("<!--[-1-->"),s.push("<!--]-->"),a&&(0,_chunks_index_js_Bpk4pd78_js__WEBPACK_IMPORTED_MODULE_0__.a5)(a);});}


//# sourceMappingURL=_page.svelte.js-CIU-V5O8.js.map


/***/ })

};
