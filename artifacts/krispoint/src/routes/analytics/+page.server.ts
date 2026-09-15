import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { validateSession } from '$lib/server/auth';

const isSoloEdition = process.env.VITE_KRISPOINT_EDITION === 'solo';

export const load: PageServerLoad = async ({ cookies, url, fetch }) => {
  const token = cookies.get('session_token');
  
  if (!token) {
    throw redirect(303, '/login');
  }

  const session = await validateSession(token);
  if (!session.success || !session.user) {
    throw redirect(303, '/login');
  }

  const user = session.user;
  const roleName = user.roleName?.toLowerCase() || '';

  if (roleName === 'front desk') {
    throw redirect(303, '/dashboard');
  }

  const canViewOrganizationAnalytics = !isSoloEdition &&
    (roleName === 'admin' || roleName === 'owner' || roleName === 'system owner');

  const startDate = url.searchParams.get('startDate') || getDefaultStartDate();
  const endDate = url.searchParams.get('endDate') || getDefaultEndDate();
  const preset = url.searchParams.get('preset') || '30days';
  const filterUserId = url.searchParams.get('userId') || 'all';
  const filterModality = url.searchParams.get('modality') || 'all';
  const filterStatus = url.searchParams.get('status') || 'all';

  let userAnalyticsUrl = `/api/analytics/user?period=custom&startDate=${startDate}&endDate=${endDate}`;
  if (preset === 'all') {
    userAnalyticsUrl = '/api/analytics/user?period=all';
  }

  const userAnalyticsResponse = await fetch(userAnalyticsUrl);
  const userAnalyticsResult = await userAnalyticsResponse.json();

  let adminAnalytics = null;
  if (canViewOrganizationAnalytics) {
    let adminUrl = `/api/analytics/admin?period=custom&startDate=${startDate}&endDate=${endDate}`;
    if (preset === 'all') {
      adminUrl = '/api/analytics/admin?period=all';
    }
    if (filterUserId !== 'all') {
      adminUrl += `&userId=${filterUserId}`;
    }
    if (filterModality !== 'all') {
      adminUrl += `&modality=${encodeURIComponent(filterModality)}`;
    }
    if (filterStatus !== 'all') {
      adminUrl += `&status=${filterStatus}`;
    }

    const adminResponse = await fetch(adminUrl);
    const adminResult = await adminResponse.json();
    if (adminResult.success) {
      adminAnalytics = adminResult.data;
    }
  }

  return {
    userAnalytics: userAnalyticsResult.success ? userAnalyticsResult.data : null,
    adminAnalytics,
    canViewOrganizationAnalytics,
    filters: {
      startDate,
      endDate,
      preset,
      userId: filterUserId,
      modality: filterModality,
      status: filterStatus
    },
    user: {
      id: user.id,
      username: user.username,
      roleName: user.roleName
    }
  };
};

function getDefaultStartDate(): string {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  return date.toISOString().split('T')[0];
}

function getDefaultEndDate(): string {
  return new Date().toISOString().split('T')[0];
}
