// utils/formatDate.ts
export function ddmmToIso(data: string) {
  // Aceita "13-02-2022" OU "13/02/2022"
  const clean = data.replace(/\//g, "-"); // troca barras por traços
  const partes = clean.split("-");
  if (partes.length === 3) {
    return `${partes[2]}-${partes[1]}-${partes[0]}`;
  }
  return data;
}

export function isoToDdmm(data: string) {
  // "2022-02-13" => "13-02-2022"
  const partes = data.split("-");
  if (partes.length === 3) {
    return `${partes[2]}-${partes[1]}-${partes[0]}`;
  }
  return data;
}
