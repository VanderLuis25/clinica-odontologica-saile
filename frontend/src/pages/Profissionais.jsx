import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { apiService } from "../services/api.js";
import { FaCalendarAlt, FaTimes, FaClock, FaArrowLeft, FaArrowRight, FaInfoCircle, FaUser, FaPhone, FaEnvelope, FaIdCard, FaUserCog } from "react-icons/fa"; 
import "./Profissionais.css";

// URL base para as fotos
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Dados padrão de horário de trabalho para cálculo de vagas
const todosHorariosPadrao = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];


// Função que gera todos os dias de um mês específico (mantida)
const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = [];
    let currentDate = new Date(year, month, 1);

    while (currentDate.getMonth() === month) {
        const day = new Date(currentDate);
        days.push(day);
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return days;
};


// ------------------------------------------
// COMPONENTE MODAL DA AGENDA
// ------------------------------------------
const AgendaModal = ({ profissional, onClose, agendamentosPorProfissional, pacientesMap }) => {
    
    if (!profissional) return null;

    // --- ESTADOS PARA NAVEGAÇÃO E SELEÇÃO ---
    const [dataAtual, setDataAtual] = useState(new Date());
    const [diaSelecionado, setDiaSelecionado] = useState(null);
    const [agendamentosDoDia, setAgendamentosDoDia] = useState([]);

    // Puxa agendamentos agrupados
    const agendamentosBrutos = agendamentosPorProfissional[profissional._id] || [];
    
    const hoje = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0); 
        return d;
    }, []);
    const hojeString = hoje.toISOString().split('T')[0];


    // Função para adicionar detalhes do paciente
    const getAgendamentosComDetalhes = useCallback((agendamentos) => {
        return agendamentos.map(ag => {
            const pacienteId = ag.paciente?._id || ag.paciente; 
            const pacienteData = pacientesMap[pacienteId] || {}; 
            
            return {
                ...ag,
                pacienteNome: pacienteData.nome || 'Paciente Não Encontrado',
                pacienteNumero: pacienteData.telefone || 'N/A', 
                pacienteCpf: pacienteData.cpf || 'N/A',
                observacao: ag.observacoes || 'Nenhuma observação', 
            };
        }).sort((a, b) => {
            // Ordenação por data e hora
            const dateTimeA = new Date(`${a.data}T${a.hora}`);
            const dateTimeB = new Date(`${b.data}T${b.hora}`);
            return dateTimeA - dateTimeB;
        });
    }, [pacientesMap]); 


    const agendamentosDetalhados = useMemo(() => getAgendamentosComDetalhes(agendamentosBrutos), [agendamentosBrutos, getAgendamentosComDetalhes]);
    const diasDoMes = useMemo(() => getDaysInMonth(dataAtual), [dataAtual]);


    // --- LÓGICA DE NAVEGAÇÃO E VISUALIZAÇÃO ---
    const avancarMes = () => {
        setDataAtual(prevDate => {
            const newDate = new Date(prevDate.getFullYear(), prevDate.getMonth() + 1, 1);
            return newDate;
        });
        setDiaSelecionado(null);
    };
    const retornarMes = () => { 
        setDataAtual(prevDate => {
            const newDate = new Date(prevDate.getFullYear(), prevDate.getMonth() - 1, 1);
            return newDate;
        });
        setDiaSelecionado(null);
    };
    const fecharDetalhesDoDia = () => setDiaSelecionado(null);
    
    const handleClickDia = (dia) => {
        const status = getStatusDoDia(dia);
        
        if (status.class === 'dia-passado' || status.class === 'dia-fechado') {
            fecharDetalhesDoDia();
            return;
        }

        const diaString = dia.toISOString().split('T')[0];
        const agendamentosNoDia = agendamentosDetalhados.filter(a => new Date(a.data).toISOString().split('T')[0] === diaString);

        setDiaSelecionado(dia);
        setAgendamentosDoDia(agendamentosNoDia);
    };
    
    // Filtra agendamentos
    const agendamentosDeHoje = agendamentosDetalhados.filter(a => new Date(a.data).toISOString().split('T')[0] === hojeString);
    const agendamentosFuturos = agendamentosDetalhados.filter(a => {
        const agendamentoDateString = new Date(a.data).toISOString().split('T')[0];
        return agendamentoDateString > hojeString; 
    });


    // Lógica para determinar status do dia no calendário
    const getStatusDoDia = (dia) => {
        const diaDaSemana = dia.getDay();

        if (diaDaSemana === 0) { 
             return { status: 'Fechado', class: 'dia-fechado' };
        }

        const diaString = dia.toISOString().split('T')[0];
        if (diaString < hojeString) return { status: 'Passado', class: 'dia-passado' };

        const agendamentosNoDia = agendamentosDetalhados.filter(a => 
            new Date(a.data).toISOString().split('T')[0] === diaString
        );

        const horariosOcupados = agendamentosNoDia.length;
        const horariosLivres = todosHorariosPadrao.length - horariosOcupados;

        if (horariosLivres === 0) return { status: 'Lotado', class: 'dia-lotado' };
        if (horariosLivres < todosHorariosPadrao.length) return { status: `${horariosLivres} Vagas`, class: 'dia-parcial' };
        
        return { status: 'Livre', class: 'dia-livre' };
    };


    // Renderização do Modal
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h2>Agenda de {profissional.nome}</h2>
                <button className="fechar-btn" onClick={onClose}><FaTimes /></button>
                
                {/* 1. Agendamentos de Hoje (Prioritário) */}
                <div className="agenda-secao agenda-hoje">
                    <h3><FaClock /> Agendamentos de Hoje ({hoje.toLocaleDateString('pt-BR')})</h3>
                    <ul className="lista-agendamentos">
                        {agendamentosDeHoje.length === 0 ? (
                            <li className="agendamento-vazio">Nenhum agendamento marcado para hoje.</li>
                        ) : (
                            agendamentosDeHoje.map((ag, index) => (
                                <li key={index} className="agendamento-item-detalhe">
                                    <div className="agendamento-info-principal">
                                        <FaClock style={{ marginRight: '5px' }}/> {ag.hora} - <FaUser style={{ margin: '0 5px 0 10px' }}/> **{ag.pacienteNome}**
                                    </div>
                                    <div className="agendamento-detalhes">
                                        <p><FaPhone /> Número: {ag.pacienteNumero}</p>
                                        <p><FaInfoCircle /> Observação: *{ag.observacao}*</p>
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                </div>

                <hr />

                {/* 2. Visão de Disponibilidade Mensal com Navegação */}
                <div className="agenda-secao">
                    <div className="navegacao-mes">
                        <button onClick={retornarMes}><FaArrowLeft /></button>
                        <h3>
                            <FaCalendarAlt /> {dataAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                        </h3>
                        <button onClick={avancarMes}><FaArrowRight /></button>
                    </div>
                    
                    <div className="calendario-simples">
                        <div className="dias-semana-header">
                            <span>Dom</span><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span>
                        </div>
                        {Array.from({ length: new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 1).getDay() }).map((_, i) => (
                             <div key={`empty-${i}`} className="dia-agenda dia-passado" style={{ cursor: 'default' }}></div>
                        ))}
                        
                        {diasDoMes.map(dia => {
                            const status = getStatusDoDia(dia);
                            const isToday = dia.toDateString() === hoje.toDateString();
                            const isSelected = diaSelecionado && dia.toDateString() === diaSelecionado.toDateString();

                            return (
                                <div
                                    key={dia.getTime()}
                                    className={`dia-agenda ${status.class} ${isToday ? 'dia-hoje' : ''} ${isSelected ? 'dia-selecionado' : ''}`}
                                    onClick={() => handleClickDia(dia)}
                                >
                                    <span className="data">{dia.getDate()}</span>
                                    <span className="status">{status.status}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 3. Modal de Detalhes do Dia Selecionado */}
                {diaSelecionado && (
                    <div className="detalhes-dia-modal">
                        <h4>
                            <FaInfoCircle /> Agendamentos para **{diaSelecionado.toLocaleDateString('pt-BR')}**
                            <button onClick={fecharDetalhesDoDia} className="fechar-detalhes-btn"><FaTimes /></button>
                        </h4>
                        
                        <ul className="lista-agendamentos">
                            {agendamentosDoDia.length === 0 ? (
                                <li className="agendamento-vazio">Nenhum agendamento para este dia.</li>
                            ) : (
                                agendamentosDoDia.map((ag, index) => (
                                    <li key={index} className="agendamento-item-detalhe">
                                        <div className="agendamento-info-principal">
                                            <FaClock style={{ marginRight: '5px' }}/> {ag.hora} - <FaUser style={{ margin: '0 5px 0 10px' }}/> **{ag.pacienteNome}**
                                        </div>
                                        <div className="agendamento-detalhes">
                                            <p><FaPhone /> Número: {ag.pacienteNumero}</p>
                                            <p><FaIdCard /> CPF: {ag.pacienteCpf}</p>
                                            <p><FaInfoCircle /> Observação: *{ag.observacao}*</p>
                                        </div>
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>
                )}
                
                <hr />

                {/* 4. Lista de Todos os Agendamentos Futuros (exclui o dia atual e passados) */}
                <div className="agenda-secao">
                    <h3><FaCalendarAlt /> Próximos Agendamentos ({agendamentosFuturos.length})</h3>
                    <ul className="lista-agendamentos">
                        {agendamentosFuturos.length === 0 ? (
                            <li className="agendamento-vazio">Nenhum agendamento futuro encontrado para {profissional.nome}.</li>
                        ) : (
                            agendamentosFuturos.map((ag, index) => (
                                <li key={index} className="agendamento-item-detalhe">
                                    <div className="agendamento-info-principal">
                                        <FaClock style={{ marginRight: '5px' }}/> {ag.hora} ({new Date(ag.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}) - <FaUser style={{ margin: '0 5px 0 10px' }}/> **{ag.pacienteNome}**
                                    </div>
                                    <div className="agendamento-detalhes">
                                        <p><FaPhone /> Número: {ag.pacienteNumero}</p>
                                        <p><FaInfoCircle /> Observação: *{ag.observacao}*</p>
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
};


// ------------------------------------------
// COMPONENTE PRINCIPAL: Profissionais.jsx
// ------------------------------------------
export default function Profissionais() {
    const [profissionais, setProfissionais] = useState([]);
    const navigate = useNavigate();
    const [agendamentos, setAgendamentos] = useState([]); 
    const [pacientes, setPacientes] = useState([]);       
    const [modalAberto, setModalAberto] = useState(false);
    const [profissionalSelecionado, setProfissionalSelecionado] = useState(null);
    const [loading, setLoading] = useState(true);

    
    // Processamento de dados (Agrupamento e Mapa) - ESTÁVEL com useMemo
    const { agendamentosPorProfissional, pacientesMap } = useMemo(() => {
        const pMap = pacientes.reduce((acc, p) => {
            acc[p._id] = p;
            return acc;
        }, {});

        const aByProf = agendamentos.reduce((acc, ag) => {
            const profId = ag.profissional?._id || ag.profissional; 
            
            if (profId) {
                if (!acc[profId]) acc[profId] = [];
                acc[profId].push(ag);
            } 
            return acc;
        }, {});

        return { agendamentosPorProfissional: aByProf, pacientesMap: pMap };
    }, [agendamentos, pacientes]);


    // 🚨 CORREÇÃO CRÍTICA: Função aninhada em useEffect para máxima estabilidade
    useEffect(() => {
        
        const carregarDados = async () => {
            try {
                setLoading(true);
                // Busca todos os dados em paralelo
                const [{ data: userRes }, { data: agendRes }, { data: pacRes }] = await Promise.all([
                    apiService.getUsuarios(), // ✅ CORREÇÃO: Busca todos os usuários
                    apiService.getAgendamentos(), 
                    apiService.getPacientes(), 
                ]);
                    
                // Filtra para exibir apenas Doutores e Atendentes
                const staff = userRes.filter(u => u.perfil === 'patrao' || u.profissional === 'Dr(a)' || u.profissional === 'Atendente');
                
                // ✅ LÓGICA DE FILTRO: Se uma clínica está selecionada, esconde o card do patrão.
                const selectedClinicId = localStorage.getItem('selectedClinicId');
                if (selectedClinicId && selectedClinicId !== '') {
                    setProfissionais(staff.filter(u => u.perfil !== 'patrao'));
                } else {
                    setProfissionais(staff || []);
                }
                setAgendamentos(agendRes || []); 
                setPacientes(pacRes || []);
            } catch (err) {
                console.error("Erro ao carregar dados:", err);
            } finally {
                // Adiciona um pequeno delay para mitigar o flickering em modo Strict
                setTimeout(() => setLoading(false), 50); 
            }
        };

        carregarDados(); 
        
        // O array vazio [ ] garante que esta função roda apenas na montagem.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); 


    const abrirAgenda = (profissional) => {
        setProfissionalSelecionado(profissional);
        setModalAberto(true);
    };

    const fecharAgenda = () => {
        setModalAberto(false);
        setProfissionalSelecionado(null);
    };
    

    if (loading) return <p className="loading-msg">Carregando dados...</p>;
    
    if (profissionais.length === 0) return <p className="empty-msg">Nenhum profissional ou atendente encontrado.</p>;

    return (
        <div className="profissionais-page">
            <h1 className="profissionais-titulo">Nossos Profissionais</h1> 
            <div className="cards-container">
                {profissionais.map(prof => (
                    <div key={prof._id} className="profissional-card">
                        <img src={prof.foto ? `${baseURL}${prof.foto}` : '/placeholder-foto.png'} alt={`Foto de ${prof.nome}`} className="profissional-foto"/>
                        <div className="card-info">
                            {/* ✅ CORREÇÃO: Exibe "Saile" para o perfil de patrão */}
                            <h3>{prof.nome} <span className="tipo-profissional">
                                ({prof.perfil === 'patrao' ? 'Saile' : prof.profissional})
                            </span></h3>
                            <p className="especialidade">Especialidade: {prof.funcao || "Clínico Geral"}</p>
                            {/* Exibe a clínica do profissional */}
                            <p className="clinica-info">{prof.clinica?.nome || 'Sem clínica'}</p>
                            <div className="profissional-contato">
                                {prof.cro && <p><FaIdCard /> CRO: {prof.cro}</p>}
                                {prof.tel && <p><FaPhone /> Telefone: {prof.tel}</p>}
                                {prof.email && <p><FaEnvelope /> Email: {prof.email}</p>}
                            </div>
                            {/* ✅ LÓGICA CONDICIONAL DOS BOTÕES */}
                            {prof.perfil === 'patrao' ? (
                                <div className="admin-buttons">
                                    <button className="agenda-btn" onClick={() => abrirAgenda(prof)}>
                                        <FaCalendarAlt /> Ver Agenda
                                    </button>
                                    <button className="agenda-btn" onClick={() => navigate('/usuarios')}>
                                        <FaUserCog /> Gerenciar Usuários
                                    </button>
                                </div>
                            ) : prof.profissional === 'Dr(a)' ? (
                                <button className="agenda-btn" onClick={() => abrirAgenda(prof)}>
                                    <FaCalendarAlt /> Acessar Agenda
                                </button>
                            ) : (
                                <div className="no-agenda-placeholder"></div> // Espaço reservado para atendentes
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {modalAberto && (
                <AgendaModal
                    profissional={profissionalSelecionado}
                    onClose={fecharAgenda}
                    agendamentosPorProfissional={agendamentosPorProfissional}
                    pacientesMap={pacientesMap}
                />
            )}
        </div>
    );
}