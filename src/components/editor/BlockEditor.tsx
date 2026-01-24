'use client';

import React, { useRef, useState, useEffect } from 'react';
import type { EditorBlock, ImageBlock as ImageBlockType } from './types';
import { createBlockId, createEmptyMarkdownBlock } from './utils/blockUtils';
import { CalloutBlock } from './blocks/CalloutBlock';
import { CodeBlock } from './blocks/CodeBlock';
import { DiagramBlock } from './blocks/DiagramBlock';
import { EmbedBlock } from './blocks/EmbedBlock';
import { ImageBlock } from './blocks/ImageBlock';
import { MediaLibrary } from './media/MediaLibrary';
import { ImageAnnotator } from './media/ImageAnnotator';

import { useBlockEditorState } from './hooks/useBlockEditorState';
import { useCommandMenu } from './hooks/useCommandMenu';
import { useEditorShortcuts } from './hooks/useEditorShortcuts';
import { useMediaHandlers } from './hooks/useMediaHandlers';
import { GhostGutter } from './components/GhostGutter';
import { BlockCommandMenu } from './components/BlockCommandMenu';
import { BlockCommand } from './constants';

interface BlockEditorProps {
  value: string;
  onChange: (value: string) => void;
  mediaLibraryTrigger?: number;
  mode?: 'write' | 'inspect';
}

export function BlockEditor({ value, onChange, mediaLibraryTrigger, mode = 'write' }: BlockEditorProps) {
  const {
    blocks,
    activeBlockId,
    setActiveBlockId,
    syncBlocks,
    handleMoveBlock,
    handleDeleteBlock,
  } = useBlockEditorState(value, onChange);

  const {
    menuOpen,
    menuPosition,
    menuAnchorId,
    menuRef,
    openCommandMenu,
    closeCommandMenu,
  } = useCommandMenu();

  const [isDragging, setIsDragging] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [, setUploadErrors] = useState<Record<string, string>>({});
  const [pasteNotification, setPasteNotification] = useState<string | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [annotationTarget, setAnnotationTarget] = useState<ImageBlockType | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const insertBlockAfter = (anchorId: string | null, block: EditorBlock) => {
    syncBlocks((prev) => {
      if (!anchorId) return [...prev, block];
      const index = prev.findIndex((item) => item.id === anchorId);
      if (index === -1) return [...prev, block];
      const next = [...prev];
      next.splice(index + 1, 0, block);
      return next;
    });
  };

  const replaceBlock = (blockId: string, block: EditorBlock) => {
    syncBlocks((prev) => prev.map((item) => (item.id === blockId ? block : item)));
  };

  const { handleImageUpload, handleFileDrop, handlePaste } = useMediaHandlers({
    activeBlockId,
    syncBlocks,
    insertBlockAfter,
    setUploadingCount,
    setUploadProgress,
    setUploadErrors,
    setPasteNotification,
  });

  const handleMarkdownChange = (blockId: string, nextValue: string) => {
    const endsWithSlash = nextValue.endsWith('/');
    if (menuOpen && menuAnchorId === blockId) {
      if (!(endsWithSlash && (nextValue.slice(0, -1).trim() === '' || /[\n\r]\s*$/.test(nextValue.slice(0, -1))))) {
        closeCommandMenu();
      }
    }

    if (endsWithSlash && (nextValue.slice(0, -1).trim() === '' || /[\n\r]\s*$/.test(nextValue.slice(0, -1)))) {
      openCommandMenu(blockId);
      syncBlocks((prev) =>
        prev.map((block) =>
          block.id === blockId && block.type === 'markdown' ? { ...block, content: nextValue } : block
        )
      );
      return;
    }

    syncBlocks((prev) =>
      prev.map((block) =>
        block.id === blockId && block.type === 'markdown' ? { ...block, content: nextValue } : block
      )
    );
  };

  const { handleMarkdownKeyDown } = useEditorShortcuts({
    blocks,
    syncBlocks,
    handleMarkdownChange,
  });

  const scrollBlockIntoView = (blockId: string) => {
    setTimeout(() => {
      const el = document.querySelector(`[data-block-id="${blockId}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 0);
  };

  const createBlockForCommand = (type: EditorBlock['type']): EditorBlock => {
    switch (type) {
      case 'image': return { id: createBlockId('image'), type: 'image', src: '', alt: '', size: 'full' };
      case 'callout': return { id: createBlockId('callout'), type: 'callout', tone: 'tip', content: '' };
      case 'embed': return { id: createBlockId('embed'), type: 'embed', provider: 'youtube', url: '' };
      case 'code': return { id: createBlockId('code'), type: 'code', language: 'text', content: '' };
      case 'diagram': return { id: createBlockId('diagram'), type: 'diagram', language: 'mermaid', content: 'flowchart TD\n  A[Start] --> B[Next]' };
      case 'divider': return { id: createBlockId('divider'), type: 'divider' };
      default: return createEmptyMarkdownBlock();
    }
  };

  const handleCommandSelect = (command: BlockCommand) => {
    closeCommandMenu();
    if (command.type === 'image') {
      fileInputRef.current?.click();
      return;
    }
    const newBlock = createBlockForCommand(command.type);
    const anchor = blocks.find((item) => item.id === menuAnchorId);
    if (anchor?.type === 'markdown' && (!anchor.content.trim() || anchor.content.trim() === '/')) {
      replaceBlock(menuAnchorId!, newBlock);
      insertBlockAfter(newBlock.id, createEmptyMarkdownBlock());
    } else {
      insertBlockAfter(menuAnchorId, newBlock);
    }
    scrollBlockIntoView(newBlock.id);
  };



  useEffect(() => {
    if (mediaLibraryTrigger) setLibraryOpen(true);
  }, [mediaLibraryTrigger]);

  const blockChangeHandlersRef = useRef<Map<string, (updates: Partial<EditorBlock>) => void>>(new Map());
  const imageBlockChangeHandlersRef = useRef<Map<string, (updates: Partial<ImageBlockType>) => void>>(new Map());

  const getBlockChangeHandler = (blockId: string) => {
    if (!blockChangeHandlersRef.current.has(blockId)) {
      blockChangeHandlersRef.current.set(blockId, (updates: Partial<EditorBlock>) => {
        syncBlocks((p) => p.map((i) => (i.id === blockId ? ({ ...i, ...updates } as EditorBlock) : i)));
      });
    }
    return blockChangeHandlersRef.current.get(blockId)!;
  };

  const getImageBlockChangeHandler = (blockId: string) => {
    if (!imageBlockChangeHandlersRef.current.has(blockId)) {
      imageBlockChangeHandlersRef.current.set(blockId, (updates: Partial<ImageBlockType>) => {
        syncBlocks((p) => p.map((i) => (i.id === blockId ? ({ ...i, ...updates } as ImageBlockType) : i)));
      });
    }
    return imageBlockChangeHandlersRef.current.get(blockId)!;
  };

  return (
    <div
      className="relative"
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleFileDrop}
      onPaste={handlePaste}
    >
      <div className="space-y-3">
        {blocks.map((block) => (
          <div
            key={block.id}
            data-block-id={block.id}
            className={`group relative rounded-lg transition-all duration-200 ${activeBlockId === block.id ? 'z-10 bg-[#27272a] shadow-lg ring-1 ring-white/20 border-l-2 border-accent-primary' : 'z-0 border-l-2 border-transparent'}`}
            onClick={() => setActiveBlockId(block.id)}
          >
            {activeBlockId === block.id && (
              <span className="absolute -top-4 left-2 text-[9px] uppercase tracking-widest text-white/50 select-none pointer-events-none">
                {block.type}
              </span>
            )}

            <GhostGutter
              blockId={block.id}
              onOpenMenu={openCommandMenu}
              onMoveUp={(id) => handleMoveBlock(id, 'up')}
              onDelete={handleDeleteBlock}
            />

            {block.type === 'markdown' && (
              <textarea
                className="w-full resize-none border-none bg-transparent px-2 py-4 font-mono text-base font-medium leading-relaxed text-white/90 caret-accent-primary placeholder:text-white/50 focus:outline-none overflow-hidden"
                value={block.content}
                placeholder="Start writing... (type / for blocks)"
                onChange={(e) => {
                  handleMarkdownChange(block.id, e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                onKeyDown={(e) => handleMarkdownKeyDown(e, block.id)}
                onFocus={(e) => {
                  setActiveBlockId(block.id);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                ref={(el) => {
                  if (el) {
                    el.style.height = 'auto';
                    el.style.height = `${el.scrollHeight}px`;
                  }
                }}
              />
            )}

            {block.type === 'image' && (
              <div data-block-id={block.id} className="pt-2 pb-6">
                <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                  {block.type}
                </div>
                <ImageBlock
                  block={block}
                  editable
                  onChange={getImageBlockChangeHandler(block.id)}
                  onAnnotate={() => setAnnotationTarget(block)}
                  onUploadClick={() => { setActiveBlockId(block.id); fileInputRef.current?.click(); }}
                  onDrop={(files) => handleImageUpload(files, block.id)}
                  mode={mode}
                />
              </div>
            )}

            {block.type === 'callout' && <CalloutBlock block={block} editable onChange={getBlockChangeHandler(block.id)} />}
            {block.type === 'embed' && <EmbedBlock block={block} editable onChange={getBlockChangeHandler(block.id)} />}
            {block.type === 'code' && <CodeBlock block={block} editable onChange={getBlockChangeHandler(block.id)} />}
            {block.type === 'diagram' && <DiagramBlock block={block} editable onChange={getBlockChangeHandler(block.id)} />}
            {block.type === 'divider' && (
              <div className="py-6 transition-opacity group-hover:opacity-100">
                <hr className="border-border-subtle" />
              </div>
            )}
          </div>
        ))}
      </div>



      {menuOpen && (
        <BlockCommandMenu
          menuRef={menuRef}
          position={menuPosition}
          onSelect={handleCommandSelect}
        />
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
            <div className="ml-4 h-1.5 w-32 overflow-hidden rounded-full bg-surface-interactive">
              <div
                className="h-full bg-brand-gradient transition-all duration-300"
                style={{ width: `${Math.round(Object.values(uploadProgress).reduce((a, b) => a + b, 0) / Math.max(1, Object.keys(uploadProgress).length))}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {pasteNotification && (
        <div className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-full border border-border-interactive bg-surface-dense px-4 py-2 text-xs text-text-primary shadow-lg animate-in fade-in slide-in-from-bottom-4">
          {pasteNotification}
        </div>
      )}

      <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={(e) => { if (e.target.files) handleImageUpload(e.target.files); }} />
      <MediaLibrary
        isOpen={libraryOpen}
        blocks={blocks}
        onClose={() => setLibraryOpen(false)}
        onInsert={(url) => {
          insertBlockAfter(activeBlockId, {
            id: createBlockId('image'),
            type: 'image',
            src: url,
            alt: '',
            size: 'full',
          });
          setLibraryOpen(false);
        }}
      />
      {annotationTarget && (
        <ImageAnnotator
          block={annotationTarget}
          onClose={() => setAnnotationTarget(null)}
          onSave={(annotations) => {
            syncBlocks((p) =>
              p.map((b) => (b.id === annotationTarget.id ? { ...b, annotations } : b))
            );
            setAnnotationTarget(null);
          }}
        />
      )}
    </div>
  );
}
