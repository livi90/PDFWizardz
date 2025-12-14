import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import bundleObfuscator from 'vite-plugin-bundle-obfuscator';

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
        // Ofuscación agresiva solo en producción
        // Ofusca TODO el bundle para máxima protección
        ...(isProduction ? [
          bundleObfuscator({
            // Excluir solo node_modules, ofuscar todo lo demás
            excludes: ['node_modules/**'],
            options: {
              // Nivel de ofuscación: MEDIUM-HIGH (balance entre protección y velocidad)
              compact: true,
              controlFlowFlattening: true,
              controlFlowFlatteningThreshold: 0.5, // Reducido de 0.75 para más velocidad
              deadCodeInjection: true,
              deadCodeInjectionThreshold: 0.3, // Reducido de 0.4 para más velocidad
              debugProtection: false,
              debugProtectionInterval: 0,
              disableConsoleOutput: false,
              identifierNamesGenerator: 'hexadecimal',
              log: false,
              numbersToExpressions: true,
              renameGlobals: false,
              selfDefending: true,
              simplify: true,
              splitStrings: true,
              splitStringsChunkLength: 15, // Aumentado de 10 para menos procesamiento
              stringArray: true,
              stringArrayCallsTransform: true,
              stringArrayCallsTransformThreshold: 0.5, // Reducido de 0.75 para más velocidad
              stringArrayEncoding: ['base64'],
              stringArrayIndexShift: true,
              stringArrayRotate: true,
              stringArrayShuffle: true,
              stringArrayWrappersCount: 1, // Reducido de 2 para más velocidad
              stringArrayWrappersChainedCalls: true,
              stringArrayWrappersParametersMaxCount: 3, // Reducido de 4
              stringArrayWrappersType: 'function',
              stringArrayThreshold: 0.6, // Reducido de 0.75 para más velocidad
              transformObjectKeys: true,
              unicodeEscapeSequence: false
            }
          })
        ] : [])
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
        // Minificación optimizada con Terser (balance velocidad/protección)
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: false, // Mantener console en desarrollo, eliminar en producción si quieres
            drop_debugger: true,
            pure_funcs: ['console.log'], // Eliminar console.log pero mantener otros
            passes: 2, // Reducido de 3 a 2 para más velocidad (sigue siendo efectivo)
            unsafe: true,
            unsafe_comps: true,
            unsafe_math: true,
            unsafe_methods: true,
            unsafe_proto: true,
            unsafe_regexp: true,
            unsafe_undefined: true,
            warnings: false
          },
          mangle: {
            properties: {
              regex: /^_/ // Mangle propiedades que empiezan con _
            },
            toplevel: true, // Mangle nombres de nivel superior
            safari10: true
          },
          format: {
            comments: false, // Eliminar todos los comentarios
            beautify: false
          }
        },
        rollupOptions: {
          input: path.resolve(__dirname, 'index.html'),
          output: {
            // Ofuscar nombres de archivos en producción
            entryFileNames: isProduction ? 'assets/[hash].js' : 'assets/[name].js',
            chunkFileNames: isProduction ? 'assets/[hash].js' : 'assets/[name].js',
            assetFileNames: isProduction ? 'assets/[hash].[ext]' : 'assets/[name].[ext]',
            // Compactar código
            compact: true,
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
