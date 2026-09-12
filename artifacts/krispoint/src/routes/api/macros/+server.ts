import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, schema } from '$lib/server/db';
import { validateSessionFromRequest, checkPermission, logAudit } from '$lib/server/auth';
import { eq, and, desc, or, ne } from 'drizzle-orm';

export const GET: RequestHandler = async ({ request, url }) => {
  try {
    const session = await validateSessionFromRequest(request);
    if (!session.success || !session.user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const scope = url.searchParams.get('scope');
    const userId = session.user.id;

    let macros;

    if (scope === 'system') {
      macros = await db
        .select()
        .from(schema.macros)
        .where(and(
          eq(schema.macros.isSystem, true),
          eq(schema.macros.isActive, true)
        ))
        .orderBy(desc(schema.macros.createdAt));
    } else if (scope === 'personal') {
      macros = await db
        .select()
        .from(schema.macros)
        .where(and(
          eq(schema.macros.isSystem, false),
          eq(schema.macros.createdBy, userId),
          eq(schema.macros.isActive, true)
        ))
        .orderBy(desc(schema.macros.createdAt));
    } else {
      macros = await db
        .select()
        .from(schema.macros)
        .where(and(
          eq(schema.macros.isActive, true),
          or(
            eq(schema.macros.isSystem, true),
            eq(schema.macros.createdBy, userId)
          )
        ))
        .orderBy(desc(schema.macros.createdAt));
    }

    return json({ success: true, macros });
  } catch (error) {
    console.error('Error fetching macros:', error);
    return json({ success: false, error: 'Failed to fetch macros' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const session = await validateSessionFromRequest(request);
    if (!session.success || !session.user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, category, content, variables, voiceCommand, isSystem } = body;

    if (!name || !content) {
      return json({ success: false, error: 'Name and content are required' }, { status: 400 });
    }

    const userId = session.user.id;

    if (isSystem) {
      const hasPermission = await checkPermission(userId, 'macros.manage_system');
      if (!hasPermission) {
        return json({ success: false, error: 'Only admins can create system macros' }, { status: 403 });
      }
    }

    if (voiceCommand && voiceCommand.trim()) {
      const normalizedVoiceCommand = voiceCommand.trim().toLowerCase();
      
      let conflictQuery;
      if (isSystem) {
        conflictQuery = await db
          .select()
          .from(schema.macros)
          .where(and(
            eq(schema.macros.isSystem, true),
            eq(schema.macros.isActive, true)
          ));
      } else {
        conflictQuery = await db
          .select()
          .from(schema.macros)
          .where(and(
            eq(schema.macros.isSystem, false),
            eq(schema.macros.createdBy, userId),
            eq(schema.macros.isActive, true)
          ));
      }

      const existingConflict = conflictQuery.find(
        m => m.voiceCommand?.toLowerCase() === normalizedVoiceCommand
      );

      if (existingConflict) {
        const poolName = isSystem ? 'system' : 'personal';
        return json({ 
          success: false, 
          error: `Voice command "${voiceCommand}" already exists in your ${poolName} macros` 
        }, { status: 400 });
      }
    }

    const [newMacro] = await db
      .insert(schema.macros)
      .values({
        name,
        category: category || null,
        content,
        variables: variables || null,
        voiceCommand: voiceCommand?.trim() || null,
        isSystem: isSystem || false,
        isGlobal: isSystem || false,
        createdBy: userId,
        isActive: true
      })
      .returning();

    await logAudit({
      userId: session.user.id,
      username: session.user.username,
      userRole: session.user.roleName,
      action: 'MACRO_CREATED',
      category: 'MACROS',
      severity: 'INFO',
      resourceType: 'MACRO',
      resourceId: String(newMacro.id),
      description: `${isSystem ? 'System' : 'Personal'} macro "${name}" created`,
      metadata: { isSystem, category }
    });

    return json({ success: true, macro: newMacro }, { status: 201 });
  } catch (error) {
    console.error('Error creating macro:', error);
    return json({ success: false, error: 'Failed to create macro' }, { status: 500 });
  }
};
