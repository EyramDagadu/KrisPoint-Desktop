export const id = 8195;
export const ids = [8195];
export const modules = {

/***/ 68195:
/***/ ((__webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(__webpack_module__, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   POST: () => (/* binding */ v)
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












const v=async({request:c,params:m$1})=>{try{const s=await (0,_auth_BFFUBPoh_js__WEBPACK_IMPORTED_MODULE_2__.v)(c);if(!s.success||!s.user)return (0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Unauthorized"},{status:401});const r=parseInt(m$1.id),i=parseInt(m$1.addendumId);if(isNaN(r)||isNaN(i))return (0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Invalid ID"},{status:400});const[u]=await _db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.d.select().from(_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.reportAmendments).where((0,drizzle_orm__WEBPACK_IMPORTED_MODULE_8__/* .and */ .Uo)((0,drizzle_orm__WEBPACK_IMPORTED_MODULE_8__.eq)(_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.reportAmendments.id,i),(0,drizzle_orm__WEBPACK_IMPORTED_MODULE_8__.eq)(_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.reportAmendments.reportId,r))).limit(1);if(!u)return (0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Addendum not found"},{status:404});if(u.status!=="DRAFT")return (0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Only draft addendums can be submitted"},{status:400});if(u.createdBy!==s.user.id)return (0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Only the addendum creator can submit it"},{status:403});const f=await c.json(),{specialistId:a}=f;if(!a)return (0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Please select a specialist for review"},{status:400});const[d]=await _db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.d.select({fullName:_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.users.fullName,title:_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.users.title}).from(_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.users).where((0,drizzle_orm__WEBPACK_IMPORTED_MODULE_8__.eq)(_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.users.id,a)).limit(1),p$1=d?d.title?`${d.title} ${d.fullName}`:d.fullName:`specialist #${a}`,b=await (0,_getReportIdentifier_DBWnsoia_js__WEBPACK_IMPORTED_MODULE_3__.p)(r),l=new Date,[I]=await _db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.d.update(_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.reportAmendments).set({status:"SUBMITTED",assignedSpecialistId:a,submittedAt:l,updatedAt:l}).where((0,drizzle_orm__WEBPACK_IMPORTED_MODULE_8__.eq)(_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.reportAmendments.id,i)).returning();return await (0,_auth_BFFUBPoh_js__WEBPACK_IMPORTED_MODULE_2__.l)({userId:s.user.id,username:s.user.username,userRole:s.user.roleName,action:"ADDENDUM_SUBMITTED",category:"REPORTS",severity:"INFO",resourceType:"ADDENDUM",resourceId:String(i),description:`Addendum submitted for report #${r} to ${p$1}`,metadata:{reportId:r,specialistId:a}}),(0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!0,addendum:I,message:"Addendum submitted for review"})}catch(s){return console.error("Error submitting addendum:",s),(0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:false,error:"Failed to submit addendum"},{status:500})}};


//# sourceMappingURL=_server.ts-Dh67eSMx.js.map

__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ })

};
