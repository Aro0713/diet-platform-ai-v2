export function isWithinNormalRange(name: string, value: number, options: any = {}): boolean {
  name = name.toLowerCase();

  if (name === 'glukoza') {
    if (options.note === 'na czczo') return value <= 100;
    if (options.note === 'po posiłku') return value <= 140;
  }

  if (name === 'tsh') {
    return value >= 0.27 && value <= 4.2;
  }

  if (name === 'kreatynina') {
    if (options.sex === 'female') return value <= 1.1;
    return value <= 1.3;
  }

  if (name === 'ldl') {
    return value < 100;
  }

  return false;
}
