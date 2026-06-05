export async function register() {
  const { validateProductionEnv } = await import('@/lib/envValidation');
  validateProductionEnv();
}
