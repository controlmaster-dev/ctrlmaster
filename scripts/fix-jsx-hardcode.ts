/**
 * Script para corregir JSX hardcodeado en archivos TypeScript/TSX
 * Convierte llamadas a _jsx() y _jsxs() de vuelta a JSX normal
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface JSXCallMatch {
  fullMatch: string;
  type: 'jsx' | 'jsxs';
  tag: string;
  props: string;
  rest: string;
  indent: string;
}

/**
 * Convierte una llamada a _jsx o _jsxs de vuelta a JSX
 */
function convertJSXCall(content: string): string {
  // Patrón para encontrar imports de react/jsx-runtime
  const importPattern = /import\s*\{[^}]*jsx[^}]*\}\s*from\s*["']react\/jsx-runtime["'];?\s*\n?/g;
  let fixedContent = content.replace(importPattern, '');
  
  // Patrón para encontrar llamadas a _jsx y _jsxs
  // Este es un patrón simplificado que funciona para la mayoría de los casos
  const jsxPattern = /_(jsx|jsxs)\s*\(\s*["']([^"']+)["']\s*,\s*\{([^}]*)\}([^)]*)\)/g;
  
  fixedContent = fixedContent.replace(jsxPattern, (match, type, tag, props, rest) => {
    const propsStr = props.trim();
    const restStr = rest.trim();
    
    // Si hay children en rest
    if (restStr.includes('children:') || restStr.includes('children:')) {
      const childrenMatch = restStr.match(/children:\s*(.+?)(?:,\s*)?$/);
      if (childrenMatch) {
        let children = childrenMatch[1];
        
        // Si children es un array, convertir a JSX
        if (children.startsWith('[') && children.endsWith(']')) {
          children = children.slice(1, -1);
        }
        
        const cleanProps = propsStr ? ` ${propsStr}` : '';
        return `<${tag}${cleanProps}>${children}</${tag}>`;
      }
    }
    
    // Si no hay children
    const cleanProps = propsStr ? ` ${propsStr}` : '';
    return `<${tag}${cleanProps} />`;
  });
  
  return fixedContent;
}

/**
 * Procesa un archivo individual
 */
function processFile(filePath: string): { fixed: boolean; error?: string } {
  try {
    const content = readFileSync(filePath, 'utf-8');
    
    // Solo procesar archivos que importen react/jsx-runtime
    if (!content.includes('react/jsx-runtime')) {
      return { fixed: false };
    }
    
    const fixedContent = convertJSXCall(content);
    
    // Verificar si hubo cambios
    if (fixedContent === content) {
      return { fixed: false };
    }
    
    writeFileSync(filePath, fixedContent, 'utf-8');
    return { fixed: true };
  } catch (error) {
    return { fixed: false, error: String(error) };
  }
}

/**
 * Procesa recursivamente un directorio
 */
function processDirectory(dir: string, results: { fixed: string[]; errors: { file: string; error: string }[] }): void {
  try {
    const files = readdirSync(dir);
    
    for (const file of files) {
      const filePath = join(dir, file);
      const stats = statSync(filePath);
      
      if (stats.isDirectory()) {
        // Ignorar node_modules, .next, .git, dist, build
        if (
!['node_modules', '.next', '.git', 'dist', 'build', '.vercel'].includes(file)
) {
          processDirectory(filePath, results);
        }
      } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        const result = processFile(filePath);
        if (result.fixed) {
          results.fixed.push(filePath);
        } else if (result.error) {
          results.errors.push({ file: filePath, error: result.error });
        }
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${dir}:`, error);
  }
}

/**
 * Función principal
 */
function main() {
  console.log('🔧 Iniciando corrección de JSX hardcodeado...\n');
  
  const results: { fixed: string[]; errors: { file: string; error: string }[] } = {
    fixed: [],
    errors: [],
  };
  
  // Procesar el directorio src
  const srcDir = join(__dirname, '..', 'src');
  processDirectory(srcDir, results);
  
  // Mostrar resultados
  console.log(`✅ Archivos corregidos: ${results.fixed.length}`);
  if (results.fixed.length > 0) {
    results.fixed.forEach(file => {
      console.log(`   - ${file}`);
    });
  }
  
  console.log(`\n❌ Errores: ${results.errors.length}`);
  if (results.errors.length > 0) {
    results.errors.forEach(({ file, error }) => {
      console.log(`   - ${file}: ${error}`);
    });
  }
  
  if (results.fixed.length === 0 && results.errors.length === 0) {
    console.log('\n✨ No se encontraron archivos con JSX hardcodeado.');
  } else {
    console.log('\n✨ Proceso completado!');
  }
}

// Ejecutar
main();
