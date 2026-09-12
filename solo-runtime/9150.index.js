export const id = 9150;
export const ids = [9150];
export const modules = {

/***/ 99150:
/***/ ((__webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(__webpack_module__, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   POST: () => (/* binding */ D)
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












const R=900*1e3,D=async({request:c,params:p$1})=>{try{const s=await (0,_auth_BFFUBPoh_js__WEBPACK_IMPORTED_MODULE_2__.v)(c);if(!s.success||!s.user)return (0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Unauthorized"},{status:401});const o=parseInt(p$1.id);if(isNaN(o))return (0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Invalid report ID"},{status:400});const[t]=await _db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.d.select({id:_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.reports.id,status:_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.reports.status,statusBeforeSign:_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.reports.statusBeforeSign,signedBy:_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.reports.signedBy,signedAt:_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.reports.signedAt,createdBy:_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.reports.createdBy,assignedSpecialistId:_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.reports.assignedSpecialistId}).from(_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.reports).where((0,drizzle_orm__WEBPACK_IMPORTED_MODULE_8__.eq)(_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.reports.id,o)).limit(1);if(!t)return (0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Report not found"},{status:404});if(t.status!=="SIGNED")return (0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Report is not signed"},{status:400});if(t.signedBy!==s.user.id)return (0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Only the signer can undo their sign-off"},{status:403});if(!t.signedAt)return (0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Report has no sign-off timestamp"},{status:400});const l=new Date(t.signedAt).getTime(),i=Date.now()-l;if(i>=R){const m=Math.floor(i/6e4);return (0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:`The 15-minute undo window has expired. Report was signed ${m} minutes ago.`},{status:400})}const u=new Date,n=t.statusBeforeSign||"DRAFT",[g]=await _db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.d.update(_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.reports).set({status:n,statusBeforeSign:null,signedBy:null,signedAt:null,reviewedBy:null,assignedSpecialistId:n==="SUBMITTED"?t.assignedSpecialistId:null,updatedAt:u}).where((0,drizzle_orm__WEBPACK_IMPORTED_MODULE_8__.eq)(_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.reports.id,o)).returning();await _db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.d.insert(_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.reportWorkflows).values({reportId:o,event:"SIGN_UNDONE",userId:s.user.id,userRole:s.user.roleName,occurredAt:u,metadata:{previousSignedAt:t.signedAt,restoredToStatus:n,undoneWithinMinutes:Math.floor(i/6e4)}});const[f]=await _db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.d.update(_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.worklist).set({status:"IN_PROGRESS",updatedAt:u}).where((0,drizzle_orm__WEBPACK_IMPORTED_MODULE_8__.eq)(_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.worklist.reportId,o)).returning();return _reportEvents_Ce_jVB2J_js__WEBPACK_IMPORTED_MODULE_3__.p.notifyReportStatusChange(o,f?.id||null,"IN_PROGRESS",n),console.log(`Report ${o} sign-off undone by user ${s.user.id} (${s.user.username})`),await (0,_auth_BFFUBPoh_js__WEBPACK_IMPORTED_MODULE_2__.l)({userId:s.user.id,username:s.user.username,userRole:s.user.roleName,action:"REPORT_SIGN_UNDONE",category:"REPORTS",severity:"INFO",resourceType:"REPORT",resourceId:String(o),description:`Report sign-off undone, restored to ${n}`,metadata:{previousSignedAt:t.signedAt,restoredToStatus:n,undoneWithinMinutes:Math.floor(i/6e4)}}),(0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!0,report:g,message:"Sign-off has been undone. You can continue editing."})}catch(s){return console.error("Undo sign error:",s),(0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:false,error:"Failed to undo sign-off"},{status:500})}};


//# sourceMappingURL=_server.ts-A2Ixha3O.js.map

__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ })

};
