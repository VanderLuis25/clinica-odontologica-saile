// Importa o serverless-http para "envelopar" o app Express.
import serverless from 'serverless-http';
// Importa a configuração do seu servidor Express.
import { app, connectToDatabase } from '../../backend/server.js';

// Conecta ao banco de dados (a função gerencia para não reconectar desnecessariamente).
connectToDatabase();

// Exporta o handler que o Netlify irá usar.
// O serverless(app) faz a mágica de converter as requisições HTTP
// do Netlify para um formato que o Express entende.
export const handler = serverless(app);