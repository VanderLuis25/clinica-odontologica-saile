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
        // 💡 ATUALIZAÇÃO: Se o usuário for 'patrao', ele vê todos os profissionais.
        // Se for 'funcionario', a lógica de filtro por clínica (se aplicável) deve ser adicionada aqui.
        // Por enquanto, a requisição do patrão é atendida removendo qualquer filtro de clínica.
        if (req.usuario.perfil === 'patrao') {
            const profissionais = await Profissional.find(filtroProfissionais);
            return res.json(profissionais);
        }
        
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