import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// Ofuscación desactivada por problemas de velocidad en deploy
// import bundleObfuscator from 'vite-plugin-bundle-obfuscator';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isProduction = mode === 'production';
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        // OFUSCACIÓN DESACTIVADA: Causaba timeouts en deploy
        // La minificación agresiva con Terser proporciona protección básica suficiente
        // Los archivos críticos (excelTemplateService, geminiService) están protegidos por:
        // 1. Minificación agresiva (nombres ofuscados)
        // 2. Mangle de propiedades y nombres
        // 3. Compresión múltiple
        // 4. Código en chunks separados
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        // Minificación AGRESIVA con Terser - Protección principal sin ofuscación lenta
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: false, // Mantener console para debugging
            drop_debugger: true,
            pure_funcs: ['console.log', 'console.debug'], // Eliminar logs de desarrollo
            passes: 3, // Múltiples pases para mejor ofuscación de nombres
            unsafe: true,
            unsafe_comps: true,
            unsafe_math: true,
            unsafe_methods: true,
            unsafe_proto: true,
            unsafe_regexp: true,
            unsafe_undefined: true,
            warnings: false,
            // Opciones adicionales para mejor ofuscación
            collapse_vars: true,
            reduce_vars: true,
            unused: true
          },
          mangle: {
            // Mangle AGRESIVO: Ofusca todos los nombres (excepto propiedades conocidas)
            properties: {
              regex: /^_/, // Mangle propiedades que empiezan con _
              reserved: [] // No reservar nombres
            },
            toplevel: true, // Mangle nombres de nivel superior (CRÍTICO para protección)
            safari10: true,
            // Mangle nombres de funciones y variables
            keep_classnames: false, // Ofuscar nombres de clases
            keep_fnames: false // Ofuscar nombres de funciones
          },
          format: {
            comments: false, // Eliminar todos los comentarios
            beautify: false,
            // Compactar al máximo
            max_line_len: 0,
            preserve_annotations: false
          }
        },
        rollupOptions: {
          input: path.resolve(__dirname, 'index.html'),
          output: {
            // Ofuscar nombres de archivos en producción (protección adicional)
            entryFileNames: isProduction ? 'assets/[hash].js' : 'assets/[name].js',
            chunkFileNames: isProduction ? 'assets/[hash].js' : 'assets/[name].js',
            assetFileNames: isProduction ? 'assets/[hash].[ext]' : 'assets/[name].[ext]',
            // Compactar código al máximo
            compact: true,
            // Code splitting automático: Vite separará automáticamente los módulos grandes
            // Los servicios críticos se separarán naturalmente en chunks
            manualChunks: isProduction ? (id) => {
              // Separar servicios críticos en chunks independientes
              if (id.includes('excelTemplateService')) {
                return 'excel-service';
              }
              if (id.includes('geminiService')) {
                return 'grimoire-service';
              }
              // Chunk para node_modules
              if (id.includes('node_modules')) {
                return 'vendor';
              }
            } : undefined,
            // Generar source maps solo en desarrollo
            sourcemap: !isProduction
          }
        },
        // Optimizaciones adicionales
        chunkSizeWarningLimit: 1000,
        reportCompressedSize: false, // Más rápido en builds grandes
        cssCodeSplit: true,
        sourcemap: !isProduction // Source maps solo en desarrollo
      }
    };
});
