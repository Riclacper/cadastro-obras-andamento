import * as Location from "expo-location";

export interface Localizacao {
  lat: number;
  long: number;
  endereco?: string;
  precisao?: number;
  capturadoEm?: string;
  googleMapsUrl?: string;
}

export async function obterLocalizacaoAtual(): Promise<Localizacao> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== "granted") throw new Error("Permissão negada para acessar localização.");
  const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  const { latitude, longitude, accuracy } = position.coords;
  let endereco = "";
  try {
    const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
    endereco = [address?.street, address?.streetNumber, address?.district, address?.city, address?.region]
      .filter(Boolean).join(", ");
  } catch {
    // A coordenada continua válida mesmo quando a geocodificação não estiver disponível.
  }
  return {
    lat: latitude,
    long: longitude,
    endereco: endereco || undefined,
    precisao: typeof accuracy === "number" ? Math.round(accuracy) : undefined,
    capturadoEm: new Date().toISOString(),
    googleMapsUrl: `https://www.google.com/maps?q=${latitude},${longitude}`,
  };
}
