import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as schema from '../../../../../shared/schema';
import { eq } from 'drizzle-orm';
import { validateSessionFromRequest, logAudit } from '$lib/server/auth';

export const GET: RequestHandler = async ({ request }) => {
  try {
    const session = await validateSessionFromRequest(request);
    if (!session.success || !session.user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const [user] = await db
      .select({
        signatureUrl: schema.users.signatureUrl,
        signatureName: schema.users.signatureName
      })
      .from(schema.users)
      .where(eq(schema.users.id, session.user.id))
      .limit(1);

    if (!user || !user.signatureUrl) {
      return json({ success: true, signature: null });
    }

    return json({ 
      success: true, 
      signature: {
        url: user.signatureUrl,
        name: user.signatureName
      }
    });
  } catch (error) {
    console.error('Get signature error:', error);
    return json({ success: false, error: 'Failed to get signature' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const session = await validateSessionFromRequest(request);
    if (!session.success || !session.user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    let data;
    try {
      data = await request.json();
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return json({ success: false, error: 'Invalid request data - signature may be too large' }, { status: 400 });
    }

    const { signatureUrl, signatureName } = data;

    if (!signatureUrl) {
      return json({ success: false, error: 'Signature data is required' }, { status: 400 });
    }

    // Check signature data size (base64 images can be large)
    const signatureSize = signatureUrl.length;
    const maxSize = 500000; // 500KB limit for base64 data
    if (signatureSize > maxSize) {
      console.error(`Signature too large: ${signatureSize} bytes (max ${maxSize})`);
      return json({ success: false, error: 'Signature image is too large. Please use a smaller image.' }, { status: 400 });
    }

    await db
      .update(schema.users)
      .set({
        signatureUrl: signatureUrl,
        signatureName: signatureName || 'Digital Signature',
        updatedAt: new Date()
      })
      .where(eq(schema.users.id, session.user.id));

    // Audit log for signature update
    await logAudit({
      userId: session.user.id,
      username: session.user.username,
      userRole: session.user.roleName,
      action: 'SIGNATURE_UPDATED',
      category: 'SETTINGS',
      severity: 'INFO',
      resourceType: 'USER',
      resourceId: String(session.user.id),
      description: 'Digital signature updated'
    });

    return json({ success: true });
  } catch (error: any) {
    console.error('Save signature error:', error);
    const errorMessage = error?.message || 'Failed to save signature';
    return json({ success: false, error: errorMessage }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ request }) => {
  try {
    const session = await validateSessionFromRequest(request);
    if (!session.success || !session.user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await db
      .update(schema.users)
      .set({
        signatureUrl: null,
        signatureName: null,
        updatedAt: new Date()
      })
      .where(eq(schema.users.id, session.user.id));

    // Audit log for signature deletion
    await logAudit({
      userId: session.user.id,
      username: session.user.username,
      userRole: session.user.roleName,
      action: 'SIGNATURE_DELETED',
      category: 'SETTINGS',
      severity: 'WARNING',
      resourceType: 'USER',
      resourceId: String(session.user.id),
      description: 'Digital signature deleted'
    });

    return json({ success: true });
  } catch (error) {
    console.error('Delete signature error:', error);
    return json({ success: false, error: 'Failed to delete signature' }, { status: 500 });
  }
};
