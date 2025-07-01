export function tryParseJSON(raw: string, strict = true): any {
  try {
    let cleaned = raw
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .replace(/^\s*AI\s*[:\-]?\s*/gi, '')
      .trim();

    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1 || start >= end) throw new Error('Brak nawiasów.');

    cleaned = cleaned.substring(start, end + 1);

    const opens = [...cleaned.matchAll(/{/g)].length;
    const closes = [...cleaned.matchAll(/}/g)].length;
    if (strict && opens !== closes) {
      const diff = opens - closes;
      if (diff > 0) cleaned += '}'.repeat(diff);
      else cleaned = cleaned.slice(0, cleaned.length + diff);
    }

    return JSON.parse(cleaned);
  } catch (err) {
    console.error('❌ JSON.parse() failed:', err);
    return null;
  }
}
