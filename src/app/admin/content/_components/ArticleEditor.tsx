'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  const [justSaved, setJustSaved] = useState(false);
  const effectiveRole = (session?.user?.role as UserRole) || UserRole.USER;
  const canDelete = hasRole(effectiveRole, UserRole.ADMIN);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const shortcutHint = useMemo(() => {
    return /Mac|iPhone|iPad/.test(navigator.platform) ? 'Cmd+S' : 'Ctrl+S';
  }, []);

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
      setJustSaved(true);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => setJustSaved(false), 2000);
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

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  if (!article) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-16">
        <div className="mx-auto max-w-6xl px-6 animate-pulse">
          <div className="mb-4 h-3 w-32 rounded-full bg-surface-dense" />
          <div className="mb-8 h-10 w-80 rounded-lg bg-surface-dense" />
          <div className="mb-8 h-44 rounded-xl bg-surface-interactive/50" />
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="h-[520px] rounded-xl bg-surface-interactive/50" />
            <div className="h-[520px] rounded-xl bg-surface-interactive/50" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle pb-4">
          <div className="flex flex-wrap items-center gap-4">
            <p className="text-[11px] uppercase tracking-[0.35em] text-text-muted">Editor</p>
            {hasUnsavedChanges && (
              <div className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface-dense/60 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-amber/80" aria-hidden="true" />
                Unsaved
                <kbd className="ml-1 rounded border border-border-subtle bg-surface-dense px-1.5 py-0.5 text-[10px] font-mono text-text-muted">
                  {shortcutHint}
                </kbd>
              </div>
            )}
            {!hasUnsavedChanges && justSaved && (
              <div className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface-dense/60 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-green/80" aria-hidden="true" />
                Saved
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            {article.is_published && livePillarSlug && (
              <Link
                href={`/learn/${livePillarSlug}/${article.slug}`}
                className="text-sm text-text-secondary transition-colors hover:text-text-primary"
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

        <ArticleForm article={article} pillars={pillars} onChange={setArticle} />
      </div>

      <div className="mx-auto mt-8 w-full px-6 lg:px-10 2xl:px-14">
        <MarkdownEditor
          value={article.body}
          onChange={(value: string) => setArticle({ ...article, body: value })}
        />
      </div>

      <div className="mx-auto mt-8 max-w-6xl px-6">
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
