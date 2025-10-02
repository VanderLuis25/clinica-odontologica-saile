// Importa o serverless-http para "envelopar" o app Express.
import serverless from 'serverless-http';
// Importa a configuração do seu servidor Express.
// CORREÇÃO: O caminho relativo foi ajustado para funcionar a partir da pasta `netlify/functions`.
import { app, connectToDatabase } from '../../backend/server.js';

// Conecta ao banco de dados (a função gerencia para não reconectar desnecessariamente).
connectToDatabase();

// Exporta o handler que o Netlify irá usar.
export const handler = serverless(app);