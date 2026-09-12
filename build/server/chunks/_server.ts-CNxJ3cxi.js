import { j as json } from './index-Djsj11qr.js';
import { a as C } from './auth-CFRsUa-j.js';
import { s as _e, d as fe } from './db-C6eh-v9M.js';
import { or, sql, eq, gte, lte, and, desc } from 'drizzle-orm';
import 'bcryptjs';
import 'crypto';
import 'dotenv/config';
import 'pg';
import 'drizzle-orm/node-postgres';
import 'drizzle-orm/pg-core';

async function M(d){const t=d.get("session_token");if(!t)return {authorized:false,error:"No session token"};const s=await C(t);if(!s.success||!s.user)return {authorized:false,error:"Invalid session"};const o=s.permissions||[];return !o.includes("audit.read")&&!o.includes("audit.view")&&!o.includes("users.manage")?{authorized:false,error:"Insufficient permissions"}:{authorized:true,userId:s.user.id}}const E=async({cookies:d,url:t})=>{try{const s=await M(d);if(!s.authorized)return json({success:!1,error:s.error},{status:403});const o=parseInt(t.searchParams.get("page")||"1"),g=parseInt(t.searchParams.get("limit")||"50"),h=isNaN(o)||o<1?1:o,n=isNaN(g)||g<1?50:Math.min(g,100),$=Math.max(0,(h-1)*n),c=t.searchParams.get("search")||"",f=t.searchParams.get("category")||"",p=t.searchParams.get("severity")||"",w=t.searchParams.get("action")||"",L=t.searchParams.get("startDate")||"",y=t.searchParams.get("endDate")||"",a=[];if(c&&a.push(or(sql`lower(${_e.auditLogs.username}) like lower(${`%${c}%`})`,sql`lower(${_e.auditLogs.action}) like lower(${`%${c}%`})`,sql`lower(${_e.auditLogs.description}) like lower(${`%${c}%`})`,sql`lower(${_e.auditLogs.resourceId}) like lower(${`%${c}%`})`)),f&&a.push(eq(_e.auditLogs.category,f)),p&&a.push(eq(_e.auditLogs.severity,p)),w&&a.push(eq(_e.auditLogs.action,w)),L&&a.push(gte(_e.auditLogs.createdAt,new Date(L))),y){const r=new Date(y);r.setHours(23,59,59,999),a.push(lte(_e.auditLogs.createdAt,r));}const I=a.length>0?and(...a):void 0,[N,k]=await Promise.all([fe.select().from(_e.auditLogs).where(I).orderBy(desc(_e.auditLogs.createdAt)).limit(n).offset($),fe.select({count:sql`cast(count(*) as int)`}).from(_e.auditLogs).where(I)]),P=k[0]?.count||0,v=await fe.selectDistinct({category:_e.auditLogs.category}).from(_e.auditLogs).where(sql`${_e.auditLogs.category} IS NOT NULL`),D=await fe.selectDistinct({action:_e.auditLogs.action}).from(_e.auditLogs);return json({success:!0,logs:N,pagination:{page:h,limit:n,total:P,totalPages:Math.ceil(P/n)},filters:{categories:v.map(r=>r.category).filter(Boolean),actions:D.map(r=>r.action).filter(Boolean),severities:["INFO","WARNING","ERROR","CRITICAL"]}})}catch(s){return console.error("Get audit logs API error:",s),json({success:false,error:"Internal server error"},{status:500})}};

export { E as GET };
//# sourceMappingURL=_server.ts-CNxJ3cxi.js.map
