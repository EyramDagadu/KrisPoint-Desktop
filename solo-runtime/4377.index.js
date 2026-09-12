export const id = 4377;
export const ids = [4377];
export const modules = {

/***/ 84377:
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












const P=async({request:w,params:S})=>{try{const s=await (0,_auth_BFFUBPoh_js__WEBPACK_IMPORTED_MODULE_2__.v)(w);if(!s.success||!s.user)return (0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Unauthorized"},{status:401});if(!await (0,_auth_BFFUBPoh_js__WEBPACK_IMPORTED_MODULE_2__.c)(s.user.id,"reports.finalize"))return (0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Permission denied"},{status:403});const r=parseInt(S.id);if(isNaN(r))return (0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Invalid ID"},{status:400});const[e]=await _db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.d.select().from(_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.reports).where((0,drizzle_orm__WEBPACK_IMPORTED_MODULE_8__.eq)(_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.reports.id,r)).limit(1);if(!e)return (0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Report not found"},{status:404});const t=new Date;if(e.status==="SIGNED")return (0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:'Report is already signed. Use "Undo Sign Off" first if you need to make changes.'},{status:400});const p$1=2147483647;let f=e.reviewDurationMs,g=e.reportingDurationMs;if(e.status==="SUBMITTED"&&e.submittedAt){const n=t.getTime()-new Date(e.submittedAt).getTime();f=n>p$1?null:n;}else if(e.status==="DRAFT"&&e.openedAt){const n=t.getTime()-new Date(e.openedAt).getTime();g=n>p$1?null:n;}const m$1=e.status==="SUBMITTED"&&e.signedBy!==null;let d=e.signedBy,c=e.signedAt,a=e.reviewedBy;m$1?a=s.user.id:e.status==="SUBMITTED"?(a=s.user.id,d=s.user.id,c=t):(d=s.user.id,c=t,a=null);const[I]=await _db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.d.update(_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.reports).set({status:"SIGNED",statusBeforeSign:e.status,reviewedBy:a,signedBy:d,signedAt:c,reportingDurationMs:g,reviewDurationMs:f,updatedAt:t}).where((0,drizzle_orm__WEBPACK_IMPORTED_MODULE_8__.eq)(_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.reports.id,r)).returning();await _db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.d.insert(_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.reportWorkflows).values({reportId:r,event:"SIGNED",userId:s.user.id,userRole:s.user.roleName,occurredAt:t}),await (0,_auth_BFFUBPoh_js__WEBPACK_IMPORTED_MODULE_2__.l)({userId:s.user.id,username:s.user.username,action:"SIGN_REPORT",category:"REPORTS",severity:"INFO",resourceType:"report",resourceId:r.toString(),description:m$1?`Co-signed report #${r}`:`Signed report #${r}`});const[D]=await _db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.d.update(_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.worklist).set({status:"COMPLETED",updatedAt:t}).where((0,drizzle_orm__WEBPACK_IMPORTED_MODULE_8__.eq)(_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.worklist.reportId,r)).returning();return _reportEvents_Ce_jVB2J_js__WEBPACK_IMPORTED_MODULE_3__.p.notifyReportStatusChange(r,D?.id||null,"COMPLETED","SIGNED"),(0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!0,report:I,message:"Report signed successfully"})}catch(s){return console.error("Sign report error:",s),(0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:false,error:"Failed to sign report"},{status:500})}};


//# sourceMappingURL=_server.ts-CXx6W2-S.js.map

__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ })

};
