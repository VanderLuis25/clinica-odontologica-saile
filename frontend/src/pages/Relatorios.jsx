import React, { useState, useEffect, useCallback } from "react";
import { apiService } from "../services/api.js";
import "./Relatorios.css";

// 💡 NOVO: Importar componentes do Chart.js
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Registrar os elementos necessários para o gráfico de pizza
ChartJS.register(ArcElement, Tooltip, Legend);

// ⚠️ SIMULAÇÃO: No ambiente real, você buscará e salvará este histórico
const STORAGE_KEY = 'financial_kpis_history';

// --- Funções Auxiliares de Formatação ---
const formatCurrency = (value) => value.toLocaleString("pt-BR", { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
});

const getSaldoClass = (saldo) => {
    if (saldo > 0) return 'saldo-positivo';
    if (saldo < 0) return 'saldo-negativo';
    return '';
};

const calculateVariation = (current, previous) => {
    if (previous === 0) return current > 0 ? "+100%" : "Novo dado";
    const variation = ((current - previous) / previous) * 100;
    const sign = variation >= 0 ? "+" : "";
    return `${sign}${variation.toFixed(2)}%`;
};

// Componente para exibir o KPI com a comparação (Mantido)
const ComparisonCard = ({ title, current, previous, isCurrency = true }) => {
    // ... (Mantido o código do ComparisonCard) ...
    const previousValue = previous || 0;
    const variation = calculateVariation(current, previousValue);
    const variationClass = variation.includes('+') ? 'variation-up' : variation.includes('-') ? 'variation-down' : '';

    const displayCurrent = isCurrency ? `R$ ${formatCurrency(current)}` : current.toLocaleString('pt-BR');
    const displayPrevious = isCurrency ? `R$ ${formatCurrency(previousValue)}` : previousValue.toLocaleString('pt-BR');

    return (
        <div className={`kpi-card ${title === 'Saldo Financeiro' ? getSaldoClass(current) : ''}`}>
            <h3>{title}</h3>
            <p className="kpi-current">{displayCurrent}</p>
            <div className={`kpi-comparison ${variationClass}`}>
                <small>vs. Mês Anterior:</small>
                <span className="kpi-variation">{variation}</span>
            </div>
            <small className="kpi-previous-value">(Mês Ant.: {displayPrevious})</small>
        </div>
    );
};


export default function Relatorios() {
    const [agendamentos, setAgendamentos] = useState([]);
    const [consultasPorProfissional, setConsultasPorProfissional] = useState({});
    // ✅ ALTERADO: Agora teremos um estado para KPIs por clínica e um para o total
    const [kpisByClinic, setKpisByClinic] = useState({});
    const [totalKpis, setTotalKpis] = useState({
        totalReceita: 0,
        totalDespesa: 0,
        saldo: 0,
        totalConsultas: 0,
        totalPacientes: 0
    });
    
    const [kpisHistorico, setKpisHistorico] = useState({});

    // Carrega o histórico ao iniciar (Mantido)
    useEffect(() => {
        const storedHistory = localStorage.getItem(STORAGE_KEY);
        if (storedHistory) {
            setKpisHistorico(JSON.parse(storedHistory));
        }
    }, []);

    // Função para salvar os KPIs (Simulação) (Mantido)
    const saveKpisForComparison = (currentKpis) => {
        // ... (Mantido o código da função saveKpisForComparison) ...
        const today = new Date();
        const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const prevMonthKey = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;
        
        const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;


        setKpisHistorico(prev => {
            const newHistory = { ...prev };
            
            if (!newHistory[prevMonthKey]) {
                const simulatedPreviousData = {
                    totalReceita: currentKpis.totalReceita * 0.9,
                    totalDespesa: currentKpis.totalDespesa * 1.1,
                    saldo: currentKpis.totalReceita * 0.9 - currentKpis.totalDespesa * 1.1,
                    totalConsultas: currentKpis.totalConsultas * 0.95,
                    totalPacientes: currentKpis.totalPacientes * 0.99
                };
                newHistory[prevMonthKey] = simulatedPreviousData;
            }

            newHistory[currentMonthKey] = currentKpis;
            
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
            return newHistory;
        });
    };

    // Buscar dados em tempo real e calcular KPIs (Mantido)
    const fetchData = useCallback(async () => {
        try {
            const [{ data: fin }, { data: ag }, { data: proc }, { data: pac }] = await Promise.all([
                apiService.getFinanceiro(),
                apiService.getAgendamentos(),
                apiService.getProcedimentos(),
                apiService.getPacientes()
            ]);

            // ... (Cálculo de KPIs e agendamentos mantido) ...
            
            // ✅ NOVO: Lógica para calcular KPIs por clínica
            const kpisCalculados = fin.reduce((acc, item) => {
                const clinicaId = item.clinica?._id;
                const clinicaNome = item.clinica?.nome || "Sem Clínica";
                if (!clinicaId) return acc;

                if (!acc[clinicaId]) {
                    acc[clinicaId] = { nome: clinicaNome, totalReceita: 0, totalDespesa: 0 };
                }

                if (item.statusPagamento && item.statusPagamento.toLowerCase() === 'pago') {
                    if (item.tipo === 'receita') {
                        acc[clinicaId].totalReceita += parseFloat(item.valor) || 0;
                    } else if (item.tipo === 'despesa') {
                        acc[clinicaId].totalDespesa += parseFloat(item.valor) || 0;
                    }
                }
                return acc;
            }, {});

            // Adiciona contagem de pacientes e agendamentos por clínica
            ag.forEach(agendamento => {
                const clinicaId = agendamento.clinica?._id;
                if (clinicaId && kpisCalculados[clinicaId]) {
                    kpisCalculados[clinicaId].totalConsultas = (kpisCalculados[clinicaId].totalConsultas || 0) + 1;
                }
            });
            pac.forEach(paciente => {
                const clinicaId = paciente.clinica?._id;
                if (clinicaId && kpisCalculados[clinicaId]) {
                    kpisCalculados[clinicaId].totalPacientes = (kpisCalculados[clinicaId].totalPacientes || 0) + 1;
                }
            });

            // Calcula o saldo para cada clínica
            Object.values(kpisCalculados).forEach(c => { c.saldo = c.totalReceita - c.totalDespesa; });
            setKpisByClinic(kpisCalculados);

            // Calcula e salva os KPIs TOTAIS para o card de resumo
            const currentKpis = { totalReceita: fin.reduce((acc, item) => item.tipo === "receita" && item.statusPagamento === 'pago' ? acc + (parseFloat(item.valor) || 0) : acc, 0), totalDespesa: fin.reduce((acc, item) => item.tipo === "despesa" && item.statusPagamento === 'pago' ? acc + (parseFloat(item.valor) || 0) : acc, 0), saldo: fin.reduce((acc, item) => item.statusPagamento === 'pago' ? (item.tipo === 'receita' ? acc + parseFloat(item.valor) : acc - parseFloat(item.valor)) : acc, 0), totalConsultas: ag.length, totalPacientes: pac.length };
            setTotalKpis(currentKpis);
            
            // 3. Salva os KPIs para comparação futura (Simulação)
            saveKpisForComparison(currentKpis); 

            // 4. Lógica de Consultas por Profissional (Mantida)
            setAgendamentos(ag);
            const totalConsultasPorProfissional = ag.reduce((acc, agendamento) => {
                const profissional = agendamento.profissional;
                const clinica = agendamento.clinica;

                if (!profissional?._id || !clinica?._id) return acc;

                // Agrupa primeiro por clínica
                if (!acc[clinica._id]) {
                    acc[clinica._id] = { nome: clinica.nome, profissionais: {} };
                }

                // Depois por profissional dentro da clínica
                if (!acc[clinica._id].profissionais[profissional._id]) {
                    acc[clinica._id].profissionais[profissional._id] = { nome: profissional.nome, quantidade: 0 };
                }
                acc[clinica._id].profissionais[profissional._id].quantidade += 1;
                return acc;
            }, {});
            setConsultasPorProfissional(totalConsultasPorProfissional);

        } catch (err) {
            console.error("Erro ao buscar dados:", err);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const getPreviousMonthKpis = () => {
        const today = new Date();
        const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const prevMonthKey = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;
        return kpisHistorico[prevMonthKey];
    };
    
    const kpisAnteriores = getPreviousMonthKpis();


    // ✅ NOVO: Prepara os dados para o gráfico de barras
    const barChartData = {
        labels: Object.values(consultasPorProfissional).map(c => c.nome),
        datasets: [
            {
                label: 'Total de Consultas por Clínica',
                data: Object.values(consultasPorProfissional).map(c => 
                    Object.values(c.profissionais).reduce((sum, prof) => sum + prof.quantidade, 0)
                ),
                backgroundColor: 'rgba(128, 5, 128, 0.7)',
                borderColor: 'rgba(128, 5, 128, 1)',
                borderWidth: 1,
            },
        ],
    };

    const barChartOptions = {
        responsive: true,
        plugins: {
            legend: {
                display: false, // Legenda já está no título do dataset
            },
            title: {
                display: true,
                text: 'Comparativo de Consultas por Clínica',
                font: { size: 16 }
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: { stepSize: 1 }
            },
        },
    };

    return (
        <div className="relatorios-container">
            <h2 className="dashboard-title">Dashboard de Desempenho Financeiro</h2>
         

            {/* ---------------- KPIs com Comparação ---------------- */}
            <div className="relatorios-kpis">
                {/* Card de Resumo Geral */}
                <ComparisonCard 
                    title="Receita Total" 
                    current={totalKpis.totalReceita} 
                    previous={kpisAnteriores?.totalReceita}
                />
                <ComparisonCard 
                    title="Despesa Total" 
                    current={totalKpis.totalDespesa} 
                    previous={kpisAnteriores?.totalDespesa}
                />
                <ComparisonCard 
                    title="Saldo Financeiro" 
                    current={totalKpis.saldo} 
                    previous={kpisAnteriores?.saldo}
                />
                <ComparisonCard 
                    title="Total de Consultas" 
                    current={totalKpis.totalConsultas} 
                    previous={kpisAnteriores?.totalConsultas}
                    isCurrency={false}
                />
                <ComparisonCard 
                    title="Total de Pacientes" 
                    current={totalKpis.totalPacientes} 
                    previous={kpisAnteriores?.totalPacientes}
                    isCurrency={false}
                />
            </div>

            <hr />

            {/* ✅ NOVO: Container para os KPIs de cada clínica */}
            <div className="clinicas-kpis-container">
                {Object.values(kpisByClinic).map(clinica => (
                    <div key={clinica.nome} className="clinica-kpi-card">
                        <h4>{clinica.nome}</h4>
                        <p><strong>Receita:</strong> {formatCurrency(clinica.totalReceita || 0)}</p>
                        <p><strong>Despesa:</strong> {formatCurrency(clinica.totalDespesa || 0)}</p>
                        <p className={getSaldoClass(clinica.saldo || 0)}><strong>Saldo:</strong> {formatCurrency(clinica.saldo || 0)}</p>
                        <p><strong>Consultas:</strong> {clinica.totalConsultas || 0}</p>
                        <p><strong>Pacientes:</strong> {clinica.totalPacientes || 0}</p>
                    </div>
                ))}
            </div>
            
            {/* ---------------- GRÁFICOS E TABELA ---------------- */}
            <div className="consultas-profissionais">
                <h3>Distribuição de Consultas por Profissional</h3>
                
                <div className="chart-and-list-container">                    
                    {/* ✅ NOVO: GRÁFICO DE BARRAS */}
                    <div className="bar-chart-container">
                        {Object.keys(consultasPorProfissional).length > 0 ? (
                            <Bar options={barChartOptions} data={barChartData} />
                        ) : (
                            <p>Nenhuma consulta encontrada para exibir.</p>
                        )}
                    </div>

                    {/* LISTA DE DETALHES POR PROFISSIONAL */}
                    <div className="profissionais-grid">
                        {Object.keys(consultasPorProfissional).length > 0 ? (
                            Object.values(consultasPorProfissional).map(clinica => (
                                <div key={clinica.nome} className="clinica-relatorio-card">
                                    <h4>{clinica.nome}</h4>
                                    <ul>
                                        {Object.values(clinica.profissionais).map(prof => (
                                            <li key={prof.nome}>{prof.nome}: <strong>{prof.quantidade}</strong> consultas</li>
                                        ))}
                                    </ul>
                                </div>
                            ))
                        ) : (
                            <p>Nenhuma consulta encontrada para exibir.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}