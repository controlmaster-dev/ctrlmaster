
import { parseProgramList, ProgramStatus, DayData } from './src/lib/program-validator';

// Mock types since we are running standalone without full TS env potentially
// But we import from src... let's replicate logic for test

const CODE_REGEX = /^[A-Z]{5}\d+$/;

function levenshteinDistance(a: string, b: string): number {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) == a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
                );
            }
        }
    }
    return matrix[b.length][a.length];
}

function testParse(inputText: string, knowledgeBaseText: string = ''): any[] {
    const lines = inputText.split('\n').map(l => l.trim()).filter(Boolean);
    const days: any[] = [];
    let currentDay: any = null;

    const knownPrefixes = new Set<string>();
    if (knowledgeBaseText) {
        const kbTokens = knowledgeBaseText.toUpperCase().split(/[^A-Z]+/);
        for (const token of kbTokens) {
            if (token.length >= 3) knownPrefixes.add(token);
        }
    }

    console.log(`Loaded ${knownPrefixes.size} Known Prefixes.`);

    for (const line of lines) {
        const lowerLine = line.toLowerCase();
        if (lowerLine.includes('domingo') || lowerLine.includes('lunes')) {
            currentDay = { dayHeader: line, programs: [] };
            days.push(currentDay);
            continue;
        }

        if (currentDay) {
            const upperLine = line.toUpperCase();
            const alphaKey = upperLine.replace(/[^A-Z]/g, '');
            const numericPart = upperLine.replace(/\D/g, '');

            let finalCode = upperLine;
            let status = 'MISSING';
            let reason = undefined;
            let originalCode = undefined;

            // NEW LOGIC
            const isKnown = knownPrefixes.has(alphaKey);
            let corrected = false;
            let bestMatch = '';

            if (!isKnown && knownPrefixes.size > 0 && alphaKey.length >= 3) {
                let minDist = 3;
                // Optimization: if alphaKey is 5 chars, we tolerate 2 edits. 
                // If 4 chars, maybe 1 edit is better?
                // But Levenshtein 1 makes 4->5.

                for (const prefix of Array.from(knownPrefixes)) {
                    const dist = levenshteinDistance(alphaKey, prefix);
                    if (dist < minDist) {
                        minDist = dist;
                        bestMatch = prefix;
                    }
                }

                if (bestMatch && minDist <= 2) {
                    if (numericPart.length > 0) {
                        finalCode = `${bestMatch}${numericPart}`;
                        status = 'CORRECTED';
                        originalCode = line;
                        reason = `Corregido: ${alphaKey} → ${bestMatch}`;
                    } else {
                        finalCode = bestMatch;
                        status = 'CORRECTED';
                        originalCode = line;
                        reason = `Corregido: ${alphaKey} → ${bestMatch} (Sin N°)`;
                    }
                    corrected = true;
                }
            }

            if (!corrected) {
                if (CODE_REGEX.test(finalCode)) {
                    // Valid format, uncorrected.
                } else {
                    if (alphaKey.length > 0 && (numericPart.length > 0 || alphaKey.length >= 3)) {
                        status = 'INVALID_FORMAT';
                        reason = 'Formato irreconocible';
                    } else {
                        continue;
                    }
                }
            } else {
                // If it was corrected, but matches an existing valid format in KB?
                // All good.
            }

            currentDay.programs.push({ code: finalCode, originalCode, status, reason });
        }
    }
    return days;
}


const kb = `PENTH, CLAMO, VENTR, JWORS, ESCRI, NDCON, NOMUC, RHEBR, GVICT, JERUS, LAKEW, ENCAS, NCASA, EXPMV, PACOR, SOMOH, VIVIE, MENVI, KINGC, JOELO, VIABU, TIEFE, VDVIC, TODOP, PROCL, EPHDN, JOYCE, REFLE, LPDMP, IMPMU, DIGOV, VIVEM, CIELO, CACIE, SHOWF, CASAD, SEXDI, AUNAV, VNPEM, VREAL, BAYLE, PALPU, PATIM, TRFLE, ARRAI, LECPU, ENBUE, EKIDS, VICTO, SANID, REPVI, DISRU, VENCE, GUADM, MILAD, VIDAF, LIBRO, CANTI, SUSLI, TRANS, SOLDA, ESTRA, ABIER, MATEO, SOBRE, COMPS, TSORO, PREST, EKIDS`;

const input = `
Domingo 25
EXPMB264
ARRAY1
NKASA224
KINGG609
VEBTR8123
NCON361
`;

console.log("--- START DEBUG ---");
const results = testParse(input, kb);
results.forEach(day => {
    day.programs.forEach(p => {
        console.log(`Code: ${p.code} | Status: ${p.status} | Original: ${p.originalCode || 'N/A'} | Reason: ${p.reason}`);
    });
});
console.log("--- END DEBUG ---");
