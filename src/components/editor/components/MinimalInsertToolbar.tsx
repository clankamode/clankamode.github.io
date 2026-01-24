import { COMMANDS } from '../constants';
import type { EditorBlock } from '../types';

interface MinimalInsertToolbarProps {
    onInsert: (type: EditorBlock['type']) => void;
}

export function MinimalInsertToolbar({ onInsert }: MinimalInsertToolbarProps) {
    return (
        <div className="mt-16 flex items-center justify-center pt-8 opacity-20 transition-opacity hover:opacity-100">
            <div className="flex flex-wrap items-center justify-center gap-2">
                {COMMANDS.map((command) => (
                    <button
                        key={command.id}
                        type="button"
                        className="rounded-full bg-transparent px-3 py-1 text-[10px] uppercase tracking-[0.1em] text-text-muted transition hover:text-text-primary focus-ring"
                        onClick={() => onInsert(command.type)}
                    >
                        {command.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
