
const fs = require('fs');

function checkBalance(filename) {
    try {
        const text = fs.readFileSync(filename, 'utf-8');
        const stack = [];
        const pairs = { ')': '(', '}': '{', ']': '[' };

        let inString = false;
        let stringChar = '';
        let inComment = false; // // style
        let inBlockComment = false; // /* style */
        let inTemplate = false; // ` style

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const nextChar = text[i + 1] || '';
            const prevChar = text[i - 1] || '';

            // Handle Strings/Comments state
            if (inComment) {
                if (char === '\n') inComment = false;
                continue;
            }
            if (inBlockComment) {
                if (char === '*' && nextChar === '/') {
                    inBlockComment = false;
                    i++;
                }
                continue;
            }
            if (inString) {
                if (char === stringChar && prevChar !== '\\') inString = false;
                continue;
            }
            if (inTemplate) {
                if (char === '`' && prevChar !== '\\') inTemplate = false;
                // Note: Does not handle ${} interpolation diving back into code, but sufficient for basic brace check usually
                else if (char === '$' && nextChar === '{') {
                    // This is the hard part - simplified: treat ${} as code? 
                    // For now, let's just ignore template content except braces? No, that's risky.
                    // Simplest approach: Don't ignore templates, just standard strings.
                    // Most errors are in standard code.
                }
                // continue; // Let's NOT ignore template content to catch ${...} braces
            }

            // Start states
            if (char === '/' && nextChar === '/') {
                inComment = true;
                i++;
                continue;
            }
            if (char === '/' && nextChar === '*') {
                inBlockComment = true;
                i++;
                continue;
            }
            if (char === '"' || char === "'") {
                inString = true;
                stringChar = char;
                continue;
            }
            if (char === '`') {
                // inTemplate = true; // Treating backticks as code for now to handle ${} braces correctly
                continue;
            }

            // Check Braces
            // Get line number for reporting
            const lineNum = text.substring(0, i).split('\n').length;

            if ('({['.includes(char)) {
                stack.push({ char, line: lineNum, index: i });
            } else if (')}]'.includes(char)) {
                if (stack.length === 0) {
                    console.log(`Error: Unmatched '${char}' at line ${lineNum + 1}`);
                    return;
                }

                const last = stack.pop();
                if (last.char !== pairs[char]) {
                    console.log(`Error: Mismatched '${char}' at line ${lineNum + 1}:${charPos + 1}. Expected closing for '${last.char}' from line ${last.line}:${last.pos}`);
                    return;
                }

                if (stack.length === 0) {
                    console.log(`Stack became empty at line ${lineNum} after closing '${last.char}' from line ${last.line}`);
                }
            }
        }

        if (stack.length > 0) {
            const last = stack[stack.length - 1];
            console.log(`Error: Unclosed '${last.char}' from line ${last.line}`);
        } else {
            console.log("All braces balanced!");
        }
    } catch (err) {
        console.error("Error reading file:", err);
    }
}

checkBalance('src/app/configuracion/page.tsx');
