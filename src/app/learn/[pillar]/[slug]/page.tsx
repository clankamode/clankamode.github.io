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
import ArticleRenderer from '../../_components/ArticleRenderer';
import ArticleNav from '../../_components/ArticleNav';
import Breadcrumbs from '../../_components/Breadcrumbs';
import MobileSidebarToggle from '../../_components/MobileSidebarToggle';
import PillarSidebar from '../../_components/PillarSidebar';
import TableOfContents from '../../_components/TableOfContents';
import PremiumGate from '../../_components/PremiumGate';
import ReadingProgress from '../../_components/ReadingProgress';
import { extractHeadings } from '../../_components/markdown';

interface ArticlePageProps {
  params: Promise<{ pillar: string; slug: string }>;
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

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { pillar: pillarSlug, slug: articleSlug } = await params;
  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role as UserRole | undefined;
  const canViewDrafts = !!userRole && hasRole(userRole, UserRole.EDITOR);
  const canEdit = canViewDrafts;

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

  return (
    <div className="min-h-screen bg-background pt-20 pb-24">
      <ReadingProgress />
      <section className="mx-auto w-full max-w-[1680px] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-[240px_minmax(0,1fr)_240px]">
          <aside className="hidden lg:block">
            <div className="sticky top-28">
              <PillarSidebar
                pillarSlug={pillar.slug}
                pillarName={pillar.name}
                topics={topics}
                currentArticleSlug={article.slug}
              />
            </div>
          </aside>

          <div className="min-w-0">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <Breadcrumbs
                items={[
                  { label: 'Library', href: '/learn' },
                  { label: pillar.name, href: `/learn/${pillar.slug}` },
                  { label: topicMatch?.name || 'Topic' },
                  { label: article.title },
                ]}
              />
              <MobileSidebarToggle title={pillar.name}>
                <PillarSidebar
                  pillarSlug={pillar.slug}
                  pillarName={pillar.name}
                  topics={topics}
                  currentArticleSlug={article.slug}
                />
              </MobileSidebarToggle>
            </div>

            <div className="mb-10 border-b border-border-subtle pb-8">
              <p className="text-xs uppercase tracking-[0.3em] text-text-muted">
                {pillar.name}
              </p>
              <h1 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight text-text-primary">
                {article.title}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-text-muted font-mono">
                <span>{formatDate(article.updated_at)}</span>
                <span className="text-text-muted/60">•</span>
                <span>{article.reading_time_minutes || 5} min read</span>
                {article.is_premium && (
                  <>
                    <span className="text-text-muted/60">•</span>
                    <span className="rounded-full bg-surface-dense px-3 py-1 text-[10px] font-semibold text-text-primary">
                      Premium
                    </span>
                  </>
                )}
                {canEdit && (
                  <>
                    <span className="text-text-muted/60">•</span>
                    <Link
                      href={`/admin/content/${article.id}`}
                      className="text-brand-green hover:text-brand-emerald transition-colors"
                    >
                      Edit article
                    </Link>
                  </>
                )}
              </div>
              {/* Excerpt intentionally hidden here - shown only in card views to avoid duplication with article intro */}
            </div>

            <div>
              <ArticleRenderer content={contentToRender} />
              {!canViewPremium && <PremiumGate />}
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
            </div>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-28">
              <TableOfContents items={tocItems} />
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
