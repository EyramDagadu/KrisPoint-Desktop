export const id = 5575;
export const ids = [5575];
export const modules = {

/***/ 35575:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ M)
/* harmony export */ });
/* harmony import */ var _index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(98579);
/* harmony import */ var _utils_Ca_EoiSx_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(79936);
/* harmony import */ var _state_svelte_xhjpmOz7_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(25781);




function M(e,g){(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__._)();let o=[],n=true,v=0,a=[],r="",b="unreviewed",p="",h="",w=0;const c=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.z)(a);(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.J)(e,s=>{s.title="<title>Voice Training Data - KrisPoint Admin</title>";}),e.out.push('<div class="training-data-page svelte-1w46tcf">'),e.out.push("<!--[!-->"),e.out.push('<!--]--> <div class="controls-bar svelte-1w46tcf"><div class="filters svelte-1w46tcf"><label class="svelte-1w46tcf">Status: <select class="svelte-1w46tcf">'),e.select_value=b,e.out.push(`<option value=""${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.Z)(e,"")}>All</option><option value="unreviewed"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.Z)(e,"unreviewed")}>Unreviewed</option><option value="reviewed"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.Z)(e,"reviewed")}>Reviewed</option>`),e.select_value=void 0,e.out.push('</select></label> <label class="svelte-1w46tcf">Usability: <select class="svelte-1w46tcf">'),e.select_value=p,e.out.push(`<option value=""${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.Z)(e,"")}>All</option><option value="usable"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.Z)(e,"usable")}>Usable</option><option value="unusable"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.Z)(e,"unusable")}>Unusable</option>`),e.select_value=void 0,e.out.push('</select></label> <label class="svelte-1w46tcf">Date: <select class="svelte-1w46tcf">'),e.select_value=h,e.out.push(`<option value=""${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.Z)(e,"")}>All Time</option><option value="today"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.Z)(e,"today")}>Today</option><option value="week"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.Z)(e,"week")}>This Week</option><option value="month"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.Z)(e,"month")}>This Month</option>`),e.select_value=void 0,e.out.push('</select></label> <label class="svelte-1w46tcf">Speaker: <select class="svelte-1w46tcf">'),e.select_value=r,e.out.push(`<option value=""${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.Z)(e,"")}>All Speakers</option><!--[-->`);for(let s=0,f=c.length;s<f;s++){let i=c[s];e.out.push(`<option${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("value",i.id)}${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.Z)(e,i.id)}>${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(i.name)}</option>`);}e.out.push("<!--]-->"),e.select_value=void 0,e.out.push(`</select></label></div> <div class="actions svelte-1w46tcf"><select class="bulk-action-select svelte-1w46tcf"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("disabled",n,true)}><option value=""${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.Z)(e,"")}>Bulk Actions...</option><option value="usable"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.Z)(e,"usable")}>Mark All Usable</option><option value="unusable"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.Z)(e,"unusable")}>Mark All Unusable</option></select> <button class="btn-secondary svelte-1w46tcf"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("disabled",n,true)}>Refresh</button> `),e.out.push("<!--[!-->"),e.out.push(`<!--]--></div></div> <div class="stats-bar svelte-1w46tcf"><span>Total: ${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(v)}</span> <span>Current: ${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(w+1)} of ${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(o.length)}</span></div> <div class="shortcuts-hint svelte-1w46tcf"><span><kbd class="svelte-1w46tcf">Space</kbd> Play/Pause</span> <span><kbd class="svelte-1w46tcf">Ctrl+Enter</kbd> Save &amp; Next</span> <span><kbd class="svelte-1w46tcf">Esc</kbd> Mark Unusable</span> <span><kbd class="svelte-1w46tcf">←</kbd><kbd class="svelte-1w46tcf">→</kbd> Navigate</span></div> `),e.out.push("<!--[-->"),e.out.push('<div class="loading svelte-1w46tcf">Loading samples...</div>'),e.out.push("<!--]--></div>"),(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.f)();}


//# sourceMappingURL=_page.svelte-TjRGlXPg.js.map


/***/ }),

/***/ 25781:
/***/ ((__unused_webpack___webpack_module__, __unused_webpack___webpack_exports__, __webpack_require__) => {

/* harmony import */ var _index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(98579);


const o=_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.g.toString().includes("$$")||/function \w+\(\) \{\}/.test(_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.g.toString());o&&new URL("https://example.com");
//# sourceMappingURL=state.svelte-xhjpmOz7.js.map


/***/ })

};
