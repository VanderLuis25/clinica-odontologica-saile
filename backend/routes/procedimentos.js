import express from 'express';
import Procedimento from '../models/Procedimento.js';
import Clinica from '../models/Clinica.js'; // Importar Clinica
import Financeiro from '../models/Financeiro.js'; // 💡 Importar o modelo Financeiro
import User from '../models/User.js'; // 💡 Importar User para buscar dados do funcionário

const router = express.Router();

// 1. ROTA GET: Listar todos os procedimentos
router.get('/', async (req, res) => {
    try {
        // 💡 ATUALIZAÇÃO: Filtro rigoroso por clínica.
        const filtro = {};

        if (req.usuario.perfil === 'patrao') {
            const clinicaId = req.headers['x-clinic-id'];
            // Se uma clínica específica for selecionada, filtra por ela.
            // Se não, o filtro fica vazio e busca de TODAS as clínicas.
            if (clinicaId) filtro.clinica = clinicaId;
        } else if (req.usuario.perfil === 'funcionario') {
            const funcionarioLogado = await User.findById(req.usuario.id);
            if (funcionarioLogado && funcionarioLogado.clinica) {
                filtro.clinica = funcionarioLogado.clinica;
            } else {
                return res.json([]);
            }
        }

        // 💡 CORREÇÃO CRÍTICA: Uso de .populate('paciente')
        // Isso garante que o campo 'paciente' não retorne apenas o ID, mas o objeto completo do paciente,
        // permitindo que o frontend acesse p.paciente.nome e p.paciente.cpf
        const procedimentos = await Procedimento.find(filtro).populate('paciente').populate('clinica', 'nome');
        res.json(procedimentos);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao buscar procedimentos', error: err.message });
    }
});

// 2. ROTA POST: Criar novo procedimento (NÃO MUDOU)
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

        const novoProcedimento = new Procedimento({
            ...req.body,
            clinica: clinicaId // Associa à clínica correta.
        });
        await novoProcedimento.save();
        
        // 💡 Melhoria: Popula o paciente no procedimento recém-criado para obter os dados
        const procedimentoRetorno = await Procedimento.findById(novoProcedimento._id).populate('paciente', 'nome cpf');
        
        // 💡 LÓGICA ATUALIZADA: Criar registro financeiro correspondente com todos os dados
        if (procedimentoRetorno && procedimentoRetorno.valor > 0) {
            const registroFinanceiro = new Financeiro({
                descricao: `Procedimento: ${procedimentoRetorno.nome}`,
                valor: procedimentoRetorno.valor,
                tipo: 'receita',
                data: new Date().toISOString().split('T')[0], // Usa a data atual
                statusPagamento: 'pendente',
                clinica: clinicaId, // ✅ Adiciona a clínica ao registro financeiro
                procedimento: procedimentoRetorno._id, // Vincula ao procedimento
                // ✅ CORREÇÃO: Pega os dados do paciente populado
                nomePaciente: procedimentoRetorno.paciente?.nome, 
                cpfPaciente: procedimentoRetorno.paciente?.cpf,
            });
            await registroFinanceiro.save();
        }
        
        // Retorna o procedimento já populado para o frontend
        
        res.status(201).json(procedimentoRetorno);
    } catch (error) {
        console.error('Erro ao criar procedimento (Mongoose):', error); 
        
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message).join(', ');
            return res.status(400).json({ 
                message: `Erro de Validação: ${messages}`, 
                error: error.message 
            });
        }
        
        res.status(500).json({ message: 'Erro ao criar procedimento.', error: error.message });
    }
});


// 3. ROTA PUT: Atualizar procedimento por ID
router.put('/:id', async (req, res) => {
    try {
        // ✅ INÍCIO DA VERIFICAÇÃO DE SEGURANÇA
        if (req.usuario.perfil === 'funcionario') {
            const procedimento = await Procedimento.findById(req.params.id);
            if (!procedimento) {
                return res.status(404).json({ message: 'Procedimento não encontrado.' });
            }

            const funcionarioLogado = await User.findById(req.usuario.id);
            // Verifica se o procedimento pertence à clínica do funcionário
            if (procedimento.clinica.toString() !== funcionarioLogado.clinica.toString()) {
                return res.status(403).json({ message: 'Acesso negado. Você não tem permissão para alterar este procedimento.' });
            }
        }
        // ✅ FIM DA VERIFICAÇÃO DE SEGURANÇA

        // Popula o campo 'paciente' após a atualização
        const procedimentoAtualizado = await Procedimento.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true, runValidators: true }
        ).populate('paciente'); // 💡 Popula o paciente aqui também!
        
        if (!procedimentoAtualizado) return res.status(404).json({ message: 'Procedimento não encontrado.' });
        res.status(200).json(procedimentoAtualizado);
    } catch (error) {
        res.status(400).json({ message: 'Erro ao atualizar procedimento.', error: error.message });
    }
});

// 4. ROTA DELETE: Excluir procedimento por ID (NÃO MUDOU)
router.delete('/:id', async (req, res) => {
    try {
        // ✅ INÍCIO DA VERIFICAÇÃO DE SEGURANÇA
        if (req.usuario.perfil === 'funcionario') {
            const procedimento = await Procedimento.findById(req.params.id);
            if (!procedimento) {
                return res.status(404).json({ message: 'Procedimento não encontrado.' });
            }

            const funcionarioLogado = await User.findById(req.usuario.id);
            // Verifica se o procedimento pertence à clínica do funcionário
            if (procedimento.clinica.toString() !== funcionarioLogado.clinica.toString()) {
                return res.status(403).json({ message: 'Acesso negado. Você não tem permissão para excluir este procedimento.' });
            }
        }
        // ✅ FIM DA VERIFICAÇÃO DE SEGURANÇA

        const procedimentoDeletado = await Procedimento.findByIdAndDelete(req.params.id);
        if (!procedimentoDeletado) return res.status(404).json({ message: 'Procedimento não encontrado.' });
        res.status(200).json({ message: 'Procedimento excluído com sucesso.' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao excluir procedimento.', error: error.message });
    }
});

export default router;