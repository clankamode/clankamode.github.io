import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import PillarCard from './_components/PillarCard';
import { getLearningLibrary } from '@/lib/content';
import { UserRole, hasRole } from '@/types/roles';

export const dynamic = 'force-dynamic';

export default async function LearnPage() {
  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role as UserRole | undefined;
  const canViewDrafts = userRole ? hasRole(userRole, UserRole.EDITOR) : false;

  const library = await getLearningLibrary(canViewDrafts);

  const pillarCards = library.map((pillar) => ({
    pillar,
    articleCount: pillar.topics.reduce((sum, topic) => sum + topic.articles.length, 0),
  }));

  return (
    <div className="min-h-screen bg-background pt-24 pb-24">
      <section className="mx-auto max-w-6xl px-6">
        <div className="mb-14 max-w-3xl">
          <p className="text-xs uppercase tracking-[0.3em] text-text-muted">The Library</p>
          <h1 className="mt-4 text-5xl md:text-6xl font-bold tracking-tight text-text-primary">
            Structured paths for deliberate mastery.
          </h1>
          <p className="mt-6 text-lg text-text-secondary leading-relaxed">
            Four pillars. Clear progression. Everything you need to build the skills that compound.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {pillarCards.map(({ pillar, articleCount }) => (
            <PillarCard key={pillar.id} pillar={pillar} articleCount={articleCount} />
          ))}
        </div>
      </section>
    </div>
  );
}
