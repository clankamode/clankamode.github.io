'use client';

import { Button } from '@/components/ui/Button';

interface PublishControlsProps {
  saving: boolean;
  isPublished: boolean;
  onSave: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onDelete: () => void;
  canDelete?: boolean;
}

export default function PublishControls({
  saving,
  isPublished,
  onSave,
  onPublish,
  onUnpublish,
  onDelete,
  canDelete = false,
}: PublishControlsProps) {
  return (
    <div className="mt-8 flex flex-wrap items-center gap-3 sm:justify-end">
      <Button
        onClick={onSave}
        disabled={saving}
        variant="ghost"
        className="border border-border-subtle bg-surface-dense/60 text-text-secondary hover:text-text-primary"
      >
        {saving ? 'Saving...' : 'Save Draft'}
      </Button>
      {isPublished ? (
        <Button
          onClick={onUnpublish}
          disabled={saving}
          className="border border-border-subtle bg-surface-dense/70 text-text-primary hover:bg-surface-dense"
        >
          Unpublish
        </Button>
      ) : (
        <Button onClick={onPublish} disabled={saving} className="bg-brand-green text-black">
          Publish
        </Button>
      )}
      {canDelete && (
        <Button
          onClick={onDelete}
          disabled={saving}
          variant="ghost"
          className="text-red-300 hover:bg-red-500/10 hover:text-red-200"
        >
          Delete
        </Button>
      )}
    </div>
  );
}
