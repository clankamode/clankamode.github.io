'use client';

import { Button } from '@/components/ui/Button';

interface PublishControlsProps {
  saving: boolean;
  isPublished: boolean;
  onSaveDraft?: () => void;
  onPublishChanges?: () => void;
  onSave?: () => void;
  onPublish: () => void;
  onDelete: () => void;
  canDelete?: boolean;
  className?: string;
}

export default function PublishControls({
  saving,
  isPublished,
  onSaveDraft,
  onPublishChanges,
  onSave,
  onPublish,
  onDelete,
  canDelete = false,
  className = '',
}: PublishControlsProps) {
  if (isPublished && onSaveDraft && onPublishChanges) {
    return (
      <div className={`inline-flex items-center rounded-lg border border-border-subtle bg-surface-workbench overflow-hidden shadow-sm ${className}`}>
        <Button
          onClick={onPublishChanges}
          disabled={saving}
          variant="primary"
          className="h-9 min-h-0 py-0 rounded-l-lg rounded-r-none border-0 text-xs px-4"
        >
          {saving ? 'Publishing...' : 'Publish Changes'}
        </Button>
        <Button
          onClick={onSaveDraft}
          disabled={saving}
          variant="ghost"
          className="h-9 min-h-0 py-0 rounded-none border-0 bg-transparent text-text-primary hover:bg-surface-dense/50 hover:text-text-primary text-xs px-3"
        >
          {saving ? 'Saving...' : 'Save Draft'}
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
        onClick={onSave || onSaveDraft}
        disabled={saving}
        variant="ghost"
        className="h-9 min-h-0 py-0 rounded-none border-0 bg-transparent text-text-primary hover:bg-surface-dense/50 hover:text-text-primary text-xs px-3"
      >
        {saving ? 'Saving...' : 'Save Draft'}
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
