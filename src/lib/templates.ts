export function sanitizeTemplateTitle(value: string): string {
  return value.trim().replace(/\s+/g, ' ').slice(0, 60);
}
