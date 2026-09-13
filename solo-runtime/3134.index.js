export const id = 3134;
export const ids = [3134];
export const modules = {

/***/ 50586:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   u: () => (/* binding */ u)
/* harmony export */ });
/* harmony import */ var _index_js_BPHC9uE5_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(34899);
/* harmony import */ var _attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(89831);



/* empty css                                           */function u(d,t){d.component(l=>{let a=(0,_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.M)(t.show,false),i=(0,_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.M)(t.title,"Confirm Action"),o=(0,_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.M)(t.message,"Are you sure you want to proceed?"),c=(0,_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.M)(t.confirmText,"Confirm"),m=(0,_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.M)(t.cancelText,"Cancel"),n=(0,_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.M)(t.danger,false);a?l.push(`<!--[0--><div class="confirm-backdrop svelte-193t4hn" role="dialog" aria-modal="true"><div class="confirm-dialog svelte-193t4hn"><div class="confirm-header svelte-193t4hn"><h3 class="svelte-193t4hn">${(0,_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.P)(i)}</h3></div> <div class="confirm-body svelte-193t4hn"><p class="svelte-193t4hn">${(0,_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.P)(o)}</p></div> <div class="confirm-actions svelte-193t4hn"><button class="btn btn-cancel svelte-193t4hn">${(0,_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.P)(m)}</button> <button${(0,_index_js_BPHC9uE5_js__WEBPACK_IMPORTED_MODULE_0__.a4)("btn svelte-193t4hn",void 0,{"btn-danger":n,"btn-primary":!n})}>${(0,_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.P)(c)}</button></div></div></div>`):l.push("<!--[-1-->"),l.push("<!--]-->"),(0,_index_js_BPHC9uE5_js__WEBPACK_IMPORTED_MODULE_0__.a5)(t,{show:a,title:i,message:o,confirmText:c,cancelText:m,danger:n});});}


//# sourceMappingURL=ConfirmDialog.js-B_ufL4xb.js.map


/***/ }),

/***/ 40298:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   d: () => (/* binding */ d),
/* harmony export */   e: () => (/* binding */ e),
/* harmony export */   f: () => (/* binding */ f),
/* harmony export */   h: () => (/* binding */ h),
/* harmony export */   l: () => (/* binding */ l),
/* harmony export */   p: () => (/* binding */ p)
/* harmony export */ });
/* harmony import */ var _index2_js_B91mjNiV_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(12144);


const n={pendingReviews:0,returnedReports:0,loading:false,lastFetched:null};function i(){const{subscribe:t,set:a,update:c}=(0,_index2_js_B91mjNiV_js__WEBPACK_IMPORTED_MODULE_0__.z)(n);return {subscribe:t,async loadCounts(){},async refreshAfterAction(){await this.loadCounts();},reset(){a(n);}}}const d=i(),o={isAuthenticated:false,currentUser:null,permissions:[],isLoading:false,error:null},e=(0,_index2_js_B91mjNiV_js__WEBPACK_IMPORTED_MODULE_0__.z)(o),l=(0,_index2_js_B91mjNiV_js__WEBPACK_IMPORTED_MODULE_0__.B)(e,t=>t.isAuthenticated),p=(0,_index2_js_B91mjNiV_js__WEBPACK_IMPORTED_MODULE_0__.B)(e,t=>t.currentUser),h=(0,_index2_js_B91mjNiV_js__WEBPACK_IMPORTED_MODULE_0__.B)(e,t=>t.permissions);(0,_index2_js_B91mjNiV_js__WEBPACK_IMPORTED_MODULE_0__.B)(e,t=>t.error);const f=(0,_index2_js_B91mjNiV_js__WEBPACK_IMPORTED_MODULE_0__.B)(e,t=>t.isLoading);


//# sourceMappingURL=authStore.js-Bl2ko8Kh.js.map


/***/ }),

/***/ 19976:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (/* binding */ A),
/* harmony export */   f: () => (/* binding */ f),
/* harmony export */   o: () => (/* binding */ o),
/* harmony export */   p: () => (/* binding */ p),
/* harmony export */   s: () => (/* binding */ s),
/* harmony export */   w: () => (/* binding */ w)
/* harmony export */ });
/* harmony import */ var _index2_js_B91mjNiV_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(12144);


const c={isActivated:false,license:null,features:[],expiresAt:null,lastValidated:null,error:null,isLoading:false,serverUrl:""},s=(0,_index2_js_B91mjNiV_js__WEBPACK_IMPORTED_MODULE_0__.z)(c),o=(0,_index2_js_B91mjNiV_js__WEBPACK_IMPORTED_MODULE_0__.B)(s,e=>!(!e.isActivated||!e.license||e.expiresAt&&new Date(e.expiresAt)<new Date)),f=(0,_index2_js_B91mjNiV_js__WEBPACK_IMPORTED_MODULE_0__.B)(s,e=>e.license?!!(e.expiresAt&&new Date(e.expiresAt)<new Date):false),w=(0,_index2_js_B91mjNiV_js__WEBPACK_IMPORTED_MODULE_0__.B)(s,e=>e.features||[]),p=e=>{const r=(0,_index2_js_B91mjNiV_js__WEBPACK_IMPORTED_MODULE_0__.E)(s);return !r.isActivated||r.expiresAt&&new Date(r.expiresAt)<new Date?false:r.features?.includes(e)||false},A={async initialize(){},setServerUrl(e){},async activate(e){return {success:false,error:"Not in browser"}},async validateOnline(){},async deactivate(){return {success:false}},clear(){},getDaysRemaining(){const e=(0,_index2_js_B91mjNiV_js__WEBPACK_IMPORTED_MODULE_0__.E)(s);if(!e.expiresAt)return null;const r=new Date(e.expiresAt)-new Date;return Math.max(0,Math.ceil(r/(1e3*60*60*24)))},async getSubscriptionStatus(){return null},async setupAutoRenew(e){return {success:false,error:"Not in browser"}},async changeAutoRenewPlan(e){return {success:false,error:"Not in browser"}},getTopUpUrl(e){const r=(0,_index2_js_B91mjNiV_js__WEBPACK_IMPORTED_MODULE_0__.E)(s);if(!r.serverUrl||!r.license?.key)return null;let i=r.serverUrl;const t=new URLSearchParams;return t.set("license_key",r.license.key),e&&t.set("plan_id",String(e)),`${i}?${t.toString()}`},async toggleAutoRenew(e){return {success:false,error:"Not in browser"}}};


//# sourceMappingURL=licenseStore.js-CSOu6edw.js.map


/***/ }),

/***/ 42299:
/***/ ((__unused_webpack___webpack_module__, __unused_webpack___webpack_exports__, __webpack_require__) => {

/* harmony import */ var _attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(89831);
/* harmony import */ var _exports_js_CSfjgVlQ_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(42623);
/* harmony import */ var _utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(26765);
/* harmony import */ var _root_js_CksVe0PM_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(22967);





const o=_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_0__.z.toString().includes("$$")||/function \w+\(\) \{\}/.test(_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_0__.z.toString()),r="a:";o&&new URL(r);
//# sourceMappingURL=state.svelte.js-Cm6uwfjG.js.map


/***/ }),

/***/ 53134:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* binding */ Ne)
});

// EXTERNAL MODULE: ./build/server/chunks/chunks/index.js-BPHC9uE5.js
var index_js_BPHC9uE5 = __webpack_require__(34899);
// EXTERNAL MODULE: ./build/server/chunks/chunks/attributes.js-BJlrMZid.js
var attributes_js_BJlrMZid = __webpack_require__(89831);
// EXTERNAL MODULE: ./build/server/chunks/chunks/exports.js-CSfjgVlQ.js
var exports_js_CSfjgVlQ = __webpack_require__(42623);
// EXTERNAL MODULE: ./build/server/chunks/chunks/utils.js-_be9Tdq2.js
var utils_js_be9Tdq2 = __webpack_require__(71621);
// EXTERNAL MODULE: ./build/server/chunks/chunks/utils2.js-2HFXsNTe.js
var utils2_js_2HFXsNTe = __webpack_require__(26765);
// EXTERNAL MODULE: ./build/server/chunks/chunks/root.js-CksVe0PM.js
var root_js_CksVe0PM = __webpack_require__(22967);
// EXTERNAL MODULE: ./build/server/chunks/chunks/state.svelte.js-Cm6uwfjG.js
var state_svelte_js_Cm6uwfjG = __webpack_require__(42299);
// EXTERNAL MODULE: ./build/server/chunks/chunks/index2.js-B91mjNiV.js
var index2_js_B91mjNiV = __webpack_require__(12144);
;// CONCATENATED MODULE: ./build/server/chunks/chunks/letterheadStore.js-BU5-GwLY.js


const r=(0,index2_js_B91mjNiV.z)({currentLetterhead:null,letterheads:[],isUploading:false,uploadProgress:0,uploadError:null,isLoading:false,settings:{height:120,opacity:1,position:"top",margin:20,topMargin:10}});


//# sourceMappingURL=letterheadStore.js-BU5-GwLY.js.map

// EXTERNAL MODULE: ./build/server/chunks/chunks/ConfirmDialog.js-B_ufL4xb.js
var ConfirmDialog_js_B_ufL4xb = __webpack_require__(50586);
// EXTERNAL MODULE: ./build/server/chunks/chunks/authStore.js-Bl2ko8Kh.js
var authStore_js_Bl2ko8Kh = __webpack_require__(40298);
;// CONCATENATED MODULE: ../../node_modules/.pnpm/@tauri-apps+api@2.11.1/node_modules/@tauri-apps/api/external/tslib/tslib.es6.js
/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol, Iterator */


function tslib_es6_classPrivateFieldGet(receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
}

function tslib_es6_classPrivateFieldSet(receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};



;// CONCATENATED MODULE: ../../node_modules/.pnpm/@tauri-apps+api@2.11.1/node_modules/@tauri-apps/api/core.js


// Copyright 2019-2024 Tauri Programme within The Commons Conservancy
// SPDX-License-Identifier: Apache-2.0
// SPDX-License-Identifier: MIT
var _Channel_onmessage, _Channel_nextMessageIndex, _Channel_pendingMessages, _Channel_messageEndIndex, _Resource_rid;
/**
 * Invoke your custom commands.
 *
 * This package is also accessible with `window.__TAURI__.core` when [`app.withGlobalTauri`](https://v2.tauri.app/reference/config/#withglobaltauri) in `tauri.conf.json` is set to `true`.
 * @module
 */
/**
 * A key to be used to implement a special function
 * on your types that define how your type should be serialized
 * when passing across the IPC.
 * @example
 * Given a type in Rust that looks like this
 * ```rs
 * #[derive(serde::Serialize, serde::Deserialize)
 * enum UserId {
 *   String(String),
 *   Number(u32),
 * }
 * ```
 * `UserId::String("id")` would be serialized into `{ String: "id" }`
 * and so we need to pass the same structure back to Rust
 * ```ts
 * import { SERIALIZE_TO_IPC_FN } from "@tauri-apps/api/core"
 *
 * class UserIdString {
 *   id
 *   constructor(id) {
 *     this.id = id
 *   }
 *
 *   [SERIALIZE_TO_IPC_FN]() {
 *     return { String: this.id }
 *   }
 * }
 *
 * class UserIdNumber {
 *   id
 *   constructor(id) {
 *     this.id = id
 *   }
 *
 *   [SERIALIZE_TO_IPC_FN]() {
 *     return { Number: this.id }
 *   }
 * }
 *
 * type UserId = UserIdString | UserIdNumber
 * ```
 *
 */
// if this value changes, make sure to update it in:
// 1. ipc.js
// 2. process-ipc-message-fn.js
const SERIALIZE_TO_IPC_FN = '__TAURI_TO_IPC_KEY__';
/**
 * Stores the callback in a known location, and returns an identifier that can be passed to the backend.
 * The backend uses the identifier to `eval()` the callback.
 *
 * @return An unique identifier associated with the callback function.
 *
 * @since 1.0.0
 */
function transformCallback(
// TODO: Make this not optional in v3
callback, once = false) {
    return window.__TAURI_INTERNALS__.transformCallback(callback, once);
}
class Channel {
    constructor(onmessage) {
        _Channel_onmessage.set(this, void 0);
        // the index is used as a mechanism to preserve message order
        _Channel_nextMessageIndex.set(this, 0);
        _Channel_pendingMessages.set(this, []);
        _Channel_messageEndIndex.set(this, void 0);
        tslib_es6_classPrivateFieldSet(this, _Channel_onmessage, onmessage || (() => { }), "f");
        this.id = transformCallback((rawMessage) => {
            const index = rawMessage.index;
            if ('end' in rawMessage) {
                if (index == tslib_es6_classPrivateFieldGet(this, _Channel_nextMessageIndex, "f")) {
                    this.cleanupCallback();
                }
                else {
                    tslib_es6_classPrivateFieldSet(this, _Channel_messageEndIndex, index, "f");
                }
                return;
            }
            const message = rawMessage.message;
            // Process the message if we're at the right order
            if (index == tslib_es6_classPrivateFieldGet(this, _Channel_nextMessageIndex, "f")) {
                tslib_es6_classPrivateFieldGet(this, _Channel_onmessage, "f").call(this, message);
                tslib_es6_classPrivateFieldSet(this, _Channel_nextMessageIndex, tslib_es6_classPrivateFieldGet(this, _Channel_nextMessageIndex, "f") + 1, "f");
                // process pending messages
                while (tslib_es6_classPrivateFieldGet(this, _Channel_nextMessageIndex, "f") in tslib_es6_classPrivateFieldGet(this, _Channel_pendingMessages, "f")) {
                    const message = tslib_es6_classPrivateFieldGet(this, _Channel_pendingMessages, "f")[tslib_es6_classPrivateFieldGet(this, _Channel_nextMessageIndex, "f")];
                    tslib_es6_classPrivateFieldGet(this, _Channel_onmessage, "f").call(this, message);
                    // eslint-disable-next-line @typescript-eslint/no-array-delete
                    delete tslib_es6_classPrivateFieldGet(this, _Channel_pendingMessages, "f")[tslib_es6_classPrivateFieldGet(this, _Channel_nextMessageIndex, "f")];
                    tslib_es6_classPrivateFieldSet(this, _Channel_nextMessageIndex, tslib_es6_classPrivateFieldGet(this, _Channel_nextMessageIndex, "f") + 1, "f");
                }
                if (tslib_es6_classPrivateFieldGet(this, _Channel_nextMessageIndex, "f") === tslib_es6_classPrivateFieldGet(this, _Channel_messageEndIndex, "f")) {
                    this.cleanupCallback();
                }
            }
            // Queue the message if we're not
            else {
                // eslint-disable-next-line security/detect-object-injection
                tslib_es6_classPrivateFieldGet(this, _Channel_pendingMessages, "f")[index] = message;
            }
        });
    }
    cleanupCallback() {
        window.__TAURI_INTERNALS__.unregisterCallback(this.id);
    }
    set onmessage(handler) {
        tslib_es6_classPrivateFieldSet(this, _Channel_onmessage, handler, "f");
    }
    get onmessage() {
        return tslib_es6_classPrivateFieldGet(this, _Channel_onmessage, "f");
    }
    [(_Channel_onmessage = new WeakMap(), _Channel_nextMessageIndex = new WeakMap(), _Channel_pendingMessages = new WeakMap(), _Channel_messageEndIndex = new WeakMap(), SERIALIZE_TO_IPC_FN)]() {
        return `__CHANNEL__:${this.id}`;
    }
    toJSON() {
        // eslint-disable-next-line security/detect-object-injection
        return this[SERIALIZE_TO_IPC_FN]();
    }
}
class PluginListener {
    constructor(plugin, event, channelId) {
        this.plugin = plugin;
        this.event = event;
        this.channelId = channelId;
    }
    async unregister() {
        return invoke(`plugin:${this.plugin}|remove_listener`, {
            event: this.event,
            channelId: this.channelId
        });
    }
}
/**
 * Adds a listener to a plugin event.
 *
 * @returns The listener object to stop listening to the events.
 *
 * @since 2.0.0
 */
async function addPluginListener(plugin, event, cb) {
    const handler = new Channel(cb);
    try {
        await invoke(`plugin:${plugin}|register_listener`, {
            event,
            handler
        });
        return new PluginListener(plugin, event, handler.id);
    }
    catch {
        // TODO(v3): remove this fallback
        // note: we must try with camelCase here for backwards compatibility
        await invoke(`plugin:${plugin}|registerListener`, { event, handler });
        return new PluginListener(plugin, event, handler.id);
    }
}
/**
 * Get permission state for a plugin.
 *
 * This should be used by plugin authors to wrap their actual implementation.
 */
async function checkPermissions(plugin) {
    return invoke(`plugin:${plugin}|check_permissions`);
}
/**
 * Request permissions.
 *
 * This should be used by plugin authors to wrap their actual implementation.
 */
async function requestPermissions(plugin) {
    return invoke(`plugin:${plugin}|request_permissions`);
}
/**
 * Sends a message to the backend.
 * @example
 * ```typescript
 * import { invoke } from '@tauri-apps/api/core';
 * await invoke('login', { user: 'tauri', password: 'poiwe3h4r5ip3yrhtew9ty' });
 * ```
 *
 * @param cmd The command name.
 * @param args The optional arguments to pass to the command.
 * @param options The request options.
 * @return A promise resolving or rejecting to the backend response.
 *
 * @since 1.0.0
 */
async function invoke(cmd, args = {}, options) {
    return window.__TAURI_INTERNALS__.invoke(cmd, args, options);
}
/**
 * Convert a device file path to an URL that can be loaded by the webview.
 * Note that `asset:` and `http://asset.localhost` must be added to [`app.security.csp`](https://v2.tauri.app/reference/config/#csp-1) in `tauri.conf.json`.
 * Example CSP value: `"csp": "default-src 'self' ipc: http://ipc.localhost; img-src 'self' asset: http://asset.localhost"` to use the asset protocol on image sources.
 *
 * Additionally, `"enable" : "true"` must be added to [`app.security.assetProtocol`](https://v2.tauri.app/reference/config/#assetprotocolconfig)
 * in `tauri.conf.json` and its access scope must be defined on the `scope` array on the same `assetProtocol` object.
 *
 * @param  filePath The file path.
 * @param  protocol The protocol to use. Defaults to `asset`. You only need to set this when using a custom protocol.
 * @example
 * ```typescript
 * import { appDataDir, join } from '@tauri-apps/api/path';
 * import { convertFileSrc } from '@tauri-apps/api/core';
 * const appDataDirPath = await appDataDir();
 * const filePath = await join(appDataDirPath, 'assets/video.mp4');
 * const assetUrl = convertFileSrc(filePath);
 *
 * const video = document.getElementById('my-video');
 * const source = document.createElement('source');
 * source.type = 'video/mp4';
 * source.src = assetUrl;
 * video.appendChild(source);
 * video.load();
 * ```
 *
 * @return the URL that can be used as source on the webview.
 *
 * @since 1.0.0
 */
function convertFileSrc(filePath, protocol = 'asset') {
    return window.__TAURI_INTERNALS__.convertFileSrc(filePath, protocol);
}
/**
 * A rust-backed resource stored through `tauri::Manager::resources_table` API.
 *
 * The resource lives in the main process and does not exist
 * in the Javascript world, and thus will not be cleaned up automatically
 * except on application exit. If you want to clean it up early, call {@linkcode Resource.close}
 *
 * @example
 * ```typescript
 * import { Resource, invoke } from '@tauri-apps/api/core';
 * export class DatabaseHandle extends Resource {
 *   static async open(path: string): Promise<DatabaseHandle> {
 *     const rid: number = await invoke('open_db', { path });
 *     return new DatabaseHandle(rid);
 *   }
 *
 *   async execute(sql: string): Promise<void> {
 *     await invoke('execute_sql', { rid: this.rid, sql });
 *   }
 * }
 * ```
 */
class Resource {
    get rid() {
        return __classPrivateFieldGet(this, _Resource_rid, "f");
    }
    constructor(rid) {
        _Resource_rid.set(this, void 0);
        __classPrivateFieldSet(this, _Resource_rid, rid, "f");
    }
    /**
     * Destroys and cleans up this resource from memory.
     * **You should not call any method on this object anymore and should drop any reference to it.**
     */
    async close() {
        return invoke('plugin:resources|close', {
            rid: this.rid
        });
    }
}
_Resource_rid = new WeakMap();
function isTauri() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    return !!(globalThis || window).isTauri;
}



;// CONCATENATED MODULE: ./build/server/chunks/chunks/OllamaService.js-BIz2vyJd.js


const f={BASE_URL:"/",DEV:false,MODE:"production",PROD:true,SSR:true,VITE_KRISPOINT_EDITION:"solo"};class T{constructor(){this.baseUrl=this.getOllamaUrl(),this.model="mistral:7b",this.isAvailable=false,this._isTauriRuntime=null;}getOllamaUrl(){if(typeof window<"u"){const s=window.location.hostname;if(s!=="localhost"&&s!=="127.0.0.1")return console.log(`🤖 Ollama URL set to server IP: http://${s}:11434`),`http://${s}:11434`}return "http://localhost:11434"}isTauriRuntime(){return this._isTauriRuntime!==null?this._isTauriRuntime:typeof window<"u"&&!!(window.__TAURI_INTERNALS__||window.__TAURI__?.core)?(console.log("✅ Tauri desktop app detected (host: "+window.location.hostname+")"),this._isTauriRuntime=true,true):(console.log("🌐 Browser/dev mode detected (host: "+window.location.hostname+")"),this._isTauriRuntime=false,false)}async makeRequest(s,t={}){if(this.isTauriRuntime()){console.log("🖥️ Using Tauri backend HTTP proxy (CORS-free)"),console.log("📤 Request:",{url:s,method:t.method,headers:t.headers});try{console.log("⏳ Waiting for Tauri backend response...");const e=await invoke("http_request",{request:{url:s,method:t.method||"GET",headers:t.headers||{},body:t.body||null}});return console.log("✅ Tauri backend response received:",{status:e.status,bodyLength:e.body?.length||0}),{ok:e.status>=200&&e.status<300,status:e.status,statusText:e.status===200?"OK":"Error",headers:e.headers,text:async()=>e.body,json:async()=>JSON.parse(e.body)}}catch(e){throw console.error("❌ Tauri backend error:",e),new Error(`Tauri HTTP request failed: ${e.message||e}`)}}else return console.log("🌐 Using browser fetch"),fetch(s,t)}async checkAvailability(){return  false}setConfig(s,t){this.baseUrl=s||"http://localhost:11434",this.model=t||"mistral:7b";}getConfig(){return {baseUrl:this.baseUrl,model:this.model}}stripHtml(s){if(!s)return "";let t=s.replace(/<br\s*\/?>/gi,`
`).replace(/<\/p>/gi,`
`).replace(/<\/div>/gi,`
`).replace(/<\/li>/gi,`
`).replace(/<\/tr>/gi,`
`).replace(/<\/h[1-6]>/gi,`
`);return t=t.replace(/<[^>]*>/g,""),t=t.replace(/&nbsp;/gi," ").replace(/&amp;/gi,"&").replace(/&lt;/gi,"<").replace(/&gt;/gi,">").replace(/&quot;/gi,'"').replace(/&#39;/gi,"'").replace(/&bull;/gi,"•"),t=t.replace(/\n\s*\n\s*\n/g,`

`).trim(),t}async smartRefine(s,t,e,i,r=null){if(!this.isAvailable)throw new Error("Ollama is not running. Please start Ollama and try again.");const n=this.stripHtml(s),l=this.stripHtml(t);return console.log("🧹 Stripped HTML from content:",{originalLength:s.length,cleanLength:n.length,hadHtml:s.includes("<")}),this.analyzeCompleteness(n).isComplete?this.polishReport(n,r):this.generateFullReport(n,l,e,r)}async generateFullReport(s,t,e="General",i=null){if(!this.isAvailable)throw new Error("Ollama is not running.");const r=`You are a professional radiologist report writer. Your task is ONLY to rewrite findings into a structured radiology report.

STRICT RULES:
1. Output EXACTLY this structure with these section headers:
   COMPARISON:
   [single line - reference comparison or state if unavailable]
   
   TECHNIQUE:
   [2-3 sentences describing imaging technique]
   
   FINDINGS:
   [rewritten findings from input, organized by anatomy, professional language, NO speculation]
   
   IMPRESSION:
   [1-3 sentences - concise diagnostic impression based ONLY on findings]

2. MANDATORY REQUIREMENTS:
   - Use professional radiology terminology ONLY
   - NO personal observations, NO speculation, NO "suggestive of"
   - Format findings as paragraphs OR bullet points (•) - choose what's most appropriate for the content
   - If findings are simple/few, use paragraphs; if multiple findings, use bullet points
   - Impression must match findings exactly - no extra diagnoses
   - Keep language precise, concise, medical-grade

3. INPUT DATA:
   Clinical Indication: ${t||"Not provided"}
   Report Type: ${e}
   Raw Findings: ${s}

CRITICAL: Output the report structure EXACTLY as shown above. Do not add any extra text before or after.`;return this.callOllama(r,i)}async polishReport(s,t=null){if(!this.isAvailable)throw new Error("Ollama is not running.");const e=`You are a professional radiologist editor. Your task is ONLY to improve the language and clarity of a radiology report.

STRICT RULES:
1. PRESERVE the existing structure:
   - Keep all sections: COMPARISON, TECHNIQUE, FINDINGS, IMPRESSION
   - Keep all findings and content - do NOT remove or add findings
   - Keep all section headers exactly as they are

2. IMPROVEMENTS ALLOWED ONLY:
   - Fix grammar and spelling
   - Improve medical terminology (more professional)
   - Clarify awkward sentences
   - Standardize formatting (consistent terminology)
   - Remove redundancy within the same section

3. IMPROVEMENTS FORBIDDEN:
   - Do NOT add new findings
   - Do NOT change findings content or meaning
   - Do NOT modify impression (keep exact same clinical meaning)
   - Do NOT reorganize sections
   - Do NOT change section headers

4. REPORT TO EDIT:
${s}

CRITICAL: Output the complete polished report with ALL sections intact. Make NO structural changes.`;return this.callOllama(e,t)}async generateImpression(s,t){if(!this.isAvailable)throw new Error("Ollama is not running.");const e=this.stripHtml(s),i=this.stripHtml(t),r=`You are a radiologist creating an impression for a medical report.

STRICT RULES:
1. Output ONLY the impression text - nothing else
2. Impression MUST be based ONLY on the provided findings
3. Impression must be 1-3 sentences, concise and professional
4. Use definitive language (not speculative like "suggestive of", "cannot exclude")
5. If findings are normal, state normal and list the study type
6. If findings are abnormal, state the findings and their clinical relevance

INPUT:
Clinical Indication: ${e||"Not provided"}
Findings: ${i}

CRITICAL: Respond with ONLY the impression text. No labels, no extra text. Start directly with the impression.`;return this.callOllama(r)}async callOllama(s,t=null){try{let e="";const i={model:this.model,prompt:s,stream:!0,temperature:.3},r=this.isTauriRuntime();console.log("🚀 Ollama request:",{isTauri:r,url:`${this.baseUrl}/api/generate`,model:this.model,fetchType:r?"Tauri backend proxy (no streaming)":"Browser fetch (streaming)",env:f?.TAURI_PLATFORM||"browser"});const n=await this.makeRequest(`${this.baseUrl}/api/generate`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(i)});if(console.log("📥 Ollama response:",{ok:n.ok,status:n.status,statusText:n.statusText,headers:n.headers}),!n.ok){const l=await n.text();throw console.error("❌ Ollama error response:",l),new Error(`Ollama API error: ${n.status} ${n.statusText}`)}if(r){console.log("🖥️ Tauri mode: Getting full response (no streaming)");const c=(await n.text()).split(`
`).filter(a=>a.trim());for(const a of c)try{const o=JSON.parse(a);o.response&&(e+=o.response);}catch{}t&&e&&(console.log("✅ Full response ready, length:",e.length),t(e));}else {const l=n.body.getReader(),c=new TextDecoder;let a="";for(;;){const{done:o,value:m}=await l.read();if(o)break;const g=c.decode(m,{stream:!0});a+=g;const d=a.split(`
`);a=d.pop()||"";for(const u of d)if(u.trim())try{const p=JSON.parse(u);p.response&&(e+=p.response,t&&t(e));}catch(p){console.warn("JSON parse error:",p.message);}}if(a.trim())try{const o=JSON.parse(a);o.response&&(e+=o.response,t&&t(e));}catch{}}return console.log("✅ Ollama generation complete, total length:",e.length),e.trim()}catch(e){throw console.error("❌ Ollama API error:",{message:e.message,stack:e.stack,name:e.name}),e}}analyzeCompleteness(s){const t=/COMPARISON:/i.test(s),e=/TECHNIQUE:/i.test(s),i=/FINDINGS:/i.test(s),r=/IMPRESSION:/i.test(s),n=s.replace(/\s+/g," ").length,l=n>300;return {isComplete:e&&i&&r&&l,sections:{hasComparison:t,hasTechnique:e,hasFindings:i,hasImpression:r},contentLength:n}}}const R=new T;


//# sourceMappingURL=OllamaService.js-BIz2vyJd.js.map

// EXTERNAL MODULE: ./build/server/chunks/chunks/licenseStore.js-CSOu6edw.js
var licenseStore_js_CSOu6edw = __webpack_require__(19976);
;// CONCATENATED MODULE: ./build/server/chunks/entries/pages/settings/_page.svelte.js-Bxa-mW7O.js















function be(R,D){R.component(u=>{var t;let v=D.letterhead;const m=`MEDICAL IMAGING REPORT

Patient: John Doe
Date: ${new Date().toLocaleDateString()}
Study: Chest X-ray

FINDINGS:
The cardiac silhouette is normal in size and configuration. The mediastinal contours are within normal limits. The lung fields are clear bilaterally with no evidence of infiltrate, effusion, or pneumothorax.

IMPRESSION:
Normal chest radiograph.

Dr. Sarah Johnson, MD
Radiologist`;u.push('<div class="letterhead-preview svelte-1299np5"><h4 class="svelte-1299np5">📄 PDF Preview</h4> <p class="preview-description svelte-1299np5">Preview how your letterhead will appear on medical reports</p> <div class="preview-layout svelte-1299np5"><div class="preview-container svelte-1299np5">'),(0,index_js_BPHC9uE5.a6)(t??={},"$letterheadStore",r).settings.position==="top"?u.push(`<!--[0--><div class="letterhead-section svelte-1299np5"${(0,index_js_BPHC9uE5.ab)(`height: ${(0,index_js_BPHC9uE5.aa)((0,index_js_BPHC9uE5.a6)(t??={},"$letterheadStore",r).settings.height)}px; margin-top: ${(0,index_js_BPHC9uE5.aa)((0,index_js_BPHC9uE5.a6)(t??={},"$letterheadStore",r).settings.topMargin)}px;`)}><img${(0,attributes_js_BJlrMZid.k)("src",v.url)}${(0,attributes_js_BJlrMZid.k)("alt",v.name)} class="letterhead-image svelte-1299np5"${(0,index_js_BPHC9uE5.ab)(` opacity: ${(0,index_js_BPHC9uE5.aa)((0,index_js_BPHC9uE5.a6)(t??={},"$letterheadStore",r).settings.opacity)}; max-height: ${(0,index_js_BPHC9uE5.aa)((0,index_js_BPHC9uE5.a6)(t??={},"$letterheadStore",r).settings.height)}px; margin-left: ${(0,index_js_BPHC9uE5.aa)((0,index_js_BPHC9uE5.a6)(t??={},"$letterheadStore",r).settings.margin)}px; margin-right: ${(0,index_js_BPHC9uE5.aa)((0,index_js_BPHC9uE5.a6)(t??={},"$letterheadStore",r).settings.margin)}px; `)}/></div>`):u.push("<!--[-1-->"),u.push(`<!--]--> <div class="report-content svelte-1299np5"${(0,index_js_BPHC9uE5.ab)(`margin: ${(0,index_js_BPHC9uE5.aa)((0,index_js_BPHC9uE5.a6)(t??={},"$letterheadStore",r).settings.margin)}px;`)}><pre class="report-text svelte-1299np5">${(0,attributes_js_BJlrMZid.P)(m)}</pre></div> `),(0,index_js_BPHC9uE5.a6)(t??={},"$letterheadStore",r).settings.position==="bottom"?u.push(`<!--[0--><div class="letterhead-footer svelte-1299np5"${(0,index_js_BPHC9uE5.ab)(`height: ${(0,index_js_BPHC9uE5.aa)((0,index_js_BPHC9uE5.a6)(t??={},"$letterheadStore",r).settings.height)}px;`)}><img${(0,attributes_js_BJlrMZid.k)("src",v.url)}${(0,attributes_js_BJlrMZid.k)("alt",v.name)} class="letterhead-image svelte-1299np5"${(0,index_js_BPHC9uE5.ab)(` opacity: ${(0,index_js_BPHC9uE5.aa)((0,index_js_BPHC9uE5.a6)(t??={},"$letterheadStore",r).settings.opacity)}; max-height: ${(0,index_js_BPHC9uE5.aa)((0,index_js_BPHC9uE5.a6)(t??={},"$letterheadStore",r).settings.height)}px; margin: ${(0,index_js_BPHC9uE5.aa)((0,index_js_BPHC9uE5.a6)(t??={},"$letterheadStore",r).settings.margin)}px; `)}/></div>`):u.push("<!--[-1-->"),u.push(`<!--]--></div> <div class="settings-panel svelte-1299np5"><h5 class="svelte-1299np5">⚙️ Letterhead Settings</h5> <div class="setting-group svelte-1299np5"><label for="height-slider" class="svelte-1299np5">Height: ${(0,attributes_js_BJlrMZid.P)((0,index_js_BPHC9uE5.a6)(t??={},"$letterheadStore",r).settings.height)}px</label> <input id="height-slider" type="range" min="60" max="200"${(0,attributes_js_BJlrMZid.k)("value",(0,index_js_BPHC9uE5.a6)(t??={},"$letterheadStore",r).settings.height)} class="slider svelte-1299np5"/></div> <div class="setting-group svelte-1299np5"><label for="opacity-slider" class="svelte-1299np5">Opacity: ${(0,attributes_js_BJlrMZid.P)(Math.round((0,index_js_BPHC9uE5.a6)(t??={},"$letterheadStore",r).settings.opacity*100))}%</label> <input id="opacity-slider" type="range" min="0.3" max="1" step="0.1"${(0,attributes_js_BJlrMZid.k)("value",(0,index_js_BPHC9uE5.a6)(t??={},"$letterheadStore",r).settings.opacity)} class="slider svelte-1299np5"/></div> <div class="setting-group svelte-1299np5"><label for="margin-slider" class="svelte-1299np5">Side Margin: ${(0,attributes_js_BJlrMZid.P)((0,index_js_BPHC9uE5.a6)(t??={},"$letterheadStore",r).settings.margin)}px</label> <input id="margin-slider" type="range" min="10" max="50"${(0,attributes_js_BJlrMZid.k)("value",(0,index_js_BPHC9uE5.a6)(t??={},"$letterheadStore",r).settings.margin)} class="slider svelte-1299np5"/></div> <div class="setting-group svelte-1299np5"><label for="top-margin-slider" class="svelte-1299np5">Top Margin: ${(0,attributes_js_BJlrMZid.P)((0,index_js_BPHC9uE5.a6)(t??={},"$letterheadStore",r).settings.topMargin)}px</label> <input id="top-margin-slider" type="range" min="0" max="60"${(0,attributes_js_BJlrMZid.k)("value",(0,index_js_BPHC9uE5.a6)(t??={},"$letterheadStore",r).settings.topMargin)} class="slider svelte-1299np5"/></div> <div class="setting-group svelte-1299np5"><label for="position-select" class="svelte-1299np5">Position:</label> `),u.select({id:"position-select",value:(0,index_js_BPHC9uE5.a6)(t??={},"$letterheadStore",r).settings.position,class:"position-select"},S=>{S.option({value:"top"},d=>{d.push("Top of page");}),S.option({value:"bottom"},d=>{d.push("Bottom of page");});},"svelte-1299np5"),u.push("</div></div></div></div>"),t&&(0,index_js_BPHC9uE5.a7)(t),(0,index_js_BPHC9uE5.a5)(D,{letterhead:v});});}function me(R,D){R.component(u$1=>{var t;let v=(0,attributes_js_BJlrMZid.M)(D.isAdmin,true),m=false,S=true,d;function f(c){if(c.push('<div class="letterhead-manager svelte-1v1n74w"><div class="manager-header svelte-1v1n74w"><h3 class="svelte-1v1n74w">🏥 Letterhead Management</h3> <p class="svelte-1v1n74w">'),v?c.push("<!--[0-->Upload and manage your hospital letterheads for professional reports"):c.push("<!--[-1-->View the organization letterhead used on professional reports"),c.push("<!--]--></p> "),v?c.push("<!--[-1-->"):c.push('<!--[0--><p class="admin-note svelte-1v1n74w">Letterhead is set by the administrator and applies to all users.</p>'),c.push("<!--]--></div> "),(0,index_js_BPHC9uE5.a6)(t??={},"$letterheadStore",r).currentLetterhead?(c.push(`<!--[0--><div class="current-selection svelte-1v1n74w"><h4 class="svelte-1v1n74w">📄 Current Letterhead</h4> <div class="current-letterhead svelte-1v1n74w"><img${(0,attributes_js_BJlrMZid.k)("src",(0,index_js_BPHC9uE5.a6)(t??={},"$letterheadStore",r).currentLetterhead.url)}${(0,attributes_js_BJlrMZid.k)("alt",(0,index_js_BPHC9uE5.a6)(t??={},"$letterheadStore",r).currentLetterhead.name)} class="current-image svelte-1v1n74w"/> <div class="current-info svelte-1v1n74w"><span class="current-name svelte-1v1n74w">${(0,attributes_js_BJlrMZid.P)((0,index_js_BPHC9uE5.a6)(t??={},"$letterheadStore",r).currentLetterhead.name)}</span> `),v?c.push('<!--[0--><button class="clear-btn svelte-1v1n74w">Remove</button>'):c.push("<!--[-1-->"),c.push("<!--]--></div></div></div>")):(c.push('<!--[-1--><div class="no-selection svelte-1v1n74w">'),v?c.push("<!--[0--><p>No letterhead selected. Choose one below or upload a new one.</p>"):c.push("<!--[-1--><p>No letterhead has been set by the administrator yet.</p>"),c.push("<!--]--></div>")),c.push("<!--]--> "),v?(c.push('<!--[0--><div class="upload-section svelte-1v1n74w">'),c.push('<!--[-1--><button class="upload-btn svelte-1v1n74w">📁 Upload New Letterhead</button>'),c.push("<!--]--></div>")):c.push("<!--[-1-->"),c.push("<!--]--> "),(0,index_js_BPHC9uE5.a6)(t??={},"$letterheadStore",r).letterheads.length>0&&v){c.push('<!--[0--><div class="letterheads-grid svelte-1v1n74w"><h4 class="svelte-1v1n74w">Available Letterheads</h4> <div class="grid svelte-1v1n74w"><!--[-->');const C=(0,index_js_BPHC9uE5.a9)((0,index_js_BPHC9uE5.a6)(t??={},"$letterheadStore",r).letterheads);for(let y=0,x=C.length;y<x;y++){let k$1=C[y];c.push(`<div${(0,index_js_BPHC9uE5.a4)("letterhead-card svelte-1v1n74w",void 0,{selected:(0,index_js_BPHC9uE5.a6)(t??={},"$letterheadStore",r).currentLetterhead?.id===k$1.id})}><img${(0,attributes_js_BJlrMZid.k)("src",k$1.url)}${(0,attributes_js_BJlrMZid.k)("alt",k$1.name)} class="letterhead-thumb svelte-1v1n74w"/> <div class="card-info svelte-1v1n74w"><span class="letterhead-name svelte-1v1n74w">${(0,attributes_js_BJlrMZid.P)(k$1.name)}</span> <div class="card-actions svelte-1v1n74w"><button class="use-btn svelte-1v1n74w"${(0,attributes_js_BJlrMZid.k)("disabled",(0,index_js_BPHC9uE5.a6)(t??={},"$letterheadStore",r).currentLetterhead?.id===k$1.id,true)}>${(0,attributes_js_BJlrMZid.P)((0,index_js_BPHC9uE5.a6)(t??={},"$letterheadStore",r).currentLetterhead?.id===k$1.id?"Current":"Use")}</button> <button class="delete-btn svelte-1v1n74w">🗑️</button></div></div></div>`);}c.push("<!--]--></div></div>");}else c.push("<!--[-1-->");c.push("<!--]--> "),(0,index_js_BPHC9uE5.a6)(t??={},"$letterheadStore",r).currentLetterhead?(c.push('<!--[0--><div class="preview-section svelte-1v1n74w">'),be(c,{letterhead:(0,index_js_BPHC9uE5.a6)(t??={},"$letterheadStore",r).currentLetterhead}),c.push("<!----></div>")):c.push("<!--[-1-->"),c.push("<!--]--></div> "),(0,ConfirmDialog_js_B_ufL4xb.u)(c,{title:"Delete Letterhead?",message:"Are you sure you want to delete this letterhead?",confirmText:"Delete",cancelText:"Cancel",danger:true,get show(){return m},set show(C){m=C,S=false;}}),c.push("<!---->");}do S=true,d=u$1.copy(),f(d);while(!S);u$1.subsume(d),t&&(0,index_js_BPHC9uE5.a7)(t),(0,index_js_BPHC9uE5.a5)(D,{isAdmin:v});});}function fe(R,D){R.component(u=>{u.push('<div class="signature-manager svelte-1xv9zyr"><div class="section-header svelte-1xv9zyr"><h3 class="svelte-1xv9zyr">Digital Signature</h3> <p class="section-description svelte-1xv9zyr">Upload your handwritten signature. The background will be automatically removed for professional PDF reports.</p></div> '),u.push('<!--[-1--><div class="no-signature svelte-1xv9zyr"><div class="upload-prompt svelte-1xv9zyr"><div class="upload-icon svelte-1xv9zyr">✍️</div> <p class="svelte-1xv9zyr">No signature uploaded yet</p> <button class="btn btn-primary svelte-1xv9zyr">Upload Signature</button></div></div>'),u.push("<!--]--> "),u.push("<!--[-1-->"),u.push('<!--]--> <input type="file" accept="image/*" style="display: none;"/></div>');});}function Ne(R$1,D){R$1.component(u$1=>{var t;let v,m,S,d=typeof window<"u"&&localStorage.getItem("settings_active_tab")||"general",f$1=c();function c(){return {general:{theme:"light",autoSave:true,autoSaveInterval:30,showConfirmation:true},voice:{enabled:true,language:"en-US",continuous:true,confidenceThreshold:.7,autoCorrection:true,medicalTerms:true,contributeTrainingData:false},ai:{providerMode:"hosted",ollamaUrl:"http://localhost:11434",ollamaModel:"mistral:7b",enabled:true},reports:{defaultTemplate:"blank",includeTechnique:true,includeComparison:true,pdfFormat:"standard",exportQuality:"high"},interface:{fontSize:"medium",tooltips:true,animations:true},clinical:{institutionName:"",designation:"Radiologist",userName:"",credentials:"MD",signature:"",worklistIntegration:false,pacsIntegration:false}}}let C="",y=false,x={fullName:"",email:"",specialty:"",department:"",designation:""},k$1={currentPassword:"",newPassword:"",confirmPassword:""},N=false,Y={question:"",answer:""},F=false;const $=["What was the name of your first patient?","In which city did you complete your medical degree?","What is your medical school mentor's last name?","What was your first hospital rotation specialty?","What is your favorite medical textbook?","What was the name of your first clinical supervisor?","In which year did you complete your medical internship?","What is your mother's maiden name?"];let B=false,Q=false,ee="",te="",se="",T=false;function ie(){f$1.ai&&R.setConfig(f$1.ai.ollamaUrl,f$1.ai.ollamaModel);}let X="",le="",h$1=null,M=false,ae=false,E=null,V=null;async function ce(){M=true,h$1=await licenseStore_js_CSOu6edw.A.getSubscriptionStatus(),M=false;}const oe=[{id:"profile",label:"Admin Profile",icon:"👨‍⚕️"},{id:"general",label:"General",icon:"⚙️"},{id:"voice",label:"Voice Recognition",icon:"🎤"},{id:"ai",label:"AI Assistant",icon:"✨"},{id:"letterheads",label:"Letterheads",icon:"🏥"},{id:"clinical",label:"External Integrations",icon:"🔗"},{id:"license",label:"License",icon:"🔑"},...[{id:"backup",label:"Backup & Restore",icon:"💾"}]],ne=[{id:"profile",label:"Doctor Profile",icon:"👨‍⚕️"},{id:"general",label:"General",icon:"⚙️"},{id:"voice",label:"Voice Settings",icon:"🎤"},{id:"license",label:"License",icon:"🔑"}],pe=[{id:"profile",label:"Profile",icon:"👤"},{id:"general",label:"General",icon:"⚙️"},{id:"license",label:"License",icon:"🔑"}];v=!(0,index_js_BPHC9uE5.a6)(t??={},"$permissions",authStore_js_Bl2ko8Kh.h)?.includes("reports.create")&&!(0,index_js_BPHC9uE5.a6)(t??={},"$permissions",authStore_js_Bl2ko8Kh.h)?.includes("templates.read"),m=(0,index_js_BPHC9uE5.a6)(t??={},"$permissions",authStore_js_Bl2ko8Kh.h)?.includes("users.manage"),S=v?pe:m?oe:ne,S.map(z=>z.id).includes(d)||(d="profile"),typeof window<"u"&&d&&localStorage.setItem("settings_active_tab",d),(0,index_js_BPHC9uE5.a6)(t??={},"$currentUser",authStore_js_Bl2ko8Kh.p)&&(x={fullName:(0,index_js_BPHC9uE5.a6)(t??={},"$currentUser",authStore_js_Bl2ko8Kh.p).fullName||"",email:(0,index_js_BPHC9uE5.a6)(t??={},"$currentUser",authStore_js_Bl2ko8Kh.p).email||"",specialty:(0,index_js_BPHC9uE5.a6)(t??={},"$currentUser",authStore_js_Bl2ko8Kh.p).specialty||"Radiology",department:(0,index_js_BPHC9uE5.a6)(t??={},"$currentUser",authStore_js_Bl2ko8Kh.p).department||"",institution:(0,index_js_BPHC9uE5.a6)(t??={},"$currentUser",authStore_js_Bl2ko8Kh.p).institution||"",designation:(0,index_js_BPHC9uE5.a6)(t??={},"$currentUser",authStore_js_Bl2ko8Kh.p).designation||""}),f$1.ai&&ie(),(0,index_js_BPHC9uE5.a6)(t??={},"$isLicenseActive",licenseStore_js_CSOu6edw.o)&&(0,index_js_BPHC9uE5.a6)(t??={},"$licenseState",licenseStore_js_CSOu6edw.s).serverUrl&&(0,index_js_BPHC9uE5.a6)(t??={},"$licenseState",licenseStore_js_CSOu6edw.s).license?.key&&ce();let q=true,O;function ue(e){(0,index_js_BPHC9uE5.ac)("1i19ct2",e,n=>{n.title(l=>{l.push("<title>Settings - KrisPoint</title>");});}),e.push('<div class="settings-page svelte-1i19ct2"><div class="settings-container svelte-1i19ct2"><div class="settings-sidebar svelte-1i19ct2"><nav class="settings-nav svelte-1i19ct2"><!--[-->');const z=(0,index_js_BPHC9uE5.a9)(S);for(let n=0,l=z.length;n<l;n++){let r=z[n];e.push(`<button${(0,index_js_BPHC9uE5.a4)("nav-item svelte-1i19ct2",void 0,{active:d===r.id})}><span class="nav-icon svelte-1i19ct2">${(0,attributes_js_BJlrMZid.P)(r.icon)}</span> <span class="nav-label svelte-1i19ct2">${(0,attributes_js_BJlrMZid.P)(r.label)}</span></button>`);}if(e.push('<!--]--></nav></div> <div class="settings-content svelte-1i19ct2">'),d==="profile"?(e.push(`<!--[0--><div class="settings-section svelte-1i19ct2"><h2 class="svelte-1i19ct2">${(0,attributes_js_BJlrMZid.P)(v?"👤 Profile":m?"👨‍⚕️ Admin Profile":"👨‍⚕️ Doctor Profile")}</h2> <div class="profile-info svelte-1i19ct2"><div class="setting-group svelte-1i19ct2"><label for="profile-username" class="svelte-1i19ct2">Username</label> <input id="profile-username" type="text"${(0,attributes_js_BJlrMZid.k)("value",(0,index_js_BPHC9uE5.a6)(t??={},"$currentUser",authStore_js_Bl2ko8Kh.p)?.username||"Not available")} disabled="" class="readonly-field svelte-1i19ct2"/> <p class="setting-description svelte-1i19ct2">Your username cannot be changed</p></div> <div class="setting-group svelte-1i19ct2"><label for="profile-fullname" class="svelte-1i19ct2">Full Name</label> <input id="profile-fullname" type="text"${(0,attributes_js_BJlrMZid.k)("value",x.fullName)}${(0,attributes_js_BJlrMZid.k)("placeholder",v?"Your full name":"Dr. Full Name")}${(0,attributes_js_BJlrMZid.k)("disabled",y,true)} class="svelte-1i19ct2"/></div> <div class="setting-group svelte-1i19ct2"><label for="profile-email" class="svelte-1i19ct2">Email</label> <input id="profile-email" type="email"${(0,attributes_js_BJlrMZid.k)("value",x.email)}${(0,attributes_js_BJlrMZid.k)("placeholder",v?"email@hospital.com":"doctor@hospital.com")}${(0,attributes_js_BJlrMZid.k)("disabled",y,true)} class="svelte-1i19ct2"/></div> `),v?e.push("<!--[-1-->"):(e.push('<!--[0--><div class="setting-row svelte-1i19ct2"><div class="setting-group svelte-1i19ct2"><label for="profile-specialty" class="svelte-1i19ct2">Specialty</label> '),m?(e.push("<!--[0-->"),e.select({id:"profile-specialty",value:x.specialty,disabled:y,class:""},n=>{n.option({value:"Radiology",class:""},l=>{l.push("Radiology");},"svelte-1i19ct2"),n.option({value:"Diagnostic Radiology",class:""},l=>{l.push("Diagnostic Radiology");},"svelte-1i19ct2"),n.option({value:"Interventional Radiology",class:""},l=>{l.push("Interventional Radiology");},"svelte-1i19ct2"),n.option({value:"Nuclear Medicine",class:""},l=>{l.push("Nuclear Medicine");},"svelte-1i19ct2"),n.option({value:"Radiation Oncology",class:""},l=>{l.push("Radiation Oncology");},"svelte-1i19ct2");},"svelte-1i19ct2")):e.push(`<!--[-1--><input id="profile-specialty" type="text"${(0,attributes_js_BJlrMZid.k)("value",x.specialty||"Not assigned")} disabled="" class="readonly-field svelte-1i19ct2"/> <p class="setting-description svelte-1i19ct2">Specialty is set by the administrator</p>`),e.push('<!--]--></div> <div class="setting-group svelte-1i19ct2"><label for="profile-designation" class="svelte-1i19ct2">Designation</label> '),e.push(`<!--[0--><input id="profile-designation" type="text"${(0,attributes_js_BJlrMZid.k)("value",x.designation)} placeholder="e.g., Consultant Radiologist"${(0,attributes_js_BJlrMZid.k)("disabled",y,true)} class="svelte-1i19ct2"/> <p class="setting-description svelte-1i19ct2">Shown on your reports and PDF signatures</p>`),e.push('<!--]--></div></div> <div class="setting-group svelte-1i19ct2"><label for="profile-department" class="svelte-1i19ct2">Department</label> '),m?e.push(`<!--[0--><input id="profile-department" type="text"${(0,attributes_js_BJlrMZid.k)("value",x.department)} placeholder="e.g., Radiology Department"${(0,attributes_js_BJlrMZid.k)("disabled",y,true)} class="svelte-1i19ct2"/>`):e.push(`<!--[-1--><input id="profile-department" type="text"${(0,attributes_js_BJlrMZid.k)("value",x.department||"Not assigned")} disabled="" class="readonly-field svelte-1i19ct2"/> <p class="setting-description svelte-1i19ct2">Department is set by the administrator</p>`),e.push("<!--]--></div>")),e.push('<!--]--> <div class="setting-group svelte-1i19ct2"><label for="profile-institution" class="svelte-1i19ct2">Facility/Institution</label> '),m?e.push(`<!--[0--><input id="profile-institution" type="text"${(0,attributes_js_BJlrMZid.k)("value",C)} placeholder="Hospital or medical institution name"${(0,attributes_js_BJlrMZid.k)("disabled",y,true)} class="svelte-1i19ct2"/> <p class="setting-description svelte-1i19ct2">This institution name is shared across all users in the system</p>`):e.push(`<!--[-1--><input id="profile-institution" type="text"${(0,attributes_js_BJlrMZid.k)("value","Not set by administrator")} disabled="" class="readonly-field svelte-1i19ct2"/> <p class="setting-description svelte-1i19ct2">Institution is set by the system administrator</p>`),e.push("<!--]--></div></div> "),v?e.push("<!--[-1-->"):(e.push('<!--[0--><div class="signature-section svelte-1i19ct2"><h3 class="svelte-1i19ct2">🖋️ Digital Signature</h3> <p class="setting-description svelte-1i19ct2">Upload your signature image. White backgrounds are automatically removed for professional PDF reports.</p> '),fe(e),e.push("<!----></div>")),e.push(`<!--]--> <div class="password-section svelte-1i19ct2"><h3 class="svelte-1i19ct2">🔒 Change Password</h3> <p class="setting-description svelte-1i19ct2">Update your password to keep your account secure. Requirements: at least 8 characters, including uppercase, lowercase, number, and special character.</p> <div class="password-form svelte-1i19ct2"><div class="setting-group svelte-1i19ct2"><label for="current-password" class="svelte-1i19ct2">Current Password</label> <input id="current-password" type="password"${(0,attributes_js_BJlrMZid.k)("value",k$1.currentPassword)} placeholder="Enter current password"${(0,attributes_js_BJlrMZid.k)("disabled",N,true)} class="svelte-1i19ct2"/></div> <div class="setting-group svelte-1i19ct2"><label for="new-password" class="svelte-1i19ct2">New Password</label> <input id="new-password" type="password"${(0,attributes_js_BJlrMZid.k)("value",k$1.newPassword)} placeholder="Min 8 chars, uppercase, lowercase, number, symbol"${(0,attributes_js_BJlrMZid.k)("disabled",N,true)} class="svelte-1i19ct2"/></div> <div class="setting-group svelte-1i19ct2"><label for="confirm-password" class="svelte-1i19ct2">Confirm New Password</label> <input id="confirm-password" type="password"${(0,attributes_js_BJlrMZid.k)("value",k$1.confirmPassword)} placeholder="Re-enter new password"${(0,attributes_js_BJlrMZid.k)("disabled",N,true)} class="svelte-1i19ct2"/></div> <button type="button" class="btn btn-primary svelte-1i19ct2"${(0,attributes_js_BJlrMZid.k)("disabled",N,true)}>`),e.push("<!--[-1-->🔑 Change Password"),e.push("<!--]--></button> "),e.push("<!--[-1-->"),e.push('<!--]--></div></div> <div class="security-question-section svelte-1i19ct2"><h3 class="svelte-1i19ct2">🔐 Password Recovery Setup</h3> <p class="setting-description svelte-1i19ct2">'),e.push("<!--[-1-->Set up a security question to recover your password if you forget it. This works completely offline - no email required!"),e.push('<!--]--></p> <div class="security-question-form svelte-1i19ct2"><div class="setting-group svelte-1i19ct2"><label for="security-question" class="svelte-1i19ct2">Security Question</label> '),e.select({id:"security-question",value:Y.question,disabled:F,class:""},n=>{n.option({value:"",class:""},r=>{r.push("-- Select a question --");},"svelte-1i19ct2"),n.push("<!--[-->");const l=(0,index_js_BPHC9uE5.a9)($);for(let r=0,p=l.length;r<p;r++){let A=l[r];n.option({value:A,class:""},g=>{g.push(`${(0,attributes_js_BJlrMZid.P)(A)}`);},"svelte-1i19ct2");}n.push("<!--]-->");},"svelte-1i19ct2"),e.push(`</div> <div class="setting-group svelte-1i19ct2"><label for="security-answer" class="svelte-1i19ct2">Your Answer</label> <input id="security-answer" type="text"${(0,attributes_js_BJlrMZid.k)("value",Y.answer)}${(0,attributes_js_BJlrMZid.k)("placeholder","Enter your answer (case-insensitive)")}${(0,attributes_js_BJlrMZid.k)("disabled",F,true)} class="svelte-1i19ct2"/> <p class="setting-description-small svelte-1i19ct2">💡 Answers are case-insensitive. "John Smith" and "john smith" will both work.</p></div> <button type="button" class="btn btn-primary svelte-1i19ct2"${(0,attributes_js_BJlrMZid.k)("disabled",F,true)}>`),e.push(`<!--[-1-->${(0,attributes_js_BJlrMZid.P)("✅ Set Up Security Question")}`),e.push(`<!--]--></button></div></div> <div class="profile-actions svelte-1i19ct2"><button class="btn btn-primary svelte-1i19ct2"${(0,attributes_js_BJlrMZid.k)("disabled",y,true)}>`),e.push("<!--[-1-->💾 Save Profile"),e.push('<!--]--></button> <button class="btn btn-outline btn-logout svelte-1i19ct2">🚪 Logout</button></div></div>')):e.push("<!--[-1-->"),e.push("<!--]--> "),d==="general"?(e.push('<!--[0--><div class="settings-section svelte-1i19ct2"><h2 class="svelte-1i19ct2">General Settings</h2> <div class="setting-group svelte-1i19ct2"><label for="theme-select" class="svelte-1i19ct2">Theme</label> '),e.select({id:"theme-select",value:f$1.general.theme,class:""},n=>{n.option({value:"light",class:""},l=>{l.push("Light Theme");},"svelte-1i19ct2"),n.option({value:"dark",class:""},l=>{l.push("Dark Theme");},"svelte-1i19ct2");},"svelte-1i19ct2"),e.push(`</div> <div class="setting-group checkbox-group svelte-1i19ct2"><label class="svelte-1i19ct2"><input type="checkbox"${(0,attributes_js_BJlrMZid.k)("checked",f$1.general.showConfirmation,true)} class="svelte-1i19ct2"/> Show confirmation dialogs</label></div> <div class="setting-group checkbox-group svelte-1i19ct2"><label class="svelte-1i19ct2"><input type="checkbox"${(0,attributes_js_BJlrMZid.k)("checked",f$1.interface.tooltips,true)} class="svelte-1i19ct2"/> Show tooltips</label></div> <div class="setting-group checkbox-group svelte-1i19ct2"><label class="svelte-1i19ct2"><input type="checkbox"${(0,attributes_js_BJlrMZid.k)("checked",f$1.interface.animations,true)} class="svelte-1i19ct2"/> Enable animations</label></div></div>`)):e.push("<!--[-1-->"),e.push("<!--]--> "),d==="backup"?e.push(`<!--[0--><div class="settings-section svelte-1i19ct2"><h2 class="svelte-1i19ct2">Backup &amp; Restore</h2> <div class="backup-warning svelte-1i19ct2"><strong class="svelte-1i19ct2">Keep your backup password safe.</strong> If you lose both this workstation and the backup password, encrypted patient data cannot be recovered.
              The backup includes the database and the protected recovery keys required on a replacement computer.</div> <div class="backup-panel svelte-1i19ct2"><h3 class="svelte-1i19ct2">Create encrypted backup</h3> <div class="setting-group svelte-1i19ct2"><label for="backup-password" class="svelte-1i19ct2">Backup password</label> <input id="backup-password" type="password"${(0,attributes_js_BJlrMZid.k)("value",ee)} minlength="12"${(0,attributes_js_BJlrMZid.k)("disabled",T,true)} autocomplete="new-password" class="svelte-1i19ct2"/> <p class="setting-description svelte-1i19ct2">Use at least 12 characters. This password is not stored by KrisPoint.</p></div> <div class="setting-group svelte-1i19ct2"><label for="backup-password-confirm" class="svelte-1i19ct2">Confirm backup password</label> <input id="backup-password-confirm" type="password"${(0,attributes_js_BJlrMZid.k)("value",te)} minlength="12"${(0,attributes_js_BJlrMZid.k)("disabled",T,true)} autocomplete="new-password" class="svelte-1i19ct2"/></div> <div class="setting-group svelte-1i19ct2"><label for="backup-account-password" class="svelte-1i19ct2">KrisPoint account password</label> <input id="backup-account-password" type="password"${(0,attributes_js_BJlrMZid.k)("value",se)}${(0,attributes_js_BJlrMZid.k)("disabled",T,true)} autocomplete="current-password" class="svelte-1i19ct2"/> <p class="setting-description svelte-1i19ct2">Required to authorize backup and restore operations.</p></div> <button class="btn btn-primary svelte-1i19ct2"${(0,attributes_js_BJlrMZid.k)("disabled",T,true)}>Create encrypted backup</button></div> <div class="backup-panel svelte-1i19ct2"><h3 class="svelte-1i19ct2">Restore from backup</h3> <p class="setting-description svelte-1i19ct2">The backup is decrypted and fully validated before current data is replaced. If replacement fails, current data is restored automatically.</p> <button class="btn btn-danger svelte-1i19ct2"${(0,attributes_js_BJlrMZid.k)("disabled",T,true)}>Choose backup and restore</button></div></div>`):e.push("<!--[-1-->"),e.push("<!--]--> "),d==="voice"?(e.push(`<!--[0--><div class="settings-section svelte-1i19ct2"><h2 class="svelte-1i19ct2">${(0,attributes_js_BJlrMZid.P)(m?"Voice Recognition Settings":"Voice Training Consent")}</h2> `),m?(e.push(`<!--[0--><div class="setting-group checkbox-group svelte-1i19ct2"><label class="svelte-1i19ct2"><input type="checkbox"${(0,attributes_js_BJlrMZid.k)("checked",f$1.voice.enabled,true)} class="svelte-1i19ct2"/> Enable voice recognition</label></div> `),e.push(`<!--[0--><div class="setting-group svelte-1i19ct2"><label for="voice-confidence" class="svelte-1i19ct2">Confidence Threshold</label> <input id="voice-confidence" type="range" min="0.1" max="1" step="0.1"${(0,attributes_js_BJlrMZid.k)("value",f$1.voice.confidenceThreshold)} class="svelte-1i19ct2"/> <span class="range-value svelte-1i19ct2">${(0,attributes_js_BJlrMZid.P)(f$1.voice.confidenceThreshold)}</span></div> <div class="section-info svelte-1i19ct2"><p class="svelte-1i19ct2"><strong class="svelte-1i19ct2">Smart Punctuation:</strong> Periods, commas, and question marks are automatically inserted by AI as you speak. Manual voice commands are available for special punctuation (semicolons, colons, quotes, brackets, etc.).</p></div>`),e.push("<!--]-->")):e.push("<!--[-1-->"),e.push(`<!--]--> <div class="training-data-section svelte-1i19ct2"><h3 class="svelte-1i19ct2">Training Data Collection</h3> <div class="setting-group checkbox-group svelte-1i19ct2"><label class="checkbox-label svelte-1i19ct2"><input type="checkbox"${(0,attributes_js_BJlrMZid.k)("checked",f$1.voice.contributeTrainingData,true)} class="svelte-1i19ct2"/> Contribute to voice recognition training</label></div> <div class="section-info training-info svelte-1i19ct2"><p class="svelte-1i19ct2">Help improve voice recognition for medical terminology by contributing your dictation data. When enabled:</p> <ul class="svelte-1i19ct2"><li class="svelte-1i19ct2">Audio recordings and transcripts are collected during dictation</li> <li class="svelte-1i19ct2">Administrators review and verify transcripts for training</li> <li class="svelte-1i19ct2">Data is only accessible to administrators</li> <li class="svelte-1i19ct2">You can opt out at any time</li></ul></div></div></div>`)):e.push("<!--[-1-->"),e.push("<!--]--> "),d==="ai"?(e.push(`<!--[0--><div class="settings-section svelte-1i19ct2"><h2 class="svelte-1i19ct2">✨ AI Assistant Settings</h2> <p class="section-info svelte-1i19ct2">Choose how optional AI drafting assistance is provided. Reports,
              dictation, templates, and ordinary reporting controls work without
              selecting or configuring a provider.</p> <div class="setting-group svelte-1i19ct2"><label for="ai-provider-mode" class="svelte-1i19ct2">Provider mode</label> `),e.select({id:"ai-provider-mode",value:f$1.ai.providerMode,class:""},n=>{n.option({value:"hosted",class:""},l=>{l.push("Hosted (recommended)");},"svelte-1i19ct2"),n.option({value:"disabled",class:""},l=>{l.push("Disabled");},"svelte-1i19ct2"),n.option({value:"ollama",class:""},l=>{l.push("Private Ollama (advanced)");},"svelte-1i19ct2"),n.option({value:"byo",class:""},l=>{l.push("Bring your own provider (advanced)");},"svelte-1i19ct2");},"svelte-1i19ct2"),e.push("</div> "),e.push(`<!--[0--><div${(0,index_js_BPHC9uE5.a4)("connection-status ","svelte-1i19ct2")}>`),e.push("<!--[-1-->⏳"),e.push(`<!--]--> ${(0,attributes_js_BJlrMZid.P)("Checking hosted AI gateway…")}</div> <p class="setting-description svelte-1i19ct2">Hosted readiness is checked through the authenticated gateway.
                 Provider credentials are never sent to or stored by this browser.</p>`),e.push("<!--]--></div>")):e.push("<!--[-1-->"),e.push("<!--]--> "),d==="clinical"?e.push(`<!--[0--><div class="settings-section svelte-1i19ct2"><h2 class="svelte-1i19ct2">External Integrations</h2> <p class="section-info svelte-1i19ct2">These integrations are planned for future releases and will enable seamless connection with hospital systems.</p> <div class="setting-group checkbox-group svelte-1i19ct2"><label class="disabled-option svelte-1i19ct2"><input type="checkbox" disabled=""${(0,attributes_js_BJlrMZid.k)("checked",false,true)} class="svelte-1i19ct2"/> Enable worklist integration (RIS/HIS) <span class="coming-soon svelte-1i19ct2">— Coming Soon</span></label> <p class="setting-description svelte-1i19ct2">Connect with Radiology Information System or Hospital Information System for patient worklist management.</p></div> <div class="setting-group checkbox-group svelte-1i19ct2"><label class="disabled-option svelte-1i19ct2"><input type="checkbox" disabled=""${(0,attributes_js_BJlrMZid.k)("checked",false,true)} class="svelte-1i19ct2"/> Enable PACS integration <span class="coming-soon svelte-1i19ct2">— Coming Soon</span></label> <p class="setting-description svelte-1i19ct2">Connect with Picture Archiving and Communication System for medical image viewing and retrieval.</p></div></div>`):e.push("<!--[-1-->"),e.push("<!--]--> "),d==="letterheads"?(e.push('<!--[0--><div class="settings-section letterhead-section svelte-1i19ct2">'),me(e,{isAdmin:m}),e.push("<!----></div>")):e.push("<!--[-1-->"),e.push("<!--]--> "),d==="license"){if(e.push('<!--[0--><div class="settings-section svelte-1i19ct2"><h2 class="svelte-1i19ct2">🔑 License Management</h2> '),(0,index_js_BPHC9uE5.a6)(t??={},"$isLicenseActive",licenseStore_js_CSOu6edw.o)){e.push(`<!--[0--><div class="license-status license-active svelte-1i19ct2"><div class="license-badge svelte-1i19ct2"><span class="badge-icon svelte-1i19ct2">✓</span> <span class="badge-text svelte-1i19ct2">Premium Active</span></div> <div class="license-details svelte-1i19ct2"><div class="detail-row svelte-1i19ct2"><span class="detail-label svelte-1i19ct2">License Key:</span> <span class="detail-value license-key-display svelte-1i19ct2">${(0,attributes_js_BJlrMZid.P)((0,index_js_BPHC9uE5.a6)(t??={},"$licenseState",licenseStore_js_CSOu6edw.s).license?.key||"N/A")}</span></div> <div class="detail-row svelte-1i19ct2"><span class="detail-label svelte-1i19ct2">Plan:</span> <span class="detail-value svelte-1i19ct2">${(0,attributes_js_BJlrMZid.P)((0,index_js_BPHC9uE5.a6)(t??={},"$licenseState",licenseStore_js_CSOu6edw.s).license?.plan||"Premium")}</span></div> <div class="detail-row svelte-1i19ct2"><span class="detail-label svelte-1i19ct2">Expires:</span> <span class="detail-value svelte-1i19ct2">${(0,attributes_js_BJlrMZid.P)((0,index_js_BPHC9uE5.a6)(t??={},"$licenseState",licenseStore_js_CSOu6edw.s).expiresAt?new Date((0,index_js_BPHC9uE5.a6)(t??={},"$licenseState",licenseStore_js_CSOu6edw.s).expiresAt).toLocaleDateString():"N/A")}</span></div> <div class="detail-row svelte-1i19ct2"><span class="detail-label svelte-1i19ct2">Days Remaining:</span> <span class="detail-value svelte-1i19ct2">${(0,attributes_js_BJlrMZid.P)(licenseStore_js_CSOu6edw.A.getDaysRemaining()||0)} days</span></div> <div class="detail-row svelte-1i19ct2"><span class="detail-label svelte-1i19ct2">Features:</span> <span class="detail-value features-list svelte-1i19ct2"><!--[-->`);const n=(0,index_js_BPHC9uE5.a9)((0,index_js_BPHC9uE5.a6)(t??={},"$licenseFeatures",licenseStore_js_CSOu6edw.w));for(let l=0,r=n.length;l<r;l++){let p=n[l];e.push(`<span class="feature-tag svelte-1i19ct2">${(0,attributes_js_BJlrMZid.P)(p)}</span>`);}e.push("<!--]--></span></div></div> "),M?e.push('<!--[0--><div class="detail-row svelte-1i19ct2"><span class="detail-label svelte-1i19ct2">Auto-Renewal:</span> <span class="detail-value svelte-1i19ct2">Checking...</span></div>'):h$1?.hasSubscription?(e.push(`<!--[1--><div class="auto-renewal-section svelte-1i19ct2"><div class="detail-row svelte-1i19ct2"><span class="detail-label svelte-1i19ct2">Auto-Renewal:</span> <span${(0,index_js_BPHC9uE5.a4)("detail-value svelte-1i19ct2",void 0,{"auto-renew-on":h$1.autoRenew,"auto-renew-off":!h$1.autoRenew})}>${(0,attributes_js_BJlrMZid.P)(h$1.autoRenew?"On":"Off")}</span></div> <div class="detail-row svelte-1i19ct2"><span class="detail-label svelte-1i19ct2">Current Plan:</span> <span class="detail-value svelte-1i19ct2">${(0,attributes_js_BJlrMZid.P)(h$1.planName||"N/A")} (${(0,attributes_js_BJlrMZid.P)(h$1.planInterval||"N/A")})</span></div> `),h$1.nextPaymentDate&&h$1.autoRenew?e.push(`<!--[0--><div class="detail-row svelte-1i19ct2"><span class="detail-label svelte-1i19ct2">Next Payment:</span> <span class="detail-value svelte-1i19ct2">${(0,attributes_js_BJlrMZid.P)(new Date(h$1.nextPaymentDate).toLocaleDateString())}</span></div>`):e.push("<!--[-1-->"),e.push(`<!--]--> <button${(0,index_js_BPHC9uE5.a4)("btn btn-auto-renew svelte-1i19ct2",void 0,{"btn-danger":h$1.autoRenew})}${(0,attributes_js_BJlrMZid.k)("disabled",ae,true)}>${(0,attributes_js_BJlrMZid.P)(h$1.autoRenew?"Turn Off Auto-Renewal":"Turn On Auto-Renewal")}</button> `),h$1.availablePlans?.length>1?(e.push('<!--[0--><div class="change-plan-section svelte-1i19ct2" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color, #e2e8f0);"><label for="change-plan-select" style="font-weight: 500; margin-bottom: 0.5rem; display: block;" class="svelte-1i19ct2">Change Auto-Renewal Plan</label> <div style="display: flex; gap: 0.5rem; align-items: center;" class="svelte-1i19ct2">'),e.select({id:"change-plan-select",value:E,style:"flex: 1; padding: 0.5rem; border-radius: 6px; border: 1px solid var(--border-color, #e2e8f0); background: var(--input-bg, #fff); color: var(--text-color, #1a202c);",class:""},l=>{l.option({value:null,class:""},p=>{p.push("Select a different plan...");},"svelte-1i19ct2"),l.push("<!--[-->");const r=(0,index_js_BPHC9uE5.a9)(h$1.availablePlans.filter(p=>p.id!==h$1.planId));for(let p=0,A=r.length;p<A;p++){let g=r[p];l.option({value:g.id,class:""},U=>{U.push(`${(0,attributes_js_BJlrMZid.P)(g.name)} - GH₵${(0,attributes_js_BJlrMZid.P)((g.price_cedis/100).toFixed(2))}/${(0,attributes_js_BJlrMZid.P)(g.interval)}`);},"svelte-1i19ct2");}l.push("<!--]-->");},"svelte-1i19ct2"),e.push(` <button class="btn btn-primary svelte-1i19ct2"${(0,attributes_js_BJlrMZid.k)("disabled",!E,true)} style="white-space: nowrap;">${(0,attributes_js_BJlrMZid.P)("Change Plan")}</button></div></div>`)):e.push("<!--[-1-->"),e.push("<!--]--></div>")):(e.push('<!--[-1--><div class="auto-renewal-section svelte-1i19ct2"><div class="detail-row svelte-1i19ct2"><span class="detail-label svelte-1i19ct2">Auto-Renewal:</span> <span class="detail-value auto-renew-off svelte-1i19ct2">Not set up</span></div> '),h$1?.availablePlans?.length>0?(e.push(`<!--[0--><div class="setup-auto-renew svelte-1i19ct2" style="margin-top: 0.75rem;"><label for="setup-plan-select" style="font-weight: 500; margin-bottom: 0.5rem; display: block;" class="svelte-1i19ct2">Set Up Auto-Renewal</label> <p style="font-size: 0.85rem; color: var(--text-secondary, #718096); margin-bottom: 0.5rem;" class="svelte-1i19ct2">Automatically renew your license when it expires. You'll be charged on the expiration date.</p> <div style="display: flex; gap: 0.5rem; align-items: center;" class="svelte-1i19ct2">`),e.select({id:"setup-plan-select",value:E,style:"flex: 1; padding: 0.5rem; border-radius: 6px; border: 1px solid var(--border-color, #e2e8f0); background: var(--input-bg, #fff); color: var(--text-color, #1a202c);",class:""},l=>{l.option({value:null,class:""},p=>{p.push("Select a plan...");},"svelte-1i19ct2"),l.push("<!--[-->");const r=(0,index_js_BPHC9uE5.a9)(h$1.availablePlans);for(let p=0,A=r.length;p<A;p++){let g=r[p];l.option({value:g.id,class:""},U=>{U.push(`${(0,attributes_js_BJlrMZid.P)(g.name)} - GH₵${(0,attributes_js_BJlrMZid.P)((g.price_cedis/100).toFixed(2))}/${(0,attributes_js_BJlrMZid.P)(g.interval)}`);},"svelte-1i19ct2");}l.push("<!--]-->");},"svelte-1i19ct2"),e.push(` <button class="btn btn-primary svelte-1i19ct2"${(0,attributes_js_BJlrMZid.k)("disabled",!E,true)} style="white-space: nowrap;">${(0,attributes_js_BJlrMZid.P)("Set Up Auto-Renewal")}</button></div></div>`)):e.push("<!--[-1-->"),e.push("<!--]--></div>")),e.push("<!--]--> "),!M&&h$1?.availablePlans?.length>0&&(0,index_js_BPHC9uE5.a6)(t??={},"$licenseState",licenseStore_js_CSOu6edw.s).serverUrl?(e.push('<!--[0--><div class="top-up-section svelte-1i19ct2" style="margin-top: 1.5rem; padding: 1rem; border-radius: 8px; background: var(--card-bg-alt, rgba(102,126,234,0.05)); border: 1px solid var(--border-color, #e2e8f0);"><h3 style="font-size: 1rem; margin-bottom: 0.5rem;" class="svelte-1i19ct2">Top Up License</h3> <p style="font-size: 0.85rem; color: var(--text-secondary, #718096); margin-bottom: 0.75rem;" class="svelte-1i19ct2">Add time to your license immediately with a one-time payment. The extra time is added to your current expiration date.</p> <div style="display: flex; gap: 0.5rem; align-items: center;" class="svelte-1i19ct2">'),e.select({value:V,style:"flex: 1; padding: 0.5rem; border-radius: 6px; border: 1px solid var(--border-color, #e2e8f0); background: var(--input-bg, #fff); color: var(--text-color, #1a202c);",class:""},l=>{l.option({value:null,class:""},p=>{p.push("Select a plan...");},"svelte-1i19ct2"),l.push("<!--[-->");const r=(0,index_js_BPHC9uE5.a9)(h$1.availablePlans);for(let p=0,A=r.length;p<A;p++){let g=r[p];l.option({value:g.id,class:""},U=>{U.push(`${(0,attributes_js_BJlrMZid.P)(g.name)} - GH₵${(0,attributes_js_BJlrMZid.P)((g.price_cedis/100).toFixed(2))}/${(0,attributes_js_BJlrMZid.P)(g.interval)}`);},"svelte-1i19ct2");}l.push("<!--]-->");},"svelte-1i19ct2"),e.push(` <button class="btn btn-primary svelte-1i19ct2"${(0,attributes_js_BJlrMZid.k)("disabled",!V,true)} style="white-space: nowrap;">Top Up Now</button></div></div>`)):e.push("<!--[-1-->"),e.push('<!--]--> <button class="btn btn-secondary svelte-1i19ct2" style="margin-top: 1rem;">Deactivate License</button></div>');}else (0,index_js_BPHC9uE5.a6)(t??={},"$isLicenseExpired",licenseStore_js_CSOu6edw.f)?(e.push(`<!--[1--><div class="license-status license-expired svelte-1i19ct2"><div class="license-badge expired svelte-1i19ct2"><span class="badge-icon svelte-1i19ct2">⏰</span> <span class="badge-text svelte-1i19ct2">License Expired</span></div> <div class="license-details svelte-1i19ct2"><div class="detail-row svelte-1i19ct2"><span class="detail-label svelte-1i19ct2">License Key:</span> <span class="detail-value license-key-display svelte-1i19ct2">${(0,attributes_js_BJlrMZid.P)((0,index_js_BPHC9uE5.a6)(t??={},"$licenseState",licenseStore_js_CSOu6edw.s).license?.key||"N/A")}</span></div> <div class="detail-row svelte-1i19ct2"><span class="detail-label svelte-1i19ct2">Expired On:</span> <span class="detail-value expired-date svelte-1i19ct2">${(0,attributes_js_BJlrMZid.P)((0,index_js_BPHC9uE5.a6)(t??={},"$licenseState",licenseStore_js_CSOu6edw.s).expiresAt?new Date((0,index_js_BPHC9uE5.a6)(t??={},"$licenseState",licenseStore_js_CSOu6edw.s).expiresAt).toLocaleDateString():"N/A")}</span></div></div> <p class="license-description svelte-1i19ct2">Your premium license has expired. Renew it to restore access to voice dictation,
                  AI report polishing, inter-user chat, templates, and macros.</p> <div class="renewal-actions svelte-1i19ct2">`),(0,index_js_BPHC9uE5.a6)(t??={},"$licenseState",licenseStore_js_CSOu6edw.s).serverUrl?e.push('<!--[0--><button class="btn btn-renew svelte-1i19ct2">Renew License</button>'):e.push("<!--[-1-->"),e.push(`<!--]--> <button class="btn btn-secondary svelte-1i19ct2">Enter Different Key</button></div> <div class="setting-group svelte-1i19ct2" style="margin-top: 1rem;"><label for="license-key-reactivate" class="svelte-1i19ct2">Or re-activate with a new key</label> <input id="license-key-reactivate" type="text"${(0,attributes_js_BJlrMZid.k)("value",X)} placeholder="KP-XXXX-XXXX-XXXX-XXXX"${(0,attributes_js_BJlrMZid.k)("disabled",!(0,index_js_BPHC9uE5.a6)(t??={},"$licenseState",licenseStore_js_CSOu6edw.s).serverUrl,true)} class="svelte-1i19ct2"/></div> `),e.push("<!--[-1-->"),e.push(`<!--]--> <button class="btn btn-primary svelte-1i19ct2"${(0,attributes_js_BJlrMZid.k)("disabled",!(0,index_js_BPHC9uE5.a6)(t??={},"$licenseState",licenseStore_js_CSOu6edw.s).serverUrl||!X.trim(),true)}>${(0,attributes_js_BJlrMZid.P)("Activate New Key")}</button></div>`)):(e.push(`<!--[-1--><div class="license-status license-inactive svelte-1i19ct2"><div class="license-badge inactive svelte-1i19ct2"><span class="badge-icon svelte-1i19ct2">!</span> <span class="badge-text svelte-1i19ct2">Free Version</span></div> <p class="license-description svelte-1i19ct2">Activate a license to unlock premium features including voice dictation, 
                  AI report polishing, inter-user chat, templates, and macros.</p> `),m?e.push(`<!--[0--><div class="setting-group svelte-1i19ct2"><label for="license-server-url" class="svelte-1i19ct2">License Server URL</label> <div class="input-with-button svelte-1i19ct2"><input id="license-server-url" type="text"${(0,attributes_js_BJlrMZid.k)("value",le)} placeholder="https://your-license-server.com or /license-server" class="svelte-1i19ct2"/> <button class="btn btn-secondary svelte-1i19ct2">Save</button></div> <p class="setting-description svelte-1i19ct2">The URL of your self-hosted license server</p></div>`):e.push("<!--[-1-->"),e.push(`<!--]--> <div class="setting-group svelte-1i19ct2"><label for="license-key-input" class="svelte-1i19ct2">License Key</label> <input id="license-key-input" type="text"${(0,attributes_js_BJlrMZid.k)("value",X)} placeholder="KP-XXXX-XXXX-XXXX-XXXX"${(0,attributes_js_BJlrMZid.k)("disabled",!(0,index_js_BPHC9uE5.a6)(t??={},"$licenseState",licenseStore_js_CSOu6edw.s).serverUrl,true)} class="svelte-1i19ct2"/> `),(0,index_js_BPHC9uE5.a6)(t??={},"$licenseState",licenseStore_js_CSOu6edw.s).serverUrl?e.push("<!--[-1-->"):e.push('<!--[0--><p class="setting-description warning svelte-1i19ct2">Please configure the license server URL first (admin required)</p>'),e.push("<!--]--></div> "),e.push("<!--[-1-->"),e.push(`<!--]--> <button class="btn btn-primary svelte-1i19ct2"${(0,attributes_js_BJlrMZid.k)("disabled",!(0,index_js_BPHC9uE5.a6)(t??={},"$licenseState",licenseStore_js_CSOu6edw.s).serverUrl||!X.trim(),true)}>${(0,attributes_js_BJlrMZid.P)("Activate License")}</button></div>`));e.push("<!--]--></div>");}else e.push("<!--[-1-->");e.push('<!--]--></div></div> <div class="save-controls svelte-1i19ct2"><button class="btn btn-primary save-button svelte-1i19ct2"><span class="save-icon svelte-1i19ct2">💾</span> Save Changes</button> '),e.push('<!--[-1--><div class="saved-indicator svelte-1i19ct2">✅ All Changes Saved</div>'),e.push("<!--]--> "),e.push("<!--[-1-->"),e.push("<!--]--></div></div> "),(0,ConfirmDialog_js_B_ufL4xb.u)(e,{title:"Reset All Settings?",message:"Are you sure you want to reset all settings to defaults? This cannot be undone.",confirmText:"Reset",cancelText:"Cancel",danger:true,get show(){return B},set show(n){B=n,q=false;}}),e.push("<!----> "),(0,ConfirmDialog_js_B_ufL4xb.u)(e,{title:"Logout?",message:"Are you sure you want to logout?",confirmText:"Logout",cancelText:"Cancel",get show(){return Q},set show(n){Q=n,q=false;}}),e.push("<!---->");}do q=true,O=u$1.copy(),ue(O);while(!q);u$1.subsume(O),t&&(0,index_js_BPHC9uE5.a7)(t);});}


//# sourceMappingURL=_page.svelte.js-Bxa-mW7O.js.map


/***/ })

};
