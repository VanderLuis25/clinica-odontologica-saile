import express from 'express';
import Paciente from '../models/Paciente.js';
import Clinica from '../models/Clinica.js'; // Importar Clinica
import User from '../models/User.js'; // 💡 Importar User para buscar dados do funcionário

const router = express.Router();

// 1. ROTA PRINCIPAL: GET / (Listar todos os pacientes OTIMIZADA)
router.get('/', async (req, res) => {
    try {
        const filtro = {};

        if (req.usuario.perfil === 'patrao') {
            const clinicaId = req.headers['x-clinic-id'];
            // Se uma clínica específica for selecionada, filtra por ela.
            // Se não, o filtro fica vazio e busca de TODAS as clínicas.
            if (clinicaId) filtro.clinica = clinicaId;
        } else if (req.usuario.perfil === 'funcionario') {
            // ✅ CORREÇÃO: Busca o usuário logado para garantir o ID da clínica correto.
            const funcionarioLogado = await User.findById(req.usuario.id);
            if (funcionarioLogado && funcionarioLogado.clinica) {
                // Funcionário: vê apenas dados da sua própria clínica.
                filtro.clinica = funcionarioLogado.clinica;
            } else {
                // Se o funcionário não tem clínica associada, ele não pode ver nenhum paciente.
                // Retorna uma lista vazia para evitar erros.
                return res.json([]);
            }
        }

        const pacientes = await Paciente.find(filtro)
            // Retornando a dataNascimento para cálculo de idade no frontend
            .select('nome cpf telefone dataNascimento clinica') 
            .populate('clinica', 'nome') // ✅ Adicionado para incluir o nome da clínica
            .sort({ nome: 1 });
        res.status(200).json(pacientes);
    } catch (error) {
        console.error('Erro ao listar pacientes:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao listar pacientes.' });
    }
});

// 2. ROTA DE BUSCA: GET /search
router.get('/search', async (req, res) => {
    const { q: termo } = req.query; // ✅ CORREÇÃO: Usa 'q' como parâmetro, conforme definido no frontend (api.js)

    try {
        if (!termo) {
            return res.status(200).json([]);
        }
        const regex = new RegExp(termo, 'i');
        const filtro = {}; // Inicia o filtro
        
        // ✅ CORREÇÃO: Garante que a busca respeite a clínica do usuário.
        if (req.usuario.perfil === 'patrao') {
            const clinicaId = req.headers['x-clinic-id'];
            if (clinicaId) filtro.clinica = clinicaId;
        } else if (req.usuario.perfil === 'funcionario') {
            const funcionarioLogado = await User.findById(req.usuario.id);
            if (funcionarioLogado && funcionarioLogado.clinica) {
                filtro.clinica = funcionarioLogado.clinica;
            } else {
                return res.json([]); // Funcionário sem clínica não busca nada.
            }
        }

        filtro.$or = [ // Adiciona a condição de busca por nome ou CPF ao filtro existente
                { nome: { $regex: regex } },
                { cpf: { $regex: regex } }
            ];

        const pacientes = await Paciente.find(filtro)
            .select('_id nome cpf telefone dataNascimento')
            .limit(10);

        res.json(pacientes);
    } catch (err) {
        res.status(500).json({ message: "Erro ao buscar pacientes", error: err.message });
    }
});


// 3. ROTA POST: Criar novo paciente
router.post('/', async (req, res) => {
    try {
        let clinicaId;

        // ✅ CORREÇÃO: Garante que a clínica seja a do funcionário logado.
        if (req.usuario.perfil === 'funcionario') {
            const funcionarioLogado = await User.findById(req.usuario.id);
            clinicaId = funcionarioLogado?.clinica;
        } else {
            // Para o patrão, continua usando o cabeçalho.
            clinicaId = req.headers['x-clinic-id'];
        }

        if (!clinicaId) return res.status(400).json({ message: "O usuário não está associado a nenhuma clínica." });

        const novoPaciente = new Paciente({
            ...req.body,
            clinica: clinicaId // Associa à clínica correta.
        });
        await novoPaciente.save();
        res.status(201).json(novoPaciente);
    } catch (error) {
        console.error('Erro ao criar paciente (Mongoose):', error); 
        
        let statusCode = 400;
        let errorMessage = 'Erro ao criar paciente.';

        // Tratamento de Erro de Validação
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message).join(', ');
            errorMessage = `Erro de Validação: ${messages}`;
            statusCode = 400;
        }
        
        // Tratamento de Erro de Duplicidade (11000 do MongoDB)
        else if (error.code === 11000) { 
            const field = Object.keys(error.keyValue)[0];
            errorMessage = `Erro de Duplicidade: O campo "${field}" com o valor "${error.keyValue[field]}" já está cadastrado.`;
            statusCode = 409; 
        }

        res.status(statusCode).json({ message: errorMessage, error: error.message });
    }
});

// 4. ROTA PUT: Atualizar paciente por ID (AGORA COM TRATAMENTO DE ERRO COMPLETO)
router.put('/:id', async (req, res) => {
    try {
        // ✅ INÍCIO DA VERIFICAÇÃO DE SEGURANÇA
        if (req.usuario.perfil === 'funcionario') {
            const paciente = await Paciente.findById(req.params.id);
            if (!paciente) {
                return res.status(404).json({ message: 'Paciente não encontrado.' });
            }

            const funcionarioLogado = await User.findById(req.usuario.id);
            // Verifica se o paciente pertence à clínica do funcionário
            if (paciente.clinica.toString() !== funcionarioLogado.clinica.toString()) {
                return res.status(403).json({ message: 'Acesso negado. Você não tem permissão para alterar este paciente.' });
            }
        }
        // ✅ FIM DA VERIFICAÇÃO DE SEGURANÇA

        const pacienteAtualizado = await Paciente.findByIdAndUpdate(
            req.params.id,
            req.body,
            // new: true retorna o doc atualizado; runValidators: true executa as validações
            { new: true, runValidators: true } 
        );
        
        if (!pacienteAtualizado) {
            return res.status(404).json({ message: 'Paciente não encontrado.' });
        }
        
        res.status(200).json(pacienteAtualizado);
    } catch (error) {
        let statusCode = 400;
        let errorMessage = 'Erro ao atualizar paciente.';

        // 1. Tratamento de Erro de Duplicidade (CPF/Email unique: true)
        if (error.code === 11000) { 
            const field = Object.keys(error.keyValue)[0];
            errorMessage = `Erro de Duplicidade: O campo "${field}" com o valor "${error.keyValue[field]}" já está cadastrado.`;
            statusCode = 409; 
        } 
        // 2. Tratamento de Erro de Validação (dataNascimento ou nome faltando)
        else if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message).join('; ');
            errorMessage = `Erro de Validação: ${messages}`;
            statusCode = 400;
        }
        
        console.error('Erro detalhado ao atualizar paciente:', error);
        res.status(statusCode).json({ message: errorMessage, error: error.message });
    }
});

// 5. ROTA DELETE: Excluir paciente por ID
router.delete('/:id', async (req, res) => {
    try {
        // ✅ INÍCIO DA VERIFICAÇÃO DE SEGURANÇA
        if (req.usuario.perfil === 'funcionario') {
            const paciente = await Paciente.findById(req.params.id);
            if (!paciente) {
                return res.status(404).json({ message: 'Paciente não encontrado.' });
            }

            const funcionarioLogado = await User.findById(req.usuario.id);
            // Verifica se o paciente pertence à clínica do funcionário
            if (paciente.clinica.toString() !== funcionarioLogado.clinica.toString()) {
                return res.status(403).json({ message: 'Acesso negado. Você não tem permissão para excluir este paciente.' });
            }
        }
        // ✅ FIM DA VERIFICAÇÃO DE SEGURANÇA

        const pacienteDeletado = await Paciente.findByIdAndDelete(req.params.id);
        if (!pacienteDeletado) return res.status(404).json({ message: 'Paciente não encontrado.' });
        res.status(200).json({ message: 'Paciente excluído com sucesso.' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao excluir paciente.', error: error.message });
    }
});

export default router;