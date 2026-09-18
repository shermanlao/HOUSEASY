/** App basePath — must match next.config.js */
export const BASE_PATH = '/rental';

/** Prefix a root-absolute path for raw fetch / URL construction (Link/redirect need no helper). */
export function withBasePath(path: string): string {
  if (!path.startsWith('/')) return path;
  if (path === BASE_PATH || path.startsWith(`${BASE_PATH}/`)) return path;
  return `${BASE_PATH}${path}`;
}
