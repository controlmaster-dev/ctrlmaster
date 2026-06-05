// CRON_SECRET se valida solo al invocar rutas /api/cron/* (requireCronAuth).
const PRODUCTION_REQUIRED_STRING_VARS = ['CREDENTIALS_ENC_KEY'] as const;

function resolveMongoUri(): string | undefined {
  return process.env.MONGODB_URI || process.env.MONGO_URI;
}

function isValidEncryptionKey(raw: string | undefined, label: string): string | null {
  if (!raw) return `${label} is required`;
  try {
    const key = Buffer.from(raw, 'base64');
    if (key.length !== 32) {
      return `${label} must decode to 32 bytes (base64)`;
    }
    return null;
  } catch {
    return `${label} must be valid base64`;
  }
}

export function getProductionEnvErrors(): string[] {
  if (process.env.NODE_ENV !== 'production') return [];
  // next build ejecuta instrumentation en fase de compilación sin variables de deploy.
  if (process.env.NEXT_PHASE === 'phase-production-build') return [];

  const errors: string[] = [];

  if (!resolveMongoUri()) {
    errors.push('MONGODB_URI (or MONGO_URI) is required');
  }

  for (const name of PRODUCTION_REQUIRED_STRING_VARS) {
    if (!process.env[name]?.trim()) {
      errors.push(`${name} is required`);
    }
  }

  const credentialsKeyError = isValidEncryptionKey(
    process.env.CREDENTIALS_ENC_KEY,
    'CREDENTIALS_ENC_KEY'
  );
  if (credentialsKeyError) errors.push(credentialsKeyError);

  const fileKeyRaw = process.env.FILE_ENC_KEY || process.env.CREDENTIALS_ENC_KEY;
  const fileKeyError = isValidEncryptionKey(
    fileKeyRaw,
    process.env.FILE_ENC_KEY ? 'FILE_ENC_KEY' : 'CREDENTIALS_ENC_KEY'
  );
  if (fileKeyError) errors.push(fileKeyError);

  return errors;
}

export function validateProductionEnv(): void {
  const errors = getProductionEnvErrors();
  if (errors.length === 0) return;

  throw new Error(
    `Invalid production environment:\n- ${errors.join('\n- ')}`
  );
}
