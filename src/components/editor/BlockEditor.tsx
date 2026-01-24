'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type {
  EditorBlock,
  ImageBlock as ImageBlockType,
} from './types';
import { parseBlocks } from './utils/parseBlocks';
import { serializeBlocks } from './utils/serializeBlocks';
import { createBlockId, createEmptyMarkdownBlock } from './utils/blockUtils';
import { detectEmbedFromText, detectImageFromText } from './utils/pasteHandler';
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
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const [pasteNotification, setPasteNotification] = useState<string | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [annotationTarget, setAnnotationTarget] = useState<ImageBlockType | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isInternalChange = useRef(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const pendingSyncRef = useRef<EditorBlock[] | null>(null);
  const lastSerializedValue = useRef<string>(value);

  useEffect(() => {
    if (pendingSyncRef.current) {
      const blocksToSync = pendingSyncRef.current;
      const serialized = serializeBlocks(blocksToSync);
      pendingSyncRef.current = null;
      
      if (serialized !== lastSerializedValue.current) {
        lastSerializedValue.current = serialized;
        isInternalChange.current = true;
        onChange(serialized);
      }
    }
  }, [blocks, onChange]);

  useEffect(() => {
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    
    if (value !== lastSerializedValue.current) {
      lastSerializedValue.current = value;
      setBlocks(parseBlocks(value));
    }
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
        setMenuPosition(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        setMenuAnchorId(null);
        setMenuPosition(null);
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
      pendingSyncRef.current = next;
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

  useEffect(() => {
    const currentBlockIds = new Set(blocks.map(b => b.id));
    blockChangeHandlersRef.current.forEach((_, blockId) => {
      if (!currentBlockIds.has(blockId)) {
        blockChangeHandlersRef.current.delete(blockId);
      }
    });
    imageBlockChangeHandlersRef.current.forEach((_, blockId) => {
      if (!currentBlockIds.has(blockId)) {
        imageBlockChangeHandlersRef.current.delete(blockId);
      }
    });
  }, [blocks]);

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

  const scrollBlockIntoView = (blockId: string) => {
    setTimeout(() => {
      const blockElement = document.querySelector(`[data-block-id="${blockId}"]`);
      if (blockElement) {
        blockElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 0);
  };

  const openCommandMenu = (blockId: string, buttonElement?: HTMLElement) => {
    setMenuAnchorId(blockId);
    setActiveBlockId(blockId);
    
    if (buttonElement) {
      const rect = buttonElement.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const menuHeight = 300;
      const menuWidth = 240;
      const padding = 8;
      
      let top = rect.bottom + padding;
      let right = viewportWidth - rect.right;
      
      if (top + menuHeight > viewportHeight - padding) {
        top = rect.top - menuHeight - padding;
        if (top < padding) {
          top = padding;
        }
      }
      
      if (right + menuWidth > viewportWidth - padding) {
        right = padding;
      } else if (right < padding) {
        right = padding;
      }
      
      setMenuPosition({ top, right });
    } else {
      setMenuPosition(null);
    }
    
    setMenuOpen(true);
  };

  const handleCommandSelect = (command: BlockCommand) => {
    setMenuOpen(false);
    setMenuPosition(null);
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
      scrollBlockIntoView(newBlock.id);
    } else {
      insertBlockAfter(menuAnchorId, newBlock);
      scrollBlockIntoView(newBlock.id);
    }
  };

  const insertBlockFromToolbar = (type: EditorBlock['type']) => {
    const anchorId = activeBlockId ?? blocks[blocks.length - 1]?.id ?? null;
    if (type === 'image') {
      const newBlock = createBlockForCommand('image');
      if (!anchorId) {
        insertBlockAfter(null, newBlock);
        setActiveBlockId(newBlock.id);
        scrollBlockIntoView(newBlock.id);
        return;
      }
      const anchor = blocks.find((item) => item.id === anchorId);
      if (anchor?.type === 'markdown' && !anchor.content.trim()) {
        replaceBlock(anchorId, newBlock);
        insertBlockAfter(newBlock.id, createEmptyMarkdownBlock());
      } else {
        insertBlockAfter(anchorId, newBlock);
      }
      setActiveBlockId(newBlock.id);
      scrollBlockIntoView(newBlock.id);
      return;
    }
    const newBlock = createBlockForCommand(type);
    if (!anchorId) {
      insertBlockAfter(null, newBlock);
      scrollBlockIntoView(newBlock.id);
      return;
    }
    const anchor = blocks.find((item) => item.id === anchorId);
    if (anchor?.type === 'markdown' && !anchor.content.trim()) {
      replaceBlock(anchorId, newBlock);
      insertBlockAfter(newBlock.id, createEmptyMarkdownBlock());
    } else {
      insertBlockAfter(anchorId, newBlock);
    }
    scrollBlockIntoView(newBlock.id);
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

  const blockChangeHandlersRef = useRef<Map<string, (updates: Partial<EditorBlock>) => void>>(new Map());
  const imageBlockChangeHandlersRef = useRef<Map<string, (updates: Partial<ImageBlockType>) => void>>(new Map());

  const getBlockChangeHandler = useCallback((blockId: string) => {
    if (!blockChangeHandlersRef.current.has(blockId)) {
      blockChangeHandlersRef.current.set(blockId, (updates: Partial<EditorBlock>) => {
        syncBlocks((prev) =>
          prev.map((item) => (item.id === blockId ? ({ ...item, ...updates } as EditorBlock) : item))
        );
      });
    }
    return blockChangeHandlersRef.current.get(blockId)!;
  }, []);

  const getImageBlockChangeHandler = useCallback((blockId: string) => {
    if (!imageBlockChangeHandlersRef.current.has(blockId)) {
      imageBlockChangeHandlersRef.current.set(blockId, (updates: Partial<ImageBlockType>) => {
        syncBlocks((prev) =>
          prev.map((item) => (item.id === blockId ? ({ ...item, ...updates } as ImageBlockType) : item))
        );
      });
    }
    return imageBlockChangeHandlersRef.current.get(blockId)!;
  }, []);

  const handleImageUpload = async (files: FileList | File[], targetBlockId?: string) => {
    const fileArray = Array.from(files);
    if (!fileArray.length) {
      return;
    }
    setUploadingCount((count) => count + fileArray.length);
    setUploadErrors({});
    
    for (const file of fileArray) {
      if (!file.type.startsWith('image/')) {
        setUploadingCount((count) => Math.max(0, count - 1));
        setUploadErrors((prev) => ({
          ...prev,
          [file.name]: 'File must be an image (JPG, PNG, GIF, WebP)',
        }));
        continue;
      }
      
      const fileId = `${file.name}-${Date.now()}`;
      setUploadProgress((prev) => ({ ...prev, [fileId]: 0 }));
      
      try {
        const uploaded = await uploadArticleMedia(file);
        storeRecentMedia(uploaded.url, file.name);
        setUploadProgress((prev) => ({ ...prev, [fileId]: 100 }));
        
        if (targetBlockId) {
          const targetBlock = blocks.find((b) => b.id === targetBlockId && b.type === 'image');
          if (targetBlock) {
            syncBlocks((prev) =>
              prev.map((block) =>
                block.id === targetBlockId && block.type === 'image'
                  ? { ...block, src: uploaded.url, caption: file.name.replace(/\.[^/.]+$/, '') || undefined }
                  : block
              )
            );
            const generatedAlt = await generateAltText(uploaded.url);
            if (generatedAlt) {
              syncBlocks((prev) =>
                prev.map((block) =>
                  block.id === targetBlockId && block.type === 'image'
                    ? { ...block, alt: generatedAlt }
                    : block
                )
              );
            }
          }
        } else {
          const newBlock: ImageBlockType = {
            id: createBlockId('image'),
            type: 'image',
            src: uploaded.url,
            alt: '',
            caption: file.name.replace(/\.[^/.]+$/, '') || undefined,
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
        }
        
        setTimeout(() => {
          setUploadProgress((prev) => {
            const next = { ...prev };
            delete next[fileId];
            return next;
          });
        }, 1000);
      } catch (error) {
        console.error('Upload failed', error);
        setUploadErrors((prev) => ({
          ...prev,
          [file.name]: (error as Error).message || 'Upload failed',
        }));
      } finally {
        setUploadingCount((count) => Math.max(0, count - 1));
      }
    }
  };

  const handleFileDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files.length) {
      const targetElement = event.target as HTMLElement;
      const imageBlockElement = targetElement.closest('[data-block-id]');
      const blockId = imageBlockElement?.getAttribute('data-block-id');
      await handleImageUpload(event.dataTransfer.files, blockId || undefined);
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.closest('input, textarea')) {
      return;
    }
    
    const text = event.clipboardData.getData('text');
    
    const image = detectImageFromText(text);
    if (image) {
      event.preventDefault();
      const block: EditorBlock = {
        id: createBlockId('image'),
        type: 'image',
        src: image.src,
        alt: image.alt,
        size: 'full',
      };
      insertBlockAfter(activeBlockId, block);
      setPasteNotification('Image block created from URL');
      setTimeout(() => setPasteNotification(null), 3000);
      return;
    }

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
      setPasteNotification(`${embed.provider === 'url' ? 'Link' : embed.provider} block created`);
      setTimeout(() => setPasteNotification(null), 3000);
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
        if (event.dataTransfer.types.includes('Files')) {
          event.preventDefault();
          setIsDragging(true);
        }
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleFileDrop}
      onPaste={handlePaste}
    >
      <div className="space-y-5">
        {blocks.map((block) => (
          <div
            key={block.id}
            data-block-id={block.id}
            className={`group relative transition ${
              block.type === 'markdown'
                ? 'rounded-xl border border-border-workbench bg-surface-workbench p-4'
                : 'frame bg-surface-workbench p-4'
            } ${
              activeBlockId === block.id ? 'border-border-interactive shadow-[var(--shadow-lift)]' : ''
            }`}
            onClick={() => setActiveBlockId(block.id)}
          >
            {block.type !== 'markdown' ? (
              <div className="flex items-center justify-between gap-3 pb-3 text-xs text-text-muted">
                <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">{block.type}</span>
                <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    className="rounded border border-border-subtle px-2 py-1 text-xs text-text-secondary transition hover:border-border-interactive hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={(e) => {
                      e.stopPropagation();
                      openCommandMenu(block.id, e.currentTarget);
                    }}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      openCommandMenu(block.id, e.currentTarget);
                    }}
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
                className="min-h-[min(300px,30vh)] w-full resize-y rounded-lg border border-border-workbench bg-surface-dense p-4 font-mono text-sm leading-relaxed text-text-primary placeholder:text-text-muted/60 transition focus:border-border-interactive focus:outline-none"
                value={block.content}
                placeholder="Start writing... (type / for blocks)"
                onChange={(event) => handleMarkdownChange(block.id, event.target.value)}
                onFocus={() => setActiveBlockId(block.id)}
              />
            )}

            {block.type === 'image' && (
              <div data-block-id={block.id}>
                <ImageBlock
                  block={block}
                  editable
                  onChange={getImageBlockChangeHandler(block.id)}
                  onAnnotate={() => setAnnotationTarget(block)}
                  onUploadClick={() => {
                    setActiveBlockId(block.id);
                    fileInputRef.current?.click();
                  }}
                  onDrop={(files) => handleImageUpload(files, block.id)}
                />
              </div>
            )}

            {block.type === 'callout' && (
              <CalloutBlock
                block={block}
                editable
                onChange={getBlockChangeHandler(block.id)}
              />
            )}

            {block.type === 'embed' && (
              <EmbedBlock
                block={block}
                editable
                onChange={getBlockChangeHandler(block.id)}
              />
            )}

            {block.type === 'code' && (
              <CodeBlock
                block={block}
                editable
                onChange={getBlockChangeHandler(block.id)}
              />
            )}

            {block.type === 'diagram' && (
              <DiagramBlock
                block={block}
                editable
                onChange={getBlockChangeHandler(block.id)}
              />
            )}

            {block.type === 'divider' && <hr className="border-border-subtle" />}
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-border-workbench pt-4">
        <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Insert</span>
        {COMMANDS.map((command) => (
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
          className="fixed z-20 w-60 rounded-xl border border-border-subtle bg-surface-workbench p-3 shadow-[var(--shadow-lift)]"
          style={
            menuPosition
              ? { top: `${menuPosition.top}px`, right: `${menuPosition.right}px` }
              : { top: '80px', right: '0' }
          }
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
          <div className="flex items-center justify-between">
            <span>Uploading {uploadingCount} file{uploadingCount === 1 ? '' : 's'}...</span>
            {Object.keys(uploadProgress).length > 0 && (
              <div className="ml-4 h-1.5 w-32 overflow-hidden rounded-full bg-surface-interactive">
                <div
                  className="h-full bg-brand-gradient transition-all duration-300"
                  style={{
                    width: `${Math.round(Object.values(uploadProgress).reduce((a, b) => a + b, 0) / Object.keys(uploadProgress).length)}%`,
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {Object.keys(uploadErrors).length > 0 && (
        <div className="mt-4 space-y-2">
          {Object.entries(uploadErrors).map(([filename, error]) => (
            <div
              key={filename}
              className="rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300"
            >
              <p className="font-medium">{filename}</p>
              <p className="text-xs text-red-400/80">{error}</p>
            </div>
          ))}
        </div>
      )}

      {pasteNotification && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg border border-border-subtle bg-surface-workbench px-4 py-3 text-sm text-text-primary shadow-[var(--shadow-lift)]">
          {pasteNotification}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          if (event.target.files) {
            const targetBlockId = activeBlockId && blocks.find((b) => b.id === activeBlockId && b.type === 'image')?.id;
            void handleImageUpload(event.target.files, targetBlockId || undefined);
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
