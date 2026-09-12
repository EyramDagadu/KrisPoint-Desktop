

export const index = 12;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/reports/_page.svelte.js')).default;
export const universal = {
  "prerender": true,
  "ssr": false
};
export const universal_id = "src/routes/reports/+page.js";
export const imports = ["_app/immutable/nodes/12.DPDukjvT.js","_app/immutable/chunks/DsnmJJEf.js","_app/immutable/chunks/DCCa7WY_.js","_app/immutable/chunks/D5gQvCjn.js","_app/immutable/chunks/TxzGf9kf.js","_app/immutable/chunks/D3a4_bll.js","_app/immutable/chunks/CR6m4V62.js","_app/immutable/chunks/Crmhr63z.js","_app/immutable/chunks/BZXIp3h8.js","_app/immutable/chunks/BvBU9x--.js","_app/immutable/chunks/CPF_VgrF.js","_app/immutable/chunks/Cr9GWNwF.js","_app/immutable/chunks/DN-ef-cC.js","_app/immutable/chunks/CIVnmXEU.js","_app/immutable/chunks/C4glEofd.js","_app/immutable/chunks/BZIGDFf3.js","_app/immutable/chunks/B0VOwdXh.js","_app/immutable/chunks/CP_c372A.js","_app/immutable/chunks/BqlTOgs2.js","_app/immutable/chunks/CerCfjoB.js","_app/immutable/chunks/wEXL-ng-.js","_app/immutable/chunks/DDUZErzj.js","_app/immutable/chunks/tySiD8aD.js","_app/immutable/chunks/Ct5FWWRu.js","_app/immutable/chunks/e3_y2cg_.js","_app/immutable/chunks/FSgwuUB5.js","_app/immutable/chunks/DVVrJoQm.js","_app/immutable/chunks/thgaPqfa.js","_app/immutable/chunks/C5VKH-05.js"];
export const stylesheets = ["_app/immutable/assets/ConfirmDialog.BS-59iBY.css","_app/immutable/assets/PDFPreviewModal.D4SeAJ6Q.css","_app/immutable/assets/DateFilterDropdown.D9YbXaKS.css","_app/immutable/assets/12.CZH5ZRS6.css"];
export const fonts = [];
