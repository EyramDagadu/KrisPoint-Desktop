import { j as json } from './index-Djsj11qr.js';

const n=async({request:t})=>{const e=process.env.KRISPOINT_LAUNCH_SECRET;return !e||t.headers.get("x-krispoint-launch-secret")!==e?json({ready:false},{status:404}):json({ready:true})};

export { n as GET };
//# sourceMappingURL=_server.ts-CkaHz054.js.map
