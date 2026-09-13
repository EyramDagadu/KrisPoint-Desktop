export const id = 3655;
export const ids = [3655];
export const modules = {

/***/ 23655:
/***/ ((__webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(__webpack_module__, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   POST: () => (/* binding */ P)
/* harmony export */ });
/* harmony import */ var _chunks_utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(26765);
/* harmony import */ var _chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(32411);
/* harmony import */ var _chunks_auth_js_BEnDHOh1_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(31981);
/* harmony import */ var _chunks_reportEvents_js_Ce_jVB2J_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(80610);
/* harmony import */ var drizzle_orm__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(7002);
/* harmony import */ var _chunks_utils_js_be9Tdq2_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(71621);
/* harmony import */ var dotenv_config__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(63281);
/* harmony import */ var pg__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(99556);
/* harmony import */ var bcryptjs__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(68668);
/* harmony import */ var crypto__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(76982);
/* harmony import */ var _chunks_encryption_js_e_FMoLY3_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(70305);
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__, _chunks_auth_js_BEnDHOh1_js__WEBPACK_IMPORTED_MODULE_2__]);
([_chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__, _chunks_auth_js_BEnDHOh1_js__WEBPACK_IMPORTED_MODULE_2__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);














const P=async({request:p$1,params:l})=>{try{const e=await (0,_chunks_auth_js_BEnDHOh1_js__WEBPACK_IMPORTED_MODULE_2__.a)(p$1);if(!e.success||!e.user)return (0,_chunks_utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Unauthorized"},{status:401});const m=await (0,_chunks_auth_js_BEnDHOh1_js__WEBPACK_IMPORTED_MODULE_2__.c)(e.user.id,"reports.sign_own"),c=await (0,_chunks_auth_js_BEnDHOh1_js__WEBPACK_IMPORTED_MODULE_2__.c)(e.user.id,"reports.finalize");if(!m&&!c)return (0,_chunks_utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Permission denied"},{status:403});const t=parseInt(l.id);if(isNaN(t))return (0,_chunks_utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Invalid ID"},{status:400});const[r]=await _chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.d.select().from(_chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.s.reports).where((0,drizzle_orm__WEBPACK_IMPORTED_MODULE_10__.eq)(_chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.s.reports.id,t)).limit(1);if(!r)return (0,_chunks_utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Report not found"},{status:404});if(r.createdBy!==e.user.id&&!c)return (0,_chunks_utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"You can only sign off your own reports"},{status:403});const i=new Date;if(r.status==="SIGNED")return (0,_chunks_utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:'Report is already signed. Use "Undo Sign Off" first if you need to make changes.'},{status:400});if(r.status==="SUBMITTED")return (0,_chunks_utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Report is awaiting specialist review. Use standard sign endpoint."},{status:400});const g=2147483647;let n=r.reportingDurationMs;if(r.openedAt){const d=i.getTime()-new Date(r.openedAt).getTime();n=d>g?null:d;}const[w]=await _chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.d.update(_chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.s.reports).set({status:"SIGNED",statusBeforeSign:r.status,reviewedBy:null,signedBy:e.user.id,signedAt:i,reportingDurationMs:n,reviewDurationMs:null,updatedAt:i}).where((0,drizzle_orm__WEBPACK_IMPORTED_MODULE_10__.eq)(_chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.s.reports.id,t)).returning();await _chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.d.insert(_chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.s.reportWorkflows).values({reportId:t,event:"SIGNED_BY_CREATOR",userId:e.user.id,userRole:e.user.roleName,occurredAt:i});const[R]=await _chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.d.update(_chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.s.worklist).set({status:"COMPLETED",updatedAt:i}).where((0,drizzle_orm__WEBPACK_IMPORTED_MODULE_10__.eq)(_chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.s.worklist.reportId,t)).returning();return _chunks_reportEvents_js_Ce_jVB2J_js__WEBPACK_IMPORTED_MODULE_3__.p.notifyReportStatusChange(t,R?.id||null,"COMPLETED","SIGNED"),await (0,_chunks_auth_js_BEnDHOh1_js__WEBPACK_IMPORTED_MODULE_2__.l)({userId:e.user.id,username:e.user.username,userRole:e.user.roleName,action:"REPORT_SELF_SIGNED",category:"REPORTS",severity:"INFO",resourceType:"REPORT",resourceId:String(t),description:"Report signed off by creator",metadata:{reportingDurationMs:n}}),(0,_chunks_utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!0,report:w,message:"Report signed off successfully"})}catch(e){return console.error("Sign-off report error:",e),(0,_chunks_utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:false,error:"Failed to sign off report"},{status:500})}};


//# sourceMappingURL=_server.ts.js-lM5T4Fe7.js.map

__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ })

};
