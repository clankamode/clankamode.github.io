import { useCallback } from 'react';
import type { EditorBlock } from '../types';

interface UseEditorShortcutsProps {
    blocks: EditorBlock[];
    syncBlocks: (updater: (prev: EditorBlock[]) => EditorBlock[]) => void;
    handleMarkdownChange: (blockId: string, nextValue: string) => void;
}

export function useEditorShortcuts({
    blocks,
    syncBlocks,
    handleMarkdownChange,
}: UseEditorShortcutsProps) {
    const handleMarkdownKeyDown = useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>, blockId: string) => {
        const isMod = event.metaKey || event.ctrlKey;
        const textarea = event.currentTarget;

        if (isMod) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const selection = textarea.value.substring(start, end);

            const applyFormat = (prefix: string, suffix: string, defaultPlaceholder = '') => {
                event.preventDefault();
                const content = selection || defaultPlaceholder;
                const formatted = `${prefix}${content}${suffix}`;

                textarea.focus();
                const success = document.execCommand('insertText', false, formatted);

                if (!success) {
                    const before = textarea.value.substring(0, start);
                    const after = textarea.value.substring(end);
                    handleMarkdownChange(blockId, `${before}${formatted}${after}`);
                }

                setTimeout(() => {
                    const newStart = start + prefix.length;
                    const newEnd = selection ? newStart + selection.length : newStart + defaultPlaceholder.length;
                    textarea.setSelectionRange(newStart, newEnd);
                }, 0);
            };

            if (event.key === 'b') {
                applyFormat('**', '**', 'bold text');
                return;
            }
            if (event.key === 'i') {
                applyFormat('*', '*', 'italic text');
                return;
            }
            if (event.key === 'k') {
                applyFormat('[', '](url)', 'link text');
                return;
            }
        }

        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            const isUp = event.key === 'ArrowUp';
            const isStart = textarea.selectionStart === 0 && textarea.selectionEnd === 0;
            const isEnd = textarea.selectionStart === textarea.value.length && textarea.selectionEnd === textarea.value.length;

            if ((isUp && isStart) || (!isUp && isEnd)) {
                event.preventDefault();
                const currentIndex = blocks.findIndex((b) => b.id === blockId);
                const targetIndex = isUp ? currentIndex - 1 : currentIndex + 1;

                if (targetIndex >= 0 && targetIndex < blocks.length) {
                    const targetBlock = blocks[targetIndex];
                    const targetEl = document.querySelector(`[data-block-id="${targetBlock.id}"] textarea`) as HTMLTextAreaElement;
                    if (targetEl) {
                        targetEl.focus();
                        const pos = isUp ? targetEl.value.length : 0;
                        targetEl.setSelectionRange(pos, pos);
                    }
                }
            }
        }

        if (event.key === 'Backspace') {
            const isStart = textarea.selectionStart === 0 && textarea.selectionEnd === 0;

            if (isStart) {
                const currentIndex = blocks.findIndex((b) => b.id === blockId);
                if (currentIndex > 0) {
                    const prevBlock = blocks[currentIndex - 1];
                    if (prevBlock.type === 'markdown') {
                        event.preventDefault();
                        const currentContent = textarea.value;
                        const prevContent = prevBlock.content;
                        const junctionPos = prevContent.length;

                        syncBlocks((prev) => {
                            const next = [...prev];
                            next[currentIndex - 1] = {
                                ...prevBlock,
                                content: prevContent + currentContent
                            };
                            next.splice(currentIndex, 1);
                            return next;
                        });

                        setTimeout(() => {
                            const prevEl = document.querySelector(`[data-block-id="${prevBlock.id}"] textarea`) as HTMLTextAreaElement;
                            if (prevEl) {
                                prevEl.focus();
                                prevEl.setSelectionRange(junctionPos, junctionPos);
                            }
                        }, 0);
                    }
                }
            }
        }
    }, [blocks, syncBlocks, handleMarkdownChange]);

    return { handleMarkdownKeyDown };
}
