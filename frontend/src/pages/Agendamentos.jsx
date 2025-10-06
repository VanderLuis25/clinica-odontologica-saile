import React, { useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { SystemDataContext } from '../context/SystemDataContext.jsx'; // 💡 1. Importar o Contexto
import './Agendamentos.css';
import AssinaturaDigital from '../components/AssinaturaDigital';
import io from 'socket.io-client'; // 💡 Importar o cliente socket.io

const Agendamentos = () => {
    // 💡 2. Usar o Contexto para obter dados e funções
    const { 
        agendamentos, 
        fetchAgendamentos,
        createAgendamento,
        updateAgendamento,
        deleteAgendamento,
        pacientes,
        fetchPacientes,
        procedimentos,
        fetchProcedimentos,
        profissionais,
        fetchProfissionais,
        searchPacientes: apiSearchPacientes,
    } = useContext(SystemDataContext);

    // --- Estados para o Formulário de Agendamento ---
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [agendamentoEmEdicao, setAgendamentoEmEdicao] = useState(null);
    const [showForm, setShowForm] = useState(false); 

    const initialFormData = {
        paciente: '',
        nomePaciente: '',
        cpf: '',
        telefone: '',
        procedimento: '',
        valorProcedimento: '',
        profissional: '',
        tipoPaciente: 'adulto',
        assinaturaResponsavel: '',
        data: '',
        hora: '',
        observacoes: '',
        status: 'Confirmado', 
    };
    const [formData, setFormData] = useState(initialFormData);

    // --- Estados para a Lista de Agendamentos ---
    const [listSearchTerm, setListSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'data', direction: 'ascending' });

    // 💡 3. Lógica do Socket.IO para atualizações em tempo real
    useEffect(() => {
        const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const socket = io(baseURL); // URL do seu backend
        socket.on('atualizacao', () => {
            console.log('Recebida atualização de agendamentos, recarregando...');
            fetchAgendamentos();
        });

        return () => socket.disconnect(); // Limpa a conexão ao desmontar o componente
    }, [fetchAgendamentos]);

    useEffect(() => {
        const loadInitialData = () => {
            fetchProcedimentos();
            fetchProfissionais();
            fetchAgendamentos();
        };
        loadInitialData();
    }, [fetchProcedimentos, fetchProfissionais, fetchAgendamentos]);

    const searchPatients = useCallback(async (query) => {
        if (query.length < 1) {
            setSearchResults([]);
            return;
        }
        const results = await apiSearchPacientes(query);
        setSearchResults(results || []);
    }, [apiSearchPacientes]);

    useEffect(() => {
        const handler = setTimeout(() => searchPatients(searchTerm), 500);
        return () => clearTimeout(handler);
    }, [searchTerm, searchPatients]);

    const calcularTipoPaciente = (dataNascimento) => {
        if (!dataNascimento) return 'adulto';
        const hoje = new Date();
        const nascimento = new Date(dataNascimento);
        let idade = hoje.getFullYear() - nascimento.getFullYear();
        const mes = hoje.getMonth() - nascimento.getMonth();
        if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) idade--;
        return idade < 18 ? 'infantil' : 'adulto';
    };

    const handlePatientSelect = (paciente) => {
        // ✅ LÓGICA DE RETORNO: Encontra o procedimento mais recente do paciente.
        const procedimentosDoPaciente = procedimentos
            .filter(p => p.paciente?._id === paciente._id)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Ordena do mais novo para o mais antigo

        const ultimoProcedimento = procedimentosDoPaciente.length > 0 ? procedimentosDoPaciente[0] : null;

        setSelectedPatient(paciente);
        setSearchTerm(paciente.nome);
        setSearchResults([]);

        // Preenche o formulário com os dados do paciente e o último procedimento (se houver)
        setFormData(prev => ({
            ...prev,
            paciente: paciente._id,
            nomePaciente: paciente.nome,
            cpf: paciente.cpf,
            telefone: paciente.telefone,
            // Preenche automaticamente o procedimento e o valor para agilizar retornos
            procedimento: ultimoProcedimento?._id || '',
            valorProcedimento: ultimoProcedimento?.valor ? parseFloat(ultimoProcedimento.valor).toFixed(2) : '',
            tipoPaciente: calcularTipoPaciente(paciente.dataNascimento),
        }));
    };
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        let newFormData = { ...formData, [name]: value };

        // 1. Lógica do Procedimento
        if (name === 'procedimento') {
            const proc = procedimentos.find(p => p._id === value);
            // Verifica se o procedimento foi encontrado antes de tentar acessar o valor
            newFormData.valorProcedimento = proc ? parseFloat(proc.valor).toFixed(2) : '';
        }
        
        // 2. Lógica de Bloqueio de Domingo na Seleção de Data
        if (name === 'data') {
            const selectedDate = new Date(value.replace(/-/g, '/')); 
            const dayOfWeek = selectedDate.getDay(); // 0 = Domingo
            
            if (dayOfWeek === 0) {
                alert('Não é possível selecionar domingos para agendamentos. Por favor, escolha outra data.');
            }
        }

        setFormData(newFormData);
    };
    
    const handleSignatureChange = (signatureDataURL) => {
        setFormData(prev => ({ ...prev, assinaturaResponsavel: signatureDataURL }));
    };

    const resetForm = () => {
        setFormData(initialFormData);
        setSelectedPatient(null);
        setSearchTerm('');
        setAgendamentoEmEdicao(null);
        setShowForm(false); 
    };

    const handleCreateOrUpdateAppointment = async (e) => {
        e.preventDefault();
        
        const appointmentDate = new Date(formData.data.replace(/-/g, '/')); 
        const dayOfWeek = appointmentDate.getDay(); // 0 = Domingo
        
        if (dayOfWeek === 0) {
            alert('Não é possível agendar consultas aos domingos. Por favor, escolha outra data.');
            return; 
        }

        const payload = {
            paciente: formData.paciente,
            profissional: formData.profissional,
            data: formData.data, 
            hora: formData.hora,
            observacoes: formData.observacoes,
            // Só envia o procedimento se ele for selecionado
            procedimento: formData.procedimento || null,
            tipoPaciente: formData.tipoPaciente,
            assinaturaResponsavel: formData.tipoPaciente === 'infantil' ? formData.assinaturaResponsavel : undefined,
            status: formData.status, 
        };

        if (formData.tipoPaciente === 'infantil' && !formData.assinaturaResponsavel && !agendamentoEmEdicao) {
            alert('A assinatura do responsável é obrigatória para pacientes infantis.');
            return;
        }

        try {
            if (agendamentoEmEdicao) {
                await updateAgendamento(agendamentoEmEdicao._id, payload);
                alert('Agendamento atualizado com sucesso!');
            } else {
                await createAgendamento(payload);
                alert('Agendamento criado com sucesso!');
            }
            resetForm();
            fetchAgendamentos();
        } catch (error) {
            alert(`Erro ao salvar agendamento: ${error.response?.data?.message || error.message}`);
        }
    };

    // FUNÇÃO DE EDIÇÃO CORRIGIDA COM OPTIONAL CHAINING
    const handleEdit = (agendamento) => {
        setAgendamentoEmEdicao(agendamento);
        
        // Garante que a data é formatada como YYYY-MM-DD
        const dataOriginal = new Date(agendamento.data);
        const dataFormatada = dataOriginal.toISOString().split('T')[0];

        setFormData({
            // ✅ CORRIGIDO: Usa optional chaining para Paciente
            paciente: agendamento.paciente?._id || '', 
            nomePaciente: agendamento.paciente?.nome || '',
            cpf: agendamento.paciente?.cpf || '',
            telefone: agendamento.paciente?.telefone || '',

            // ✅ CORRIGIDO: Usa optional chaining para Procedimento
            procedimento: agendamento.procedimento?._id || '', 
            valorProcedimento: agendamento.procedimento?.valor ? parseFloat(agendamento.procedimento.valor).toFixed(2) : '',
            
            // ✅ CORRIGIDO: Usa optional chaining para Profissional
            profissional: agendamento.profissional?._id || '', 
            
            tipoPaciente: agendamento.tipoPaciente,
            assinaturaResponsavel: agendamento.assinaturaResponsavel || '',
            data: dataFormatada, 
            hora: agendamento.hora,
            observacoes: agendamento.observacoes || '',
            status: agendamento.status || 'Confirmado', 
        });
        
        // Define o paciente selecionado (o objeto completo populado, ou null se não existir)
        setSelectedPatient(agendamento.paciente || null);
        
        // Define o searchTerm apenas se houver paciente
        setSearchTerm(agendamento.paciente?.nome || '');
        
        // Garante que o formulário está visível
        setShowForm(true); 
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Tem certeza que deseja excluir este agendamento?')) return;
        try {
            await deleteAgendamento(id);
            // fetchAgendamentos() é chamado dentro do deleteAgendamento no contexto
        } catch {
            alert('Erro ao excluir agendamento.');
        }
    };

    const sortedAndFilteredAgendamentos = useMemo(() => {
        let items = agendamentos.filter(ag => {
            const term = listSearchTerm.toLowerCase();
            return (
                ag.paciente?.nome?.toLowerCase().includes(term) ||
                ag.paciente?.cpf?.includes(term) ||
                ag.procedimento?.nome?.toLowerCase().includes(term) ||
                ag.profissional?.nome?.toLowerCase().includes(term) ||
                ag.status?.toLowerCase().includes(term) 
            );
        });

        if (sortConfig.key !== null) {
            items.sort((a, b) => {
                let aValue, bValue;

                if (sortConfig.key === 'nome') {
                    aValue = a.paciente?.nome || '';
                    bValue = b.paciente?.nome || '';
                } else if (sortConfig.key === 'procedimento') {
                    aValue = a.procedimento?.nome || '';
                    bValue = b.procedimento?.nome || '';
                } else if (sortConfig.key === 'data') {
                    // Ordena por Data e depois por Hora
                    aValue = new Date(`${a.data}T${a.hora}`);
                    bValue = new Date(`${b.data}T${b.hora}`);
                } else if (sortConfig.key === 'status') {
                    aValue = a.status || '';
                    bValue = b.status || '';
                } else {
                    return 0;
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return items;
    }, [agendamentos, listSearchTerm, sortConfig]);

    const timeSlots = [];
    for (let h = 8; h <= 17; h++) {
        timeSlots.push(`${h.toString().padStart(2, '0')}:00`);
        if (h !== 17) timeSlots.push(`${h.toString().padStart(2, '0')}:30`);
    }

    // Função para abrir o formulário no modo de criação
    const handleNovoAgendamento = () => {
        resetForm(); // Limpa se estiver em modo de edição
        setShowForm(true);
    };

    return (
        <div className="agendamentos-container">
            <h1>AGENDAMENTOS</h1>

            {!showForm && (
                <button 
                    onClick={handleNovoAgendamento} 
                    className="btn btn-green btn-novo-agendamento"
                    style={{ marginBottom: '30px' }}
                >
                    + NOVO AGENDAMENTO
                </button>
            )}

            {showForm && (
                <div className="agendamento-form">
                    <h2>{agendamentoEmEdicao ? 'Editar Agendamento' : 'Novo Agendamento'}</h2>

                    {/* Campo de Pesquisa do Paciente */}
                    <input
                        type="text"
                        placeholder="Pesquisar paciente por nome ou CPF..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        disabled={!!agendamentoEmEdicao}
                    />

                    {/* Resultados da Pesquisa */}
                    {searchResults.length > 0 && !agendamentoEmEdicao && (
                        <div className="search-results">
                            {searchResults.map(paciente => (
                                <div key={paciente._id} onClick={() => handlePatientSelect(paciente)}>
                                    <strong>{paciente.nome}</strong> ({paciente.cpf})
                                </div>
                            ))}
                        </div>
                    )}

                    <form onSubmit={handleCreateOrUpdateAppointment}>
                        {/* Garante que um paciente foi selecionado antes de permitir o submit no modo de criação */}
                        <fieldset disabled={!selectedPatient && !agendamentoEmEdicao}>
                            <div className="agendamento-grid">
                                {/* Paciente Info (Read-only) */}
                                <div><label>Paciente:</label><input type="text" value={formData.nomePaciente} readOnly disabled /></div>
                                <div><label>CPF:</label><input type="text" value={formData.cpf} readOnly disabled /></div>
                                <div><label>Telefone:</label><input type="text" value={formData.telefone} readOnly disabled /></div>

                                {/* Procedimento */}
                                <div>
                                    <label>Procedimento *:</label>
                                    <select name="procedimento" value={formData.procedimento} onChange={handleChange}>
                                        <option value="">Selecione...</option>
                                        {procedimentos.map(p => <option key={p._id} value={p._id}>{p.nome}</option>)}
                                    </select>
                                </div>
                                <div><label>Valor:</label><input type="text" value={`R$ ${formData.valorProcedimento}`} readOnly disabled /></div>

                                {/* Profissional */}
                                <div>
                                    <label>Profissional *:</label>
                                    <select name="profissional" value={formData.profissional} onChange={handleChange} required>
                                        <option value="">Selecione...</option>
                                        {profissionais.map(p => <option key={p._id} value={p._id}>{p.nome}</option>)}
                                    </select>
                                </div>

                                {/* Tipo de Paciente */}
                                <div>
                                    <label>Tipo de Paciente *:</label>
                                    <select name="tipoPaciente" value={formData.tipoPaciente} onChange={handleChange} required>
                                        <option value="adulto">Adulto</option>
                                        <option value="infantil">Infantil</option>
                                    </select>
                                </div>

                                {/* Data e Hora */}
                                <div><label>Data *:</label><input type="date" name="data" value={formData.data} onChange={handleChange} required /></div>
                                <div>
                                    <label>Hora *:</label>
                                    <select name="hora" value={formData.hora} onChange={handleChange} required>
                                        <option value="">Selecione...</option>
                                        {timeSlots.map(time => <option key={time} value={time}>{time}</option>)}
                                    </select>
                                </div>

                                {/* Status */}
                                <div>
                                    <label>Status *:</label>
                                    <select name="status" value={formData.status} onChange={handleChange} required>
                                        <option value="Confirmado">Confirmado</option>
                                        <option value="Cancelado">Cancelado</option>
                                        <option value="Falta">Falta</option>
                                    </select>
                                </div>
                            </div>

                            {/* Assinatura Digital Condicional */}
                            {formData.tipoPaciente === 'infantil' && (
                                <div className="assinatura-digital-container">
                                    <AssinaturaDigital
                                        onSignatureChange={handleSignatureChange}
                                        signatureData={formData.assinaturaResponsavel}
                                        disabled={!!agendamentoEmEdicao}
                                    />
                                </div>
                            )}

                            <div>
                                <label>Observação:</label>
                                <textarea name="observacoes" value={formData.observacoes} onChange={handleChange} rows="3"></textarea>
                            </div>

                            <div style={{ marginTop: '20px' }}>
                                <button type="submit" className={`btn ${agendamentoEmEdicao ? 'btn-orange' : 'btn-green'}`}>
                                    {agendamentoEmEdicao ? 'SALVAR EDIÇÃO' : 'CRIAR AGENDAMENTO'}
                                </button>
                                {/* BOTÃO CANCELAR REMOVIDO DAQUI */}
                            </div>
                        </fieldset>
                        
                        {/* ** CORREÇÃO: BOTÃO CANCELAR MOVIDO PARA FORA DO FIELDSET ** */}
                        <div style={{ marginTop: '20px' }}>
                             <button type="button" onClick={resetForm} className="btn btn-red">CANCELAR</button>
                        </div>
                        {/* ** FIM DA CORREÇÃO ** */}

                        {!selectedPatient && !agendamentoEmEdicao && (
                            <p style={{color: 'red', marginTop: '10px'}}>Por favor, selecione um paciente acima para começar o agendamento.</p>
                        )}
                    </form>
                </div>
            )}

            <div className="lista-agendamentos">
                <h2>LISTA DE AGENDAMENTOS</h2>

                <div className="lista-header">
                    <input
                        type="text"
                        placeholder="Pesquisar na lista (nome, CPF, procedimento, status)..."
                        value={listSearchTerm}
                        onChange={(e) => setListSearchTerm(e.target.value)}
                    />
                    <div className="lista-actions">
                        <button onClick={() => handleSort('data')}>Data/Hora</button>
                        <button onClick={() => handleSort('nome')}>Paciente</button>
                        <button onClick={() => handleSort('procedimento')}>Procedimento</button>
                        <button onClick={() => handleSort('status')}>Status</button>
                    </div>
                </div>

                <table className="agendamentos-table">
                    <thead>
                        <tr><th>PACIENTE</th><th>CPF</th><th>TELEFONE</th><th>PROCEDIMENTO</th><th>PROFISSIONAL</th><th>DATA</th><th>HORA</th><th>STATUS</th><th>AÇÕES</th></tr>
                    </thead>
                    <tbody>
                        {sortedAndFilteredAgendamentos.length === 0 ? (
                            <tr><td colSpan="9" style={{ textAlign: 'center' }}>Nenhum agendamento encontrado.</td></tr>
                        ) : (
                            sortedAndFilteredAgendamentos.map(ag => (
                                <tr key={ag._id}>
                                    <td>{ag.paciente?.nome ?? 'N/A'}</td>
                                    <td>{ag.paciente?.cpf ?? 'N/A'}</td>
                                    <td>{ag.paciente?.telefone ?? 'N/A'}</td>
                                    <td>{ag.procedimento?.nome ?? 'N/A'}</td>
                                    <td>{ag.profissional?.nome ?? 'N/A'}</td>
                                    <td>{new Date(ag.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                                    <td>{ag.hora}</td>
                                    <td>
                                        <span className={`status-badge status-${ag.status?.toLowerCase() || 'confirmado'}`}>
                                            {ag.status || 'Confirmado'}
                                        </span>
                                    </td>
                                    <td className="table-actions">
                                        <button className="edit" onClick={() => handleEdit(ag)} title="Editar Agendamento">
                                            <i className="fas fa-pen"></i>
                                        </button>
                                        <button className="delete" onClick={() => handleDelete(ag._id)} title="Excluir Agendamento">
                                            <i className="fas fa-trash-alt"></i>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Agendamentos;