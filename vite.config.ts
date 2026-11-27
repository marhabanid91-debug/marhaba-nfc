import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// رقم فريد لكل بناء: يُدمج في التطبيق ويُكتب في version.json لاكتشاف التحديثات تلقائياً
const BUILD_ID = Date.now().toString();

// https://vitejs.dev/config/
export default defineConfig({
  define: { __BUILD_ID__: JSON.stringify(BUILD_ID) },
  plugins: [
    react(),
    {
      name: 'emit-version',
      generateBundle() {
        this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ id: BUILD_ID }) });
      },
    },
  ],
});
