export const id = 3451;
export const ids = [3451];
export const modules = {

/***/ 93451:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   POST: () => (/* binding */ i)
/* harmony export */ });
/* harmony import */ var _chunks_utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(26765);
/* harmony import */ var _chunks_utils_js_be9Tdq2_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(71621);



const i=async({request:o})=>{try{const{key:e}=await o.json();if(!e||typeof e!="string"||e.length!==64)return (0,_chunks_utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Invalid encryption key format"},{status:400});const s=process.env.VITE_KRISPOINT_EDITION==="solo";if(s)return (0,_chunks_utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!0,instructions:{},message:"KrisPoint Solo stores its encryption keys in the operating system credential store."});const r=s?"SOLO_ENCRYPTION_KEY":"ENCRYPTION_KEY";return (0,_chunks_utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!0,instructions:{replit:`Add ${r} to your Secrets tab in Replit, then restart the server.`,linux:`Add to /etc/environment or your shell profile: export ${r}=${e}`,windows:`Set system environment variable: ${r} = ${e}`,docker:`Add to your docker-compose.yml or -e ${r}=${e}`},message:`Key generated. Set the ${r} environment variable on your server, then restart the application.`})}catch(e){return console.error("Setup complete error:",e),(0,_chunks_utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:false,error:"Failed to process request"},{status:500})}};


//# sourceMappingURL=_server.ts.js-CvwoG07E.js.map


/***/ })

};
