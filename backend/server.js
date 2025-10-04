import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors'; // 💡 1. Importe o pacote cors
import http from 'http'; // 💡 Importar o módulo http
import { Server } from 'socket.io'; // 💡 Importar o Server do socket.io
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Importe suas rotas
import usuariosRouter from './routes/usuarios.js';
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
app.use('/usuarios', usuariosRouter);
app.use('/pacientes', pacientesRouter);
app.use('/procedimentos', procedimentosRouter);
app.use('/agendamentos', agendamentosRouter);
app.use('/financeiro', financeiroRouter);
app.use('/prontuarios', prontuariosRouter);
app.use('/profissionais', profissionaisRouter); // 💡 Adicionado
app.use('/lembretes', lembretesRouter);         // 💡 Adicionado
app.use('/relatorios', relatoriosRouter);       // 💡 Adicionado
app.use('/api/clinicas', auth, clinicasRouter); // 💡 NOVO: Aplicar middleware de autenticação na rota de clínicas

// Conexão com o DB e inicialização do servidor (seu código de conexão aqui)
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => server.listen(PORT, () => console.log(`Servidor rodando na porta: ${PORT}`))) // 💡 Alterado de app.listen para server.listen
  .catch((error) => console.log(error.message));