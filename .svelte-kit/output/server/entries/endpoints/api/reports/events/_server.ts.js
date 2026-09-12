import{v as i}from"../../../../../chunks/auth.js";import{r as a}from"../../../../../chunks/reportEvents.js";const m=async({request:o})=>{const n=await i(o);if(!n.success||!n.user)return new Response("Unauthorized",{status:401});const t=`report-${n.user.id}-${Date.now()}-${Math.random().toString(36).substr(2,9)}`;let e=null;const c=new ReadableStream({start(r){const s=new TextEncoder;a.addClient(t,r),r.enqueue(s.encode(`data: ${JSON.stringify({type:"connected",clientId:t})}

`)),e=setInterval(()=>{try{r.enqueue(s.encode(`: heartbeat

`))}catch{e&&clearInterval(e),a.removeClient(t)}},3e4)},cancel(){e&&clearInterval(e),a.removeClient(t)}});return new Response(c,{headers:{"Content-Type":"text/event-stream","Cache-Control":"no-cache",Connection:"keep-alive","X-Accel-Buffering":"no"}})};export{m as GET};
