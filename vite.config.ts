import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  ssr: {
    noExternal: [/^firebase-admin/]  // firebase-admin과 하위 모듈을 SSR 번들에 포함
  }
});