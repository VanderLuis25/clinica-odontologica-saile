// routes/Profissional.js CORRIGIDO E COMPLETO

import express from 'express';
import Profissional from '../models/User.js'; // Assumindo que profissionais são salvos no modelo User

const router = express.Router();

const filtroProfissionais = { 
    // Filtro para buscar apenas os usuários marcados como Profissionais
    profissional: 'Dr(a)' 
};


router.get('/', async (req, res) => {
    try {
        const profissionais = await Profissional.find(filtroProfissionais);
        
        // Retorna a lista COMPLETA de objetos dos profissionais
        res.json(profissionais);
        
    } catch (err) {
        console.error("❌ Erro ao buscar profissionais:", err);
        res.status(500).json({ 
            message: 'Erro interno do servidor ao buscar profissionais.', 
            error: err.message 
        });
    }
});

// Nota: Adicione rotas de CRUD (GET /:id, POST, PUT, DELETE) se necessário
// para a gestão individual do profissional, se elas não estiverem em routes/usuarios.js.

export default router;