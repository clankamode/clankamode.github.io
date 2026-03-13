import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';

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
