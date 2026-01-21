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
    <div className="mt-8 flex flex-wrap items-center gap-3">
      <Button onClick={onSave} disabled={saving} variant="ghost">
        {saving ? 'Saving...' : 'Save Draft'}
      </Button>
      {isPublished ? (
        <Button onClick={onUnpublish} disabled={saving} className="bg-white/10 text-text-primary">
          Unpublish
        </Button>
      ) : (
        <Button onClick={onPublish} disabled={saving} className="bg-brand-green text-black">
          Publish
        </Button>
      )}
      {canDelete && (
        <Button onClick={onDelete} disabled={saving} variant="ghost">
          Delete
        </Button>
      )}
    </div>
  );
}
