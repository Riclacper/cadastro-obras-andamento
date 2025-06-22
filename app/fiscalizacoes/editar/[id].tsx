import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, Alert, ScrollView, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Picker } from "@react-native-picker/picker";
import { ddmmToIso, isoToDdmm } from "../../../utils/formatDate";
import Header from "../../../components/Header";
import { StyleSheet } from "react-native";

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
const API_URL = "http://192.168.0.102:5000";

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
    if (!result.canceled && result.assets && result.assets[0].base64) {
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
    <ScrollView contentContainerStyle={{ padding: 20, backgroundColor: "#f5f6fa", flexGrow: 1 }}>
      <Header />
      <Text style={styles.titulo}>Editar Fiscalização</Text>
      <Text style={styles.label}>Obra vinculada *</Text>
      <View style={styles.pickerBox}>
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
      <Text style={styles.label}>Data da fiscalização *</Text>
      <TextInput value={data} onChangeText={setData} placeholder="DD-MM-YYYY" style={styles.input} />
      <Text style={styles.label}>Status *</Text>
      <View style={styles.pickerBox}>
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
      <Text style={styles.label}>Observações *</Text>
      <TextInput value={observacoes} onChangeText={setObservacoes} multiline numberOfLines={3} style={styles.input} />
      <Text style={styles.label}>Foto</Text>
      <TouchableOpacity onPress={pickImage} style={styles.button}>
        <Text style={styles.buttonText}>{foto ? "Trocar foto" : "Tirar foto"}</Text>
      </TouchableOpacity>
      {foto ? <Image source={{ uri: foto }} style={{ width: 220, height: 150, borderRadius: 8, marginBottom: 12, alignSelf: "center" }} /> : null}
      <Text style={styles.label}>Localização (GPS)</Text>
      <TouchableOpacity onPress={obterLocalizacao} style={styles.button}>
        <Text style={styles.buttonText}>Obter localização atual</Text>
      </TouchableOpacity>
      {localizacao.lat !== 0 && (
        <Text style={{ marginBottom: 14, textAlign: "center" }}>
          Lat: {localizacao.lat.toFixed(5)} | Long: {localizacao.long.toFixed(5)}
        </Text>
      )}
      <TouchableOpacity style={styles.button} onPress={atualizarFiscalizacao} disabled={salvando}>
        <Text style={styles.buttonText}>{salvando ? "Salvando..." : "Salvar alterações"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: "#27ae60",
    padding: 12,
    marginBottom: 14,
    backgroundColor: "#fff",
    color: "#222",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  button: {
    marginBottom: 14,
    backgroundColor: "#27ae60",
    padding: 14,
    alignItems: "center",
    borderRadius: 8,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  titulo: {
    fontWeight: "bold",
    fontSize: 24,
    color: "#2980b9",
    marginBottom: 18,
    textAlign: "center"
  },
  label: { fontWeight: "bold", color: "#222", marginBottom: 4 },
  pickerBox: {
    borderWidth: 1,
    borderColor: "#27ae60",
    borderRadius: 8,
    marginBottom: 14,
    backgroundColor: "#fff",
    overflow: "hidden"
  }
});
