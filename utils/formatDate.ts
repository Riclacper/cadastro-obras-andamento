// utils/formatDate.ts
export function ddmmToIso(data: string) {
  const clean = data.trim().replace(/\//g, "-");
  const partes = clean.split("-");
  if (partes.length === 3 && isValidDdmm(clean)) {
    const [dia, mes, ano] = partes;
    return `${ano}-${mes}-${dia}`;
  }
  return data;
}

export function isValidDdmm(data: string) {
  const match = data.trim().match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
  if (!match) return false;

  const [, dia, mes, ano] = match;
  const date = new Date(Date.UTC(Number(ano), Number(mes) - 1, Number(dia)));
  return (
    date.getUTCFullYear() === Number(ano) &&
    date.getUTCMonth() === Number(mes) - 1 &&
    date.getUTCDate() === Number(dia)
  );
}

export function maskDdmm(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function isoToDdmm(data: string) {
  // "2022-02-13" => "13/02/2022"
  const partes = data.slice(0, 10).split("-");
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
  return data;
}
