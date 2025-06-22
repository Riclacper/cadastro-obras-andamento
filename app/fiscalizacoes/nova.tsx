import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Button, ScrollView, Alert, TouchableOpacity, ActivityIndicator, Image } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Picker } from "@react-native-picker/picker";
import { ddmmToIso } from "../../utils/formatDate";

interface Obra {
  _id: string;
  nome: string;
}

interface FiscalizacaoPayload {
  data: string;
  status: string;
  observacoes: string;
  localizacao: { lat: number; long: number };
  foto: string;
  obra: string;
}

const API_URL = "http://192.168.0.102:5000"; // Troque pelo IP do seu backend

export default function NovaFiscalizacao() {
  const router = useRouter();
  const params = useLocalSearchParams<{ obraId?: string }>();

  const [obras, setObras] = useState<Obra[]>([]);
  const [obraId, setObraId] = useState<string>(params.obraId || "");
  const [data, setData] = useState("");
  const [status, setStatus] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [foto, setFoto] = useState<string>("");
  const [localizacao, setLocalizacao] = useState<{ lat: number; long: number }>({ lat: 0, long: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchObras() {
      try {
        const res = await fetch(`${API_URL}/obras`);
        const data = await res.json();
        setObras(data);
      } catch {
        setObras([]);
      }
    }
    fetchObras();
  }, []);

  async function pickImage() {
    let permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permissão negada para acessar a câmera!");
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      quality: 0.6,
      base64: true,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!result.cancelled && result.assets && result.assets[0].base64) {
      setFoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  }

  async function obterLocalizacao() {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permissão negada para acessar localização!");
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    setLocalizacao({
      lat: location.coords.latitude,
      long: location.coords.longitude,
    });
  }

  async function cadastrarFiscalizacao() {
    if (!obraId || !data || !status || !observacoes) {
      Alert.alert("Preencha todos os campos obrigatórios!");
      return;
    }
    setLoading(true);
    const payload: FiscalizacaoPayload = {
      data: ddmmToIso(data),      
      status,
      observacoes,
      localizacao,
      foto,
      obra: obraId,
    };
    try {
      const response = await fetch(`${API_URL}/fiscalizacoes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        Alert.alert("Fiscalização cadastrada com sucesso!");
        setData("");
        setStatus("");
        setObservacoes("");
        setFoto("");
        setLocalizacao({ lat: 0, long: 0 });
        if (!params.obraId) setObraId("");
        router.back();
      } else {
        const data = await response.json();
        Alert.alert("Erro ao cadastrar fiscalização", data.error || "Erro desconhecido");
      }
    } catch (err) {
      Alert.alert("Erro de rede", "Não foi possível conectar ao backend.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontWeight: "bold", fontSize: 22, marginBottom: 16 }}>Nova Fiscalização</Text>

      <Text>Obra vinculada *</Text>
      <View style={{ borderWidth: 1, borderColor: "#ccc", borderRadius: 5, marginBottom: 10 }}>
        <Picker
          selectedValue={obraId}
          onValueChange={setObraId}
          enabled={!params.obraId}
          style={{ width: "100%" }}
        >
          <Picker.Item label="Selecione a obra" value="" />
          {obras.map(o => (
            <Picker.Item key={o._id} label={o.nome} value={o._id} />
          ))}
        </Picker>
      </View>

      <Text>Data da fiscalização *</Text>
      <TextInput value={data} onChangeText={setData} placeholder="DD-MM-YYYY" style={styles.input} />

      <Text>Status *</Text>
      <View style={{ borderWidth: 1, borderColor: "#ccc", borderRadius: 5, marginBottom: 10 }}>
        <Picker
          selectedValue={status}
          onValueChange={setStatus}
          style={{ width: "100%" }}
        >
          <Picker.Item label="Selecione o status" value="" />
          <Picker.Item label="Em dia" value="Em dia" />
          <Picker.Item label="Atrasada" value="Atrasada" />
          <Picker.Item label="Parada" value="Parada" />
        </Picker>
      </View>

      <Text>Observações *</Text>
      <TextInput value={observacoes} onChangeText={setObservacoes} multiline numberOfLines={3} style={styles.input} />

      <Text>Foto</Text>
      <TouchableOpacity onPress={pickImage} style={styles.button}>
        <Text>{foto ? "Trocar foto" : "Tirar foto"}</Text>
      </TouchableOpacity>
      {foto ? <Image source={{ uri: foto }} style={{ width: 220, height: 150, borderRadius: 8, marginBottom: 12 }} /> : null}

      <Text>Localização (GPS)</Text>
      <TouchableOpacity onPress={obterLocalizacao} style={styles.button}>
        <Text>Obter localização atual</Text>
      </TouchableOpacity>
      {localizacao.lat !== 0 && (
        <Text>Lat: {localizacao.lat.toFixed(5)} | Long: {localizacao.long.toFixed(5)}</Text>
      )}

      <Button title={loading ? "Salvando..." : "Cadastrar Fiscalização"} onPress={cadastrarFiscalizacao} disabled={loading} color="#27ae60" />
    </ScrollView>
  );
}

const styles = {
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 5, padding: 10, marginBottom: 10 },
  button: { marginBottom: 12, backgroundColor: "#eee", padding: 10, alignItems: "center" }
};
