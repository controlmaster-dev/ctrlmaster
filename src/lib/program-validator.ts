
export interface ProgramStatus {
    code: string;
    originalCode?: string;
    status: 'MISSING' | 'REMOVED' | 'RECORDING' | 'ARCHIVE' | 'VALID' | 'INVALID_FORMAT' | 'CORRECTED';
    reason?: string;
}

export interface DayData {
    dayHeader: string;
    programs: ProgramStatus[];
}

// Rules Configuration
const RULES_REMOVE = new Set(['VAVIV', 'PRIME', 'TRANS', 'AQUEN', 'ENORA']);
const RULES_RECORDING = new Set(['MESAR', 'ENBUE']);
const RULES_ARCHIVE = new Set([
    'PVIDA', 'TETEL', 'AUNAV', 'ESTRA', 'EKIDS', 'CIAMU', 'GUADM',
    'ABIER', 'PALAB', 'CREAT', 'ESANO', 'VOLAD', 'SERMO', 'VIGIL',
    'XTOSL', 'PATIM', 'MISRA', 'LECPU', 'ESTRA', 'CHIQU', 'TSORO'
]);

// Regex for Program Codes: 5 Letters + Digits (e.g., CLAMO334)
const CODE_REGEX = /^[A-Z]{5}\d+$/;

const DAYS = new Set(['lunes', 'martes', 'miércoles', 'miercoles', 'jueves', 'viernes', 'sábado', 'sabado', 'domingo']);

// Levenshtein Distance Algorithm
function levenshteinDistance(a: string, b: string): number {
    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) == a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    Math.min(
                        matrix[i][j - 1] + 1, // insertion
                        matrix[i - 1][j] + 1 // deletion
                    )
                );
            }
        }
    }

    return matrix[b.length][a.length];
}

export function parseProgramList(inputText: string, knowledgeBaseText: string = ''): DayData[] {
    const lines = inputText.split('\n').map(l => l.trim()).filter(Boolean);
    const days: DayData[] = [];
    let currentDay: DayData | null = null;
    const globalSeenCodes = new Set<string>();

    // Parse Knowledge Base (Extract valid prefixes/codes)
    // Expecting lists of codes, we extract the 5-letter prefixes if possible, or just the full valid codes.
    // For auto-correction, we primarily need to know "What is a valid program prefix?".
    // Heuristic: Input "CLAMO334" -> Learn "CLAMO".
    const knownPrefixes = new Set<string>();
    if (knowledgeBaseText) {
        // Clean and split
        const kbTokens = knowledgeBaseText.toUpperCase().split(/[^A-Z]+/);
        for (const token of kbTokens) {
            if (token.length >= 3) knownPrefixes.add(token);
        }
    }

    for (const line of lines) {
        // 1. Identify Headers (Must contain a Day Name)
        const lowerLine = line.toLowerCase();
        // Day detection
        const isHeader = Array.from(DAYS).some(d => lowerLine.includes(d));

        if (isHeader) {
            currentDay = {
                dayHeader: line,
                programs: []
            };
            days.push(currentDay);
            continue;
        }

        // 2. Process Content
        if (currentDay) {
            const upperLine = line.toUpperCase();

            // Extract Components for Fuzzy Matching
            // alphaKey: All letters (e.g. "EKID0S47" -> "EKIDS", "PENTH442e" -> "PENTHE")
            const alphaKey = upperLine.replace(/[^A-Z]/g, '');
            // numericPart: All digits
            const numericPart = upperLine.replace(/\D/g, '');

            let finalCode = upperLine;
            let status: ProgramStatus['status'] = 'MISSING';
            let reason: string | undefined = undefined;
            let originalCode: string | undefined = undefined;

            // Strategy:
            // 1. Is alphaKey in KnownPrefixes? -> TRUSTED (Existing valid code)
            // 2. If not, try Fuzzy Match against KnownPrefixes.
            // 3. If Fuzzy Match found -> CORRECTED.
            // 4. If no fuzzy match but formatted correctly -> TRUSTED (New/Unknown Code)

            const isKnown = knownPrefixes.has(alphaKey);
            let corrected = false;
            let bestMatch = '';

            if (!isKnown && knownPrefixes.size > 0 && alphaKey.length >= 3) {
                // Try Fuzzy Correction
                let minDist = 3;
                // Optimization: Tolerance could be dynamic based on length, but 2 is safe for length 5.

                for (const prefix of Array.from(knownPrefixes)) {
                    const dist = levenshteinDistance(alphaKey, prefix);
                    if (dist < minDist) {
                        minDist = dist;
                        bestMatch = prefix;
                    }
                }

                if (bestMatch && minDist <= 2) {
                    // We found a likely correction
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
                // If NOT corrected, we check if it was valid to begin with
                if (CODE_REGEX.test(finalCode)) {
                    // It is a valid format (e.g. "NEWCD123"). 
                    // Since we didn't find a close fuzzy match in the KB, we assume it's a valid query for a code we just don't know yet (or it's correct).
                    // Status remains MISSING (or Rule applied later).
                } else {
                    // Check potential garbage vs invalid format
                    if (alphaKey.length > 0 && (numericPart.length > 0 || alphaKey.length >= 3)) {
                        status = 'INVALID_FORMAT';
                        reason = 'Formato irreconocible';
                    } else {
                        // Likely noise
                        continue;
                    }
                }
            }

            // --- RULES ENGINE ---

            // Deduplication (Global)
            if (globalSeenCodes.has(finalCode)) {
                continue;
            }
            globalSeenCodes.add(finalCode);

            let baseCode = finalCode.match(/^([A-Z]+)/)?.[1] || '';

            // Check Rules
            let ruleStatus: ProgramStatus['status'] | null = null;
            let ruleReason = '';

            if (RULES_REMOVE.has(baseCode)) {
                ruleStatus = 'REMOVED';
                ruleReason = 'Omitir (En Vivo / No anotar)';
            } else if (RULES_RECORDING.has(baseCode)) {
                ruleStatus = 'RECORDING';
                ruleReason = 'Grabación (Mantener / No pedir)';
            } else if (RULES_ARCHIVE.has(baseCode)) {
                ruleStatus = 'ARCHIVE';
                ruleReason = 'Del archive';
            }

            if (ruleStatus) {
                if (status === 'CORRECTED') {
                    status = ruleStatus;
                    reason = `${ruleReason} (Corregido de ${originalCode || line})`;
                    originalCode = line;
                } else {
                    status = ruleStatus;
                    reason = ruleReason;
                }
            }

            currentDay.programs.push({
                code: finalCode,
                originalCode,
                status,
                reason
            });
        }
    }

    return days;
}
