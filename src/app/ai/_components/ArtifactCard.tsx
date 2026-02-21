'use client';

import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';

interface GeneratedImage {
    id: string;
    url: string;
    mimeType?: string;
}

interface ArtifactCardProps {
    images: GeneratedImage[];
    onDownload?: (url: string) => void;
}

export function ArtifactCard({
    images,
    onDownload,
}: ArtifactCardProps) {
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);

    const primaryImage = images[0];

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape' && zoomedImage) {
            setZoomedImage(null);
        }
    }, [zoomedImage]);

    useEffect(() => {
        if (zoomedImage) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [zoomedImage, handleKeyDown]);

    return (
        <>
            <div className="space-y-3">
                {/* Image - aligned to content, not centered */}
                <div className="rounded-lg overflow-hidden bg-black/20">
                    {primaryImage ? (
                        <Image
                            src={primaryImage.url}
                            alt="Generated image"
                            width={800}
                            height={600}
                            className="max-h-[60vh] max-w-full object-contain cursor-zoom-in hover:opacity-95 transition-opacity"
                            onClick={() => setZoomedImage(primaryImage.url)}
                        />
                    ) : (
                        <div className="py-20 text-center text-white/30 text-sm">No image generated</div>
                    )}
                </div>

                {/* Versions strip */}
                {images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto">
                        {images.map((img) => (
                            <button
                                key={img.id}
                                onClick={() => setZoomedImage(img.url)}
                                className="h-12 w-16 flex-shrink-0 rounded overflow-hidden bg-black/20 hover:ring-1 hover:ring-white/20 transition-all"
                            >
                                <Image src={img.url} alt="" width={64} height={48} className="h-full w-full object-cover" />
                            </button>
                        ))}
                    </div>
                )}

                {/* Thin inline action row - not chunky footer */}
                <div className="flex items-center gap-4 text-[12px] text-white/40">
                    {primaryImage && onDownload && (
                        <button
                            onClick={() => onDownload(primaryImage.url)}
                            className="hover:text-white/70 transition-colors"
                        >
                            Download
                        </button>
                    )}
                    <button
                        onClick={() => primaryImage && setZoomedImage(primaryImage.url)}
                        className="hover:text-white/70 transition-colors"
                    >
                        Zoom
                    </button>
                </div>
            </div>

            {/* Zoom overlay */}
            {zoomedImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center cursor-zoom-out"
                    onClick={() => setZoomedImage(null)}
                >
                    <Image
                        src={zoomedImage}
                        alt="Zoomed"
                        width={1920}
                        height={1080}
                        className="max-w-[90vw] max-h-[90vh] object-contain"
                    />
                    <div className="absolute top-4 right-4 text-white/50 text-sm">ESC to close</div>
                </div>
            )}
        </>
    );
}
