import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Button, ScrollView, Alert, TouchableOpacity, ActivityIndicator, Image } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Picker } from "@react-native-picker/picker";
import { ddmmToIso, isoToDdmm } from "../../../utils/formatDate";


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

const API_URL = "http://192.168.0.102:5000"; // Troque pelo seu IP

export default function EditarFiscalizacao() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [obraId, setObraId] = useState<string>("");
  const [data, setData] = useState("");
  const [status, setStatus] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [foto, setFoto] = useState<string>("");
  const [localizacao, setLocalizacao] = useState<{ lat: number; long: number }>({ lat: 0, long: 0 });

  useEffect(() => {
    async function fetchFiscalizacao() {
      try {
        const res = await fetch(`${API_URL}/fiscalizacoes/${id}`);
        const data = await res.json();
        setObraId(data.obra || "");
        setData(data.data ? isoToDdmm(data.data) : "");
        setStatus(data.status || "");
        setObservacoes(data.observacoes || "");
        setFoto(data.foto || "");
        setLocalizacao(data.localizacao || { lat: 0, long: 0 });
      } catch {
        Alert.alert("Erro ao carregar fiscalização.");
        router.back();
      } finally {
        setLoading(false);
      }
    }
    async function fetchObras() {
      try {
        const res = await fetch(`${API_URL}/obras`);
        const data = await res.json();
        setObras(data);
      } catch {
        setObras([]);
      }
    }
    fetchFiscalizacao();
    fetchObras();
  }, [id]);

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

  async function atualizarFiscalizacao() {
    if (!obraId || !data || !status || !observacoes) {
      Alert.alert("Preencha todos os campos obrigatórios!");
      return;
    }
    setSalvando(true);
    const payload: FiscalizacaoPayload = {
      data: ddmmToIso(data),
      status,
      observacoes,
      localizacao,
      foto,
      obra: obraId,
    };
    try {
      const res = await fetch(`${API_URL}/fiscalizacoes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        Alert.alert("Fiscalização atualizada com sucesso!");
        router.back();
      } else {
        const data = await res.json();
        Alert.alert("Erro ao atualizar fiscalização", data.error || "Erro desconhecido");
      }
    } catch (err) {
      Alert.alert("Erro de rede", "Não foi possível conectar ao backend.");
    } finally {
      setSalvando(false);
    }
  }

  if (loading) {
    return <ActivityIndicator size="large" color="#27ae60" style={{ marginTop: 64 }} />;
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontWeight: "bold", fontSize: 22, marginBottom: 16 }}>Editar Fiscalização</Text>

      <Text>Obra vinculada *</Text>
      <View style={{ borderWidth: 1, borderColor: "#ccc", borderRadius: 5, marginBottom: 10 }}>
        <Picker
          selectedValue={obraId}
          onValueChange={setObraId}
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

      <Button title={salvando ? "Salvando..." : "Salvar alterações"} onPress={atualizarFiscalizacao} disabled={salvando} color="#27ae60" />
    </ScrollView>
  );
}

const styles = {
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 5, padding: 10, marginBottom: 10 },
  button: { marginBottom: 12, backgroundColor: "#eee", padding: 10, alignItems: "center" }
};
