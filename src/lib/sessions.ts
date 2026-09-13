export function sanitizeSessionNotes(notes: string): string {
  return notes.trim().replace(/\s+/g, ' ').slice(0, 1000);
}
