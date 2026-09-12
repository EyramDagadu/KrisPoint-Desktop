export const id = 2713;
export const ids = [2713];
export const modules = {

/***/ 42713:
/***/ ((__webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(__webpack_module__, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   POST: () => (/* binding */ v)
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












const v=async({request:u,params:c})=>{try{const e=await (0,_auth_BFFUBPoh_js__WEBPACK_IMPORTED_MODULE_2__.v)(u);if(!e.success||!e.user)return (0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Unauthorized"},{status:401});if(!await (0,_auth_BFFUBPoh_js__WEBPACK_IMPORTED_MODULE_2__.c)(e.user.id,"reports.review"))return (0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Permission denied"},{status:403});const r=parseInt(c.id);if(isNaN(r))return (0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Invalid report ID"},{status:400});const[t]=await _db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.d.select().from(_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.reports).where((0,drizzle_orm__WEBPACK_IMPORTED_MODULE_8__.eq)(_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.reports.id,r)).limit(1);return t?t.status!=="SUBMITTED"?(0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Only submitted reports can be claimed"},{status:400}):t.assignedSpecialistId===e.user.id?(0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"This report is already assigned to you"},{status:400}):(await _db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.d.update(_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.reports).set({assignedSpecialistId:e.user.id,updatedAt:new Date}).where((0,drizzle_orm__WEBPACK_IMPORTED_MODULE_8__.eq)(_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.reports.id,r)),await _db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.d.insert(_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.reportWorkflows).values({reportId:r,event:"CLAIMED",userId:e.user.id,userRole:e.user.roleName,occurredAt:new Date,metadata:{previousSpecialistId:t.assignedSpecialistId,claimedBy:e.user.id}}),_reportEvents_Ce_jVB2J_js__WEBPACK_IMPORTED_MODULE_3__.p.notifyReportClaimed(r,e.user.id,t.assignedSpecialistId),await (0,_auth_BFFUBPoh_js__WEBPACK_IMPORTED_MODULE_2__.l)({userId:e.user.id,username:e.user.username,userRole:e.user.roleName,action:"REPORT_CLAIMED",category:"REPORTS",severity:"INFO",resourceType:"REPORT",resourceId:String(r),description:"Report claimed for review",metadata:{previousSpecialistId:t.assignedSpecialistId}}),(0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!0})):(0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Report not found"},{status:404})}catch(e){return console.error("Claim report error:",e),(0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:false,error:"Failed to claim report"},{status:500})}};


//# sourceMappingURL=_server.ts-BNZ_B7jV.js.map

__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ })

};
