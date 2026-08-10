import { resolve } from 'path';

export function resolveUploadDir(configuredValue: string | undefined): string {
  const dir = configuredValue ?? (process.env.VERCEL ? '/tmp' : './uploads');
  return resolve(dir);
}
