export const id = 3097;
export const ids = [3097];
export const modules = {

/***/ 13097:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   s: () => (/* binding */ x)
/* harmony export */ });
/* harmony import */ var drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(22840);
/* harmony import */ var drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(82563);
/* harmony import */ var drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(20161);
/* harmony import */ var drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(94748);
/* harmony import */ var drizzle_orm__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(67910);



const a=()=>(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("id").primaryKey({autoIncrement:true}),s=()=>(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("created_at").default((0,drizzle_orm__WEBPACK_IMPORTED_MODULE_2__/* .sql */ .ll)`CURRENT_TIMESTAMP`),o=()=>(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("updated_at").default((0,drizzle_orm__WEBPACK_IMPORTED_MODULE_2__/* .sql */ .ll)`CURRENT_TIMESTAMP`),r=u=>(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)(u,{mode:"json"}),c=(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_3__/* .sqliteTable */ .D)("roles",{id:a(),name:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("name").notNull().unique(),displayName:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("display_name").notNull(),description:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("description"),level:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("level").default(0),isSystem:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("is_system",{mode:"boolean"}).default(false),createdAt:s(),updatedAt:o()}),_=(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_3__/* .sqliteTable */ .D)("permissions",{id:a(),name:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("name").notNull().unique(),displayName:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("display_name").notNull(),description:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("description"),category:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("category").notNull(),createdAt:s()}),m=(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_3__/* .sqliteTable */ .D)("role_permissions",{id:a(),roleId:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("role_id").notNull(),permissionId:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("permission_id").notNull(),createdAt:s()}),l=(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_3__/* .sqliteTable */ .D)("users",{id:a(),username:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("username").notNull().unique(),email:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("email"),password:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("password").notNull(),fullName:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("full_name").notNull(),title:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("title"),licenseNumber:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("license_number"),specialty:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("specialty"),department:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("department"),institution:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("institution"),designation:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("designation"),roleId:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("role_id").notNull(),signatureUrl:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("signature_url"),signatureName:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("signature_name"),securityQuestion:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("security_question"),securityAnswer:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("security_answer"),failedLoginAttempts:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("failed_login_attempts").default(0),lockedUntil:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("locked_until"),lastLoginAt:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("last_login_at"),lastPasswordChangeAt:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("last_password_change_at"),mustChangePassword:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("must_change_password",{mode:"boolean"}).default(false),isActive:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("is_active",{mode:"boolean"}).default(true),isVerified:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("is_verified",{mode:"boolean"}).default(false),deletedAt:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("deleted_at"),createdBy:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("created_by"),createdAt:s(),updatedAt:o()}),p=(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_3__/* .sqliteTable */ .D)("sessions",{id:a(),userId:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("user_id").notNull(),sessionToken:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("session_token").notNull().unique(),refreshToken:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("refresh_token"),ipAddress:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("ip_address"),userAgent:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("user_agent"),deviceInfo:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("device_info"),expiresAt:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("expires_at").notNull(),refreshExpiresAt:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("refresh_expires_at"),isValid:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("is_valid",{mode:"boolean"}).default(true),revokedAt:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("revoked_at"),revokedReason:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("revoked_reason"),createdAt:s()}),y=(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_3__/* .sqliteTable */ .D)("audit_logs",{id:a(),userId:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("user_id"),username:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("username"),userRole:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("user_role"),action:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("action").notNull(),category:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("category").notNull(),severity:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("severity").default("INFO"),resourceType:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("resource_type"),resourceId:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("resource_id"),description:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("description"),oldValue:r("old_value"),newValue:r("new_value"),metadata:r("metadata"),ipAddress:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("ip_address"),userAgent:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("user_agent"),createdAt:s(),checksum:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("checksum")}),g=(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_3__/* .sqliteTable */ .D)("patients",{id:a(),mrn:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("mrn").notNull(),hashedMrn:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("hashed_mrn"),firstName:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("first_name").notNull(),lastName:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("last_name").notNull(),middleName:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("middle_name"),dateOfBirth:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("date_of_birth"),gender:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("gender"),phone:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("phone"),email:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("email"),address:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("address"),isActive:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("is_active",{mode:"boolean"}).default(true),createdBy:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("created_by"),createdAt:s(),updatedAt:o()}),f=(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_3__/* .sqliteTable */ .D)("reports",{id:a(),patientId:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("patient_id"),accessionNumber:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("accession_number"),modality:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("modality").notNull(),bodyRegion:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("body_region"),studyDate:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("study_date"),patientAge:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("patient_age"),patientAgeUnit:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("patient_age_unit").default("years"),indication:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("indication"),referringPhysician:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("referring_physician"),technique:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("technique"),comparison:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("comparison"),content:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("content"),findings:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("findings"),impressions:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("impressions"),recommendations:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("recommendations"),activeTemplateId:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("active_template_id"),activeTemplateName:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("active_template_name"),status:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("status").default("DRAFT"),priority:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("priority").default("ROUTINE"),isFromWorklist:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("is_from_worklist",{mode:"boolean"}).default(false),createdBy:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("created_by").notNull(),openedBy:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("opened_by"),openedAt:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("opened_at"),assignedSpecialistId:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("assigned_specialist_id"),submittedBy:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("submitted_by"),submittedAt:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("submitted_at"),reviewedBy:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("reviewed_by"),signedBy:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("signed_by"),signedAt:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("signed_at"),statusBeforeSign:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("status_before_sign"),reportingDurationMs:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("reporting_duration_ms"),reviewDurationMs:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("review_duration_ms"),createdAt:s(),updatedAt:o()}),N=(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_3__/* .sqliteTable */ .D)("report_amendments",{id:a(),reportId:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("report_id").notNull(),amendmentType:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("amendment_type").notNull(),reason:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("reason").notNull(),content:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("content").notNull(),status:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("status").default("DRAFT"),createdBy:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("created_by").notNull(),createdAt:s(),updatedAt:o(),assignedSpecialistId:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("assigned_specialist_id"),submittedAt:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("submitted_at"),signedBy:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("signed_by"),signedAt:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("signed_at")}),v=(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_3__/* .sqliteTable */ .D)("report_workflows",{id:a(),reportId:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("report_id").notNull(),event:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("event").notNull(),userId:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("user_id").notNull(),userRole:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("user_role"),occurredAt:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("occurred_at").notNull(),assignedToId:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("assigned_to_id"),metadata:r("metadata")}),b=(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_3__/* .sqliteTable */ .D)("report_metrics_daily",{id:a(),date:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("date").notNull(),userId:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("user_id"),userRole:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("user_role"),modality:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("modality"),department:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("department"),reportCount:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("report_count").default(0),totalReportingTimeMs:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("total_reporting_time_ms").default(0),avgReportingTimeMs:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("avg_reporting_time_ms").default(0),minReportingTimeMs:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("min_reporting_time_ms"),maxReportingTimeMs:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("max_reporting_time_ms"),reviewCount:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("review_count").default(0),totalReviewTimeMs:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("total_review_time_ms").default(0),avgReviewTimeMs:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("avg_review_time_ms").default(0),createdAt:s(),updatedAt:o()}),A=(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_3__/* .sqliteTable */ .D)("worklist",{id:a(),patientId:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("patient_id").notNull(),modality:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("modality").notNull(),bodyRegion:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("body_region"),studyDescription:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("study_description"),accessionNumber:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("accession_number"),studyDate:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("study_date"),priority:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("priority").default("ROUTINE"),indication:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("indication"),referringPhysician:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("referring_physician"),status:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("status").default("PENDING"),reportId:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("report_id"),pickedUpBy:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("picked_up_by"),pickedUpAt:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("picked_up_at"),createdBy:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("created_by").notNull(),createdAt:s(),updatedAt:o()}),w=(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_3__/* .sqliteTable */ .D)("templates",{id:a(),name:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("name").notNull(),category:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("category"),modality:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("modality"),bodyRegion:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("body_region"),comparisonHtml:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("comparison_html"),techniqueHtml:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("technique_html"),findingsHtml:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("findings_html"),impressionHtml:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("impression_html"),content:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("content").notNull(),variables:r("variables"),voiceCommand:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("voice_command"),isSystem:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("is_system",{mode:"boolean"}).default(false),isGlobal:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("is_global",{mode:"boolean"}).default(false),departmentId:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("department_id"),createdBy:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("created_by").notNull(),isActive:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("is_active",{mode:"boolean"}).default(true),createdAt:s(),updatedAt:o()}),I=(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_3__/* .sqliteTable */ .D)("macros",{id:a(),name:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("name").notNull(),voiceCommand:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("voice_command"),category:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("category"),content:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("content").notNull(),variables:r("variables"),isSystem:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("is_system",{mode:"boolean"}).default(false),isGlobal:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("is_global",{mode:"boolean"}).default(false),createdBy:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("created_by").notNull(),isActive:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("is_active",{mode:"boolean"}).default(true),createdAt:s(),updatedAt:o()}),h=(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_3__/* .sqliteTable */ .D)("user_settings",{id:a(),userId:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("user_id").notNull().unique(),voiceCommandPool:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("voice_command_pool").default("system"),preferences:r("preferences"),createdAt:s(),updatedAt:o()}),T=(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_3__/* .sqliteTable */ .D)("user_presence",{id:a(),userId:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("user_id").notNull().unique(),isOnline:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("is_online",{mode:"boolean"}).default(false),lastSeenAt:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("last_seen_at"),status:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("status").default("available"),createdAt:s(),updatedAt:o()}),k=(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_3__/* .sqliteTable */ .D)("chat_messages",{id:a(),senderId:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("sender_id").notNull(),receiverId:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("receiver_id").notNull(),content:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("content").notNull(),isRead:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("is_read",{mode:"boolean"}).default(false),readAt:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("read_at"),createdAt:s()}),R=(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_3__/* .sqliteTable */ .D)("voice_training_samples",{id:a(),userId:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("user_id").notNull(),audioPath:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("audio_path").notNull(),audioDuration:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("audio_duration"),audioFormat:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("audio_format").default("wav"),rawTranscript:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("raw_transcript").notNull(),verifiedTranscript:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("verified_transcript"),formattedTranscript:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("formatted_transcript"),correctedTranscript:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("corrected_transcript"),adminEditedTranscript:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("admin_edited_transcript"),finalTranscript:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("final_transcript"),reportId:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("report_id"),reportType:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("report_type"),sessionId:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("session_id"),wordCount:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("word_count"),avgVolume:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_4__/* .real */ .x)("avg_volume"),silencePercent:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_4__/* .real */ .x)("silence_percent"),isReviewed:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("is_reviewed",{mode:"boolean"}).default(false),reviewedBy:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("reviewed_by"),reviewedAt:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("reviewed_at"),isUsable:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("is_usable",{mode:"boolean"}).default(true),qualityNotes:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("quality_notes"),createdAt:s(),updatedAt:o()}),q=(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_3__/* .sqliteTable */ .D)("organization_settings",{id:a(),key:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("key").notNull().unique(),value:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("value"),description:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("description"),updatedBy:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("updated_by"),createdAt:s(),updatedAt:o()}),B=(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_3__/* .sqliteTable */ .D)("report_editors",{id:a(),reportId:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("report_id").notNull(),userId:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("user_id").notNull(),lastHeartbeat:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("last_heartbeat").notNull(),createdAt:s()}),M=(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_3__/* .sqliteTable */ .D)("report_edit_locks",{id:a(),reportId:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("report_id").notNull().unique(),userId:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_0__/* .integer */ .nd)("user_id").notNull(),acquiredAt:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("acquired_at").notNull(),expiresAt:(0,drizzle_orm_sqlite_core__WEBPACK_IMPORTED_MODULE_1__/* .text */ .Qq)("expires_at").notNull(),createdAt:s()}),S=l,x=Object.freeze(Object.defineProperty({__proto__:null,auditLogs:y,chatMessages:k,doctors:S,macros:I,organizationSettings:q,patients:g,permissions:_,reportAmendments:N,reportEditLocks:M,reportEditors:B,reportMetricsDaily:b,reportWorkflows:v,reports:f,rolePermissions:m,roles:c,sessions:p,templates:w,userPresence:T,userSettings:h,users:l,voiceTrainingSamples:R,worklist:A},Symbol.toStringTag,{value:"Module"}));


//# sourceMappingURL=sqlite-schema.js-CjS2czF2.js.map


/***/ }),

/***/ 93145:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {


// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  v: () => (/* binding */ SQLiteColumn),
  o: () => (/* binding */ SQLiteColumnBuilder)
});

// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/column-builder.js
var column_builder = __webpack_require__(30057);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/column.js
var column = __webpack_require__(599);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/entity.js
var entity = __webpack_require__(48666);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/table.utils.js
var table_utils = __webpack_require__(66918);
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/sqlite-core/foreign-keys.js


class ForeignKeyBuilder {
  static [entity/* entityKind */.i] = "SQLiteForeignKeyBuilder";
  /** @internal */
  reference;
  /** @internal */
  _onUpdate;
  /** @internal */
  _onDelete;
  constructor(config, actions) {
    this.reference = () => {
      const { name, columns, foreignColumns } = config();
      return { name, columns, foreignTable: foreignColumns[0].table, foreignColumns };
    };
    if (actions) {
      this._onUpdate = actions.onUpdate;
      this._onDelete = actions.onDelete;
    }
  }
  onUpdate(action) {
    this._onUpdate = action;
    return this;
  }
  onDelete(action) {
    this._onDelete = action;
    return this;
  }
  /** @internal */
  build(table) {
    return new ForeignKey(table, this);
  }
}
class ForeignKey {
  constructor(table, builder) {
    this.table = table;
    this.reference = builder.reference;
    this.onUpdate = builder._onUpdate;
    this.onDelete = builder._onDelete;
  }
  static [entity/* entityKind */.i] = "SQLiteForeignKey";
  reference;
  onUpdate;
  onDelete;
  getName() {
    const { name, columns, foreignColumns } = this.reference();
    const columnNames = columns.map((column) => column.name);
    const foreignColumnNames = foreignColumns.map((column) => column.name);
    const chunks = [
      this.table[table_utils/* TableName */.E],
      ...columnNames,
      foreignColumns[0].table[table_utils/* TableName */.E],
      ...foreignColumnNames
    ];
    return name ?? `${chunks.join("_")}_fk`;
  }
}
function foreignKey(config) {
  function mappedConfig() {
    if (typeof config === "function") {
      const { name, columns, foreignColumns } = config();
      return {
        name,
        columns,
        foreignColumns
      };
    }
    return config;
  }
  return new ForeignKeyBuilder(mappedConfig);
}

//# sourceMappingURL=foreign-keys.js.map
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/sqlite-core/unique-constraint.js


function uniqueKeyName(table, columns) {
  return `${table[table_utils/* TableName */.E]}_${columns.join("_")}_unique`;
}
function unique(name) {
  return new UniqueOnConstraintBuilder(name);
}
class UniqueConstraintBuilder {
  constructor(columns, name) {
    this.name = name;
    this.columns = columns;
  }
  static [entity/* entityKind */.i] = (/* unused pure expression or super */ null && ("SQLiteUniqueConstraintBuilder"));
  /** @internal */
  columns;
  /** @internal */
  build(table) {
    return new UniqueConstraint(table, this.columns, this.name);
  }
}
class UniqueOnConstraintBuilder {
  static [entity/* entityKind */.i] = (/* unused pure expression or super */ null && ("SQLiteUniqueOnConstraintBuilder"));
  /** @internal */
  name;
  constructor(name) {
    this.name = name;
  }
  on(...columns) {
    return new UniqueConstraintBuilder(columns, this.name);
  }
}
class UniqueConstraint {
  constructor(table, columns, name) {
    this.table = table;
    this.columns = columns;
    this.name = name ?? uniqueKeyName(this.table, this.columns.map((column) => column.name));
  }
  static [entity/* entityKind */.i] = (/* unused pure expression or super */ null && ("SQLiteUniqueConstraint"));
  columns;
  name;
  getName() {
    return this.name;
  }
}

//# sourceMappingURL=unique-constraint.js.map
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/sqlite-core/columns/common.js





class SQLiteColumnBuilder extends column_builder/* ColumnBuilder */.Q {
  static [entity/* entityKind */.i] = "SQLiteColumnBuilder";
  foreignKeyConfigs = [];
  references(ref, actions = {}) {
    this.foreignKeyConfigs.push({ ref, actions });
    return this;
  }
  unique(name) {
    this.config.isUnique = true;
    this.config.uniqueName = name;
    return this;
  }
  generatedAlwaysAs(as, config) {
    this.config.generated = {
      as,
      type: "always",
      mode: config?.mode ?? "virtual"
    };
    return this;
  }
  /** @internal */
  buildForeignKeys(column, table) {
    return this.foreignKeyConfigs.map(({ ref, actions }) => {
      return ((ref2, actions2) => {
        const builder = new ForeignKeyBuilder(() => {
          const foreignColumn = ref2();
          return { columns: [column], foreignColumns: [foreignColumn] };
        });
        if (actions2.onUpdate) {
          builder.onUpdate(actions2.onUpdate);
        }
        if (actions2.onDelete) {
          builder.onDelete(actions2.onDelete);
        }
        return builder.build(table);
      })(ref, actions);
    });
  }
}
class SQLiteColumn extends column/* Column */.V {
  constructor(table, config) {
    if (!config.uniqueName) {
      config.uniqueName = uniqueKeyName(table, [config.name]);
    }
    super(table, config);
    this.table = table;
  }
  static [entity/* entityKind */.i] = "SQLiteColumn";
}

//# sourceMappingURL=common.js.map

/***/ }),

/***/ 22840:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   nd: () => (/* binding */ integer)
/* harmony export */ });
/* unused harmony exports SQLiteBaseInteger, SQLiteBaseIntegerBuilder, SQLiteBoolean, SQLiteBooleanBuilder, SQLiteInteger, SQLiteIntegerBuilder, SQLiteTimestamp, SQLiteTimestampBuilder, int */
/* harmony import */ var _entity_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(48666);
/* harmony import */ var _sql_sql_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(67910);
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(82348);
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(93145);




class SQLiteBaseIntegerBuilder extends _common_js__WEBPACK_IMPORTED_MODULE_0__/* .SQLiteColumnBuilder */ .o {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "SQLiteBaseIntegerBuilder";
  constructor(name, dataType, columnType) {
    super(name, dataType, columnType);
    this.config.autoIncrement = false;
  }
  primaryKey(config) {
    if (config?.autoIncrement) {
      this.config.autoIncrement = true;
    }
    this.config.hasDefault = true;
    return super.primaryKey();
  }
}
class SQLiteBaseInteger extends _common_js__WEBPACK_IMPORTED_MODULE_0__/* .SQLiteColumn */ .v {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "SQLiteBaseInteger";
  autoIncrement = this.config.autoIncrement;
  getSQLType() {
    return "integer";
  }
}
class SQLiteIntegerBuilder extends SQLiteBaseIntegerBuilder {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "SQLiteIntegerBuilder";
  constructor(name) {
    super(name, "number", "SQLiteInteger");
  }
  build(table) {
    return new SQLiteInteger(
      table,
      this.config
    );
  }
}
class SQLiteInteger extends SQLiteBaseInteger {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "SQLiteInteger";
}
class SQLiteTimestampBuilder extends SQLiteBaseIntegerBuilder {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "SQLiteTimestampBuilder";
  constructor(name, mode) {
    super(name, "date", "SQLiteTimestamp");
    this.config.mode = mode;
  }
  /**
   * @deprecated Use `default()` with your own expression instead.
   *
   * Adds `DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer))` to the column, which is the current epoch timestamp in milliseconds.
   */
  defaultNow() {
    return this.default((0,_sql_sql_js__WEBPACK_IMPORTED_MODULE_2__/* .sql */ .ll)`(cast((julianday('now') - 2440587.5)*86400000 as integer))`);
  }
  build(table) {
    return new SQLiteTimestamp(
      table,
      this.config
    );
  }
}
class SQLiteTimestamp extends SQLiteBaseInteger {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "SQLiteTimestamp";
  mode = this.config.mode;
  mapFromDriverValue(value) {
    if (this.config.mode === "timestamp") {
      return new Date(value * 1e3);
    }
    return new Date(value);
  }
  mapToDriverValue(value) {
    const unix = value.getTime();
    if (this.config.mode === "timestamp") {
      return Math.floor(unix / 1e3);
    }
    return unix;
  }
}
class SQLiteBooleanBuilder extends SQLiteBaseIntegerBuilder {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "SQLiteBooleanBuilder";
  constructor(name, mode) {
    super(name, "boolean", "SQLiteBoolean");
    this.config.mode = mode;
  }
  build(table) {
    return new SQLiteBoolean(
      table,
      this.config
    );
  }
}
class SQLiteBoolean extends SQLiteBaseInteger {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "SQLiteBoolean";
  mode = this.config.mode;
  mapFromDriverValue(value) {
    return Number(value) === 1;
  }
  mapToDriverValue(value) {
    return value ? 1 : 0;
  }
}
function integer(a, b) {
  const { name, config } = (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__/* .getColumnNameAndConfig */ .Ll)(a, b);
  if (config?.mode === "timestamp" || config?.mode === "timestamp_ms") {
    return new SQLiteTimestampBuilder(name, config.mode);
  }
  if (config?.mode === "boolean") {
    return new SQLiteBooleanBuilder(name, config.mode);
  }
  return new SQLiteIntegerBuilder(name);
}
const int = (/* unused pure expression or super */ null && (integer));

//# sourceMappingURL=integer.js.map

/***/ }),

/***/ 94748:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   x: () => (/* binding */ real)
/* harmony export */ });
/* unused harmony exports SQLiteReal, SQLiteRealBuilder */
/* harmony import */ var _entity_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(48666);
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(93145);


class SQLiteRealBuilder extends _common_js__WEBPACK_IMPORTED_MODULE_0__/* .SQLiteColumnBuilder */ .o {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "SQLiteRealBuilder";
  constructor(name) {
    super(name, "number", "SQLiteReal");
  }
  /** @internal */
  build(table) {
    return new SQLiteReal(table, this.config);
  }
}
class SQLiteReal extends _common_js__WEBPACK_IMPORTED_MODULE_0__/* .SQLiteColumn */ .v {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "SQLiteReal";
  getSQLType() {
    return "real";
  }
}
function real(name) {
  return new SQLiteRealBuilder(name ?? "");
}

//# sourceMappingURL=real.js.map

/***/ }),

/***/ 82563:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Qq: () => (/* binding */ text)
/* harmony export */ });
/* unused harmony exports SQLiteText, SQLiteTextBuilder, SQLiteTextJson, SQLiteTextJsonBuilder */
/* harmony import */ var _entity_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(48666);
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(82348);
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(93145);



class SQLiteTextBuilder extends _common_js__WEBPACK_IMPORTED_MODULE_0__/* .SQLiteColumnBuilder */ .o {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "SQLiteTextBuilder";
  constructor(name, config) {
    super(name, "string", "SQLiteText");
    this.config.enumValues = config.enum;
    this.config.length = config.length;
  }
  /** @internal */
  build(table) {
    return new SQLiteText(
      table,
      this.config
    );
  }
}
class SQLiteText extends _common_js__WEBPACK_IMPORTED_MODULE_0__/* .SQLiteColumn */ .v {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "SQLiteText";
  enumValues = this.config.enumValues;
  length = this.config.length;
  constructor(table, config) {
    super(table, config);
  }
  getSQLType() {
    return `text${this.config.length ? `(${this.config.length})` : ""}`;
  }
}
class SQLiteTextJsonBuilder extends _common_js__WEBPACK_IMPORTED_MODULE_0__/* .SQLiteColumnBuilder */ .o {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "SQLiteTextJsonBuilder";
  constructor(name) {
    super(name, "json", "SQLiteTextJson");
  }
  /** @internal */
  build(table) {
    return new SQLiteTextJson(
      table,
      this.config
    );
  }
}
class SQLiteTextJson extends _common_js__WEBPACK_IMPORTED_MODULE_0__/* .SQLiteColumn */ .v {
  static [_entity_js__WEBPACK_IMPORTED_MODULE_1__/* .entityKind */ .i] = "SQLiteTextJson";
  getSQLType() {
    return "text";
  }
  mapFromDriverValue(value) {
    return JSON.parse(value);
  }
  mapToDriverValue(value) {
    return JSON.stringify(value);
  }
}
function text(a, b = {}) {
  const { name, config } = (0,_utils_js__WEBPACK_IMPORTED_MODULE_2__/* .getColumnNameAndConfig */ .Ll)(a, b);
  if (config.mode === "json") {
    return new SQLiteTextJsonBuilder(name);
  }
  return new SQLiteTextBuilder(name, config);
}

//# sourceMappingURL=text.js.map

/***/ }),

/***/ 20161:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {


// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  jo: () => (/* binding */ SQLiteTable),
  D: () => (/* binding */ sqliteTable)
});

// UNUSED EXPORTS: InlineForeignKeys, sqliteTableCreator

// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/entity.js
var entity = __webpack_require__(48666);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/table.js
var drizzle_orm_table = __webpack_require__(17169);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/utils.js
var utils = __webpack_require__(82348);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/sqlite-core/columns/common.js + 2 modules
var common = __webpack_require__(93145);
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/sqlite-core/columns/blob.js



class SQLiteBigIntBuilder extends common/* SQLiteColumnBuilder */.o {
  static [entity/* entityKind */.i] = "SQLiteBigIntBuilder";
  constructor(name) {
    super(name, "bigint", "SQLiteBigInt");
  }
  /** @internal */
  build(table) {
    return new SQLiteBigInt(table, this.config);
  }
}
class SQLiteBigInt extends common/* SQLiteColumn */.v {
  static [entity/* entityKind */.i] = "SQLiteBigInt";
  getSQLType() {
    return "blob";
  }
  mapFromDriverValue(value) {
    if (typeof Buffer !== "undefined" && Buffer.from) {
      const buf = Buffer.isBuffer(value) ? value : value instanceof ArrayBuffer ? Buffer.from(value) : value.buffer ? Buffer.from(value.buffer, value.byteOffset, value.byteLength) : Buffer.from(value);
      return BigInt(buf.toString("utf8"));
    }
    return BigInt(utils/* textDecoder */.su.decode(value));
  }
  mapToDriverValue(value) {
    return Buffer.from(value.toString());
  }
}
class SQLiteBlobJsonBuilder extends common/* SQLiteColumnBuilder */.o {
  static [entity/* entityKind */.i] = "SQLiteBlobJsonBuilder";
  constructor(name) {
    super(name, "json", "SQLiteBlobJson");
  }
  /** @internal */
  build(table) {
    return new SQLiteBlobJson(
      table,
      this.config
    );
  }
}
class SQLiteBlobJson extends common/* SQLiteColumn */.v {
  static [entity/* entityKind */.i] = "SQLiteBlobJson";
  getSQLType() {
    return "blob";
  }
  mapFromDriverValue(value) {
    if (typeof Buffer !== "undefined" && Buffer.from) {
      const buf = Buffer.isBuffer(value) ? value : value instanceof ArrayBuffer ? Buffer.from(value) : value.buffer ? Buffer.from(value.buffer, value.byteOffset, value.byteLength) : Buffer.from(value);
      return JSON.parse(buf.toString("utf8"));
    }
    return JSON.parse(utils/* textDecoder */.su.decode(value));
  }
  mapToDriverValue(value) {
    return Buffer.from(JSON.stringify(value));
  }
}
class SQLiteBlobBufferBuilder extends common/* SQLiteColumnBuilder */.o {
  static [entity/* entityKind */.i] = "SQLiteBlobBufferBuilder";
  constructor(name) {
    super(name, "buffer", "SQLiteBlobBuffer");
  }
  /** @internal */
  build(table) {
    return new SQLiteBlobBuffer(table, this.config);
  }
}
class SQLiteBlobBuffer extends common/* SQLiteColumn */.v {
  static [entity/* entityKind */.i] = "SQLiteBlobBuffer";
  mapFromDriverValue(value) {
    if (Buffer.isBuffer(value)) {
      return value;
    }
    return Buffer.from(value);
  }
  getSQLType() {
    return "blob";
  }
}
function blob(a, b) {
  const { name, config } = (0,utils/* getColumnNameAndConfig */.Ll)(a, b);
  if (config?.mode === "json") {
    return new SQLiteBlobJsonBuilder(name);
  }
  if (config?.mode === "bigint") {
    return new SQLiteBigIntBuilder(name);
  }
  return new SQLiteBlobBufferBuilder(name);
}

//# sourceMappingURL=blob.js.map
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/sqlite-core/columns/custom.js



class SQLiteCustomColumnBuilder extends common/* SQLiteColumnBuilder */.o {
  static [entity/* entityKind */.i] = "SQLiteCustomColumnBuilder";
  constructor(name, fieldConfig, customTypeParams) {
    super(name, "custom", "SQLiteCustomColumn");
    this.config.fieldConfig = fieldConfig;
    this.config.customTypeParams = customTypeParams;
  }
  /** @internal */
  build(table) {
    return new SQLiteCustomColumn(
      table,
      this.config
    );
  }
}
class SQLiteCustomColumn extends common/* SQLiteColumn */.v {
  static [entity/* entityKind */.i] = "SQLiteCustomColumn";
  sqlName;
  mapTo;
  mapFrom;
  constructor(table, config) {
    super(table, config);
    this.sqlName = config.customTypeParams.dataType(config.fieldConfig);
    this.mapTo = config.customTypeParams.toDriver;
    this.mapFrom = config.customTypeParams.fromDriver;
  }
  getSQLType() {
    return this.sqlName;
  }
  mapFromDriverValue(value) {
    return typeof this.mapFrom === "function" ? this.mapFrom(value) : value;
  }
  mapToDriverValue(value) {
    return typeof this.mapTo === "function" ? this.mapTo(value) : value;
  }
}
function customType(customTypeParams) {
  return (a, b) => {
    const { name, config } = (0,utils/* getColumnNameAndConfig */.Ll)(a, b);
    return new SQLiteCustomColumnBuilder(
      name,
      config,
      customTypeParams
    );
  };
}

//# sourceMappingURL=custom.js.map
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/sqlite-core/columns/integer.js
var integer = __webpack_require__(22840);
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/sqlite-core/columns/numeric.js



class SQLiteNumericBuilder extends common/* SQLiteColumnBuilder */.o {
  static [entity/* entityKind */.i] = "SQLiteNumericBuilder";
  constructor(name) {
    super(name, "string", "SQLiteNumeric");
  }
  /** @internal */
  build(table) {
    return new SQLiteNumeric(
      table,
      this.config
    );
  }
}
class SQLiteNumeric extends common/* SQLiteColumn */.v {
  static [entity/* entityKind */.i] = "SQLiteNumeric";
  mapFromDriverValue(value) {
    if (typeof value === "string") return value;
    return String(value);
  }
  getSQLType() {
    return "numeric";
  }
}
class SQLiteNumericNumberBuilder extends common/* SQLiteColumnBuilder */.o {
  static [entity/* entityKind */.i] = "SQLiteNumericNumberBuilder";
  constructor(name) {
    super(name, "number", "SQLiteNumericNumber");
  }
  /** @internal */
  build(table) {
    return new SQLiteNumericNumber(
      table,
      this.config
    );
  }
}
class SQLiteNumericNumber extends common/* SQLiteColumn */.v {
  static [entity/* entityKind */.i] = "SQLiteNumericNumber";
  mapFromDriverValue(value) {
    if (typeof value === "number") return value;
    return Number(value);
  }
  mapToDriverValue = String;
  getSQLType() {
    return "numeric";
  }
}
class SQLiteNumericBigIntBuilder extends common/* SQLiteColumnBuilder */.o {
  static [entity/* entityKind */.i] = "SQLiteNumericBigIntBuilder";
  constructor(name) {
    super(name, "bigint", "SQLiteNumericBigInt");
  }
  /** @internal */
  build(table) {
    return new SQLiteNumericBigInt(
      table,
      this.config
    );
  }
}
class SQLiteNumericBigInt extends common/* SQLiteColumn */.v {
  static [entity/* entityKind */.i] = "SQLiteNumericBigInt";
  mapFromDriverValue = BigInt;
  mapToDriverValue = String;
  getSQLType() {
    return "numeric";
  }
}
function numeric(a, b) {
  const { name, config } = (0,utils/* getColumnNameAndConfig */.Ll)(a, b);
  const mode = config?.mode;
  return mode === "number" ? new SQLiteNumericNumberBuilder(name) : mode === "bigint" ? new SQLiteNumericBigIntBuilder(name) : new SQLiteNumericBuilder(name);
}

//# sourceMappingURL=numeric.js.map
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/sqlite-core/columns/real.js
var real = __webpack_require__(94748);
// EXTERNAL MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/sqlite-core/columns/text.js
var columns_text = __webpack_require__(82563);
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/sqlite-core/columns/all.js






function getSQLiteColumnBuilders() {
  return {
    blob: blob,
    customType: customType,
    integer: integer/* integer */.nd,
    numeric: numeric,
    real: real/* real */.x,
    text: columns_text/* text */.Qq
  };
}

//# sourceMappingURL=all.js.map
;// CONCATENATED MODULE: ../../node_modules/.pnpm/drizzle-orm@0.44.7_@types+better-sqlite3@9.6.0_@types+pg@8.23.1_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/sqlite-core/table.js



const InlineForeignKeys = Symbol.for("drizzle:SQLiteInlineForeignKeys");
class SQLiteTable extends drizzle_orm_table/* Table */.XI {
  static [entity/* entityKind */.i] = "SQLiteTable";
  /** @internal */
  static Symbol = Object.assign({}, drizzle_orm_table/* Table */.XI.Symbol, {
    InlineForeignKeys
  });
  /** @internal */
  [drizzle_orm_table/* Table */.XI.Symbol.Columns];
  /** @internal */
  [InlineForeignKeys] = [];
  /** @internal */
  [drizzle_orm_table/* Table */.XI.Symbol.ExtraConfigBuilder] = void 0;
}
function sqliteTableBase(name, columns, extraConfig, schema, baseName = name) {
  const rawTable = new SQLiteTable(name, schema, baseName);
  const parsedColumns = typeof columns === "function" ? columns(getSQLiteColumnBuilders()) : columns;
  const builtColumns = Object.fromEntries(
    Object.entries(parsedColumns).map(([name2, colBuilderBase]) => {
      const colBuilder = colBuilderBase;
      colBuilder.setName(name2);
      const column = colBuilder.build(rawTable);
      rawTable[InlineForeignKeys].push(...colBuilder.buildForeignKeys(column, rawTable));
      return [name2, column];
    })
  );
  const table = Object.assign(rawTable, builtColumns);
  table[drizzle_orm_table/* Table */.XI.Symbol.Columns] = builtColumns;
  table[drizzle_orm_table/* Table */.XI.Symbol.ExtraConfigColumns] = builtColumns;
  if (extraConfig) {
    table[SQLiteTable.Symbol.ExtraConfigBuilder] = extraConfig;
  }
  return table;
}
const sqliteTable = (name, columns, extraConfig) => {
  return sqliteTableBase(name, columns, extraConfig);
};
function sqliteTableCreator(customizeTableName) {
  return (name, columns, extraConfig) => {
    return sqliteTableBase(customizeTableName(name), columns, extraConfig, void 0, name);
  };
}

//# sourceMappingURL=table.js.map

/***/ })

};
