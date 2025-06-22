# 📱 Cadastro de Obras em Andamento – App Mobile

Aplicativo em **React Native + Expo + TypeScript** para cadastro, acompanhamento e fiscalização de obras públicas. Permite registrar obras, fiscalizações, anexar fotos, localização por GPS e enviar relatórios por e-mail.

---

## 🚀 Tecnologias Utilizadas

- [Expo](https://expo.dev/) (Managed Workflow)
- React Native
- TypeScript
- @react-native-picker/picker
- expo-image-picker, expo-location
- Integração com backend Node.js + MongoDB via REST API

---

## 📲 Como rodar o app

### Pré-requisitos
- Node.js (>=18)
- Expo CLI (`npm install -g expo-cli`)
- Conta no [Expo Go](https://expo.dev/expo-go) (App para testar no celular)
- Backend rodando (veja documentação do backend)

### Instale as dependências

```bash
npm install
````

### Altere o IP da API

No(s) arquivo(s) `.tsx`, altere:

```ts
const API_URL = "http://SEU_IP_LOCAL:5000"
```

* Descubra o IP do seu computador com `ifconfig` (Mac/Linux) ou `ipconfig` (Windows).
* Exemplo: `http://192.168.0.102:5000`

### Inicie o projeto

```bash
npx expo start
```

* Escaneie o QR code com o **Expo Go** no seu celular (ambos precisam estar no mesmo Wi-Fi).

---

## 🛠️ Funcionalidades

* **Cadastro de Obras**: nome, responsável, datas, descrição, foto (câmera), localização via GPS.
* **Listagem de Obras**: visualização das obras cadastradas.
* **Detalhes da Obra**: dados completos, foto, localização, fiscalizações associadas.
* **Cadastro e edição de Fiscalizações**: data, status, observações, foto, localização, obra vinculada.
* **Envio de relatório por e-mail**: envia todos os dados para o endereço escolhido.
* **Fluxo 100% integrado ao backend**.
* **Compatível com tema claro e escuro**.

---

## 📦 Estrutura de Pastas

```
app/
  ├── obras/
  │     ├── index.tsx
  │     ├── nova.tsx
  │     ├── [id].tsx
  │     └── editar/[id].tsx
  ├── fiscalizacoes/
  │     ├── nova.tsx
  │     ├── editar/[id].tsx
  │     └── [id].tsx (opcional)
  ├── components/
  ├── assets/
  ├── utils/
  │     └── formatDate.ts
  ...
```

---

## 💡 Observações

* **Datas**: preencha sempre como `DD-MM-YYYY` ou `DD/MM/YYYY` (app converte automaticamente para ISO).
* **Permissões**: o app solicita acesso à câmera e localização quando necessário.
* **API Backend**: o app espera que o backend (Node.js/MongoDB) esteja rodando e acessível na mesma rede.

---

## 📸 Prints de Telas

> Inclua aqui prints das principais telas do app: cadastro, listagem, detalhes, envio de e-mail, etc.

---

## 👨‍💻 Autor

Desenvolvido por **Ricardo Lacerda**

---

## 📚 Licença

Este projeto é para fins acadêmicos e didáticos.