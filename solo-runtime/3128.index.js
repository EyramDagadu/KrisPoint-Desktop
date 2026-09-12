export const id = 3128;
export const ids = [3128];
export const modules = {

/***/ 3128:
/***/ ((__webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(__webpack_module__, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   GET: () => (/* binding */ m),
/* harmony export */   POST: () => (/* binding */ f)
/* harmony export */ });
/* harmony import */ var _index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(47868);
/* harmony import */ var _seed_Dii_9_Vz_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(83456);
/* harmony import */ var _db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(35892);
/* harmony import */ var dotenv_config__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(52874);
/* harmony import */ var pg__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(83849);
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_seed_Dii_9_Vz_js__WEBPACK_IMPORTED_MODULE_1__, _db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_2__]);
([_seed_Dii_9_Vz_js__WEBPACK_IMPORTED_MODULE_1__, _db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_2__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);









const f=async({url:r})=>{try{if(r.searchParams.get("force")==="true"){console.log("Force reseed requested...");const s=await (0,_seed_Dii_9_Vz_js__WEBPACK_IMPORTED_MODULE_1__.R)();return s.success?(0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!0,message:`Force reseed complete! Added ${s.insertedCount} role-permission links.`,insertedCount:s.insertedCount}):(0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Force reseed failed",details:s.error},{status:500})}if(!await (0,_seed_Dii_9_Vz_js__WEBPACK_IMPORTED_MODULE_1__.b)()){const s=await (0,_seed_Dii_9_Vz_js__WEBPACK_IMPORTED_MODULE_1__.C)();if(!s.success)return (0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Seeding roles/permissions failed",details:s.error},{status:500})}const c=await (0,_seed_Dii_9_Vz_js__WEBPACK_IMPORTED_MODULE_1__.v)();return c.success?(0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!0,message:"Database seeded successfully"}):(0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Seeding templates/macros failed",details:c.error},{status:500})}catch(t){return console.error("Seed API error:",t),(0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:false,error:"Internal server error"},{status:500})}},m=async()=>{try{const r=await (0,_seed_Dii_9_Vz_js__WEBPACK_IMPORTED_MODULE_1__.b)();return (0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!0,isSeeded:r})}catch(r){return console.error("Seed check error:",r),(0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:false,error:"Failed to check seed status"},{status:500})}};


//# sourceMappingURL=_server.ts-CRhub0LO.js.map

__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ })

};
