'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { UserRole, hasRole } from '@/types/roles';
import ArticleForm from './ArticleForm';
import MarkdownEditor from './MarkdownEditor';
import PublishControls from './PublishControls';

interface ArticleData {
  id: string;
  topic_id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  is_premium: boolean;
  is_published: boolean;
}

interface PillarTopic {
  id: string;
  slug: string;
  name: string;
  topics: { id: string; name: string }[];
}

interface ArticleEditorProps {
  articleId: string;
}

export default function ArticleEditor({ articleId }: ArticleEditorProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [savedArticle, setSavedArticle] = useState<ArticleData | null>(null);
  const [pillars, setPillars] = useState<PillarTopic[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const effectiveRole = (session?.user?.role as UserRole) || UserRole.USER;
  const canDelete = hasRole(effectiveRole, UserRole.ADMIN);

  const hasUnsavedChanges = useMemo(() => {
    if (!article || !savedArticle) {
      return false;
    }
    return JSON.stringify(article) !== JSON.stringify(savedArticle);
  }, [article, savedArticle]);

  const livePillarSlug = useMemo(() => {
    if (!article) {
      return null;
    }
    return (
      pillars.find((pillar) => pillar.topics.some((topic) => topic.id === article.topic_id))
        ?.slug
    );
  }, [article, pillars]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [articleRes, pillarsRes] = await Promise.all([
          fetch(`/api/content/${articleId}?includeDrafts=true`),
          fetch('/api/content/pillars'),
        ]);

        if (!articleRes.ok) {
          throw new Error('Failed to load article');
        }
        if (!pillarsRes.ok) {
          throw new Error('Failed to load topics');
        }

        const articleData = await articleRes.json();
        const pillarsData = await pillarsRes.json();
        setArticle(articleData);
        setSavedArticle(articleData);
        setPillars(pillarsData || []);
      } catch (fetchError) {
        console.error(fetchError);
        setError('Unable to load article.');
      }
    };

    fetchData();
  }, [articleId]);

  const handleSave = useCallback(async (publishOverride?: boolean) => {
    if (!article) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/content/${articleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...article,
          is_published: publishOverride ?? article.is_published,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save article');
      }

      const updated = await response.json();
      setArticle(updated);
      setSavedArticle(updated);
    } catch (saveError) {
      console.error(saveError);
      setError('Failed to save article.');
    } finally {
      setSaving(false);
    }
  }, [article, articleId]);

  const handleDelete = async () => {
    if (!confirm('Delete this article?')) {
      return;
    }
    try {
      const response = await fetch(`/api/content/${articleId}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Failed to delete article');
      }
      router.push('/admin/content');
    } catch (deleteError) {
      console.error(deleteError);
      setError('Failed to delete article.');
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 's') {
        event.preventDefault();
        if (!saving && article) {
          handleSave();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [saving, handleSave, article]);

  if (!article) {
    return (
      <div className="min-h-screen bg-background pt-24 px-6 text-text-muted">Loading...</div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Editor</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-text-primary">
              {article.title || 'Untitled'}
            </h1>
            {hasUnsavedChanges && (
              <p className="mt-2 text-xs uppercase tracking-[0.2em] text-text-muted">
                Unsaved changes
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            {article.is_published && livePillarSlug && (
              <Link
                href={`/learn/${livePillarSlug}/${article.slug}`}
                className="text-sm text-text-secondary hover:text-text-primary"
                target="_blank"
                rel="noreferrer"
              >
                View live →
              </Link>
            )}
            <Button variant="ghost" onClick={() => router.push('/admin/content')}>
              Back to library
            </Button>
          </div>
        </div>

        <ArticleForm
          article={article}
          pillars={pillars}
          onChange={setArticle}
        />

        <div className="mt-8">
          <MarkdownEditor
            value={article.body}
            onChange={(value: string) => setArticle({ ...article, body: value })}
          />
        </div>

        <PublishControls
          saving={saving}
          isPublished={article.is_published}
          onSave={() => handleSave()}
          onPublish={() => handleSave(true)}
          onUnpublish={() => handleSave(false)}
          onDelete={handleDelete}
          canDelete={canDelete}
        />

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      </div>
    </div>
  );
}
