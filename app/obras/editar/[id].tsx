import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, Alert, ScrollView, ActivityIndicator, Modal } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { ddmmToIso, isValidDdmm, isoToDdmm, maskDdmm } from "../../../utils/formatDate";
import Header from "../../../components/Header";
import { StyleSheet } from "react-native";
import { apiFetch } from "@/utils/api";

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
  status: string;
}
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
  const [status, setStatus] = useState("Em andamento");
  const [selectingStatus, setSelectingStatus] = useState(false);
  const statusOptions = ["Planejada", "Em andamento", "Concluída", "Pausada"];

  useEffect(() => {
    async function fetchObra() {
      try {
        const res = await apiFetch(`/obras/${id}`);
        const data = await res.json();
        setNome(data.nome || "");
        setResponsavel(data.responsavel || "");
        setDataInicio(data.dataInicio ? isoToDdmm(data.dataInicio) : "");
        setDataFim(data.dataFim ? isoToDdmm(data.dataFim) : "");
        setDescricao(data.descricao || "");
        setFoto(data.foto || "");
        setLocalizacao(data.localizacao || { lat: 0, long: 0 });
        setStatus(data.status || "Em andamento");
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
    if (!isValidDdmm(dataInicio) || !isValidDdmm(dataFim)) {
      Alert.alert("Informe datas válidas no formato DD-MM-YYYY.");
      return;
    }
    if (ddmmToIso(dataInicio) > ddmmToIso(dataFim)) {
      Alert.alert("A data de término deve ser igual ou posterior à data de início.");
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
      status,
    };
    try {
      const res = await apiFetch(`/obras/${id}`, {
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
      <Header title="Editar obra" />
      <Text style={styles.label}>Nome da obra *</Text>
      <TextInput value={nome} onChangeText={setNome} style={styles.input} />
      <Text style={styles.label}>Responsável *</Text>
      <TextInput value={responsavel} onChangeText={setResponsavel} style={styles.input} />
      <Text style={styles.label}>Data de início *</Text>
      <TextInput value={dataInicio} onChangeText={(value) => setDataInicio(maskDdmm(value))} placeholder="DD/MM/AAAA" keyboardType="number-pad" maxLength={10} style={styles.input} />
      <Text style={styles.label}>Data de término *</Text>
      <TextInput value={dataFim} onChangeText={(value) => setDataFim(maskDdmm(value))} placeholder="DD/MM/AAAA" keyboardType="number-pad" maxLength={10} style={styles.input} />
      <Text style={styles.label}>Descrição *</Text>
      <TextInput value={descricao} onChangeText={setDescricao} multiline numberOfLines={3} style={styles.input} />
      <Text style={styles.label}>Status da obra *</Text>
      <TouchableOpacity style={styles.selectField} onPress={() => setSelectingStatus(true)}>
        <Text style={styles.selectValue}>{status}</Text><Text style={styles.chevron}>⌄</Text>
      </TouchableOpacity>
      <Modal visible={selectingStatus} transparent animationType="slide" onRequestClose={() => setSelectingStatus(false)}>
        <View style={styles.modalBackdrop}><View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Status da obra</Text>
          {statusOptions.map((item) => <TouchableOpacity key={item} style={styles.option} onPress={() => { setStatus(item); setSelectingStatus(false); }}><Text style={styles.optionText}>{item}</Text>{item === status && <Text style={styles.check}>✓</Text>}</TouchableOpacity>)}
          <TouchableOpacity style={styles.cancelButton} onPress={() => setSelectingStatus(false)}><Text style={styles.cancelText}>Cancelar</Text></TouchableOpacity>
        </View></View>
      </Modal>
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
  label: { fontWeight: "bold", color: "#222", marginBottom: 4 },
  selectField: { alignItems: "center", backgroundColor: "#fff", borderColor: "#27ae60", borderRadius: 8, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", marginBottom: 14, minHeight: 52, paddingHorizontal: 14 },
  selectValue: { color: "#222", fontSize: 16 },
  chevron: { color: "#147A50", fontSize: 22 },
  modalBackdrop: { backgroundColor: "#00000066", flex: 1, justifyContent: "flex-end" },
  modalCard: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22 },
  modalTitle: { color: "#183B56", fontSize: 20, fontWeight: "800", marginBottom: 14 },
  option: { alignItems: "center", borderBottomColor: "#E2ECE7", borderBottomWidth: 1, flexDirection: "row", justifyContent: "space-between", paddingVertical: 16 },
  optionText: { color: "#183B56", fontSize: 16, fontWeight: "600" },
  check: { color: "#1F9D68", fontSize: 20, fontWeight: "800" },
  cancelButton: { alignItems: "center", backgroundColor: "#E7F6EE", borderRadius: 10, marginTop: 18, padding: 14 },
  cancelText: { color: "#147A50", fontWeight: "800" }
});
