import { g as On, h as ce, j as kn, B as Bt } from './index2-CY1CdFeX.js';

const a=[];function x(t,s){return {subscribe:z(t,s).subscribe}}function z(t,s=On){let n=null;const o=new Set;function i(r){if(kn(t,r)&&(t=r,n)){const u=!a.length;for(const e of o)e[1](),a.push(e,t);if(u){for(let e=0;e<a.length;e+=2)a[e][0](a[e+1]);a.length=0;}}}function l(r){i(r(t));}function b(r,u=On){const e=[r,u];return o.add(e),o.size===1&&(n=s(i,l)||On),r(t),()=>{o.delete(e),o.size===0&&n&&(n(),n=null);}}return {set:i,update:l,subscribe:b}}function E(t,s,n){const o=!Array.isArray(t),i=o?[t]:t;if(!i.every(Boolean))throw new Error("derived() expects stores as input, got a falsy value");const l=s.length<2;return x(n,(b,r)=>{let u=false;const e=[];let p=0,d=On;const y=()=>{if(p)return;d();const c=s(o?e[0]:e,b,r);l?b(c):d=typeof c=="function"?c:On;},h=i.map((c,g)=>ce(c,w=>{e[g]=w,p&=~(1<<g),u&&y();},()=>{p|=1<<g;}));return u=true,y(),function(){Bt(h),d(),u=false;}})}function v(t){let s;return ce(t,n=>s=n)(),s}

export { E, v, x, z };
//# sourceMappingURL=index-DNKSM4PU.js.map
