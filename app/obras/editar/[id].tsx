import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, Alert, ScrollView, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { ddmmToIso, isoToDdmm } from "../../../utils/formatDate";
import Header from "../../../components/Header";
import { StyleSheet } from "react-native";

interface Localizacao {
  lat: number;
  long: number;
}
interface ObraPayload {
  nome: string;
  responsavel: string;
  dataInicio: string;
  dataFim: string;
  localizacao: Localizacao;
  descricao: string;
  foto: string;
}
const API_URL = "http://192.168.0.102:5000"; // Altere para seu backend

export default function EditarObra() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [nome, setNome] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [descricao, setDescricao] = useState("");
  const [foto, setFoto] = useState<string>("");
  const [localizacao, setLocalizacao] = useState<Localizacao>({ lat: 0, long: 0 });

  useEffect(() => {
    async function fetchObra() {
      try {
        const res = await fetch(`${API_URL}/obras/${id}`);
        const data = await res.json();
        setNome(data.nome || "");
        setResponsavel(data.responsavel || "");
        setDataInicio(data.dataInicio ? isoToDdmm(data.dataInicio) : "");
        setDataFim(data.dataFim ? isoToDdmm(data.dataFim) : "");
        setDescricao(data.descricao || "");
        setFoto(data.foto || "");
        setLocalizacao(data.localizacao || { lat: 0, long: 0 });
      } catch {
        Alert.alert("Erro ao carregar dados da obra.");
        router.back();
      } finally {
        setLoading(false);
      }
    }
    fetchObra();
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

  async function atualizarObra() {
    if (!nome || !responsavel || !dataInicio || !dataFim || !descricao) {
      Alert.alert("Preencha todos os campos obrigatórios!");
      return;
    }
    setSalvando(true);
    const payload: ObraPayload = {
      nome,
      responsavel,
      dataInicio: ddmmToIso(dataInicio),
      dataFim: ddmmToIso(dataFim),
      localizacao,
      descricao,
      foto,
    };
    try {
      const res = await fetch(`${API_URL}/obras/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        Alert.alert("Obra atualizada com sucesso!");
        router.replace(`/obras/${id}`);
      } else {
        const data = await res.json();
        Alert.alert("Erro ao atualizar obra", data.error || "Erro desconhecido");
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
      <Text style={styles.titulo}>Editar Obra</Text>
      <Text style={styles.label}>Nome da obra *</Text>
      <TextInput value={nome} onChangeText={setNome} style={styles.input} />
      <Text style={styles.label}>Responsável *</Text>
      <TextInput value={responsavel} onChangeText={setResponsavel} style={styles.input} />
      <Text style={styles.label}>Data de início *</Text>
      <TextInput value={dataInicio} onChangeText={setDataInicio} placeholder="DD-MM-YYYY" style={styles.input} />
      <Text style={styles.label}>Data de término *</Text>
      <TextInput value={dataFim} onChangeText={setDataFim} placeholder="DD-MM-YYYY" style={styles.input} />
      <Text style={styles.label}>Descrição *</Text>
      <TextInput value={descricao} onChangeText={setDescricao} multiline numberOfLines={3} style={styles.input} />
      <Text style={styles.label}>Foto da Obra</Text>
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
      <TouchableOpacity style={styles.button} onPress={atualizarObra} disabled={salvando}>
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
  label: { fontWeight: "bold", color: "#222", marginBottom: 4 }
});
