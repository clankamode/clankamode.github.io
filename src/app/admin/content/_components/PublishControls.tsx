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
}: PublishControlsProps) {
  if (isPublished && onSaveDraft && onPublishChanges) {
    return (
      <div className="mt-8 inline-flex items-center rounded-lg border border-border-subtle bg-surface-workbench overflow-hidden shadow-sm">
        <Button
          onClick={onPublishChanges}
          disabled={saving}
          variant="primary"
          className="h-11 min-h-0 py-0 rounded-l-lg rounded-r-none border-0"
        >
          {saving ? 'Publishing...' : 'Publish Changes'}
        </Button>
        <Button
          onClick={onSaveDraft}
          disabled={saving}
          variant="ghost"
          className="h-11 min-h-0 py-0 rounded-none border-0 bg-transparent text-text-primary hover:bg-surface-dense/50 hover:text-text-primary"
        >
          {saving ? 'Saving...' : 'Save Draft'}
        </Button>
        {canDelete && (
          <Button
            onClick={onDelete}
            disabled={saving}
            variant="ghost"
            className="h-11 min-h-0 py-0 rounded-r-lg rounded-l-none border-0 bg-transparent text-red-300 hover:text-red-200 hover:bg-red-500/10"
          >
            Delete
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="mt-8 inline-flex items-center rounded-lg border border-border-subtle bg-surface-workbench overflow-hidden shadow-sm">
      <Button
        onClick={onPublish}
        disabled={saving}
        variant="primary"
        className="h-11 min-h-0 py-0 rounded-l-lg rounded-r-none border-0"
      >
        Publish
      </Button>
      <Button
        onClick={onSave || onSaveDraft}
        disabled={saving}
        variant="ghost"
        className="h-11 min-h-0 py-0 rounded-none border-0 bg-transparent text-text-primary hover:bg-surface-dense/50 hover:text-text-primary"
      >
        {saving ? 'Saving...' : 'Save Draft'}
      </Button>
      {canDelete && (
        <Button
          onClick={onDelete}
          disabled={saving}
          variant="ghost"
          className="h-11 min-h-0 py-0 rounded-r-lg rounded-l-none border-0 bg-transparent text-red-300 hover:text-red-200 hover:bg-red-500/10"
        >
          Delete
        </Button>
      )}
    </div>
  );
}
