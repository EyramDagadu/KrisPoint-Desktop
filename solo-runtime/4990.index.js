export const id = 4990;
export const ids = [4990];
export const modules = {

/***/ 84990:
/***/ ((__webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(__webpack_module__, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   POST: () => (/* binding */ P)
/* harmony export */ });
/* harmony import */ var _index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(47868);
/* harmony import */ var _db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(35892);
/* harmony import */ var _auth_BFFUBPoh_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(64828);
/* harmony import */ var _reportEvents_Ce_jVB2J_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(25596);
/* harmony import */ var drizzle_orm__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(63471);
/* harmony import */ var dotenv_config__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(52874);
/* harmony import */ var pg__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(83849);
/* harmony import */ var bcryptjs__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(36242);
/* harmony import */ var crypto__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(76982);
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__, _auth_BFFUBPoh_js__WEBPACK_IMPORTED_MODULE_2__]);
([_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__, _auth_BFFUBPoh_js__WEBPACK_IMPORTED_MODULE_2__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);












const P=async({request:p$1,params:l})=>{try{const e=await (0,_auth_BFFUBPoh_js__WEBPACK_IMPORTED_MODULE_2__.v)(p$1);if(!e.success||!e.user)return (0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Unauthorized"},{status:401});const m$1=await (0,_auth_BFFUBPoh_js__WEBPACK_IMPORTED_MODULE_2__.c)(e.user.id,"reports.sign_own"),c=await (0,_auth_BFFUBPoh_js__WEBPACK_IMPORTED_MODULE_2__.c)(e.user.id,"reports.finalize");if(!m$1&&!c)return (0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Permission denied"},{status:403});const t=parseInt(l.id);if(isNaN(t))return (0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Invalid ID"},{status:400});const[r]=await _db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.d.select().from(_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.reports).where((0,drizzle_orm__WEBPACK_IMPORTED_MODULE_8__.eq)(_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.reports.id,t)).limit(1);if(!r)return (0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Report not found"},{status:404});if(r.createdBy!==e.user.id&&!c)return (0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"You can only sign off your own reports"},{status:403});const i=new Date;if(r.status==="SIGNED")return (0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:'Report is already signed. Use "Undo Sign Off" first if you need to make changes.'},{status:400});if(r.status==="SUBMITTED")return (0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Report is awaiting specialist review. Use standard sign endpoint."},{status:400});const g=2147483647;let n=r.reportingDurationMs;if(r.openedAt){const d=i.getTime()-new Date(r.openedAt).getTime();n=d>g?null:d;}const[w]=await _db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.d.update(_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.reports).set({status:"SIGNED",statusBeforeSign:r.status,reviewedBy:null,signedBy:e.user.id,signedAt:i,reportingDurationMs:n,reviewDurationMs:null,updatedAt:i}).where((0,drizzle_orm__WEBPACK_IMPORTED_MODULE_8__.eq)(_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.reports.id,t)).returning();await _db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.d.insert(_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.reportWorkflows).values({reportId:t,event:"SIGNED_BY_CREATOR",userId:e.user.id,userRole:e.user.roleName,occurredAt:i});const[R]=await _db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.d.update(_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.worklist).set({status:"COMPLETED",updatedAt:i}).where((0,drizzle_orm__WEBPACK_IMPORTED_MODULE_8__.eq)(_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.worklist.reportId,t)).returning();return _reportEvents_Ce_jVB2J_js__WEBPACK_IMPORTED_MODULE_3__.p.notifyReportStatusChange(t,R?.id||null,"COMPLETED","SIGNED"),await (0,_auth_BFFUBPoh_js__WEBPACK_IMPORTED_MODULE_2__.l)({userId:e.user.id,username:e.user.username,userRole:e.user.roleName,action:"REPORT_SELF_SIGNED",category:"REPORTS",severity:"INFO",resourceType:"REPORT",resourceId:String(t),description:"Report signed off by creator",metadata:{reportingDurationMs:n}}),(0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!0,report:w,message:"Report signed off successfully"})}catch(e){return console.error("Sign-off report error:",e),(0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:false,error:"Failed to sign off report"},{status:500})}};


//# sourceMappingURL=_server.ts-B2TZ1tqW.js.map

__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ })

};
