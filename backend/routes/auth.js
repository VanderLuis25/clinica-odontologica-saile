import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.SECRET_KEY || "sua-chave-secreta-muito-segura";

/**
 * Middleware para verificar o token JWT.
 * Anexa o payload decodificado (incluindo id e perfil do usuário) ao objeto `req`.
 */
export const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Token de autenticação não fornecido." });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    // Anexa o payload decodificado (ex: { id: '...', perfil: '...', clinicaId: '...' }) ao request
    req.usuario = decoded; 
    next();
  } catch (err) {
    res.status(401).json({ error: "Token inválido ou expirado." });
  }
};