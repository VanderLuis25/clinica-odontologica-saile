// routes/relatorios.js
import express from 'express';
import Financeiro from '../models/Financeiro.js';
import Agendamento from '../models/Agendamento.js';
import Procedimento from '../models/Procedimento.js';
import Clinica from '../models/Clinica.js';
import User from '../models/User.js';

const router = express.Router();

// Rota para o relatório financeiro
router.get('/financeiro', async (req, res) => {
    try {
        // ✅ NOVO: Filtro por clínica
        const filtro = {};
        if (req.usuario.perfil === 'patrao') {
            const clinicaId = req.headers['x-clinic-id'];
            // Se uma clínica específica for selecionada, filtra por ela. Senão, busca de todas.
            if (clinicaId) filtro.clinica = clinicaId;
        } else if (req.usuario.perfil === 'funcionario') {
            const funcionarioLogado = await User.findById(req.usuario.id);
            if (funcionarioLogado && funcionarioLogado.clinica) {
                filtro.clinica = funcionarioLogado.clinica;
            } else {
                return res.json([]);
            }
        }
        const items = await Financeiro.find(filtro);
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao buscar dados financeiros.', error: err.message });
    }
});

// Rota para listar agendamentos com paginação
router.get('/agendamentos', async (req, res) => {
    try {
        // ✅ NOVO: Filtro por clínica
        const filtro = {};
        if (req.usuario.perfil === 'patrao') {
            const clinicaId = req.headers['x-clinic-id'];
            if (clinicaId) filtro.clinica = clinicaId;
        } else if (req.usuario.perfil === 'funcionario') {
            const funcionarioLogado = await User.findById(req.usuario.id);
            if (funcionarioLogado && funcionarioLogado.clinica) {
                filtro.clinica = funcionarioLogado.clinica;
            } else {
                return res.json({ total: 0, page: 1, totalPages: 0, agendamentos: [] });
            }
        }

        const page = parseInt(req.query.page) || 1;  // Número da página, padrão é 1
        const limit = parseInt(req.query.limit) || 10; // Limite de itens por página, padrão é 10
        const skip = (page - 1) * limit; // Cálculo do número de itens a serem pulados

        const totalAgendamentos = await Agendamento.countDocuments(filtro); // Total de agendamentos com filtro
        const agendamentos = await Agendamento.find(filtro)
            .populate('paciente', 'nome')
            .populate('procedimento', 'nome')
            .populate('profissional', 'nome')
            .skip(skip) // Pula os itens
            .limit(limit); // Limita os itens

        res.status(200).json({
            total: totalAgendamentos,
            page,
            totalPages: Math.ceil(totalAgendamentos / limit), // Total de páginas
            agendamentos,
        });
    } catch (err) {
        res.status(500).json({ message: 'Erro ao buscar agendamentos.', error: err.message });
    }
});

// Rota para listar procedimentos
router.get('/procedimentos', async (req, res) => {
    try {
        // ✅ NOVO: Filtro por clínica
        const filtro = {};
        if (req.usuario.perfil === 'patrao') {
            const clinicaId = req.headers['x-clinic-id'];
            if (clinicaId) filtro.clinica = clinicaId;
        } else if (req.usuario.perfil === 'funcionario') {
            const funcionarioLogado = await User.findById(req.usuario.id);
            if (funcionarioLogado && funcionarioLogado.clinica) {
                filtro.clinica = funcionarioLogado.clinica;
            } else {
                return res.json([]);
            }
        }

        const procedimentos = await Procedimento.find(filtro)
            .populate({
                path: 'paciente',
                select: 'nome'
            });

        res.status(200).json(procedimentos);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao buscar procedimentos.', error: err.message });
    }
});

export default router;