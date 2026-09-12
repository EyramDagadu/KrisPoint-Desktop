import { j as json } from './index-Djsj11qr.js';
import { d as fe, s as _e } from './db-C6eh-v9M.js';
import { count } from 'drizzle-orm';
import 'dotenv/config';
import 'pg';
import 'drizzle-orm/node-postgres';
import 'drizzle-orm/pg-core';

const l=async()=>{try{const r=(await fe.select({count:count()}).from(_e.users))[0]?.count||0;return json({success:!0,hasUsers:r>0,userCount:r,edition:process.env.VITE_KRISPOINT_EDITION==="solo"?"solo":"hospital",singleOwner:process.env.VITE_KRISPOINT_EDITION==="solo"})}catch(s){return console.error("Check users API error:",s),json({success:false,error:"Internal server error",hasUsers:false},{status:500})}};

export { l as GET };
//# sourceMappingURL=_server.ts-DSzFHc2f.js.map
