import { COMMANDS, BlockCommand } from '../constants';

interface BlockCommandMenuProps {
    menuRef: React.RefObject<HTMLDivElement | null>;
    position: { top: number; left: number } | null;
    onSelect: (command: BlockCommand) => void;
}

export function BlockCommandMenu({ menuRef, position, onSelect }: BlockCommandMenuProps) {
    return (
        <div
            ref={menuRef}
            className="fixed z-20 w-60 rounded-xl bg-surface-workbench p-3"
            style={
                position
                    ? { top: `${position.top}px`, left: `${position.left}px` }
                    : { top: '80px', left: '50%', transform: 'translateX(-50%)' }
            }
        >
            {COMMANDS.map((command) => (
                <button
                    key={command.id}
                    type="button"
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-text-secondary transition hover:bg-surface-dense hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => onSelect(command)}
                >
                    {command.label}
                    <span className="text-xs uppercase tracking-[0.2em] text-text-muted">{command.type}</span>
                </button>
            ))}
        </div>
    );
}
