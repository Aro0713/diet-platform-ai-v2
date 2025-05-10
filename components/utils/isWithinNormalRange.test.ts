import { isWithinNormalRange } from '../../isWithinNormalRange';



describe('isWithinNormalRange', () => {
  it('should return true for glukoza na czczo = 85', () => {
    expect(isWithinNormalRange('glukoza', 85, { note: 'na czczo' })).toBe(true);
  });

  it('should return false for glukoza na czczo = 120', () => {
    expect(isWithinNormalRange('glukoza', 120, { note: 'na czczo' })).toBe(false);
  });

  it('should return true for glukoza po posiłku = 135', () => {
    expect(isWithinNormalRange('glukoza', 135, { note: 'po posiłku' })).toBe(true);
  });

  it('should return false for glukoza po posiłku = 160', () => {
    expect(isWithinNormalRange('glukoza', 160, { note: 'po posiłku' })).toBe(false);
  });

  it('should return true for TSH = 2.0', () => {
    expect(isWithinNormalRange('TSH', 2.0)).toBe(true);
  });

  it('should return false for TSH = 5.0', () => {
    expect(isWithinNormalRange('TSH', 5.0)).toBe(false);
  });

  it('should return true for kreatynina (kobieta) = 1.0', () => {
    expect(isWithinNormalRange('kreatynina', 1.0, { sex: 'female' })).toBe(true);
  });

  it('should return false for kreatynina (kobieta) = 1.5', () => {
    expect(isWithinNormalRange('kreatynina', 1.5, { sex: 'female' })).toBe(false);
  });

  it('should return true for LDL = 90', () => {
    expect(isWithinNormalRange('ldl', 90)).toBe(true);
  });

  it('should return false for LDL = 160', () => {
    expect(isWithinNormalRange('ldl', 160)).toBe(false);
  });
});
