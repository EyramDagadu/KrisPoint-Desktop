import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { key } = await request.json();
    
    if (!key || typeof key !== 'string' || key.length !== 64) {
      return json({ 
        success: false, 
        error: 'Invalid encryption key format' 
      }, { status: 400 });
    }

    const solo = process.env.VITE_KRISPOINT_EDITION === 'solo';
    if (solo) {
      return json({
        success: true,
        instructions: {},
        message: 'KrisPoint Solo stores its encryption keys in the operating system credential store.'
      });
    }
    const keyName = solo ? 'SOLO_ENCRYPTION_KEY' : 'ENCRYPTION_KEY';
    return json({
      success: true,
      instructions: {
        replit: `Add ${keyName} to your Secrets tab in Replit, then restart the server.`,
        linux: `Add to /etc/environment or your shell profile: export ${keyName}=${key}`,
        windows: `Set system environment variable: ${keyName} = ${key}`,
        docker: `Add to your docker-compose.yml or -e ${keyName}=${key}`
      },
      message: `Key generated. Set the ${keyName} environment variable on your server, then restart the application.`
    });
  } catch (error) {
    console.error('Setup complete error:', error);
    return json({ 
      success: false, 
      error: 'Failed to process request' 
    }, { status: 500 });
  }
};
