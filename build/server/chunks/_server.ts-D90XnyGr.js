import { j as json } from './index-Djsj11qr.js';

const E=async()=>{const e=!!(process.env.ENCRYPTION_KEY||process.env.SOLO_ENCRYPTION_KEY),o=!!(process.env.AUDIT_SECRET||process.env.SOLO_AUDIT_KEY||e);return json({encryptionConfigured:e,auditConfigured:o,needsSetup:!e,keyName:process.env.VITE_KRISPOINT_EDITION==="solo"?"SOLO_ENCRYPTION_KEY":"ENCRYPTION_KEY"})};

export { E as GET };
//# sourceMappingURL=_server.ts-D90XnyGr.js.map
