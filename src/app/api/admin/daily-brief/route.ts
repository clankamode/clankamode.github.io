import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import OpenAI from 'openai';

const RESEND_API_URL = 'https://api.resend.com/emails';
const DAILY_BRIEF_RECIPIENT = 'castleridge.labs@gmail.com';

interface RoleCountRow {
  role: string;
}

interface BriefMetrics {
  totalUsers: number;
  adminCount: number;
  editorCount: number;
  userCount: number;
  videosCount: number;
  articlesCount: number;
  activeQuestionsCount: number;
  activeTestSessionsCount: number;
}

interface WeeklyTrendMetrics {
  thisWeekUsers: number;
  lastWeekUsers: number;
  deltaUsers: number;
  deltaPercent: number | null;
}

function getWindowBounds() {
  const now = new Date();
  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(now.getDate() - 7);

  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(thisWeekStart.getDate() - 7);

  return {
    nowIso: now.toISOString(),
    thisWeekStartIso: thisWeekStart.toISOString(),
    lastWeekStartIso: lastWeekStart.toISOString(),
  };
}

async function getWeeklyTrendMetrics(): Promise<WeeklyTrendMetrics> {
  const adminClient = getSupabaseAdminClient();
  const { nowIso, thisWeekStartIso, lastWeekStartIso } = getWindowBounds();

  const [thisWeekResult, lastWeekResult] = await Promise.all([
    adminClient
      .from('Users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thisWeekStartIso)
      .lt('created_at', nowIso),
    adminClient
      .from('Users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', lastWeekStartIso)
      .lt('created_at', thisWeekStartIso),
  ]);

  if (thisWeekResult.error || lastWeekResult.error) {
    console.error('Failed to collect weekly trend metrics:', {
      thisWeekError: thisWeekResult.error?.message,
      lastWeekError: lastWeekResult.error?.message,
    });

    return {
      thisWeekUsers: 0,
      lastWeekUsers: 0,
      deltaUsers: 0,
      deltaPercent: null,
    };
  }

  const thisWeekUsers = thisWeekResult.count ?? 0;
  const lastWeekUsers = lastWeekResult.count ?? 0;
  const deltaUsers = thisWeekUsers - lastWeekUsers;
  const deltaPercent = lastWeekUsers > 0
    ? Number(((deltaUsers / lastWeekUsers) * 100).toFixed(1))
    : null;

  return {
    thisWeekUsers,
    lastWeekUsers,
    deltaUsers,
    deltaPercent,
  };
}

function buildFallbackTrendNarrative(trend: WeeklyTrendMetrics): string {
  const direction = trend.deltaUsers > 0 ? 'up' : trend.deltaUsers < 0 ? 'down' : 'flat';
  const pctLabel = trend.deltaPercent === null ? 'n/a' : `${trend.deltaPercent}%`;

  return `New user growth is ${direction} week-over-week: ${trend.thisWeekUsers} new users in the last 7 days vs ${trend.lastWeekUsers} in the prior 7 days (${pctLabel}). Keep pushing top acquisition channels and monitor conversion quality as volume changes.`;
}

async function generateTrendNarrative(trend: WeeklyTrendMetrics): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    return buildFallbackTrendNarrative(trend);
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.responses.create({
      model: 'gpt-4o-mini',
      input: [
        {
          role: 'system',
          content: 'You are a concise growth analyst. Write exactly 2 punchy sentences for an executive update. Mention trend direction and one practical recommendation. No emojis.',
        },
        {
          role: 'user',
          content: `Website weekly signup trend: this_week_new_users=${trend.thisWeekUsers}, last_week_new_users=${trend.lastWeekUsers}, delta_users=${trend.deltaUsers}, delta_percent=${trend.deltaPercent ?? 'n/a'}.`,
        },
      ],
    });

    const narrative = response.output_text?.trim();
    if (!narrative) {
      return buildFallbackTrendNarrative(trend);
    }

    return narrative;
  } catch (error) {
    console.error('Failed to generate trend narrative via OpenAI:', error);
    return buildFallbackTrendNarrative(trend);
  }
}

function buildBriefHtml(params: BriefMetrics & { trend: WeeklyTrendMetrics; trendNarrative: string }): string {
  const {
    totalUsers,
    adminCount,
    editorCount,
    userCount,
    videosCount,
    articlesCount,
    activeQuestionsCount,
    activeTestSessionsCount,
    trend,
    trendNarrative,
  } = params;

  return `
    <div style="margin: 0; padding: 24px 12px; background-color: #f3f4f6; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; color: #111827;">
      <div style="max-width: 680px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden;">
        <div style="padding: 24px; background: linear-gradient(135deg, #111827 0%, #1f2937 45%, #2563eb 100%); color: #f9fafb;">
          <p style="margin: 0 0 8px; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; opacity: 0.85;">Castleridge Labs</p>
          <h2 style="margin: 0; font-size: 28px; line-height: 1.2;">Daily Website Brief</h2>
        </div>

        <div style="padding: 22px;">
          <h3 style="margin: 0 0 10px; font-size: 16px; color: #111827;">Weekly Growth Pulse</h3>
          <div style="padding: 12px 14px; border-radius: 10px; background: #f0fdf4; border: 1px solid #bbf7d0; color: #14532d; font-size: 13px; margin-bottom: 8px;">
            Last 7 days: <strong>${trend.thisWeekUsers}</strong> new users · Prior 7 days: <strong>${trend.lastWeekUsers}</strong> · Delta: <strong>${trend.deltaUsers}</strong> (${trend.deltaPercent === null ? 'n/a' : `${trend.deltaPercent}%`})
          </div>
          <p style="margin: 0 0 18px; font-size: 14px; line-height: 1.6; color: #1f2937;">${trendNarrative}</p>

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

function buildBriefText(params: BriefMetrics & { trend: WeeklyTrendMetrics; trendNarrative: string }): string {
  return [
    'Daily Website Brief',
    '',
    'Weekly Growth Pulse',
    `- Last 7 days new users: ${params.trend.thisWeekUsers}`,
    `- Prior 7 days new users: ${params.trend.lastWeekUsers}`,
    `- Delta users: ${params.trend.deltaUsers}`,
    `- Delta %: ${params.trend.deltaPercent === null ? 'n/a' : `${params.trend.deltaPercent}%`}`,
    '',
    params.trendNarrative,
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
      roleRowsResult,
      videosCountResult,
      articlesCountResult,
      activeQuestionsCountResult,
      activeTestSessionsCountResult,
    ] = await Promise.all([
      adminClient.from('Users').select('*', { count: 'exact', head: true }),
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
      totalUsers: totalUsersResult.count ?? 0,
      adminCount: roles.filter((row) => row.role === 'ADMIN').length,
      editorCount: roles.filter((row) => row.role === 'EDITOR').length,
      userCount: roles.filter((row) => row.role === 'USER').length,
      videosCount: videosCountResult.count ?? 0,
      articlesCount: articlesCountResult.count ?? 0,
      activeQuestionsCount: activeQuestionsCountResult.count ?? 0,
      activeTestSessionsCount: activeTestSessionsCountResult.count ?? 0,
    };

    const trend = await getWeeklyTrendMetrics();
    const trendNarrative = await generateTrendNarrative(trend);

    const subject = buildSubjectLine();

    const html = buildBriefHtml({ ...metrics, trend, trendNarrative });
    const text = buildBriefText({ ...metrics, trend, trendNarrative });

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
      trend,
      trendNarrative,
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
