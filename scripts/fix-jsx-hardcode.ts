


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


function convertJSXCall(content: string): string {

  const importPattern = /import\s*\{[^}]*jsx[^}]*\}\s*from\s*["']react\/jsx-runtime["'];?\s*\n?/g;
  let fixedContent = content.replace(importPattern, '');

  const jsxPattern = /_(jsx|jsxs)\s*\(\s*["']([^"']+)["']\s*,\s*\{([^}]*)\}([^)]*)\)/g;

  fixedContent = fixedContent.replace(jsxPattern, (match, type, tag, props, rest) => {
    const propsStr = props.trim();
    const restStr = rest.trim();

    if (restStr.includes('children:') || restStr.includes('children:')) {
      const childrenMatch = restStr.match(/children:\s*(.+?)(?:,\s*)?$/);
      if (childrenMatch) {
        let children = childrenMatch[1];

        if (children.startsWith('[') && children.endsWith(']')) {
          children = children.slice(1, -1);
        }

        const cleanProps = propsStr ? ` ${propsStr}` : '';
        return `<${tag}${cleanProps}>${children}</${tag}>`;
      }
    }

    const cleanProps = propsStr ? ` ${propsStr}` : '';
    return `<${tag}${cleanProps} />`;
  });

  return fixedContent;
}

function processFile(filePath: string): { fixed: boolean; error?: string } {
  try {
    const content = readFileSync(filePath, 'utf-8');

    if (!content.includes('react/jsx-runtime')) {
      return { fixed: false };
    }

    const fixedContent = convertJSXCall(content);

    if (fixedContent === content) {
      return { fixed: false };
    }

    writeFileSync(filePath, fixedContent, 'utf-8');
    return { fixed: true };
  } catch (error) {
    return { fixed: false, error: String(error) };
  }
}

function processDirectory(dir: string, results: { fixed: string[]; errors: { file: string; error: string }[] }): void {
  try {
    const files = readdirSync(dir);

    for (const file of files) {
      const filePath = join(dir, file);
      const stats = statSync(filePath);

      if (stats.isDirectory()) {
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

function main() {
  console.log('🔧 Iniciando corrección de JSX hardcodeado...\n');

  const results: { fixed: string[]; errors: { file: string; error: string }[] } = {
    fixed: [],
    errors: [],
  };

  const srcDir = join(__dirname, '..', 'src');
  processDirectory(srcDir, results);

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

main();
