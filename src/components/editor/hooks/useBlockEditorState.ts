import { useCallback, useEffect, useRef, useState } from 'react';
import type { EditorBlock } from '../types';
import { parseBlocks } from '../utils/parseBlocks';
import { serializeBlocks } from '../utils/serializeBlocks';
import { createEmptyMarkdownBlock } from '../utils/blockUtils';

export function useBlockEditorState(value: string, onChange: (value: string) => void) {
    const [blocks, setBlocks] = useState<EditorBlock[]>(() => parseBlocks(value));
    const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
    const isInternalChange = useRef(false);
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

    const syncBlocks = useCallback((updater: (prev: EditorBlock[]) => EditorBlock[]) => {
        setBlocks((prev) => {
            const next = updater(prev);
            isInternalChange.current = true;
            pendingSyncRef.current = next;
            return next;
        });
    }, []);

    const handleMoveBlock = useCallback((blockId: string, direction: 'up' | 'down') => {
        syncBlocks((prev) => {
            const index = prev.findIndex((block) => block.id === blockId);
            if (index === -1) return prev;
            const targetIndex = direction === 'up' ? index - 1 : index + 1;
            if (targetIndex < 0 || targetIndex >= prev.length) return prev;
            const next = [...prev];
            const [removed] = next.splice(index, 1);
            next.splice(targetIndex, 0, removed);
            return next;
        });
    }, [syncBlocks]);

    const handleDeleteBlock = useCallback((blockId: string) => {
        syncBlocks((prev) => {
            const next = prev.filter((block) => block.id !== blockId);
            return next.length ? next : [createEmptyMarkdownBlock()];
        });
    }, [syncBlocks]);

    return {
        blocks,
        setBlocks,
        activeBlockId,
        setActiveBlockId,
        syncBlocks,
        handleMoveBlock,
        handleDeleteBlock,
    };
}
