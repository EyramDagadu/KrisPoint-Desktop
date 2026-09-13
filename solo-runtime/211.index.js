export const id = 211;
export const ids = [211];
export const modules = {

/***/ 10211:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   POST: () => (/* binding */ n)
/* harmony export */ });
/* harmony import */ var _chunks_utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(26765);
/* harmony import */ var crypto__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(76982);
/* harmony import */ var _chunks_utils_js_be9Tdq2_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(71621);




const n=async()=>{if(process.env.ENCRYPTION_KEY||process.env.SOLO_ENCRYPTION_KEY)return (0,_chunks_utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:false,error:"Encryption key is already configured"},{status:400});const s=(0,crypto__WEBPACK_IMPORTED_MODULE_1__.randomBytes)(32).toString("hex");return (0,_chunks_utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:true,key:s})};


//# sourceMappingURL=_server.ts.js-Db6NuTVu.js.map


/***/ })

};
