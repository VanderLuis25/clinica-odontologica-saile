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

dotenv.config();

export const app = express(); // 💡 EXPORTAR o app
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

let isConnected;

// 💡 Função para conectar ao banco de dados
export const connectToDatabase = async () => {
  if (isConnected) {
    console.log('=> usando conexão de DB existente');
    return;
  }

  console.log('=> criando nova conexão com o DB');
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  isConnected = true;
};

// 💡 Inicia o servidor APENAS se este arquivo for executado diretamente (para desenvolvimento local)
if (process.env.NODE_ENV !== 'production_netlify') { // Usaremos essa variável no futuro
  connectToDatabase()
    .then(() => server.listen(PORT, () => console.log(`Servidor rodando na porta: ${PORT}`)))
    .catch((error) => console.log(error.message));
}