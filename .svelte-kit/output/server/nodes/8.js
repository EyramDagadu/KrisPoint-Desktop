import * as server from '../entries/pages/analytics/_page.server.ts.js';

export const index = 8;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/analytics/_page.svelte.js')).default;
export const universal = {
  "prerender": false,
  "ssr": false
};
export const universal_id = "src/routes/analytics/+page.js";
export { server };
export const server_id = "src/routes/analytics/+page.server.ts";
export const imports = ["_app/immutable/nodes/8.DT6ZS746.js","_app/immutable/chunks/DsnmJJEf.js","_app/immutable/chunks/DCCa7WY_.js","_app/immutable/chunks/D5gQvCjn.js","_app/immutable/chunks/TxzGf9kf.js","_app/immutable/chunks/D3a4_bll.js","_app/immutable/chunks/CR6m4V62.js","_app/immutable/chunks/Crmhr63z.js","_app/immutable/chunks/DVVrJoQm.js","_app/immutable/chunks/BvBU9x--.js","_app/immutable/chunks/C4glEofd.js","_app/immutable/chunks/BZIGDFf3.js","_app/immutable/chunks/Cr9GWNwF.js","_app/immutable/chunks/CPF_VgrF.js","_app/immutable/chunks/ZlLAuBRx.js","_app/immutable/chunks/C5VKH-05.js","_app/immutable/chunks/BZXIp3h8.js"];
export const stylesheets = ["_app/immutable/assets/DateFilterDropdown.D9YbXaKS.css","_app/immutable/assets/8.MnV_QRbx.css"];
export const fonts = [];
