// routes/Profissional.js CORRIGIDO E COMPLETO

import express from 'express';
import User from '../models/User.js'; // Profissionais são usuários
import Clinica from '../models/Clinica.js'; // Importar Clinica para filtro

const router = express.Router();

// GET: Listar todos os profissionais (Dentistas)
router.get('/', async (req, res) => {
    try {
        // Filtro base para pegar apenas usuários que são profissionais (dentistas)
        const filtro = { profissional: 'Dr(a)' };

        if (req.usuario.perfil === 'patrao') {
            const clinicaId = req.headers['x-clinic-id'];
            if (clinicaId) {
                const matriz = await Clinica.findOne().sort({ createdAt: 1 });
                if (matriz && matriz._id.toString() === clinicaId) {
                    // Patrão na Matriz: vê profissionais da matriz e os sem clínica.
                    filtro.$or = [{ clinica: clinicaId }, { clinica: null }, { clinica: { $exists: false } }];
                } else {
                    // Patrão em outra clínica: vê apenas profissionais daquela clínica.
                    filtro.clinica = clinicaId;
                }
            }
        } else if (req.usuario.perfil === 'funcionario') {
            // Funcionário (Atendente, etc.): vê apenas profissionais da sua própria clínica.
            const funcionarioLogado = await User.findById(req.usuario.id);
            if (funcionarioLogado && funcionarioLogado.clinica) {
                filtro.clinica = funcionarioLogado.clinica;
            } else {
                // Funcionário sem clínica não vê nenhum profissional.
                return res.json([]);
            }
        }

        const profissionais = await User.find(filtro, { password: 0 }).populate('clinica', 'nome');
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