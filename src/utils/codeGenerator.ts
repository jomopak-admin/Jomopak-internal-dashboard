export function generateCode(
  prefix: 'JOB' | 'RCV' | 'PRD' | 'WST' | 'PPR' | 'DSP' | 'FGS' | 'SPR' | 'QTE' | 'ART' | 'REL',
  existingCodes: string[],
  date: string,
): string {
  const period = date.replace(/-/g, '').slice(0, 6);
  const sequence = existingCodes.filter((code) => code.startsWith(`${prefix}-${period}-`)).length + 1;
  return `${prefix}-${period}-${String(sequence).padStart(3, '0')}`;
}
