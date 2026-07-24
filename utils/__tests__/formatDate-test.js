import { ddmmToIso, isValidDdmm, isoToDdmm } from '../formatDate';

describe('formatDate', () => {
  it('converte datas válidas para ISO', () => {
    expect(ddmmToIso('29-02-2024')).toBe('2024-02-29');
    expect(ddmmToIso('13/02/2022')).toBe('2022-02-13');
  });

  it('rejeita datas inexistentes', () => {
    expect(isValidDdmm('31-02-2025')).toBe(false);
    expect(isValidDdmm('01-13-2025')).toBe(false);
    expect(isValidDdmm('01-01-2025')).toBe(true);
  });

  it('converte datas ISO para o formato exibido', () => {
    expect(isoToDdmm('2022-02-13')).toBe('13/02/2022');
  });
});
