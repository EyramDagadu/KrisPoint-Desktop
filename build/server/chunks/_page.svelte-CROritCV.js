import { _ as _e, G as Ge, z as ze, Z as Ze, u as je, n as Ot, H as He, l as Ve, f as ve } from './index2-CY1CdFeX.js';
import './utils-Ca-EoiSx.js';
import './state.svelte-xhjpmOz7.js';
import { h } from './authStore-_wTOTagk.js';
import { _ } from './DateFilterDropdown-CmsvNQjW.js';
import './index-DNKSM4PU.js';

function X(e,C){_e();var s;let l,o,c=[],v=[],u="card",m="",p="",h$1="all",b="";const g=["CT","MRI","X-Ray","Ultrasound","Mammography","Fluoroscopy","Nuclear Medicine","PET-CT"];Ge(s??={},"$permissions",h).includes("reports.submit"),l=c.filter(t=>true),o=v.filter(t=>true),l.length>0||o.length>0;const a=ze(g);e.out.push('<div class="returned-reports-page svelte-eesdbk">'),e.out.push("<!--[!-->"),e.out.push('<!--]--> <div class="page-controls svelte-eesdbk">'),_(e,{startDate:m,endDate:p,selectedPreset:h$1}),e.out.push('<!----> <select class="modality-filter svelte-eesdbk">'),e.select_value=b,e.out.push(`<option value=""${Ze(e,"")} class="svelte-eesdbk">All Modalities</option><!--[-->`);for(let t=0,r=a.length;t<r;t++){let i=a[t];e.out.push(`<option${je("value",i)}${Ze(e,i)} class="svelte-eesdbk">${Ot(i)}</option>`);}e.out.push("<!--]-->"),e.select_value=void 0,e.out.push("</select> "),e.out.push("<!--[!-->"),e.out.push(`<!--]--> <div class="view-toggle svelte-eesdbk"><button${He("toggle-btn svelte-eesdbk",void 0,{active:u==="card"})} title="Card View">▦</button> <button${He("toggle-btn svelte-eesdbk",void 0,{active:u==="table"})} title="Table View">☰</button></div></div> `),e.out.push("<!--[-->"),e.out.push('<div class="loading svelte-eesdbk">Loading returned items...</div>'),e.out.push("<!--]--></div>"),s&&Ve(s),ve();}

export { X as default };
//# sourceMappingURL=_page.svelte-CROritCV.js.map
