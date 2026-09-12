import { j as json } from './index-Djsj11qr.js';
import { e as Z } from './auth-CFRsUa-j.js';
import './db-C6eh-v9M.js';
import 'dotenv/config';
import 'pg';
import 'drizzle-orm/node-postgres';
import 'drizzle-orm/pg-core';
import 'drizzle-orm';
import 'bcryptjs';
import 'crypto';

const d=async({request:t,getClientAddress:c,cookies:n})=>{try{const{username:s,password:a}=await t.json();if(!s||!a)return json({success:!1,error:"Username and password are required"},{status:400});const u=c(),l=t.headers.get("user-agent")||void 0,e=await Z(s,a,u,l);if(!e.success)return json(e,{status:401});if(e.session){const o=process.env.COOKIE_SECURE==="true";n.set("session_token",e.session.token,{path:"/",httpOnly:!0,secure:o,sameSite:"lax",maxAge:3600*24}),n.set("refresh_token",e.session.refreshToken,{path:"/",httpOnly:!0,secure:o,sameSite:"lax",maxAge:3600*24*30}),console.log(`[Auth] Cookies set for session, secure=${o}, origin=${t.headers.get("origin")||"none"}`);}const{session:i,...p}=e;return json({...p,session:i?{expiresAt:i.expiresAt}:void 0})}catch(s){return console.error("Login API error:",s),json({success:false,error:"Internal server error"},{status:500})}};

export { d as POST };
//# sourceMappingURL=_server.ts-BIgULSmW.js.map
