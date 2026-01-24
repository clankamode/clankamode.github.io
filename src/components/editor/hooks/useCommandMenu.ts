import { useState, useEffect, useRef, useCallback } from 'react';

export function useCommandMenu() {
    const [menuAnchorId, setMenuAnchorId] = useState<string | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);

    const openCommandMenu = useCallback((blockId: string, buttonElement?: HTMLElement) => {
        setMenuAnchorId(blockId);

        let targetElement = buttonElement;

        if (!targetElement) {
            const blockEl = document.querySelector(`[data-block-id="${blockId}"]`);
            const textarea = blockEl?.querySelector('textarea');
            targetElement = (textarea || blockEl) as HTMLElement;
        }

        if (targetElement) {
            const rect = targetElement.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;
            const menuHeight = 340;
            const menuWidth = 240;
            const padding = 8;

            let top = rect.bottom + padding;
            let left = rect.left;

            if (buttonElement?.title === 'Insert Block') {
                left = rect.right + 4;
            }

            if (top + menuHeight > viewportHeight - padding) {
                top = rect.top - menuHeight - padding;
                if (top < padding) top = padding;
            }

            if (left + menuWidth > viewportWidth - padding) {
                left = viewportWidth - menuWidth - padding;
            }

            if (left < padding) left = padding;

            setMenuPosition({ top, left });
        } else {
            setMenuPosition(null);
        }

        setMenuOpen(true);
    }, []);

    const closeCommandMenu = useCallback(() => {
        setMenuOpen(false);
        setMenuAnchorId(null);
        setMenuPosition(null);
    }, []);

    useEffect(() => {
        if (!menuOpen) return;

        const handlePointerDown = (event: MouseEvent) => {
            const target = event.target as Node | null;
            if (menuRef.current && target && !menuRef.current.contains(target)) {
                closeCommandMenu();
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                closeCommandMenu();
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [menuOpen, closeCommandMenu]);

    return {
        menuOpen,
        setMenuOpen,
        menuPosition,
        menuAnchorId,
        menuRef,
        openCommandMenu,
        closeCommandMenu,
    };
}
