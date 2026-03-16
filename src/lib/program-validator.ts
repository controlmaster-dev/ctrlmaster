
const RULES_REMOVE = new Set(['VAVIV', 'PRIME', 'TRANS', 'AQUEN', 'ENORA']);
const RULES_RECORDING = new Set(['MESAR', 'ENBUE']);
const RULES_ARCHIVE = new Set([
  'PVIDA', 'TETEL', 'AUNAV', 'ESTRA', 'EKIDS', 'CIAMU', 'GUADM',
  'ABIER', 'PALAB', 'CREAT', 'ESANO', 'VOLAD', 'SERMO', 'VIGIL',
  'XTOSL', 'PATIM', 'MISRA', 'LECPU', 'ESTRA', 'CHIQU', 'TSORO']
);


const CODE_REGEX = /^[A-Z]{5}\d+$/;

const DAYS = new Set(['lunes', 'martes', 'miércoles', 'miercoles', 'jueves', 'viernes', 'sábado', 'sabado', 'domingo']);


function levenshteinDistance(a, b) {
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
          matrix[i - 1][j - 1] + 1,
          Math.min(
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

export function parseProgramList(inputText, knowledgeBaseText = '') {
  const lines = inputText.split('\n').map((l) => l.trim()).filter(Boolean);
  const days = [];
  let currentDay = null;
  const globalSeenCodes = new Set();





  const knownPrefixes = new Set();
  if (knowledgeBaseText) {

    const kbTokens = knowledgeBaseText.toUpperCase().split(/[^A-Z]+/);
    for (const token of kbTokens) {
      if (token.length >= 3) knownPrefixes.add(token);
    }
  }

  for (const line of lines) {

    const lowerLine = line.toLowerCase();

    const isHeader = Array.from(DAYS).some((d) => lowerLine.includes(d));

    if (isHeader) {
      currentDay = {
        dayHeader: line,
        programs: []
      };
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
      const isKnown = knownPrefixes.has(alphaKey);
      let corrected = false;
      let bestMatch = '';

      if (!isKnown && knownPrefixes.size > 0 && alphaKey.length >= 3) {

        let minDist = 3;


        for (const prefix of Array.from(knownPrefixes) as string[]) {
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



        } else {

          if (alphaKey.length > 0 && (numericPart.length > 0 || alphaKey.length >= 3)) {
            status = 'INVALID_FORMAT';
            reason = 'Formato irreconocible';
          } else {

            continue;
          }
        }
      }
      if (globalSeenCodes.has(finalCode)) {
        continue;
      }
      globalSeenCodes.add(finalCode);

      let baseCode = finalCode.match(/^([A-Z]+)/)?.[1] || '';


      let ruleStatus = null;
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