import{H as w,g as D,d as L,s as R,a as S,i as Y,b as C,c as B,e as x,f as W,C as P,h as z,j as F,k as U,l as V,m as G,n as K,o as J,p as Q,q as X,r as Z,t as $,u as tt,L as et,v as T,w as nt,x as rt,y as st,z as at,A as it,B as ot}from"./index2.js";import"clsx";import"./environment.js";let lt={};function Ot(t){}function Ct(t){lt=t}function M(t){console.warn("https://svelte.dev/e/hydration_mismatch")}let k=!1;function y(t){k=t}let _;function E(t){if(t===null)throw M(),w;return _=t}function ct(){return E(D(_))}const ut=["touchstart","touchmove"];function dt(t){return ut.includes(t)}const ft=new Set,N=new Set;let A=null;function b(t){var e=this,s=e.ownerDocument,i=t.type,a=t.composedPath?.()||[],n=a[0]||t.target;A=t;var r=0,o=A===t&&t.__root;if(o){var d=a.indexOf(o);if(d!==-1&&(e===document||e===window)){t.__root=e;return}var f=a.indexOf(e);if(f===-1)return;d<=f&&(r=d)}if(n=a[r]||t.target,n!==e){L(t,"currentTarget",{configurable:!0,get(){return n||s}});var h=B,c=C;R(null),S(null);try{for(var l,u=[];n!==null;){var p=n.assignedSlot||n.parentNode||n.host||null;try{var m=n["__"+i];if(m!=null&&(!n.disabled||t.target===n))if(Y(m)){var[q,...H]=m;q.apply(n,[t,...H])}else m.call(n,t)}catch(g){l?u.push(g):l=g}if(t.cancelBubble||p===e||p===null)break;n=p}if(l){for(let g of u)queueMicrotask(()=>{throw g});throw l}}finally{t.__root=e,delete t.currentTarget,R(h),S(c)}}}function ht(t,e){var s=C;s.nodes_start===null&&(s.nodes_start=t,s.nodes_end=e)}function j(t,e){return I(t,e)}function mt(t,e){x(),e.intro=e.intro??!1;const s=e.target,i=k,a=_;try{for(var n=W(s);n&&(n.nodeType!==P||n.data!==z);)n=D(n);if(!n)throw w;y(!0),E(n),ct();const r=I(t,{...e,anchor:n});if(_===null||_.nodeType!==P||_.data!==F)throw M(),w;return y(!1),r}catch(r){if(r instanceof Error&&r.message.split(`
`).some(o=>o.startsWith("https://svelte.dev/e/")))throw r;return r!==w&&console.warn("Failed to hydrate: ",r),e.recover===!1&&U(),x(),V(s),y(!1),j(t,e)}finally{y(i),E(a)}}const v=new Map;function I(t,{target:e,anchor:s,props:i={},events:a,context:n,intro:r=!0}){x();var o=new Set,d=c=>{for(var l=0;l<c.length;l++){var u=c[l];if(!o.has(u)){o.add(u);var p=dt(u);e.addEventListener(u,b,{passive:p});var m=v.get(u);m===void 0?(document.addEventListener(u,b,{passive:p}),v.set(u,1)):v.set(u,m+1)}}};d(G(ft)),N.add(d);var f=void 0,h=K(()=>{var c=s??e.appendChild(J());return Q(()=>{if(n){X({});var l=Z;l.c=n}a&&(i.$$events=a),k&&ht(c,null),f=t(c,i)||{},k&&(C.nodes_end=_),n&&$()}),()=>{for(var l of o){e.removeEventListener(l,b);var u=v.get(l);--u===0?(document.removeEventListener(l,b),v.delete(l)):v.set(l,u)}N.delete(d),c!==s&&c.parentNode?.removeChild(c)}});return O.set(f,h),f}let O=new WeakMap;function _t(t,e){const s=O.get(t);return s?(O.delete(t),s(e)):Promise.resolve()}function pt(t){return class extends vt{constructor(e){super({component:t,...e})}}}class vt{#e;#t;constructor(e){var s=new Map,i=(n,r)=>{var o=rt(r,!1,!1);return s.set(n,o),o};const a=new Proxy({...e.props||{},$$events:{}},{get(n,r){return T(s.get(r)??i(r,Reflect.get(n,r)))},has(n,r){return r===et?!0:(T(s.get(r)??i(r,Reflect.get(n,r))),Reflect.has(n,r))},set(n,r,o){return tt(s.get(r)??i(r,o),o),Reflect.set(n,r,o)}});this.#t=(e.hydrate?mt:j)(e.component,{target:e.target,anchor:e.anchor,props:a,context:e.context,intro:e.intro??!1,recover:e.recover}),(!e?.props?.$$host||e.sync===!1)&&nt(),this.#e=a.$$events;for(const n of Object.keys(this.#t))n==="$set"||n==="$destroy"||n==="$on"||L(this,n,{get(){return this.#t[n]},set(r){this.#t[n]=r},enumerable:!0});this.#t.$set=n=>{Object.assign(a,n)},this.#t.$destroy=()=>{_t(this.#t)}}$set(e){this.#t.$set(e)}$on(e,s){this.#e[e]=this.#e[e]||[];const i=(...a)=>s.call(this,...a);return this.#e[e].push(i),()=>{this.#e[e]=this.#e[e].filter(a=>a!==i)}}$destroy(){this.#t.$destroy()}}let gt=null;function Rt(t){gt=t}function St(t){}function yt(t){const e=pt(t),s=(i,{context:a}={})=>{const n=st(t,{props:i,context:a});return{css:{code:"",map:null},head:n.head,html:n.body}};return e.render=s,e}function bt(t,e){at();let{stores:s,page:i,constructors:a,components:n=[],form:r,data_0:o=null,data_1:d=null}=e;it("__svelte__",s),s.page.set(i);const f=a[1];if(a[1]){t.out.push("<!--[-->");const h=a[0];t.out.push("<!---->"),h(t,{data:o,form:r,params:i.params,children:c=>{c.out.push("<!---->"),f(c,{data:d,form:r,params:i.params}),c.out.push("<!---->")},$$slots:{default:!0}}),t.out.push("<!---->")}else{t.out.push("<!--[!-->");const h=a[0];t.out.push("<!---->"),h(t,{data:o,form:r,params:i.params}),t.out.push("<!---->")}t.out.push("<!--]--> "),t.out.push("<!--[!-->"),t.out.push("<!--]-->"),ot()}const wt=yt(bt),Pt={app_template_contains_nonce:!1,csp:{mode:"auto",directives:{"upgrade-insecure-requests":!1,"block-all-mixed-content":!1},reportOnly:{"upgrade-insecure-requests":!1,"block-all-mixed-content":!1}},csrf_check_origin:!1,csrf_trusted_origins:[],embedded:!1,env_public_prefix:"PUBLIC_",env_private_prefix:"",hash_routing:!1,hooks:null,preload_strategy:"modulepreload",root:wt,service_worker:!1,service_worker_options:void 0,templates:{app:({head:t,body:e,assets:s,nonce:i,env:a})=>`<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<link rel="icon" href="`+s+`/favicon.png" />
		<link rel="apple-touch-icon" href="`+s+`/icons/icon-192.png" />
		<link rel="manifest" href="`+s+`/manifest.json" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<meta name="theme-color" content="#0066cc" />
		<meta name="apple-mobile-web-app-capable" content="yes" />
		<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
		<meta name="apple-mobile-web-app-title" content="KrisPoint" />
		`+t+`
	</head>
	<body data-sveltekit-preload-data="hover">
		<div style="display: contents">`+e+`</div>
		<script>
			if ('serviceWorker' in navigator) {
				navigator.serviceWorker.register('/service-worker.js');
			}
		<\/script>
	</body>
</html>
`,error:({status:t,message:e})=>`<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<title>`+e+`</title>

		<style>
			body {
				--bg: white;
				--fg: #222;
				--divider: #ccc;
				background: var(--bg);
				color: var(--fg);
				font-family:
					system-ui,
					-apple-system,
					BlinkMacSystemFont,
					'Segoe UI',
					Roboto,
					Oxygen,
					Ubuntu,
					Cantarell,
					'Open Sans',
					'Helvetica Neue',
					sans-serif;
				display: flex;
				align-items: center;
				justify-content: center;
				height: 100vh;
				margin: 0;
			}

			.error {
				display: flex;
				align-items: center;
				max-width: 32rem;
				margin: 0 1rem;
			}

			.status {
				font-weight: 200;
				font-size: 3rem;
				line-height: 1;
				position: relative;
				top: -0.05rem;
			}

			.message {
				border-left: 1px solid var(--divider);
				padding: 0 0 0 1rem;
				margin: 0 0 0 1rem;
				min-height: 2.5rem;
				display: flex;
				align-items: center;
			}

			.message h1 {
				font-weight: 400;
				font-size: 1em;
				margin: 0;
			}

			@media (prefers-color-scheme: dark) {
				body {
					--bg: #222;
					--fg: #ddd;
					--divider: #666;
				}
			}
		</style>
	</head>
	<body>
		<div class="error">
			<span class="status">`+t+`</span>
			<div class="message">
				<h1>`+e+`</h1>
			</div>
		</div>
	</body>
</html>
`},version_hash:"a2llq4"};async function Tt(){let t,e,s,i,a;return{handle:t,handleFetch:e,handleError:s,handleValidationError:i,init:a}=await import("./hooks.server.js"),{handle:t,handleFetch:e,handleError:s,handleValidationError:i,init:a,reroute:void 0,transport:void 0}}export{Ct as a,Rt as b,St as c,Tt as g,Pt as o,lt as p,gt as r,Ot as s};
