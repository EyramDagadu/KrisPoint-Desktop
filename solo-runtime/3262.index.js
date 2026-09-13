export const id = 3262;
export const ids = [3262];
export const modules = {

/***/ 43262:
/***/ ((__webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(__webpack_module__, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   POST: () => (/* binding */ D)
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














const R=900*1e3,D=async({request:c,params:p$1})=>{try{const s=await (0,_chunks_auth_js_BEnDHOh1_js__WEBPACK_IMPORTED_MODULE_2__.a)(c);if(!s.success||!s.user)return (0,_chunks_utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Unauthorized"},{status:401});const o=parseInt(p$1.id);if(isNaN(o))return (0,_chunks_utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Invalid report ID"},{status:400});const[t]=await _chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.d.select({id:_chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.s.reports.id,status:_chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.s.reports.status,statusBeforeSign:_chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.s.reports.statusBeforeSign,signedBy:_chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.s.reports.signedBy,signedAt:_chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.s.reports.signedAt,createdBy:_chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.s.reports.createdBy,assignedSpecialistId:_chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.s.reports.assignedSpecialistId}).from(_chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.s.reports).where((0,drizzle_orm__WEBPACK_IMPORTED_MODULE_10__.eq)(_chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.s.reports.id,o)).limit(1);if(!t)return (0,_chunks_utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Report not found"},{status:404});if(t.status!=="SIGNED")return (0,_chunks_utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Report is not signed"},{status:400});if(t.signedBy!==s.user.id)return (0,_chunks_utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Only the signer can undo their sign-off"},{status:403});if(!t.signedAt)return (0,_chunks_utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Report has no sign-off timestamp"},{status:400});const l=new Date(t.signedAt).getTime(),i=Date.now()-l;if(i>=R){const m=Math.floor(i/6e4);return (0,_chunks_utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:`The 15-minute undo window has expired. Report was signed ${m} minutes ago.`},{status:400})}const u$1=new Date,n=t.statusBeforeSign||"DRAFT",[g]=await _chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.d.update(_chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.s.reports).set({status:n,statusBeforeSign:null,signedBy:null,signedAt:null,reviewedBy:null,assignedSpecialistId:n==="SUBMITTED"?t.assignedSpecialistId:null,updatedAt:u$1}).where((0,drizzle_orm__WEBPACK_IMPORTED_MODULE_10__.eq)(_chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.s.reports.id,o)).returning();await _chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.d.insert(_chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.s.reportWorkflows).values({reportId:o,event:"SIGN_UNDONE",userId:s.user.id,userRole:s.user.roleName,occurredAt:u$1,metadata:{previousSignedAt:t.signedAt,restoredToStatus:n,undoneWithinMinutes:Math.floor(i/6e4)}});const[f]=await _chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.d.update(_chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.s.worklist).set({status:"IN_PROGRESS",updatedAt:u$1}).where((0,drizzle_orm__WEBPACK_IMPORTED_MODULE_10__.eq)(_chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.s.worklist.reportId,o)).returning();return _chunks_reportEvents_js_Ce_jVB2J_js__WEBPACK_IMPORTED_MODULE_3__.p.notifyReportStatusChange(o,f?.id||null,"IN_PROGRESS",n),console.log(`Report ${o} sign-off undone by user ${s.user.id} (${s.user.username})`),await (0,_chunks_auth_js_BEnDHOh1_js__WEBPACK_IMPORTED_MODULE_2__.l)({userId:s.user.id,username:s.user.username,userRole:s.user.roleName,action:"REPORT_SIGN_UNDONE",category:"REPORTS",severity:"INFO",resourceType:"REPORT",resourceId:String(o),description:`Report sign-off undone, restored to ${n}`,metadata:{previousSignedAt:t.signedAt,restoredToStatus:n,undoneWithinMinutes:Math.floor(i/6e4)}}),(0,_chunks_utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!0,report:g,message:"Sign-off has been undone. You can continue editing."})}catch(s){return console.error("Undo sign error:",s),(0,_chunks_utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:false,error:"Failed to undo sign-off"},{status:500})}};


//# sourceMappingURL=_server.ts.js-BNWblZBC.js.map

__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ })

};
