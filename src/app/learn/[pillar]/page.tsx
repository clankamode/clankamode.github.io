import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { getLearningPillarBySlug, getLearningPillarTree } from '@/lib/content';
import { UserRole, hasRole } from '@/types/roles';
import MobileSidebarToggle from '../_components/MobileSidebarToggle';
import PillarSidebar from '../_components/PillarSidebar';
import TopicAccordion from '../_components/TopicAccordion';

export const dynamic = 'force-dynamic';

interface PillarPageProps {
  params: Promise<{ pillar: string }>;
}

export default async function PillarPage({ params }: PillarPageProps) {
  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role as UserRole | undefined;
  const canViewDrafts = userRole ? hasRole(userRole, UserRole.EDITOR) : false;

  const { pillar: pillarSlug } = await params;
  const pillar = await getLearningPillarBySlug(pillarSlug.toLowerCase());
  if (!pillar) {
    notFound();
  }

  const topics = await getLearningPillarTree(pillar.id, canViewDrafts);

  return (
    <div className="min-h-screen bg-background pt-20 pb-24">
      <section className="mx-auto w-full max-w-[1680px] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-[240px_minmax(0,1fr)_240px]">
          <aside className="hidden lg:block">
            <div className="sticky top-28">
              <PillarSidebar
                pillarSlug={pillar.slug}
                pillarName={pillar.name}
                topics={topics}
              />
            </div>
          </aside>

          <div className="min-w-0">
            <div className="mb-6 flex items-center justify-between">
              <div className="text-xs uppercase tracking-[0.3em] text-text-muted">Pillar</div>
              <MobileSidebarToggle title={pillar.name}>
                <PillarSidebar
                  pillarSlug={pillar.slug}
                  pillarName={pillar.name}
                  topics={topics}
                />
              </MobileSidebarToggle>
            </div>

            <div className="mb-12 max-w-3xl">
              <h1 className="mt-2 text-4xl md:text-5xl font-bold tracking-tight text-text-primary">
                {pillar.name}
              </h1>
              <p className="mt-4 text-lg text-text-secondary leading-relaxed">
                {pillar.description || 'A deliberate path with topics that build on each other.'}
              </p>
            </div>

            <div className="space-y-6">
              {topics.map((topic, index) => (
                <TopicAccordion
                  key={topic.id}
                  pillarSlug={pillar.slug}
                  topic={topic}
                  defaultOpen={index === 0}
                />
              ))}
            </div>
          </div>

          <aside className="hidden lg:block" aria-hidden="true" />
        </div>
      </section>
    </div>
  );
}
