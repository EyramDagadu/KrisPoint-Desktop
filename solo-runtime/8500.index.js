export const id = 8500;
export const ids = [8500];
export const modules = {

/***/ 48500:
/***/ ((__webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(__webpack_module__, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   POST: () => (/* binding */ T)
/* harmony export */ });
/* harmony import */ var _index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(47868);
/* harmony import */ var _db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(35892);
/* harmony import */ var _auth_BFFUBPoh_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(64828);
/* harmony import */ var _getReportIdentifier_DBWnsoia_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(92934);
/* harmony import */ var drizzle_orm__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(63471);
/* harmony import */ var dotenv_config__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(52874);
/* harmony import */ var pg__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(83849);
/* harmony import */ var bcryptjs__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(36242);
/* harmony import */ var crypto__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(76982);
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__, _auth_BFFUBPoh_js__WEBPACK_IMPORTED_MODULE_2__, _getReportIdentifier_DBWnsoia_js__WEBPACK_IMPORTED_MODULE_3__]);
([_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__, _auth_BFFUBPoh_js__WEBPACK_IMPORTED_MODULE_2__, _getReportIdentifier_DBWnsoia_js__WEBPACK_IMPORTED_MODULE_3__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);












const T=async({request:p$1,params:u})=>{try{const e=await (0,_auth_BFFUBPoh_js__WEBPACK_IMPORTED_MODULE_2__.v)(p$1);if(!e.success||!e.user)return (0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Unauthorized"},{status:401});const t=parseInt(u.id),d=parseInt(u.addendumId);if(isNaN(t)||isNaN(d))return (0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Invalid ID"},{status:400});const[n]=await _db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.d.select().from(_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.reports).where((0,drizzle_orm__WEBPACK_IMPORTED_MODULE_8__.eq)(_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.reports.id,t)).limit(1);if(!n)return (0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Report not found"},{status:404});const[i]=await _db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.d.select().from(_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.reportAmendments).where((0,drizzle_orm__WEBPACK_IMPORTED_MODULE_8__/* .and */ .Uo)((0,drizzle_orm__WEBPACK_IMPORTED_MODULE_8__.eq)(_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.reportAmendments.id,d),(0,drizzle_orm__WEBPACK_IMPORTED_MODULE_8__.eq)(_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.reportAmendments.reportId,t))).limit(1);if(!i)return (0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Addendum not found"},{status:404});if(i.status==="SIGNED")return (0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Addendum is already signed"},{status:400});const c=await (0,_auth_BFFUBPoh_js__WEBPACK_IMPORTED_MODULE_2__.c)(e.user.id,"reports.sign"),l=await (0,_auth_BFFUBPoh_js__WEBPACK_IMPORTED_MODULE_2__.c)(e.user.id,"reports.sign_own"),g=!n.reviewedBy||n.reviewedBy===n.signedBy,w=i.createdBy===e.user.id,I=n.signedBy===e.user.id;if(i.status==="DRAFT"){if(!w)return (0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Only the addendum creator can sign a draft addendum"},{status:403});if(!g&&!I)return (0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"This report was reviewed by a specialist. Please submit the addendum for specialist review."},{status:403});if(!l&&!c)return (0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Permission denied - requires sign permission"},{status:403})}else if(i.status==="SUBMITTED"){if(i.assignedSpecialistId!==e.user.id)return (0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Only the assigned specialist can sign this addendum"},{status:403});if(!c)return (0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Permission denied - requires sign permission"},{status:403})}const N=await (0,_getReportIdentifier_DBWnsoia_js__WEBPACK_IMPORTED_MODULE_3__.p)(t),m$1=new Date,[y]=await _db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.d.update(_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.reportAmendments).set({status:"SIGNED",signedBy:e.user.id,signedAt:m$1,updatedAt:m$1}).where((0,drizzle_orm__WEBPACK_IMPORTED_MODULE_8__.eq)(_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.reportAmendments.id,d)).returning();return await (0,_auth_BFFUBPoh_js__WEBPACK_IMPORTED_MODULE_2__.l)({userId:e.user.id,username:e.user.username,userRole:e.user.roleName,action:"ADDENDUM_SIGNED",category:"REPORTS",severity:"INFO",resourceType:"ADDENDUM",resourceId:String(d),description:`Addendum signed for report #${t}`,metadata:{reportId:t}}),(0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!0,addendum:y,message:"Addendum signed successfully"})}catch(e){return console.error("Error signing addendum:",e),(0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:false,error:"Failed to sign addendum"},{status:500})}};


//# sourceMappingURL=_server.ts-BrzLv4i4.js.map

__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ })

};
