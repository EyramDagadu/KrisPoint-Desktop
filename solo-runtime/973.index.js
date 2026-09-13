export const id = 973;
export const ids = [973];
export const modules = {

/***/ 40973:
/***/ ((__webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(__webpack_module__, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   GET: () => (/* binding */ m)
/* harmony export */ });
/* harmony import */ var _chunks_auth_js_BEnDHOh1_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(31981);
/* harmony import */ var _chunks_reportEvents_js_Ce_jVB2J_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(80610);
/* harmony import */ var _chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(32411);
/* harmony import */ var dotenv_config__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(63281);
/* harmony import */ var pg__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(99556);
/* harmony import */ var bcryptjs__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(68668);
/* harmony import */ var crypto__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(76982);
/* harmony import */ var _chunks_encryption_js_e_FMoLY3_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(70305);
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_chunks_auth_js_BEnDHOh1_js__WEBPACK_IMPORTED_MODULE_0__, _chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_2__]);
([_chunks_auth_js_BEnDHOh1_js__WEBPACK_IMPORTED_MODULE_0__, _chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_2__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);












const m=async({request:o})=>{const n=await (0,_chunks_auth_js_BEnDHOh1_js__WEBPACK_IMPORTED_MODULE_0__.a)(o);if(!n.success||!n.user)return new Response("Unauthorized",{status:401});const t=`report-${n.user.id}-${Date.now()}-${Math.random().toString(36).substr(2,9)}`;let e=null;const c=new ReadableStream({start(a){const s=new TextEncoder;_chunks_reportEvents_js_Ce_jVB2J_js__WEBPACK_IMPORTED_MODULE_1__.p.addClient(t,a),a.enqueue(s.encode(`data: ${JSON.stringify({type:"connected",clientId:t})}

`)),e=setInterval(()=>{try{a.enqueue(s.encode(`: heartbeat

`));}catch{e&&clearInterval(e),_chunks_reportEvents_js_Ce_jVB2J_js__WEBPACK_IMPORTED_MODULE_1__.p.removeClient(t);}},3e4);},cancel(){e&&clearInterval(e),_chunks_reportEvents_js_Ce_jVB2J_js__WEBPACK_IMPORTED_MODULE_1__.p.removeClient(t);}});return new Response(c,{headers:{"Content-Type":"text/event-stream","Cache-Control":"no-cache",Connection:"keep-alive","X-Accel-Buffering":"no"}})};


//# sourceMappingURL=_server.ts.js-r5jLGnnn.js.map

__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ })

};
