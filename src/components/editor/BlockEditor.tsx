'use client';

import { useEffect, useRef, useState } from 'react';
import type {
  EditorBlock,
  ImageBlock as ImageBlockType,
  CalloutBlock as CalloutBlockType,
  EmbedBlock as EmbedBlockType,
  CodeBlock as CodeBlockType,
  DiagramBlock as DiagramBlockType,
} from './types';
import { parseBlocks } from './utils/parseBlocks';
import { serializeBlocks } from './utils/serializeBlocks';
import { createBlockId, createEmptyMarkdownBlock } from './utils/blockUtils';
import { detectEmbedFromText } from './utils/pasteHandler';
import { generateAltText, uploadArticleMedia } from './utils/uploadMedia';
import { CalloutBlock } from './blocks/CalloutBlock';
import { CodeBlock } from './blocks/CodeBlock';
import { DiagramBlock } from './blocks/DiagramBlock';
import { EmbedBlock } from './blocks/EmbedBlock';
import { ImageBlock } from './blocks/ImageBlock';
import { MediaLibrary } from './media/MediaLibrary';
import { ImageAnnotator } from './media/ImageAnnotator';

interface BlockEditorProps {
  value: string;
  onChange: (value: string) => void;
  mediaLibraryTrigger?: number;
}

type BlockCommand = {
  id: string;
  label: string;
  type: EditorBlock['type'];
};

const COMMANDS: BlockCommand[] = [
  { id: 'markdown', label: 'Text', type: 'markdown' },
  { id: 'image', label: 'Image', type: 'image' },
  { id: 'callout', label: 'Callout', type: 'callout' },
  { id: 'embed', label: 'Embed', type: 'embed' },
  { id: 'code', label: 'Code', type: 'code' },
  { id: 'diagram', label: 'Diagram', type: 'diagram' },
  { id: 'divider', label: 'Divider', type: 'divider' },
];

const RECENT_MEDIA_KEY = 'learning-media-recent';

export function BlockEditor({ value, onChange, mediaLibraryTrigger }: BlockEditorProps) {
  const [blocks, setBlocks] = useState<EditorBlock[]>(() => parseBlocks(value));
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [menuAnchorId, setMenuAnchorId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [annotationTarget, setAnnotationTarget] = useState<ImageBlockType | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isInternalChange = useRef(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    setBlocks(parseBlocks(value));
  }, [value]);

  useEffect(() => {
    if (mediaLibraryTrigger) {
      setLibraryOpen(true);
    }
  }, [mediaLibraryTrigger]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (menuRef.current && target && !menuRef.current.contains(target)) {
        setMenuOpen(false);
        setMenuAnchorId(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        setMenuAnchorId(null);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  const syncBlocks = (updater: (prev: EditorBlock[]) => EditorBlock[]) => {
    setBlocks((prev) => {
      const next = updater(prev);
      isInternalChange.current = true;
      onChange(serializeBlocks(next));
      return next;
    });
  };

  const storeRecentMedia = (url: string, name?: string) => {
    try {
      const existing = JSON.parse(localStorage.getItem(RECENT_MEDIA_KEY) || '[]') as {
        url: string;
        name?: string;
      }[];
      const next = [{ url, name }, ...existing.filter((item) => item.url !== url)].slice(0, 24);
      localStorage.setItem(RECENT_MEDIA_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event('media:recent-updated'));
    } catch (error) {
      console.error('Unable to store recent media', error);
    }
  };

  const insertBlockAfter = (anchorId: string | null, block: EditorBlock) => {
    syncBlocks((prev) => {
      if (!anchorId) {
        return [...prev, block];
      }
      const index = prev.findIndex((item) => item.id === anchorId);
      if (index === -1) {
        return [...prev, block];
      }
      const next = [...prev];
      next.splice(index + 1, 0, block);
      return next;
    });
  };

  const replaceBlock = (blockId: string, block: EditorBlock) => {
    syncBlocks((prev) => prev.map((item) => (item.id === blockId ? block : item)));
  };

  const createBlockForCommand = (type: EditorBlock['type']): EditorBlock => {
    switch (type) {
      case 'image':
        return {
          id: createBlockId('image'),
          type: 'image',
          src: '',
          alt: '',
          caption: '',
          size: 'full',
        };
      case 'callout':
        return {
          id: createBlockId('callout'),
          type: 'callout',
          tone: 'tip',
          content: '',
        };
      case 'embed':
        return {
          id: createBlockId('embed'),
          type: 'embed',
          provider: 'youtube',
          url: '',
        };
      case 'code':
        return {
          id: createBlockId('code'),
          type: 'code',
          language: 'text',
          content: '',
        };
      case 'diagram':
        return {
          id: createBlockId('diagram'),
          type: 'diagram',
          language: 'mermaid',
          content: 'flowchart TD\n  A[Start] --> B[Next]',
        };
      case 'divider':
        return {
          id: createBlockId('divider'),
          type: 'divider',
        };
      case 'markdown':
      default:
        return createEmptyMarkdownBlock();
    }
  };

  const openCommandMenu = (blockId: string) => {
    setMenuAnchorId(blockId);
    setMenuOpen(true);
    setActiveBlockId(blockId);
  };

  const handleCommandSelect = (command: BlockCommand) => {
    setMenuOpen(false);
    if (!menuAnchorId) {
      return;
    }
    if (command.type === 'image') {
      fileInputRef.current?.click();
      return;
    }
    const newBlock = createBlockForCommand(command.type);
    const anchor = blocks.find((item) => item.id === menuAnchorId);
    const isEmptyOrSlash = anchor?.type === 'markdown' && (!anchor.content.trim() || anchor.content.trim() === '/');
    if (isEmptyOrSlash) {
      replaceBlock(menuAnchorId, newBlock);
      insertBlockAfter(newBlock.id, createEmptyMarkdownBlock());
    } else {
      insertBlockAfter(menuAnchorId, newBlock);
    }
  };

  const insertBlockFromToolbar = (type: EditorBlock['type']) => {
    const anchorId = activeBlockId ?? blocks[blocks.length - 1]?.id ?? null;
    if (type === 'image') {
      setActiveBlockId(anchorId);
      fileInputRef.current?.click();
      return;
    }
    const newBlock = createBlockForCommand(type);
    if (!anchorId) {
      insertBlockAfter(null, newBlock);
      return;
    }
    const anchor = blocks.find((item) => item.id === anchorId);
    if (anchor?.type === 'markdown' && !anchor.content.trim()) {
      replaceBlock(anchorId, newBlock);
      insertBlockAfter(newBlock.id, createEmptyMarkdownBlock());
    } else {
      insertBlockAfter(anchorId, newBlock);
    }
  };

  const handleMarkdownChange = (blockId: string, nextValue: string) => {
    const endsWithSlash = nextValue.endsWith('/');
    
    if (menuOpen && menuAnchorId === blockId) {
      const textBeforeSlash = nextValue.slice(0, -1);
      const isStillSlashAtLineStart = endsWithSlash && (
        textBeforeSlash.trim() === '' ||
        textBeforeSlash === '' ||
        /[\n\r]\s*$/.test(textBeforeSlash)
      );
      
      if (!isStillSlashAtLineStart) {
        setMenuOpen(false);
        setMenuAnchorId(null);
      }
    }
    
    if (endsWithSlash) {
      const textBeforeSlash = nextValue.slice(0, -1);
      const isAtLineStart = 
        textBeforeSlash.trim() === '' ||
        textBeforeSlash === '' ||
        /[\n\r]\s*$/.test(textBeforeSlash);
      
      if (isAtLineStart) {
        openCommandMenu(blockId);
        syncBlocks((prev) =>
          prev.map((block) =>
            block.id === blockId && block.type === 'markdown'
              ? { ...block, content: nextValue }
              : block
          )
        );
        return;
      }
    }
    
    syncBlocks((prev) =>
      prev.map((block) =>
        block.id === blockId && block.type === 'markdown'
          ? { ...block, content: nextValue }
          : block
      )
    );
  };

  const handleImageUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (!fileArray.length) {
      return;
    }
    setUploadingCount((count) => count + fileArray.length);
    for (const file of fileArray) {
      if (!file.type.startsWith('image/')) {
        continue;
      }
      try {
        const uploaded = await uploadArticleMedia(file);
        storeRecentMedia(uploaded.url, file.name);
        const newBlock: ImageBlockType = {
          id: createBlockId('image'),
          type: 'image',
          src: uploaded.url,
          alt: '',
          caption: file.name.replace(/\.[^/.]+$/, ''),
          size: 'full',
        };
        insertBlockAfter(activeBlockId, newBlock);
        const generatedAlt = await generateAltText(uploaded.url);
        if (generatedAlt) {
          syncBlocks((prev) =>
            prev.map((block) =>
              block.id === newBlock.id && block.type === 'image'
                ? { ...block, alt: generatedAlt }
                : block
            )
          );
        }
      } catch (error) {
        console.error('Upload failed', error);
      } finally {
        setUploadingCount((count) => Math.max(0, count - 1));
      }
    }
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files.length) {
      await handleImageUpload(event.dataTransfer.files);
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const text = event.clipboardData.getData('text');
    const embed = detectEmbedFromText(text);
    if (!embed) {
      return;
    }
    event.preventDefault();
    const block: EditorBlock = {
      id: createBlockId('embed'),
      type: 'embed',
      provider: embed.provider,
      url: embed.url,
      embedId: embed.embedId,
    };
    insertBlockAfter(activeBlockId, block);
  };

  const handleMoveBlock = (blockId: string, direction: 'up' | 'down') => {
    syncBlocks((prev) => {
      const index = prev.findIndex((block) => block.id === blockId);
      if (index === -1) {
        return prev;
      }
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) {
        return prev;
      }
      const next = [...prev];
      const [removed] = next.splice(index, 1);
      next.splice(targetIndex, 0, removed);
      return next;
    });
  };

  const handleDeleteBlock = (blockId: string) => {
    syncBlocks((prev) => {
      const next = prev.filter((block) => block.id !== blockId);
      return next.length ? next : [createEmptyMarkdownBlock()];
    });
  };

  return (
    <div
      className="relative"
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onPaste={handlePaste}
    >
      <div className="space-y-6">
        {blocks.map((block) => (
          <div
            key={block.id}
            className={`group relative transition ${
              block.type === 'markdown'
                ? 'rounded-xl border border-border-workbench bg-surface-workbench p-4'
                : 'frame bg-surface-workbench p-4'
            } ${activeBlockId === block.id ? 'border-border-interactive shadow-[var(--shadow-lift)]' : ''}`}
            onClick={() => setActiveBlockId(block.id)}
          >
            {block.type !== 'markdown' ? (
              <div className="flex items-center justify-between gap-3 pb-3 text-xs text-text-muted">
                <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">{block.type}</span>
                <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    className="rounded border border-border-subtle px-2 py-1 text-xs text-text-secondary transition hover:border-border-interactive hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => openCommandMenu(block.id)}
                  >
                    + Insert
                  </button>
                  <button
                    type="button"
                    className="rounded border border-border-subtle px-2 py-1 text-xs text-text-secondary transition hover:border-border-interactive hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => handleMoveBlock(block.id, 'up')}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="rounded border border-border-subtle px-2 py-1 text-xs text-text-secondary transition hover:border-border-interactive hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => handleMoveBlock(block.id, 'down')}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="rounded border border-border-subtle px-2 py-1 text-xs text-red-300 transition hover:border-red-400/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => handleDeleteBlock(block.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <div className="pointer-events-none absolute right-3 top-3 z-10 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="pointer-events-auto flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded border border-border-subtle bg-surface-workbench px-2 py-1 text-xs text-text-secondary transition hover:border-border-interactive hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => openCommandMenu(block.id)}
                  >
                    + Insert
                  </button>
                  <button
                    type="button"
                    className="rounded border border-border-subtle bg-surface-workbench px-2 py-1 text-xs text-text-secondary transition hover:border-border-interactive hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => handleMoveBlock(block.id, 'up')}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="rounded border border-border-subtle bg-surface-workbench px-2 py-1 text-xs text-text-secondary transition hover:border-border-interactive hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => handleMoveBlock(block.id, 'down')}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="rounded border border-border-subtle bg-surface-workbench px-2 py-1 text-xs text-red-300 transition hover:border-red-400/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => handleDeleteBlock(block.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}

            {block.type === 'markdown' && (
              <textarea
                className="min-h-[min(360px,35vh)] w-full resize-y rounded-lg border border-border-workbench bg-surface-dense p-4 font-mono text-sm leading-relaxed text-text-primary placeholder:text-text-muted/60 transition focus:border-border-interactive focus:outline-none"
                value={block.content}
                placeholder="Start writing... (type / for blocks)"
                onChange={(event) => handleMarkdownChange(block.id, event.target.value)}
                onFocus={() => setActiveBlockId(block.id)}
              />
            )}

            {block.type === 'image' && (
              <ImageBlock
                block={block}
                editable
                onChange={(updates) =>
                  syncBlocks((prev) =>
                    prev.map((item) => (item.id === block.id ? ({ ...item, ...updates } as ImageBlockType) : item))
                  )
                }
                onAnnotate={() => setAnnotationTarget(block)}
              />
            )}

            {block.type === 'callout' && (
              <CalloutBlock
                block={block}
                editable
                onChange={(updates) =>
                  syncBlocks((prev) =>
                    prev.map((item) => (item.id === block.id ? ({ ...item, ...updates } as CalloutBlockType) : item))
                  )
                }
              />
            )}

            {block.type === 'embed' && (
              <EmbedBlock
                block={block}
                editable
                onChange={(updates) =>
                  syncBlocks((prev) =>
                    prev.map((item) => (item.id === block.id ? ({ ...item, ...updates } as EmbedBlockType) : item))
                  )
                }
              />
            )}

            {block.type === 'code' && (
              <CodeBlock
                block={block}
                editable
                onChange={(updates) =>
                  syncBlocks((prev) =>
                    prev.map((item) => (item.id === block.id ? ({ ...item, ...updates } as CodeBlockType) : item))
                  )
                }
              />
            )}

            {block.type === 'diagram' && (
              <DiagramBlock
                block={block}
                editable
                onChange={(updates) =>
                  syncBlocks((prev) =>
                    prev.map((item) => (item.id === block.id ? ({ ...item, ...updates } as DiagramBlockType) : item))
                  )
                }
              />
            )}

            {block.type === 'divider' && <hr className="border-border-subtle" />}
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-border-workbench pt-4">
        <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Insert</span>
        {COMMANDS.filter((command) => command.id !== 'markdown').map((command) => (
          <button
            key={command.id}
            type="button"
            className="rounded-full border border-border-subtle bg-transparent px-3 py-1.5 text-xs text-text-muted transition hover:border-border-interactive hover:text-text-primary hover:bg-surface-dense/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => insertBlockFromToolbar(command.type)}
          >
            {command.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-text-muted">
          or type <kbd className="rounded bg-surface-dense px-1.5 py-0.5 text-text-secondary">/</kbd>
        </span>
      </div>

      {menuOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 top-20 z-20 w-60 rounded-xl border border-border-subtle bg-surface-workbench p-3 shadow-[var(--shadow-lift)]"
        >
          <p className="px-2 pb-2 text-[10px] uppercase tracking-[0.25em] text-text-muted">Insert block</p>
          {COMMANDS.map((command) => (
            <button
              key={command.id}
              type="button"
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-text-secondary transition hover:bg-surface-dense hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => handleCommandSelect(command)}
            >
              {command.label}
              <span className="text-xs uppercase tracking-[0.2em] text-text-muted">{command.type}</span>
            </button>
          ))}
        </div>
      )}

      {isDragging && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl border-2 border-dashed border-border-interactive bg-surface-dense/80">
          <p className="text-sm uppercase tracking-[0.3em] text-text-secondary">Drop images to upload</p>
        </div>
      )}

      {uploadingCount > 0 && (
        <div className="mt-4 rounded-lg border border-border-subtle bg-surface-dense px-4 py-3 text-sm text-text-secondary">
          Uploading {uploadingCount} file{uploadingCount === 1 ? '' : 's'}...
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          if (event.target.files) {
            void handleImageUpload(event.target.files);
            event.target.value = '';
          }
        }}
      />

      <MediaLibrary
        isOpen={libraryOpen}
        blocks={blocks}
        onClose={() => setLibraryOpen(false)}
        onInsert={(url) => {
          const newBlock: ImageBlockType = {
            id: createBlockId('image'),
            type: 'image',
            src: url,
            alt: '',
            caption: '',
            size: 'full',
          };
          insertBlockAfter(activeBlockId, newBlock);
        }}
      />

      {annotationTarget && (
        <ImageAnnotator
          block={annotationTarget}
          onClose={() => setAnnotationTarget(null)}
          onSave={(annotations) =>
            syncBlocks((prev) =>
              prev.map((item) =>
                item.id === annotationTarget.id && item.type === 'image'
                  ? { ...item, annotations }
                  : item
              )
            )
          }
        />
      )}
    </div>
  );
}
