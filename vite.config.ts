import fs from 'node:fs';
import path from 'node:path';
import type { OutputChunk } from 'rollup';
import { defineConfig, type Plugin } from 'vite';

function injectMainModulePreload(): Plugin {
  return {
    name: 'inject-main-modulepreload',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (!ctx.bundle || !html.includes('home-page')) return html;
        const chunk = Object.values(ctx.bundle).find(
          (item): item is OutputChunk =>
            item.type === 'chunk' && item.isEntry && item.name === 'main',
        );
        if (!chunk) return html;
        const href = `/${chunk.fileName}`;
        const link = `  <link rel="modulepreload" crossorigin href="${href}" />\n  `;
        return html.replace(/<title>/, `${link}<title>`);
      },
    },
  };
}

function topicInputs(): Record<string, string> {
  const inputs: Record<string, string> = {};
  const topicsDir = path.resolve(__dirname, 'topics');

  if (!fs.existsSync(topicsDir)) {
    return inputs;
  }

  for (const entry of fs.readdirSync(topicsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const filePath = path.join(topicsDir, entry.name, 'index.html');
    if (fs.existsSync(filePath)) {
      inputs[`topics-${entry.name}`] = filePath;
    }
  }

  return inputs;
}

export default defineConfig({
  plugins: [injectMainModulePreload()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2020',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        now: path.resolve(__dirname, 'now.html'),
        logs: path.resolve(__dirname, 'logs/index.html'),
        ...topicInputs(),
      },
    },
  },
  server: {
    port: 3000,
  },
});
