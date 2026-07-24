# Cadastro de Obras — aplicativo mobile

Aplicativo em React Native, Expo e TypeScript para cadastro, acompanhamento e fiscalização de obras públicas. O app consome a API REST do repositório [cadastro-obras-backend](https://github.com/Riclacper/cadastro-obras-backend).

## Requisitos

- Node.js 20.19.4 ou superior recomendado
- Expo Go compatível com SDK 54
- Backend em execução e acessível pela rede
- iPhone e computador na mesma rede Wi-Fi para testes em rede local

## Instalação

```bash
npm install
cp .env.example .env
```

Edite `.env` e informe o IP local do computador:

```env
EXPO_PUBLIC_API_URL=http://SEU_IP_LOCAL:5000
```

Exemplo:

```env
EXPO_PUBLIC_API_URL=http://192.168.18.34:5000
```

O arquivo `.env` é local e não deve ser versionado. Para produção, use uma URL HTTPS.

## Executar

Inicie o backend em outro terminal:

```bash
cd ../cadastro-obras-backend
npm install
npm start
```

Depois, na raiz deste projeto:

```bash
npx expo start -c
```

Escaneie o QR code com o Expo Go. Em um aparelho físico, o Expo e o backend precisam estar acessíveis pelo mesmo computador. Se a rede local bloquear o Metro, tente `npx expo start --tunnel`; a API ainda deve permanecer acessível pelo IP configurado em `EXPO_PUBLIC_API_URL`.

Antes de abrir o app, é possível testar o backend no navegador do computador ou do iPhone:

```text
http://SEU_IP_LOCAL:5000/
```

## Autenticação

Ao abrir o app pela primeira vez, crie um usuário pela API ou use um usuário existente. O login do app envia `email` e `senha` para `POST /auth/login`, armazena o token localmente e protege as rotas internas. O botão **Sair** remove a sessão e retorna à tela de login.

O primeiro usuário cadastrado no backend recebe o papel `admin`; os próximos recebem `fiscal`.

O perfil Administrador gerencia obras, relatórios e usuários pela área **Equipe**. O perfil Fiscal consulta obras e registra/edita fiscalizações, sem acesso às ações administrativas.

## Funcionalidades

- Cadastro, edição, detalhes e listagem de obras
- Fiscalizações associadas às obras
- Fotos pela câmera ou galeria
- Localização por GPS
- Validação de datas e atualização por pull-to-refresh
- Envio de detalhes da obra por e-mail
- Splash screen, navegação protegida e suporte a tema claro/escuro

## Estrutura principal

```text
app/
├── _layout.tsx                 # Navegação e proteção de rotas
├── login.tsx                   # Login
├── SplashScreen.tsx            # Tela inicial
├── (tabs)/                     # Abas principais
├── obras/                      # CRUD de obras
└── fiscalizacoes/              # CRUD de fiscalizações
components/                     # Componentes reutilizáveis
constants/env.ts                # Configuração da API
utils/api.ts                    # Cliente HTTP autenticado
utils/session.ts                # Sessão local
utils/formatDate.ts             # Validação e formatação de datas
```

## Testes e verificações

```bash
npx tsc --noEmit
npx jest --runInBand --watchman=false --watch=false
```

## Solução de problemas

- **QR code não conecta:** confirme a mesma rede Wi-Fi, reinicie com `npx expo start -c` e force o encerramento/reabertura do Expo Go.
- **API não responde no iPhone:** abra `http://IP_DO_COMPUTADOR:5000/` no Safari. Se não abrir, verifique firewall e a rede local.
- **Erro de bundle ou módulo:** pare o Metro com `Ctrl+C`, execute `npm install` e inicie novamente com cache limpo.
- **Aviso do Watchman:** mensagens sobre `MustScanSubDirs` são avisos do monitor de arquivos; o erro relevante normalmente aparece depois delas.
- **Versão do Node:** versões inferiores à recomendada podem gerar avisos ou incompatibilidades durante a instalação do SDK 54.

## Licença

Projeto acadêmico e didático desenvolvido por Ricardo Lacerda Pereira.
