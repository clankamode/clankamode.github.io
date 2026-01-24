import { useCallback } from 'react';
import type { EditorBlock, ImageBlock as ImageBlockType } from '../types';
import { uploadArticleMedia, generateAltText } from '../utils/uploadMedia';
import { detectImageFromText, detectEmbedFromText } from '../utils/pasteHandler';
import { createBlockId } from '../utils/blockUtils';
import { RECENT_MEDIA_KEY } from '../constants';

interface UseMediaHandlersProps {
    activeBlockId: string | null;
    syncBlocks: (updater: (prev: EditorBlock[]) => EditorBlock[]) => void;
    insertBlockAfter: (anchorId: string | null, block: EditorBlock) => void;
    setUploadingCount: (count: (prev: number) => number) => void;
    setUploadProgress: (progress: (prev: Record<string, number>) => Record<string, number>) => void;
    setUploadErrors: (errors: (prev: Record<string, string>) => Record<string, string>) => void;
    setPasteNotification: (notif: string | null) => void;
}

export function useMediaHandlers({
    activeBlockId,
    syncBlocks,
    insertBlockAfter,
    setUploadingCount,
    setUploadProgress,
    setUploadErrors,
    setPasteNotification,
}: UseMediaHandlersProps) {
    const storeRecentMedia = useCallback((url: string, name?: string) => {
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
    }, []);

    const handleImageUpload = useCallback(async (files: FileList | File[], targetBlockId?: string) => {
        const fileArray = Array.from(files);
        if (!fileArray.length) return;

        setUploadingCount((count) => count + fileArray.length);
        setUploadErrors(() => ({}));

        for (const file of fileArray) {
            if (!file.type.startsWith('image/')) {
                setUploadingCount((count) => Math.max(0, count - 1));
                setUploadErrors((prev) => ({ ...prev, [file.name]: 'File must be an image' }));
                continue;
            }

            const fileId = `${file.name}-${Date.now()}`;
            setUploadProgress((prev) => ({ ...prev, [fileId]: 0 }));

            try {
                const uploaded = await uploadArticleMedia(file);
                storeRecentMedia(uploaded.url, file.name);
                setUploadProgress((prev) => ({ ...prev, [fileId]: 100 }));

                if (targetBlockId) {
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
                                block.id === newBlock.id && block.type === 'image' ? { ...block, alt: generatedAlt } : block
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
                setUploadErrors((prev) => ({ ...prev, [file.name]: error instanceof Error ? error.message : 'Upload failed' }));
            } finally {
                setUploadingCount((count) => Math.max(0, count - 1));
            }
        }
    }, [activeBlockId, insertBlockAfter, setUploadErrors, setUploadProgress, setUploadingCount, storeRecentMedia, syncBlocks]);

    const handleFileDrop = useCallback(async (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        if (event.dataTransfer.files.length) {
            const targetElement = event.target as HTMLElement;
            const imageBlockElement = targetElement.closest('[data-block-id]');
            const blockId = imageBlockElement?.getAttribute('data-block-id');
            await handleImageUpload(event.dataTransfer.files, blockId || undefined);
        }
    }, [handleImageUpload]);

    const handlePaste = useCallback((event: React.ClipboardEvent<HTMLDivElement>) => {
        const target = event.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.closest('input, textarea')) return;

        const text = event.clipboardData.getData('text');
        const image = detectImageFromText(text);
        if (image) {
            event.preventDefault();
            const block: EditorBlock = { id: createBlockId('image'), type: 'image', src: image.src, alt: image.alt, size: 'full' };
            insertBlockAfter(activeBlockId, block);
            setPasteNotification('Image block created from URL');
            setTimeout(() => setPasteNotification(null), 3000);
            return;
        }

        const embed = detectEmbedFromText(text);
        if (embed) {
            event.preventDefault();
            const block: EditorBlock = { id: createBlockId('embed'), type: 'embed', provider: embed.provider, url: embed.url, embedId: embed.embedId };
            insertBlockAfter(activeBlockId, block);
            setPasteNotification(`${embed.provider === 'url' ? 'Link' : embed.provider} block created`);
            setTimeout(() => setPasteNotification(null), 3000);
        }
    }, [activeBlockId, insertBlockAfter, setPasteNotification]);

    return { handleImageUpload, handleFileDrop, handlePaste };
}
