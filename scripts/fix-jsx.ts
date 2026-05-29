import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

function findMatchingBrace(content: string, startIndex: number): number {
  let depth = 0;
  for (let i = startIndex; i < content.length; i++) {
    if (content[i] === '{') depth++;
    else if (content[i] === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function findMatchingParen(content: string, startIndex: number): number {
  let depth = 0;
  for (let i = startIndex; i < content.length; i++) {
    if (content[i] === '(') depth++;
    else if (content[i] === ')') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function restoreJSX(content: string): string {
  let result = content;


  result = result.replace(/import\s*\{[^}]*(jsx|jsxs)[^}]*\}\s*from\s*["']react\/jsx-runtime["'];?\n?/g, '');

  let changed = true;
  while (changed) {
    changed = false;

    const match = result.match(/_(jsx|jsxs)\s*\(/);
    if (!match) break;

    const startIdx = match.index!;
    const openParenIdx = result.indexOf('(', startIdx);
    const closeParenIdx = findMatchingParen(result, openParenIdx);

    if (closeParenIdx === -1) break;

    const fullCall = result.substring(startIdx, closeParenIdx + 1);
    const argsContent = result.substring(openParenIdx + 1, closeParenIdx);

    const commaIdx = argsContent.indexOf(',');
    if (commaIdx === -1) {
       const tag = argsContent.trim().replace(/["']/g, '');
       result = result.substring(0, startIdx) + `<${tag} />` + result.substring(closeParenIdx + 1);
       changed = true;
       continue;
    }

    const tag = argsContent.substring(0, commaIdx).trim().replace(/["']/g, '');
    const propsRaw = argsContent.substring(commaIdx + 1).trim();

    if (propsRaw.startsWith('{')) {
       const propsEndIdx = findMatchingBrace(propsRaw, 0);
       if (propsEndIdx !== -1) {
         const propsObj = propsRaw.substring(1, propsEndIdx).trim();

         let children = "";
         let propsWithoutChildren = propsObj;

         const childrenMatch = propsObj.match(/,?\s*children:\s*/);
         if (childrenMatch) {
            const childrenStartIdx = childrenMatch.index!;
            const childrenValueStartIdx = childrenStartIdx + childrenMatch[0].length;

            children = propsObj.substring(childrenValueStartIdx).trim();
            propsWithoutChildren = propsObj.substring(0, childrenStartIdx).trim();


            if (children.startsWith('[') && children.endsWith(']')) {
               children = children.substring(1, children.length - 1);
            }
         }


         let attributes = propsWithoutChildren
            .replace(/className:\s*([^,]+)/g, 'className={$1}')
            .replace(/ref:\s*([^,]+)/g, 'ref={$1}')
            .replace(/\.\.\.props/g, '{...props}')

            ;

         let replacement;
         if (children) {
            replacement = `<${tag} ${attributes}>${children}</${tag}>`;
         } else {
            replacement = `<${tag} ${attributes} />`;
         }

         result = result.substring(0, startIdx) + replacement + result.substring(closeParenIdx + 1);
         changed = true;
       }
    }


    if (!changed) {


       result = result.substring(0, startIdx) + "TRANSFORMED_ERROR" + result.substring(startIdx + 4);
    }
  }

  return result.replace(/TRANSFORMED_ERROR/g, '_jsx');
}

function processItem(itemPath: string) {
  const stats = statSync(itemPath);
  if (stats.isDirectory()) {
    const files = readdirSync(itemPath);
    for (const file of files) {
      const path = join(itemPath, file);
      if (file !== 'node_modules' && file !== '.next') processItem(path);
    }
  } else if (itemPath.endsWith('.tsx') || itemPath.endsWith('.ts')) {
    const content = readFileSync(itemPath, 'utf-8');
    if (content.includes('react/jsx-runtime')) {
      console.log(`Processing ${itemPath}...`);
      const restored = restoreJSX(content);
      writeFileSync(itemPath, restored, 'utf-8');
    }
  }
}

const targetItem = process.argv[2] || 'src';
processItem(targetItem);
console.log('Done.');
