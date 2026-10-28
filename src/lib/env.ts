// Fail loudly at the call site instead of passing undefined around.
export function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}
