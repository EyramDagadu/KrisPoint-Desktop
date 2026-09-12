import{a as d,s as a}from"../../../../../chunks/auth.js";const f=async({cookies:i})=>{const r=i.get("session_token");if(!r)return new Response("Unauthorized",{status:401});const t=await d(r);if(!t.success||!t.user)return new Response("Invalid session",{status:401});const o=t.user.id,n=`${o}-${Date.now()}-${Math.random().toString(36).substr(2,9)}`;let e=null;const u=new ReadableStream({start(s){const c=new TextEncoder;a.addClient(n,o,s),s.enqueue(c.encode(`data: ${JSON.stringify({type:"connected"})}

`)),e=setInterval(()=>{try{s.enqueue(c.encode(`: heartbeat

`))}catch{e&&clearInterval(e),a.removeClient(n)}},3e4)},cancel(){e&&clearInterval(e),a.removeClient(n)}});return new Response(u,{headers:{"Content-Type":"text/event-stream","Cache-Control":"no-cache",Connection:"keep-alive","X-Accel-Buffering":"no"}})};export{f as GET};
