
const fs = require('fs');

function checkBalance(filename) {
    try {
        const lines = fs.readFileSync(filename, 'utf-8').split('\n');
        const stack = [];
        const pairs = { ')': '(', '}': '{', ']': '[' };

        for (let lineNum = 0; lineNum < lines.length; lineNum++) {
            const line = lines[lineNum];
            for (let charPos = 0; charPos < line.length; charPos++) {
                const char = line[charPos];
                if ('({['.includes(char)) {
                    stack.push({ char, line: lineNum + 1, pos: charPos + 1 });
                } else if (')}]'.includes(char)) {
                    if (stack.length === 0) {
                        console.log(`Error: Unmatched '${char}' at line ${lineNum + 1}:${charPos + 1}`);
                        return;
                    }

                    const last = stack.pop();
                    if (last.char !== pairs[char]) {
                        console.log(`Error: Mismatched '${char}' at line ${lineNum + 1}:${charPos + 1}. Expected closing for '${last.char}' from line ${last.line}:${last.pos}`);
                        return;
                    }
                }
            }
        }

        if (stack.length > 0) {
            const last = stack[stack.length - 1];
            console.log(`Error: Unclosed '${last.char}' from line ${last.line}:${last.pos}`);
        } else {
            console.log("All braces balanced!");
        }
    } catch (err) {
        console.error("Error reading file:", err);
    }
}

checkBalance('src/app/configuracion/page.tsx');
