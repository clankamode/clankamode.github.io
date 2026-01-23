'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { UserRole, hasRole } from '@/types/roles';
import ContentTable from './ContentTable';

interface PillarResponse {
  id: string;
  name: string;
  topics: { id: string; name: string }[];
}

interface ArticleRow {
  id: string;
  title: string;
  slug: string;
  is_published: boolean;
  is_premium: boolean;
  updated_at: string;
  topic_id: string;
}

export default function ContentDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [pillars, setPillars] = useState<PillarResponse[]>([]);
  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTopicId, setNewTopicId] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdArticleId, setCreatedArticleId] = useState<string | null>(null);
  const effectiveRole = (session?.user?.role as UserRole) || UserRole.USER;
  const canDelete = hasRole(effectiveRole, UserRole.ADMIN);

  const topicOptions = useMemo(
    () =>
      pillars.flatMap((pillar) =>
        pillar.topics.map((topic) => ({
          id: topic.id,
          label: `${pillar.name} / ${topic.name}`,
        }))
      ),
    [pillars]
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pillarsRes, articlesRes] = await Promise.all([
          fetch('/api/content/pillars'),
          fetch('/api/content?includeDrafts=true'),
        ]);

        if (!pillarsRes.ok) {
          throw new Error('Failed to load pillars');
        }
        if (!articlesRes.ok) {
          throw new Error('Failed to load articles');
        }

        const pillarsData = await pillarsRes.json();
        const articlesData = await articlesRes.json();
        setPillars(pillarsData || []);
        setArticles(articlesData || []);
      } catch (fetchError) {
        console.error(fetchError);
        setError('Unable to load content.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!newSlug && newTitle) {
      const slug = newTitle
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      setNewSlug(slug);
    }
  }, [newTitle, newSlug]);

  const handleCreate = async () => {
    if (!newTopicId || !newTitle || !newSlug) {
      setError('Title, slug, and topic are required.');
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const response = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic_id: newTopicId,
          title: newTitle,
          slug: newSlug,
          body: `# ${newTitle}\n\nStart writing here.`,
          is_published: false,
          is_premium: false,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create article');
      }

      const article = await response.json();
      setNewTitle('');
      setNewSlug('');
      setNewTopicId('');
      setCreatedArticleId(article.id);
      setShowSuccess(true);
    } catch (createError) {
      console.error(createError);
      setError('Failed to create article.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      const response = await fetch(`/api/content/${deleteConfirmId}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Failed to delete article');
      }
      setArticles((prev) => prev.filter((item) => item.id !== deleteConfirmId));
      setDeleteConfirmId(null);
    } catch (deleteError) {
      console.error(deleteError);
      setError('Failed to delete article.');
      setDeleteConfirmId(null);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-background pt-24 px-6">
        <p className="text-text-secondary">Sign in to manage content.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Admin</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-text-primary">Content Library</h1>
          <p className="mt-3 text-text-secondary">
            Create, publish, and organize learning content.
          </p>
        </div>

        <div className="mb-6 border-b border-border-workbench pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              className="flex-1 bg-transparent text-lg font-medium text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-0"
              placeholder="Start typing to create a new article..."
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && newTitle && newTopicId && !creating) {
                  handleCreate();
                }
              }}
            />
            {newTitle && (
              <div className="flex items-center gap-3 transition-opacity duration-200">
                <select
                  className="rounded-lg border border-border-subtle bg-surface-workbench px-3 py-2 text-sm text-text-primary transition-colors focus-visible:border-border-interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={newTopicId}
                  onChange={(event) => setNewTopicId(event.target.value)}
                >
                  <option value="">Select topic</option>
                  {topicOptions.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.label}
                    </option>
                  ))}
                </select>
                <Button
                  onClick={handleCreate}
                  disabled={creating || !newTopicId || !newTitle || !newSlug}
                  variant="primary"
                  className="!text-black"
                  size="md"
                >
                  {creating ? 'Creating...' : 'Create'}
                </Button>
              </div>
            )}
          </div>
          {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        </div>

        {loading ? (
          <p className="text-text-muted">Loading content...</p>
        ) : (
          <ContentTable articles={articles} onDelete={handleDelete} canDelete={canDelete} />
        )}
      </div>

      <ConfirmDialog
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={confirmDelete}
        title="Delete article?"
        message="This cannot be undone."
        confirmLabel="Delete"
        confirmVariant="danger"
      />

      {showSuccess && createdArticleId && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-surface-workbench border border-border-subtle shadow-xl p-4 max-w-sm">
          <p className="text-text-primary font-medium mb-3">Article created</p>
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              className="!text-black"
              onClick={() => {
                router.push(`/admin/content/${createdArticleId}`);
                setShowSuccess(false);
                setCreatedArticleId(null);
              }}
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowSuccess(false);
                setCreatedArticleId(null);
              }}
            >
              Create another
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
