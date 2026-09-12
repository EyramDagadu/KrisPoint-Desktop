import { j as json } from './index-Djsj11qr.js';

const i=async({request:o})=>{try{const{key:e}=await o.json();if(!e||typeof e!="string"||e.length!==64)return json({success:!1,error:"Invalid encryption key format"},{status:400});const s=process.env.VITE_KRISPOINT_EDITION==="solo";if(s)return json({success:!0,instructions:{},message:"KrisPoint Solo stores its encryption keys in the operating system credential store."});const r=s?"SOLO_ENCRYPTION_KEY":"ENCRYPTION_KEY";return json({success:!0,instructions:{replit:`Add ${r} to your Secrets tab in Replit, then restart the server.`,linux:`Add to /etc/environment or your shell profile: export ${r}=${e}`,windows:`Set system environment variable: ${r} = ${e}`,docker:`Add to your docker-compose.yml or -e ${r}=${e}`},message:`Key generated. Set the ${r} environment variable on your server, then restart the application.`})}catch(e){return console.error("Setup complete error:",e),json({success:false,error:"Failed to process request"},{status:500})}};

export { i as POST };
//# sourceMappingURL=_server.ts-DwHMuLRQ.js.map
