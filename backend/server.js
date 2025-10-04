import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors'; // 💡 1. Importe o pacote cors
import http from 'http'; // 💡 Importar o módulo http
import { Server } from 'socket.io'; // 💡 Importar o Server do socket.io
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Importe suas rotas
import usuariosRouter, { authRouter } from './routes/usuarios.js';
import pacientesRouter from './routes/pacientes.js';
import procedimentosRouter from './routes/procedimentos.js';
import agendamentosRouter from './routes/agendamentos.js';
import financeiroRouter from './routes/financeiro.js';
import prontuariosRouter from './routes/prontuarios.js';
import profissionaisRouter from './routes/profissional.js'; // 💡 Adicionado
import lembretesRouter from './routes/lembretes.js';       // 💡 Adicionado
import relatoriosRouter from './routes/relatorios.js';     // 💡 Adicionado
import { auth } from './routes/auth.js';                   // 💡 CORREÇÃO: Importar do local correto
import clinicasRouter from './routes/clinicas.js';         // 💡 NOVO: Importar rotas da clínica

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Handle __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 💡 Criar servidor HTTP e servidor Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    // 💡 CORREÇÃO: Permite requisições de qualquer origem.
    // Isso é necessário para que o seu site na Netlify possa se comunicar com a API na Railway.
    // Em um cenário mais restrito, você poderia colocar a URL do seu site Netlify aqui.
    // Ex: origin: "https://seu-site.netlify.app"
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

export const emitirAtualizacao = () => io.emit('atualizacao');

// Middlewares
// 💡 CORREÇÃO DEFINITIVA: Habilita o CORS para todas as origens e métodos.
// Esta deve ser a PRIMEIRA linha de middleware para garantir que funcione corretamente
// e lide com as requisições de pre-flight (OPTIONS) automaticamente.
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos da pasta 'uploads'
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Use suas rotas
app.use('/auth', authRouter); // Public auth routes (login, etc.)
app.use('/usuarios', auth, usuariosRouter); // Protected user routes (CRUD)
app.use('/pacientes', auth, pacientesRouter);
app.use('/procedimentos', auth, procedimentosRouter);
app.use('/agendamentos', auth, agendamentosRouter);
app.use('/financeiro', auth, financeiroRouter);
app.use('/prontuarios', auth, prontuariosRouter);
app.use('/profissionais', auth, profissionaisRouter); // 💡 Adicionado
app.use('/lembretes', auth, lembretesRouter);         // 💡 Adicionado
app.use('/relatorios', relatoriosRouter);       // 💡 Adicionado
app.use('/api/clinicas', auth, clinicasRouter); // 💡 NOVO: Aplicar middleware de autenticação na rota de clínicas

// Conexão com o DB e inicialização do servidor (seu código de conexão aqui)
// As opções { useNewUrlParser, useUnifiedTopology } não são mais necessárias nas versões recentes do Mongoose.
mongoose.connect(process.env.MONGO_URI)
  .then(() => server.listen(PORT, () => console.log(`Servidor rodando na porta: ${PORT}`))) // 💡 Alterado de app.listen para server.listen
  .catch((error) => console.log(error.message));