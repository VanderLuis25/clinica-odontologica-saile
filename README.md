# Sistema de Gestão para Clínica Odontológica (Saile)

Sistema completo de gestão para clínicas odontológicas com frontend em React/Vite e backend em Node.js/Express.

## 🚀 Funcionalidades

- **Dashboard** - Visão geral do sistema
- **Pacientes** - Cadastro e gestão de pacientes
- **Procedimentos** - Catálogo de procedimentos odontológicos
- **Agendamentos** - Sistema de agendamento de consultas
- **Prontuários** - Prontuários eletrônicos dos pacientes
- **Financeiro** - Controle financeiro e pagamentos
- **Usuários** - Gestão de usuários do sistema
- **Relatórios** - Relatórios e estatísticas

## 🛠️ Tecnologias

### Frontend
- React 18
- Vite
- React Router DOM
- Tailwind CSS
- Axios
- Chart.js
- React Icons

### Backend
- Node.js
- Express.js
- MongoDB (Atlas)
- Mongoose
- JWT (Autenticação)
- Bcrypt (Criptografia)

## 📦 Instalação

### Pré-requisitos
- Node.js (versão 16 ou superior)
- npm ou yarn
- Conta no MongoDB Atlas (ou MongoDB local)

### Passos para instalação

1. **Clone o repositório**
```bash
git clone https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
cd clinica-odontologica
```

2. **Instale as dependências**
```bash
npm run install:all
```

3. **Configure as variáveis de ambiente**
Crie um arquivo `.env` na pasta `backend` com:
```
PORT=5000
SECRET_KEY=sua-chave-secreta-muito-segura-para-jwt
MONGO_URI=sua-string-de-conexao-mongodb
```

4. **Execute o projeto**
```bash
# Para desenvolvimento (frontend + backend)
npm run dev

# Ou execute separadamente:
# Backend
npm run dev:backend

# Frontend
npm run dev:frontend
```

## 🌐 Acesso

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 👤 Primeiro Acesso

1. Acesse o sistema pela primeira vez
2. Crie o primeiro usuário (será automaticamente definido como "patrão")
3. Use as credenciais criadas para fazer login

## 📁 Estrutura do Projeto

```
clinica-odontologica/
├── frontend/                 # Aplicação React
│   ├── src/
│   │   ├── components/      # Componentes reutilizáveis
│   │   ├── pages/          # Páginas da aplicação
│   │   ├── services/       # Serviços de API
│   │   └── assets/         # Imagens e recursos
│   ├── package.json
│   └── vite.config.js
├── backend/                 # API Node.js
│   ├── models/             # Modelos do MongoDB
│   ├── routes/             # Rotas da API
│   ├── server.js           # Servidor principal
│   └── package.json
└── package.json            # Scripts principais
```

## 🔧 Scripts Disponíveis

- `npm run dev` - Executa frontend e backend em modo desenvolvimento
- `npm run dev:frontend` - Executa apenas o frontend
- `npm run dev:backend` - Executa apenas o backend
- `npm run build` - Constrói o frontend para produção
- `npm run install:all` - Instala todas as dependências

## 📝 Notas Importantes

- O sistema usa autenticação JWT
- Os dados são persistidos no MongoDB Atlas
- O primeiro usuário criado será automaticamente "patrão"
- Usuários "patrão" têm acesso a todas as funcionalidades
- Usuários "funcionário" têm acesso limitado (sem financeiro e usuários)

## 🐛 Solução de Problemas

### Erro de conexão com MongoDB
- Verifique se a string de conexão está correta
- Confirme se o IP está liberado no MongoDB Atlas

### Erro de dependências
- Execute `npm run install:all` para instalar todas as dependências
- Verifique se está usando Node.js versão 16+

### Erro de CORS
- O backend já está configurado para aceitar requisições do frontend
- Verifique se as portas estão corretas (3000 para frontend, 5000 para backend)
