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

    let templates;

    if (scope === 'system') {
      templates = await db
        .select()
        .from(schema.templates)
        .where(and(
          eq(schema.templates.isSystem, true),
          eq(schema.templates.isActive, true)
        ))
        .orderBy(desc(schema.templates.createdAt));
    } else if (scope === 'personal') {
      templates = await db
        .select()
        .from(schema.templates)
        .where(and(
          eq(schema.templates.isSystem, false),
          eq(schema.templates.createdBy, userId),
          eq(schema.templates.isActive, true)
        ))
        .orderBy(desc(schema.templates.createdAt));
    } else {
      templates = await db
        .select()
        .from(schema.templates)
        .where(and(
          eq(schema.templates.isActive, true),
          or(
            eq(schema.templates.isSystem, true),
            eq(schema.templates.createdBy, userId)
          )
        ))
        .orderBy(desc(schema.templates.createdAt));
    }

    return json({ success: true, templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return json({ success: false, error: 'Failed to fetch templates' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const session = await validateSessionFromRequest(request);
    if (!session.success || !session.user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      name, category, modality, bodyRegion, 
      comparisonHtml, techniqueHtml, findingsHtml, impressionHtml,
      content, variables, voiceCommand, isSystem 
    } = body;

    // Build content from sections if sections are provided
    let finalContent = content;
    if (comparisonHtml || techniqueHtml || findingsHtml || impressionHtml) {
      const sections = [];
      if (comparisonHtml) sections.push(`<p><strong>COMPARISON:</strong></p>${comparisonHtml}`);
      if (techniqueHtml) sections.push(`<p><strong>TECHNIQUE:</strong></p>${techniqueHtml}`);
      if (findingsHtml) sections.push(`<p><strong>FINDINGS:</strong></p>${findingsHtml}`);
      if (impressionHtml) sections.push(`<p><strong>IMPRESSION:</strong></p>${impressionHtml}`);
      finalContent = sections.join('\n');
    }

    if (!name || !finalContent) {
      return json({ success: false, error: 'Name and content (or sections) are required' }, { status: 400 });
    }

    const userId = session.user.id;

    if (isSystem) {
      const hasPermission = await checkPermission(userId, 'templates.manage_system');
      if (!hasPermission) {
        return json({ success: false, error: 'Only admins can create system templates' }, { status: 403 });
      }
    }

    if (voiceCommand && voiceCommand.trim()) {
      const normalizedVoiceCommand = voiceCommand.trim().toLowerCase();
      
      let conflictQuery;
      if (isSystem) {
        conflictQuery = await db
          .select()
          .from(schema.templates)
          .where(and(
            eq(schema.templates.isSystem, true),
            eq(schema.templates.isActive, true)
          ));
      } else {
        conflictQuery = await db
          .select()
          .from(schema.templates)
          .where(and(
            eq(schema.templates.isSystem, false),
            eq(schema.templates.createdBy, userId),
            eq(schema.templates.isActive, true)
          ));
      }

      const existingConflict = conflictQuery.find(
        t => t.voiceCommand?.toLowerCase() === normalizedVoiceCommand
      );

      if (existingConflict) {
        const poolName = isSystem ? 'system' : 'personal';
        return json({ 
          success: false, 
          error: `Voice command "${voiceCommand}" already exists in your ${poolName} templates` 
        }, { status: 400 });
      }
    }

    const [newTemplate] = await db
      .insert(schema.templates)
      .values({
        name,
        category: category || null,
        modality: modality || null,
        bodyRegion: bodyRegion || null,
        comparisonHtml: comparisonHtml || null,
        techniqueHtml: techniqueHtml || null,
        findingsHtml: findingsHtml || null,
        impressionHtml: impressionHtml || null,
        content: finalContent,
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
      action: 'TEMPLATE_CREATED',
      category: 'TEMPLATES',
      severity: 'INFO',
      resourceType: 'TEMPLATE',
      resourceId: String(newTemplate.id),
      description: `${isSystem ? 'System' : 'Personal'} template "${name}" created`,
      metadata: { isSystem, category, modality }
    });

    return json({ success: true, template: newTemplate }, { status: 201 });
  } catch (error) {
    console.error('Error creating template:', error);
    return json({ success: false, error: 'Failed to create template' }, { status: 500 });
  }
};
