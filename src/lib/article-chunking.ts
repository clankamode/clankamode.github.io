export interface ArticleChunk {
    id: string;
    title: string;
    content: string;
    index: number;
}

export function chunkArticleByHeadings(content: string): ArticleChunk[] {
    const lines = content.split('\n');
    const chunks: ArticleChunk[] = [];
    let currentChunk: string[] = [];
    let currentTitle = 'Introduction';
    let chunkIndex = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const h2Match = line.match(/^##\s+(.+)$/);

        if (h2Match && currentChunk.length > 0) {
            chunks.push({
                id: `chunk-${chunkIndex}`,
                title: currentTitle,
                content: currentChunk.join('\n').trim(),
                index: chunkIndex,
            });
            currentChunk = [line];
            currentTitle = h2Match[1].trim();
            chunkIndex++;
        } else {
            currentChunk.push(line);
        }
    }

    if (currentChunk.length > 0) {
        chunks.push({
            id: `chunk-${chunkIndex}`,
            title: currentTitle,
            content: currentChunk.join('\n').trim(),
            index: chunkIndex,
        });
    }

    if (chunks.length === 0) {
        chunks.push({
            id: 'chunk-0',
            title: 'Content',
            content: content.trim(),
            index: 0,
        });
    }

    return chunks;
}

export function getChunkByIndex(chunks: ArticleChunk[], index: number): ArticleChunk | null {
    if (index < 0 || index >= chunks.length) {
        return null;
    }
    return chunks[index];
}
