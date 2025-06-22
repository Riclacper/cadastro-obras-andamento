import React, { useEffect, useState } from "react";
import { View, Text, Image, ScrollView, Button, Alert, TouchableOpacity, ActivityIndicator, Modal, TextInput, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";

interface Obra {
  _id: string;
  nome: string;
  responsavel: string;
  dataInicio: string;
  dataFim: string;
  descricao: string;
  foto?: string;
  localizacao?: { lat: number; long: number };
}

interface Fiscalizacao {
  _id: string;
  data: string;
  status: string;
  observacoes: string;
  foto?: string;
  localizacao?: { lat: number; long: number };
}

const API_URL = "http://192.168.0.102:5000"; // Altere para seu backend

export default function DetalheObra() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [obra, setObra] = useState<Obra | null>(null);
  const [fiscalizacoes, setFiscalizacoes] = useState<Fiscalizacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalEmail, setModalEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  async function fetchObra() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/obras/${id}`);
      const data = await res.json();
      setObra(data);
    } catch (err) {
      Alert.alert("Erro ao carregar obra");
    }
    setLoading(false);
  }

  async function fetchFiscalizacoes() {
    try {
      const res = await fetch(`${API_URL}/obras/${id}/fiscalizacoes`);
      const data = await res.json();
      setFiscalizacoes(data);
    } catch (err) {
      setFiscalizacoes([]);
    }
  }

  useEffect(() => {
    fetchObra();
    fetchFiscalizacoes();
  }, [id]);

  async function deletarObra() {
    Alert.alert(
      "Confirmar exclusão",
      "Tem certeza que deseja excluir esta obra e todas as fiscalizações relacionadas?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await fetch(`${API_URL}/obras/${id}`, { method: "DELETE" });
              if (res.ok) {
                Alert.alert("Obra excluída com sucesso!");
                router.replace("/obras");
              } else {
                Alert.alert("Erro ao excluir obra");
              }
            } catch {
              Alert.alert("Erro ao excluir obra");
            }
          }
        }
      ]
    );
  }

  async function enviarEmail() {
    if (!email) {
      Alert.alert("Digite um e-mail válido!");
      return;
    }
    setSending(true);
    try {
      const res = await fetch(`${API_URL}/obras/${id}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        Alert.alert("E-mail enviado com sucesso!");
        setModalEmail(false);
        setEmail("");
      } else {
        const data = await res.json();
        Alert.alert("Erro ao enviar e-mail", data.error || "");
      }
    } catch {
      Alert.alert("Erro ao enviar e-mail");
    }
    setSending(false);
  }

  if (loading || !obra) {
    return <ActivityIndicator size="large" color="#27ae60" style={{ marginTop: 64 }} />;
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 18, backgroundColor: "#fff", flexGrow: 1 }}>
      <Text style={styles.titulo}>{obra.nome}</Text>
      {obra.foto ? (
        <Image source={{ uri: obra.foto }} style={styles.img} />
      ) : (
        <View style={styles.semImg}><Text>Sem imagem</Text></View>
      )}

      <Text style={styles.label}>Responsável:</Text>
      <Text>{obra.responsavel}</Text>

      <Text style={styles.label}>Datas:</Text>
      <Text>
        {obra.dataInicio.slice(0, 10)} até {obra.dataFim.slice(0, 10)}
      </Text>

      <Text style={styles.label}>Localização:</Text>
      {obra.localizacao
        ? <Text>Lat: {obra.localizacao.lat} | Long: {obra.localizacao.long}</Text>
        : <Text>Não informada</Text>}

      <Text style={styles.label}>Descrição:</Text>
      <Text>{obra.descricao}</Text>

      <View style={styles.separador} />

      <Text style={[styles.label, { fontSize: 18 }]}>Fiscalizações</Text>
      {fiscalizacoes.length === 0 ? (
        <Text>Nenhuma fiscalização cadastrada.</Text>
      ) : (
        fiscalizacoes.map((f) => (
          <View key={f._id} style={styles.fiscalCard}>
            <Text style={{ fontWeight: "bold" }}>{f.status} - {f.data.slice(0, 10)}</Text>
            <Text>{f.observacoes}</Text>
            {f.foto ? <Image source={{ uri: f.foto }} style={styles.fiscImg} /> : null}
            {f.localizacao
              ? <Text style={{ fontSize: 12, color: "#555" }}>Lat: {f.localizacao.lat} | Long: {f.localizacao.long}</Text>
              : null}
          </View>
        ))
      )}

      <View style={{ flexDirection: "row", justifyContent: "space-between", marginVertical: 18 }}>
        <Button title="Editar" color="#2980b9" onPress={() => router.push(`/obras/editar/${obra._id}`)} />
        <Button title="Nova Fiscalização" color="#27ae60" onPress={() => router.push({ pathname: "/fiscalizacoes/nova", params: { obraId: obra._id } })} />
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 18 }}>
        <Button title="Enviar por E-mail" color="#e67e22" onPress={() => setModalEmail(true)} />
        <Button title="Excluir" color="#c0392b" onPress={deletarObra} />
      </View>

      {/* Modal para digitar e-mail */}
      <Modal visible={modalEmail} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{ fontWeight: "bold", fontSize: 16 }}>Enviar dados por e-mail</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite o e-mail"
              value={email}
              autoCapitalize="none"
              keyboardType="email-address"
              onChangeText={setEmail}
            />
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Button title="Cancelar" color="#888" onPress={() => setModalEmail(false)} />
              <Button title={sending ? "Enviando..." : "Enviar"} color="#27ae60" onPress={enviarEmail} disabled={sending} />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  titulo: { fontWeight: "bold", fontSize: 22, marginBottom: 8 },
  img: { width: "100%", height: 180, borderRadius: 8, marginBottom: 12 },
  semImg: { width: "100%", height: 180, borderRadius: 8, marginBottom: 12, backgroundColor: "#eee", alignItems: "center", justifyContent: "center" },
  label: { fontWeight: "bold", marginTop: 8 },
  separador: { height: 1, backgroundColor: "#ddd", marginVertical: 12 },
  fiscalCard: { backgroundColor: "#f3f3f3", borderRadius: 7, padding: 10, marginBottom: 10 },
  fiscImg: { width: 80, height: 60, borderRadius: 6, marginTop: 6 }
  , modalOverlay: { flex: 1, backgroundColor: "#0008", alignItems: "center", justifyContent: "center" },
  modalContent: { backgroundColor: "#fff", padding: 24, borderRadius: 8, width: "85%" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 5, padding: 10, marginVertical: 12 }
});
