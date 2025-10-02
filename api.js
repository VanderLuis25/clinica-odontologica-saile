// Importa o serverless-http para "envelopar" o app Express.
import serverless from 'serverless-http';
// Importa a configuração do seu servidor Express.
import { app, connectToDatabase } from '../../backend/server.js';

// Conecta ao banco de dados antes de começar a processar requisições.
connectToDatabase();

// Exporta o handler que o Netlify irá usar.
// O serverless(app) faz a mágica de converter as requisições.
export const handler = serverless(app);

// NOTA: O nome do arquivo (api.js) define a rota.
// Todas as requisições para `/.netlify/functions/api/*` serão direcionadas
// para este handler, que por sua vez as passará para o seu app Express.
// Ex: `/.netlify/functions/api/usuarios` será tratado por `app.use('/usuarios', ...)`