import { j as json } from './index-Djsj11qr.js';
import { v as X, c as J, l as m } from './auth-CFRsUa-j.js';
import { d as fe, s as _e } from './db-C6eh-v9M.js';
import { eq } from 'drizzle-orm';
import 'bcryptjs';
import 'crypto';
import 'dotenv/config';
import 'pg';
import 'drizzle-orm/node-postgres';
import 'drizzle-orm/pg-core';

const p=async({params:c,request:n})=>{try{const s=await X(n);if(!s.success||!s.user)return json({success:!1,error:"Unauthorized"},{status:401});if(!await J(s.user.id,"users.manage"))return json({success:!1,error:"Insufficient permissions"},{status:403});const t=parseInt(c.id);if(isNaN(t))return json({success:!1,error:"Invalid user ID"},{status:400});if(t===s.user.id)return json({success:!1,error:"Cannot toggle your own account status"},{status:400});const a=await fe.select().from(_e.users).where(eq(_e.users.id,t)).limit(1);if(!a.length)return json({success:!1,error:"User not found"},{status:404});if(a[0].deletedAt)return json({success:!1,error:"Cannot modify a deleted user account"},{status:400});const r=!a[0].isActive;return await fe.update(_e.users).set({isActive:r,updatedAt:new Date}).where(eq(_e.users.id,t)),await m({userId:s.user.id,username:s.user.username,action:r?"USER_ACTIVATED":"USER_DEACTIVATED",category:"USERS",severity:r?"INFO":"WARNING",description:`User ${r?"activated":"deactivated"}: ${a[0].username}`,resourceType:"USER",resourceId:String(t),oldValue:{isActive:a[0].isActive},newValue:{isActive:r}}),json({success:!0,isActive:r,message:`User ${r?"activated":"deactivated"} successfully`})}catch(s){return console.error("Toggle user status API error:",s),json({success:false,error:"Internal server error"},{status:500})}};

export { p as POST };
//# sourceMappingURL=_server.ts-H5SYAP-2.js.map
