import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import {
  flattenArticles,
  getAdjacentArticles,
  getLearningPillarBySlug,
  getLearningPillarTree,
} from '@/lib/content';
import { UserRole, hasRole } from '@/types/roles';
import ArticleNav from '../../_components/ArticleNav';
import Breadcrumbs from '../../_components/Breadcrumbs';
import PillarSidebar from '../../_components/PillarSidebar';
import TableOfContents from '../../_components/TableOfContents';
import PremiumGate from '../../_components/PremiumGate';
import ReadingProgress from '../../_components/ReadingProgress';
import { extractHeadings } from '../../_components/markdown';
import CompletionButton from '../../_components/CompletionButton';
import BookmarkButton from '../../_components/BookmarkButton';
import { getArticleCompletionStatus, getBookmarkStatus } from '@/lib/progress';
import ArticleLayoutSwitcher from '../../_components/ArticleLayoutSwitcher';
import { isFeatureEnabled, FeatureFlags } from '@/lib/flags';
import ChunkedArticleRenderer from '@/components/session/ChunkedArticleRenderer';

interface ArticlePageProps {
  params: Promise<{ pillar: string; slug: string }>;
  searchParams: Promise<{ sessionChunk?: string | string[] }>;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getPreviewContent(content: string) {
  const parts = content.split('\n').filter(Boolean);
  return parts.slice(0, 6).join('\n');
}

export const dynamic = 'force-dynamic';

export default async function ArticlePage({ params, searchParams }: ArticlePageProps) {
  const { pillar: pillarSlug, slug: articleSlug } = await params;
  const resolvedSearchParams = await searchParams;
  const sessionChunkParam = Array.isArray(resolvedSearchParams?.sessionChunk)
    ? resolvedSearchParams.sessionChunk[0]
    : resolvedSearchParams?.sessionChunk;
  const parsedSessionChunk = Number.parseInt(sessionChunkParam || '', 10);
  const focusedChunkIndex = Number.isFinite(parsedSessionChunk) && parsedSessionChunk >= 0
    ? parsedSessionChunk
    : null;
  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role as UserRole | undefined;
  const canViewDrafts = !!userRole && hasRole(userRole, UserRole.EDITOR);
  const canEdit = canViewDrafts;
  const userId = session?.user?.email;
  const showProgress = isFeatureEnabled(FeatureFlags.PROGRESS_TRACKING, session?.user);

  const pillar = await getLearningPillarBySlug(pillarSlug.toLowerCase());
  if (!pillar) {
    notFound();
  }

  const topics = await getLearningPillarTree(pillar.id, canViewDrafts);
  const topicMatch = topics.find((topic) =>
    topic.articles.some((article) => article.slug === articleSlug)
  );
  const article = topicMatch?.articles.find((item) => item.slug === articleSlug);

  if (!article) {
    notFound();
  }

  if (!article.is_published && !canViewDrafts) {
    notFound();
  }

  const canViewPremium = !article.is_premium || !!session;
  const contentToRender = canViewPremium ? article.body : getPreviewContent(article.body);
  const tocItems = extractHeadings(contentToRender);
  const flatArticles = flattenArticles(topics);
  const { prev, next } = getAdjacentArticles(flatArticles, article.slug);
  const [completionStatus, bookmarkStatus] = showProgress && userId
    ? await Promise.all([
      getArticleCompletionStatus(userId, article.id, session?.user?.id ?? undefined),
      getBookmarkStatus(userId, article.id, session?.user?.id ?? undefined),
    ])
    : [null, null];

  return (
    <div className="min-h-screen bg-background pt-20 pb-24">
      {!session && <ReadingProgress />}
      <ArticleLayoutSwitcher
        pillarName={pillar.name}
        pillarSidebar={
          <PillarSidebar
            pillarSlug={pillar.slug}
            pillarName={pillar.name}
            topics={topics}
            currentArticleSlug={article.slug}
          />
        }
        tableOfContents={
          <TableOfContents items={tocItems} />
        }
        breadcrumbs={
          <Breadcrumbs
            items={[
              { label: 'Library', href: '/learn' },
              { label: pillar.name, href: `/learn/${pillar.slug}` },
              { label: topicMatch?.name || 'Topic' },
              { label: article.title },
            ]}
          />
        }
        articleContent={
          <>
            <div className="mb-10 border-b border-border-interactive pb-8">
              <p className="text-xs uppercase tracking-[0.3em] text-text-secondary">
                {pillar.name}
              </p>
              <div className="mt-4 flex flex-wrap items-start gap-4">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-text-primary">
                  {article.title}
                </h1>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-4 font-mono text-sm text-text-secondary">
                <span>{formatDate(article.updated_at)}</span>
                <span className="text-text-secondary/75">•</span>
                <span>{article.reading_time_minutes || 5} min read</span>
                {article.is_premium && (
                  <>
                    <span className="text-text-secondary/75">•</span>
                    <span className="rounded-full bg-surface-dense px-3 py-1 text-[10px] font-semibold text-text-primary">
                      Premium
                    </span>
                  </>
                )}
                {canEdit && (
                  <>
                    <span className="text-text-secondary/75">•</span>
                    <Link
                      href={`/admin/content/${article.id}`}
                      className="text-brand-green hover:text-brand-emerald transition-colors"
                    >
                      Edit article
                    </Link>
                  </>
                )}
                {showProgress && (
                  <>
                    <span className="text-text-secondary/75">•</span>
                    <BookmarkButton
                      articleId={article.id}
                      initialBookmarked={bookmarkStatus?.bookmarked}
                      size="sm"
                    />
                  </>
                )}
              </div>
            </div>

            <ChunkedArticleRenderer content={contentToRender} focusedChunkIndex={focusedChunkIndex} />
            {!canViewPremium && <PremiumGate />}
          </>
        }
        standardFooter={
          <>
            {showProgress && canViewPremium && (
              <div className="mt-8">
                <CompletionButton
                  articleId={article.id}
                  initialCompleted={completionStatus?.completed}
                />
              </div>
            )}
            <ArticleNav
              previous={
                prev
                  ? {
                    label: 'Previous',
                    title: prev.title,
                    href: `/learn/${pillar.slug}/${prev.slug}`,
                    topicName: prev.topicName,
                  }
                  : null
              }
              next={
                next
                  ? {
                    label: 'Next',
                    title: next.title,
                    href: `/learn/${pillar.slug}/${next.slug}`,
                    topicName: next.topicName,
                  }
                  : null
              }
            />
          </>
        }
      />
    </div>
  );
}
