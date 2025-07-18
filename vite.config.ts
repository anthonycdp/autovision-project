import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  const isDev = mode === "development";
  
  return {
    plugins: [
      react(),
    ],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "shared"),
        "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      },
    },
    root: path.resolve(import.meta.dirname, "client"),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist"),
      emptyOutDir: true,
      minify: !isDev,
      sourcemap: isDev,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            ui: ['@radix-ui/react-dialog', '@radix-ui/react-select', '@radix-ui/react-tabs'],
            charts: ['chart.js', 'recharts'],
            icons: ['lucide-react', 'react-icons'],
            pdf: ['react-pdf'],
          },
        },
      },
    },
    server: {
      port: 5173,
      open: false,
      hmr: {
        protocol: "ws",
        host: "localhost",
      },
      warmup: {
        clientFiles: ['./src/main.tsx', './src/App.tsx'],
      },
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'wouter',
        '@tanstack/react-query',
        'chart.js',
        'recharts',
        'lucide-react',
        'react-hook-form',
        'zod',
        'date-fns',
        '@hookform/resolvers/zod',
        'clsx',
        'tailwind-merge',
      ],
      exclude: [
        'react-pdf',
        'pdfjs-dist',
        'react-icons',
      ],
    },
    esbuild: {
      target: 'es2020',
    },
  };
}); 