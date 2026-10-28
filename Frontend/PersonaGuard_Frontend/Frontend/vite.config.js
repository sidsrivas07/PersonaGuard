import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Minimal Vite config: just enables React (JSX) support.
export default defineConfig({ plugins: [react()] });
