'use client';

import { Button } from '@/components/ui/Button';

interface PublishControlsProps {
  saving: boolean;
  isPublished: boolean;
  hasChanges: boolean;
  onSave: () => void;
  onPublish: () => void;
  onUnpublish?: () => void;
  onDelete: () => void;
  canDelete?: boolean;
  className?: string;
}

export default function PublishControls({
  saving,
  isPublished,
  hasChanges,
  onSave,
  onPublish,
  onUnpublish,
  onDelete,
  canDelete = false,
  className = '',
}: PublishControlsProps) {
  if (isPublished) {
    // Published state: Update | Unpublish | Delete
    return (
      <div className={`inline-flex items-center rounded-lg border border-border-subtle bg-surface-workbench overflow-hidden shadow-sm ${className}`}>
        <Button
          onClick={onPublish}
          disabled={saving || !hasChanges}
          variant="primary"
          className="h-9 min-h-0 py-0 rounded-l-lg rounded-r-none border-0 text-xs px-4"
        >
          {saving ? 'Updating...' : 'Update'}
        </Button>
        {onUnpublish && (
          <Button
            onClick={onUnpublish}
            disabled={saving}
            variant="ghost"
            className="h-9 min-h-0 py-0 rounded-none border-0 bg-transparent text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 text-xs px-3"
          >
            Unpublish
          </Button>
        )}
        {canDelete && (
          <Button
            onClick={onDelete}
            disabled={saving}
            variant="ghost"
            className="h-9 min-h-0 py-0 rounded-r-lg rounded-l-none border-0 bg-transparent text-red-300 hover:text-red-200 hover:bg-red-500/10 text-xs px-3"
          >
            Delete
          </Button>
        )}
      </div>
    );
  }

  // Draft state: Publish | Save | Delete
  return (
    <div className={`inline-flex items-center rounded-lg border border-border-subtle bg-surface-workbench overflow-hidden shadow-sm ${className}`}>
      <Button
        onClick={onPublish}
        disabled={saving}
        variant="primary"
        className="h-9 min-h-0 py-0 rounded-l-lg rounded-r-none border-0 text-xs px-4"
      >
        Publish
      </Button>
      <Button
        onClick={onSave}
        disabled={saving || !hasChanges}
        variant="ghost"
        className="h-9 min-h-0 py-0 rounded-none border-0 bg-transparent text-text-primary hover:bg-surface-dense/50 hover:text-text-primary text-xs px-3"
      >
        {saving ? 'Saving...' : 'Save'}
      </Button>
      {canDelete && (
        <Button
          onClick={onDelete}
          disabled={saving}
          variant="ghost"
          className="h-9 min-h-0 py-0 rounded-r-lg rounded-l-none border-0 bg-transparent text-red-300 hover:text-red-200 hover:bg-red-500/10 text-xs px-3"
        >
          Delete
        </Button>
      )}
    </div>
  );
}
