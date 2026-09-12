import { j as json } from './index-Djsj11qr.js';
import { d as fe, s as _e } from './db-C6eh-v9M.js';
import { v as X, c as J, l as m } from './auth-CFRsUa-j.js';
import { and, eq, desc, or } from 'drizzle-orm';
import 'dotenv/config';
import 'pg';
import 'drizzle-orm/node-postgres';
import 'drizzle-orm/pg-core';
import 'bcryptjs';
import 'crypto';

const I=async({request:d,url:r})=>{try{const t=await X(d);if(!t.success||!t.user)return json({success:!1,error:"Unauthorized"},{status:401});const i=r.searchParams.get("scope"),n=t.user.id;let o;return i==="system"?o=await fe.select().from(_e.macros).where(and(eq(_e.macros.isSystem,!0),eq(_e.macros.isActive,!0))).orderBy(desc(_e.macros.createdAt)):i==="personal"?o=await fe.select().from(_e.macros).where(and(eq(_e.macros.isSystem,!1),eq(_e.macros.createdBy,n),eq(_e.macros.isActive,!0))).orderBy(desc(_e.macros.createdAt)):o=await fe.select().from(_e.macros).where(and(eq(_e.macros.isActive,!0),or(eq(_e.macros.isSystem,!0),eq(_e.macros.createdBy,n)))).orderBy(desc(_e.macros.createdAt)),json({success:!0,macros:o})}catch(t){return console.error("Error fetching macros:",t),json({success:false,error:"Failed to fetch macros"},{status:500})}},N=async({request:d})=>{try{const r=await X(d);if(!r.success||!r.user)return json({success:!1,error:"Unauthorized"},{status:401});const t=await d.json(),{name:i,category:n,content:o,variables:g,voiceCommand:u,isSystem:c}=t;if(!i||!o)return json({success:!1,error:"Name and content are required"},{status:400});const f=r.user.id;if(c&&!await J(f,"macros.manage_system"))return json({success:!1,error:"Only admins can create system macros"},{status:403});if(u&&u.trim()){const v=u.trim().toLowerCase();let y;if(c?y=await fe.select().from(_e.macros).where(and(eq(_e.macros.isSystem,!0),eq(_e.macros.isActive,!0))):y=await fe.select().from(_e.macros).where(and(eq(_e.macros.isSystem,!1),eq(_e.macros.createdBy,f),eq(_e.macros.isActive,!0))),y.find(A=>A.voiceCommand?.toLowerCase()===v))return json({success:!1,error:`Voice command "${u}" already exists in your ${c?"system":"personal"} macros`},{status:400})}const[h]=await fe.insert(_e.macros).values({name:i,category:n||null,content:o,variables:g||null,voiceCommand:u?.trim()||null,isSystem:c||!1,isGlobal:c||!1,createdBy:f,isActive:!0}).returning();return await m({userId:r.user.id,username:r.user.username,userRole:r.user.roleName,action:"MACRO_CREATED",category:"MACROS",severity:"INFO",resourceType:"MACRO",resourceId:String(h.id),description:`${c?"System":"Personal"} macro "${i}" created`,metadata:{isSystem:c,category:n}}),json({success:!0,macro:h},{status:201})}catch(r){return console.error("Error creating macro:",r),json({success:false,error:"Failed to create macro"},{status:500})}};

export { I as GET, N as POST };
//# sourceMappingURL=_server.ts-Bj43_SIh.js.map
