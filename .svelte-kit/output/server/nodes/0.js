import * as universal from '../entries/pages/_layout.js';

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/+layout.js";
export const imports = ["_app/immutable/nodes/0.CKXGMRkN.js","_app/immutable/chunks/Ct5FWWRu.js","_app/immutable/chunks/DsnmJJEf.js","_app/immutable/chunks/DCCa7WY_.js","_app/immutable/chunks/D5gQvCjn.js","_app/immutable/chunks/TxzGf9kf.js","_app/immutable/chunks/C77_ikao.js","_app/immutable/chunks/BZIGDFf3.js","_app/immutable/chunks/Cr9GWNwF.js","_app/immutable/chunks/ZlLAuBRx.js","_app/immutable/chunks/CPF_VgrF.js","_app/immutable/chunks/e3_y2cg_.js","_app/immutable/chunks/vINxNE-F.js","_app/immutable/chunks/DVVrJoQm.js","_app/immutable/chunks/D3a4_bll.js","_app/immutable/chunks/CfWI2_8H.js","_app/immutable/chunks/C4glEofd.js","_app/immutable/chunks/CR6m4V62.js","_app/immutable/chunks/Crmhr63z.js","_app/immutable/chunks/CIVnmXEU.js","_app/immutable/chunks/BZXIp3h8.js","_app/immutable/chunks/thgaPqfa.js","_app/immutable/chunks/BVNbuC5X.js"];
export const stylesheets = ["_app/immutable/assets/ConfirmDialog.BS-59iBY.css","_app/immutable/assets/0.DemggCtF.css"];
export const fonts = [];
