import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';

const RESEND_API_URL = 'https://api.resend.com/emails';
const DAILY_BRIEF_RECIPIENT = 'castleridge.labs@gmail.com';

interface RoleCountRow {
  role: string;
}

interface BriefMetrics {
  usersGainedToday: number;
  totalUsers: number;
  adminCount: number;
  editorCount: number;
  userCount: number;
  videosCount: number;
  articlesCount: number;
  activeQuestionsCount: number;
  activeTestSessionsCount: number;
}

function getTodayWindowBounds() {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  return {
    nowIso: now.toISOString(),
    todayStartIso: todayStart.toISOString(),
  };
}

async function getUsersGainedTodayCount(): Promise<number> {
  const adminClient = getSupabaseAdminClient();
  const { nowIso, todayStartIso } = getTodayWindowBounds();

  const usersGainedTodayResult = await adminClient
    .from('Users')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', todayStartIso)
    .lt('created_at', nowIso);

  if (usersGainedTodayResult.error) {
    console.error('Failed to collect daily users gained metric:', {
      usersGainedTodayError: usersGainedTodayResult.error.message,
    });

    return 0;
  }

  return usersGainedTodayResult.count ?? 0;
}

function buildBriefHtml(params: BriefMetrics): string {
  const {
    usersGainedToday,
    totalUsers,
    adminCount,
    editorCount,
    userCount,
    videosCount,
    articlesCount,
    activeQuestionsCount,
    activeTestSessionsCount,
  } = params;

  return `
    <div style="margin: 0; padding: 24px 12px; background-color: #f3f4f6; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; color: #111827;">
      <div style="max-width: 680px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden;">
        <div style="padding: 24px; background: linear-gradient(135deg, #111827 0%, #1f2937 45%, #2563eb 100%); color: #f9fafb;">
          <p style="margin: 0 0 8px; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; opacity: 0.85;">Castleridge Labs</p>
          <h2 style="margin: 0; font-size: 28px; line-height: 1.2;">Daily Website Brief</h2>
        </div>

        <div style="padding: 22px;">
          <h3 style="margin: 0 0 10px; font-size: 16px; color: #111827;">Daily Users Gained</h3>
          <div style="padding: 12px 14px; border-radius: 10px; background: #f0fdf4; border: 1px solid #bbf7d0; color: #14532d; font-size: 13px; margin-bottom: 8px;">
            New users today: <strong>${usersGainedToday}</strong>
          </div>
          <p style="margin: 0 0 18px; font-size: 14px; line-height: 1.6; color: #1f2937;">Track this number day-over-day to spot growth momentum and quickly validate acquisition experiments.</p>

          <h3 style="margin: 0 0 12px; font-size: 16px; color: #111827;">Audience</h3>
          <table role="presentation" cellspacing="0" cellpadding="0" style="width: 100%; border-collapse: separate; border-spacing: 10px; margin-bottom: 16px;">
            <tr>
              <td style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px; width: 50%;">
                <p style="margin: 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.04em;">Total users</p>
                <p style="margin: 8px 0 0; font-size: 26px; font-weight: 700; color: #111827;">${totalUsers}</p>
              </td>
              <td style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px; width: 50%;">
                <p style="margin: 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.04em;">Admins</p>
                <p style="margin: 8px 0 0; font-size: 26px; font-weight: 700; color: #111827;">${adminCount}</p>
              </td>
            </tr>
            <tr>
              <td style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px;">
                <p style="margin: 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.04em;">Editors</p>
                <p style="margin: 8px 0 0; font-size: 26px; font-weight: 700; color: #111827;">${editorCount}</p>
              </td>
              <td style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px;">
                <p style="margin: 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.04em;">Users</p>
                <p style="margin: 8px 0 0; font-size: 26px; font-weight: 700; color: #111827;">${userCount}</p>
              </td>
            </tr>
          </table>

          <h3 style="margin: 0 0 12px; font-size: 16px; color: #111827;">Content & Activity</h3>
          <table role="presentation" cellspacing="0" cellpadding="0" style="width: 100%; border-collapse: collapse; overflow: hidden; border-radius: 12px; border: 1px solid #e5e7eb;">
            <tr>
              <td style="padding: 12px 14px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #374151;">Total videos</td>
              <td style="padding: 12px 14px; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 15px; font-weight: 700; color: #111827;">${videosCount}</td>
            </tr>
            <tr>
              <td style="padding: 12px 14px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #374151;">Total learning articles</td>
              <td style="padding: 12px 14px; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 15px; font-weight: 700; color: #111827;">${articlesCount}</td>
            </tr>
            <tr>
              <td style="padding: 12px 14px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #374151;">Active live questions</td>
              <td style="padding: 12px 14px; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 15px; font-weight: 700; color: #111827;">${activeQuestionsCount}</td>
            </tr>
            <tr>
              <td style="padding: 12px 14px; font-size: 14px; color: #374151;">In-progress test sessions</td>
              <td style="padding: 12px 14px; text-align: right; font-size: 15px; font-weight: 700; color: #111827;">${activeTestSessionsCount}</td>
            </tr>
          </table>

          <div style="margin-top: 16px; padding: 12px 14px; border-radius: 10px; background: #eff6ff; border: 1px solid #bfdbfe; color: #1e3a8a; font-size: 13px;">
            Tip: If active live questions or in-progress test sessions spike day-over-day, investigate user friction or support requests.
          </div>

        </div>
      </div>
    </div>
  `;
}

function buildBriefText(params: BriefMetrics): string {
  return [
    'Daily Website Brief',
    '',
    'Daily Users Gained',
    `- New users today: ${params.usersGainedToday}`,
    '',
    'Audience',
    `- Total users: ${params.totalUsers}`,
    `- Admins: ${params.adminCount}`,
    `- Editors: ${params.editorCount}`,
    `- Users: ${params.userCount}`,
    '',
    'Content & Activity',
    `- Total videos: ${params.videosCount}`,
    `- Total learning articles: ${params.articlesCount}`,
    `- Active live questions: ${params.activeQuestionsCount}`,
    `- In-progress test sessions: ${params.activeTestSessionsCount}`,
  ].join('\n');
}

function buildSubjectLine(): string {
  const nowLabel = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return `🚀 Castleridge Labs Growth | ${nowLabel}`;
}

async function sendDailyBriefEmail(payload: {
  to: string[];
  subject: string;
  html: string;
  text: string;
}) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.ADMIN_BRIEF_FROM_EMAIL || 'onboarding@resend.dev';

  if (!resendApiKey) {
    throw new Error('Missing RESEND_API_KEY');
  }

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Resend API error (${response.status}): ${errorBody}`);
  }

  return response.json();
}

export async function GET() {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        message: 'Skipping daily admin brief because RESEND_API_KEY is not configured',
      });
    }

    const adminClient = getSupabaseAdminClient();
    const recipients = [DAILY_BRIEF_RECIPIENT];

    const [
      totalUsersResult,
      usersGainedToday,
      roleRowsResult,
      videosCountResult,
      articlesCountResult,
      activeQuestionsCountResult,
      activeTestSessionsCountResult,
    ] = await Promise.all([
      adminClient.from('Users').select('*', { count: 'exact', head: true }),
      getUsersGainedTodayCount(),
      adminClient.from('Users').select('role'),
      adminClient.from('Videos').select('*', { count: 'exact', head: true }),
      adminClient.from('LearningArticles').select('*', { count: 'exact', head: true }),
      adminClient.from('LiveQuestions').select('*', { count: 'exact', head: true }).eq('is_archived', false),
      adminClient.from('TestSession').select('*', { count: 'exact', head: true }).is('completed_at', null),
    ]);

    if (totalUsersResult.error || roleRowsResult.error || videosCountResult.error || articlesCountResult.error || activeQuestionsCountResult.error || activeTestSessionsCountResult.error) {
      console.error('Failed to collect daily brief metrics:', {
        totalUsersError: totalUsersResult.error?.message,
        roleRowsError: roleRowsResult.error?.message,
        videosCountError: videosCountResult.error?.message,
        articlesCountError: articlesCountResult.error?.message,
        activeQuestionsCountError: activeQuestionsCountResult.error?.message,
        activeTestSessionsCountError: activeTestSessionsCountResult.error?.message,
      });

      return NextResponse.json({ error: 'Failed to collect metrics' }, { status: 500 });
    }

    const roles = (roleRowsResult.data || []) as RoleCountRow[];

    const metrics: BriefMetrics = {
      usersGainedToday,
      totalUsers: totalUsersResult.count ?? 0,
      adminCount: roles.filter((row) => row.role === 'ADMIN').length,
      editorCount: roles.filter((row) => row.role === 'EDITOR').length,
      userCount: roles.filter((row) => row.role === 'USER').length,
      videosCount: videosCountResult.count ?? 0,
      articlesCount: articlesCountResult.count ?? 0,
      activeQuestionsCount: activeQuestionsCountResult.count ?? 0,
      activeTestSessionsCount: activeTestSessionsCountResult.count ?? 0,
    };

    const subject = buildSubjectLine();

    const html = buildBriefHtml(metrics);
    const text = buildBriefText(metrics);

    const emailResponse = await sendDailyBriefEmail({
      to: recipients,
      subject,
      html,
      text,
    });

    return NextResponse.json({
      ok: true,
      recipients,
      metrics,
      emailResponse,
    });
  } catch (error) {
    console.error('Failed to run daily admin brief cron:', error);

    return NextResponse.json(
      { error: 'Failed to run daily admin brief cron' },
      { status: 500 }
    );
  }
}
