import { chunkArticleByHeadings } from '@/lib/article-chunking';
import { deriveStateAwareIntent, deriveStaticIntent } from '@/lib/gate-intent';
import { estimateReadingTimeMinutes } from '@/lib/reading-time';
import { formatConceptLabel, resolvePrimaryConceptSlug } from '@/lib/progress/helpers';
import type { LearningPillarWithTopics } from '@/types/content';
import type { UserLearningState } from '@/types/micro';
import type { LearnCandidateCollection, SessionItem } from '@/lib/progress/types';

export function collectLearnCandidates(params: {
  pillars: LearningPillarWithTopics[];
  completedIds: Set<string>;
  allowCompleted: boolean;
  useGenerative: boolean;
  userState: UserLearningState | null;
  maxItems?: number;
  includeChunkItems?: boolean;
  maxChunkItems?: number;
  maxChunksPerArticle?: number;
}): LearnCandidateCollection {
  const {
    pillars,
    completedIds,
    allowCompleted,
    useGenerative,
    userState,
    maxItems = 8,
    includeChunkItems = false,
    maxChunkItems = 10,
    maxChunksPerArticle = 2,
  } = params;

  const fullItems: SessionItem[] = [];
  const chunkItems: SessionItem[] = [];

  for (const pillar of pillars) {
    for (const topic of pillar.topics) {
      for (const article of topic.articles) {
        if (completedIds.has(article.id) && !allowCompleted) {
          continue;
        }

        const primaryConceptSlug = resolvePrimaryConceptSlug(article);
        const intent = useGenerative && userState
          ? deriveStateAwareIntent({
            primaryConceptSlug,
            userState,
            articleSlug: article.slug,
            pillarSlug: pillar.slug,
          })
          : deriveStaticIntent(article.slug, pillar.slug);

        if (fullItems.length < maxItems) {
          fullItems.push({
            type: 'learn',
            title: article.title,
            subtitle: `${article.reading_time_minutes || 5} min read`,
            pillarSlug: pillar.slug,
            href: `/learn/${pillar.slug}/${article.slug}`,
            articleId: article.id,
            estMinutes: article.reading_time_minutes,
            intent,
            confidence: 0.9,
            primaryConceptSlug,
            targetConcept: formatConceptLabel(primaryConceptSlug) ?? article.title,
            sourceArticleTitle: article.title,
          });
        }

        if (includeChunkItems && chunkItems.length < maxChunkItems) {
          const chunks = chunkArticleByHeadings(article.body);
          const nonTrivial = chunks.filter((chunk) => chunk.content.trim().length >= 80);
          const selectedChunks = (nonTrivial.length > 0 ? nonTrivial : chunks).slice(0, maxChunksPerArticle);

          for (const chunk of selectedChunks) {
            if (chunkItems.length >= maxChunkItems) break;

            const chunkMinutes = estimateReadingTimeMinutes(chunk.content, {
              minMinutes: 2,
              maxMinutes: 15,
            });
            const sectionTitle = chunk.title?.trim() || `Section ${chunk.index + 1}`;
            chunkItems.push({
              type: 'learn',
              title: `${article.title} · ${sectionTitle}`,
              subtitle: `Section ${chunk.index + 1}/${chunks.length} · ${chunkMinutes} min read`,
              pillarSlug: pillar.slug,
              href: `/learn/${pillar.slug}/${article.slug}?sessionChunk=${chunk.index}`,
              articleId: article.id,
              slug: article.slug,
              estMinutes: chunkMinutes,
              intent: {
                ...intent,
                text: `${intent.text} Focus this section because targeted retrieval beats broad rereads in short sessions.`,
              },
              confidence: 0.88,
              primaryConceptSlug,
              targetConcept:
                sectionTitle.toLowerCase() === 'introduction'
                  ? (formatConceptLabel(primaryConceptSlug) ?? article.title)
                  : sectionTitle,
              sessionChunkIndex: chunk.index,
              sessionChunkCount: chunks.length,
              sessionChunkTitle: sectionTitle,
              sourceArticleTitle: article.title,
            });
          }
        }

        if (fullItems.length >= maxItems && (!includeChunkItems || chunkItems.length >= maxChunkItems)) {
          return { fullItems, chunkItems };
        }
      }
    }
  }

  return { fullItems, chunkItems };
}
