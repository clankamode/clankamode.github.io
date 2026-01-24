import type { EditorBlock } from './types';

export type BlockCommand = {
    id: string;
    label: string;
    type: EditorBlock['type'];
};

export const COMMANDS: BlockCommand[] = [
    { id: 'markdown', label: 'Text', type: 'markdown' },
    { id: 'image', label: 'Image', type: 'image' },
    { id: 'callout', label: 'Callout', type: 'callout' },
    { id: 'embed', label: 'Embed', type: 'embed' },
    { id: 'code', label: 'Code', type: 'code' },
    { id: 'diagram', label: 'Diagram', type: 'diagram' },
    { id: 'divider', label: 'Divider', type: 'divider' },
];

export const RECENT_MEDIA_KEY = 'learning-media-recent';
