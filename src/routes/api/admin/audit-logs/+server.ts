import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validateSession } from '$lib/server/auth';
import { db, schema } from '$lib/server/db';
import { desc, eq, and, gte, lte, or, sql } from 'drizzle-orm';

async function checkAuditPermission(cookies: any): Promise<{ authorized: boolean; userId?: number; error?: string }> {
  const token = cookies.get('session_token');
  if (!token) {
    return { authorized: false, error: 'No session token' };
  }

  const session = await validateSession(token);
  
  if (!session.success || !session.user) {
    return { authorized: false, error: 'Invalid session' };
  }

  const permissions = session.permissions || [];
  if (!permissions.includes('audit.read') && !permissions.includes('audit.view') && !permissions.includes('users.manage')) {
    return { authorized: false, error: 'Insufficient permissions' };
  }

  return { authorized: true, userId: session.user.id };
}

export const GET: RequestHandler = async ({ cookies, url }) => {
  try {
    const authCheck = await checkAuditPermission(cookies);
    if (!authCheck.authorized) {
      return json({ success: false, error: authCheck.error }, { status: 403 });
    }

    const rawPage = parseInt(url.searchParams.get('page') || '1');
    const rawLimit = parseInt(url.searchParams.get('limit') || '50');
    const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
    const limit = isNaN(rawLimit) || rawLimit < 1 ? 50 : Math.min(rawLimit, 100);
    const offset = Math.max(0, (page - 1) * limit);
    
    const search = url.searchParams.get('search') || '';
    const category = url.searchParams.get('category') || '';
    const severity = url.searchParams.get('severity') || '';
    const action = url.searchParams.get('action') || '';
    const startDate = url.searchParams.get('startDate') || '';
    const endDate = url.searchParams.get('endDate') || '';

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          sql`lower(${schema.auditLogs.username}) like lower(${`%${search}%`})`,
          sql`lower(${schema.auditLogs.action}) like lower(${`%${search}%`})`,
          sql`lower(${schema.auditLogs.description}) like lower(${`%${search}%`})`,
          sql`lower(${schema.auditLogs.resourceId}) like lower(${`%${search}%`})`
        )
      );
    }

    if (category) {
      conditions.push(eq(schema.auditLogs.category, category));
    }

    if (severity) {
      conditions.push(eq(schema.auditLogs.severity, severity));
    }

    if (action) {
      conditions.push(eq(schema.auditLogs.action, action));
    }

    if (startDate) {
      conditions.push(gte(schema.auditLogs.createdAt, new Date(startDate)));
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      conditions.push(lte(schema.auditLogs.createdAt, end));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [logs, countResult] = await Promise.all([
      db
        .select()
        .from(schema.auditLogs)
        .where(whereClause)
        .orderBy(desc(schema.auditLogs.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(schema.auditLogs)
        .where(whereClause)
    ]);

    const total = countResult[0]?.count || 0;

    const categories = await db
      .selectDistinct({ category: schema.auditLogs.category })
      .from(schema.auditLogs)
      .where(sql`${schema.auditLogs.category} IS NOT NULL`);

    const actions = await db
      .selectDistinct({ action: schema.auditLogs.action })
      .from(schema.auditLogs);

    return json({
      success: true,
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      filters: {
        categories: categories.map(c => c.category).filter(Boolean),
        actions: actions.map(a => a.action).filter(Boolean),
        severities: ['INFO', 'WARNING', 'ERROR', 'CRITICAL']
      }
    });
  } catch (error) {
    console.error('Get audit logs API error:', error);
    return json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
};
