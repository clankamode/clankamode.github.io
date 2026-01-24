interface GhostGutterProps {
    blockId: string;
    onOpenMenu: (id: string, el: HTMLElement) => void;
    onMoveUp: (id: string) => void;
    onDelete: (id: string) => void;
}

export function GhostGutter({ blockId, onOpenMenu, onMoveUp, onDelete }: GhostGutterProps) {
    return (
        <div className="absolute -left-12 top-4 flex flex-col gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <button
                type="button"
                className="flex h-6 w-6 items-center justify-center rounded text-text-muted transition hover:text-text-primary focus-ring"
                onClick={(e) => {
                    e.stopPropagation();
                    onOpenMenu(blockId, e.currentTarget);
                }}
                title="Insert Block"
            >
                +
            </button>
            <button
                type="button"
                className="flex h-6 w-6 items-center justify-center rounded text-text-muted transition hover:text-text-primary focus-ring"
                onClick={(e) => {
                    e.stopPropagation();
                    onMoveUp(blockId);
                }}
                title="Move Up"
            >
                ↑
            </button>
            <button
                type="button"
                className="flex h-6 w-6 items-center justify-center rounded text-text-muted transition hover:text-text-primary focus-ring"
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(blockId);
                }}
                title="Delete"
            >
                ×
            </button>
        </div>
    );
}
