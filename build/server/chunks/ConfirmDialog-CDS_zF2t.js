import { _ as _e, o as be, n as Ot, H as He, t as Xe, f as ve } from './index2-CY1CdFeX.js';

/* empty css                                           */function p(t,e){_e();let a=be(e.show,false),n=be(e.title,"Confirm Action"),o=be(e.message,"Are you sure you want to proceed?"),c=be(e.confirmText,"Confirm"),d=be(e.cancelText,"Cancel"),l=be(e.danger,false);a?(t.out.push("<!--[-->"),t.out.push(`<div class="confirm-backdrop svelte-1dsi18p" role="dialog" aria-modal="true"><div class="confirm-dialog svelte-1dsi18p"><div class="confirm-header svelte-1dsi18p"><h3 class="svelte-1dsi18p">${Ot(n)}</h3></div> <div class="confirm-body svelte-1dsi18p"><p class="svelte-1dsi18p">${Ot(o)}</p></div> <div class="confirm-actions svelte-1dsi18p"><button class="btn btn-cancel svelte-1dsi18p">${Ot(d)}</button> <button${He("btn svelte-1dsi18p",void 0,{"btn-danger":l,"btn-primary":!l})}>${Ot(c)}</button></div></div></div>`)):t.out.push("<!--[!-->"),t.out.push("<!--]-->"),Xe(e,{show:a,title:n,message:o,confirmText:c,cancelText:d,danger:l}),ve();}

export { p };
//# sourceMappingURL=ConfirmDialog-CDS_zF2t.js.map
