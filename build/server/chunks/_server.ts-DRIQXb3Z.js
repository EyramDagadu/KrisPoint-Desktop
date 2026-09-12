import { j as json } from './index-Djsj11qr.js';
import { randomBytes } from 'crypto';

const n=async()=>{if(process.env.ENCRYPTION_KEY||process.env.SOLO_ENCRYPTION_KEY)return json({success:false,error:"Encryption key is already configured"},{status:400});const s=randomBytes(32).toString("hex");return json({success:true,key:s})};

export { n as POST };
//# sourceMappingURL=_server.ts-DRIQXb3Z.js.map
