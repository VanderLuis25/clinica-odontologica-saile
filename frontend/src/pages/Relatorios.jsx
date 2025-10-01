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
    
    const [kpis, setKpis] = useState({
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
            
            // 1. Filtrar registros financeiros pelo status "pago" (usando o campo correto 'statusPagamento')
            const paidFinancialRecords = fin.filter(item => item.statusPagamento && item.statusPagamento.toLowerCase() === 'pago');

            // 2. Calcule os KPIs ATUAIS, garantindo que o valor seja numérico
            const totalReceita = paidFinancialRecords.reduce((acc, item) =>
                item.tipo === "receita" ? acc + (parseFloat(item.valor) || 0) : acc, 0
            );
            const totalDespesa = paidFinancialRecords.reduce((acc, item) =>
                item.tipo === "despesa" ? acc + (parseFloat(item.valor) || 0) : acc, 0
            );

            const saldo = totalReceita - totalDespesa; 
            const totalConsultas = ag.length;
            const totalPacientes = pac.length;

            const currentKpis = { totalReceita, totalDespesa, saldo, totalConsultas, totalPacientes };
            setKpis(currentKpis);
            
            // 3. Salva os KPIs para comparação futura (Simulação)
            saveKpisForComparison(currentKpis); 

            // 4. Lógica de Consultas por Profissional (Mantida)
            setAgendamentos(ag);
            const totalConsultasPorProfissional = ag.reduce((acc, agendamento) => {
                const profissionalId = agendamento.profissional?._id || agendamento.profissional;
                const profissionalNome = agendamento.profissional?.nome || agendamento.profissionalNome; 
                
                if (!profissionalId || !profissionalNome) return acc;

                if (!acc[profissionalId]) {
                    acc[profissionalId] = { nome: profissionalNome, quantidade: 0 };
                }
                acc[profissionalId].quantidade += 1;
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


    // 💡 NOVO: Prepara os dados para o gráfico de pizza
    const pieData = {
        labels: Object.values(consultasPorProfissional).map(p => p.nome),
        datasets: [
            {
                label: 'Consultas',
                data: Object.values(consultasPorProfissional).map(p => p.quantidade),
                backgroundColor: [
                    'rgba(128, 5, 128, 0.8)', // Cor principal
                    'rgba(93, 3, 93, 0.8)',  // Cor secundária
                    'rgba(150, 50, 150, 0.8)', // Variação
                    'rgba(180, 80, 180, 0.8)', // Variação
                    'rgba(210, 110, 210, 0.8)', // Variação
                ],
                borderColor: [
                    '#ffffff',
                    '#ffffff',
                    '#ffffff',
                    '#ffffff',
                    '#ffffff',
                ],
                borderWidth: 2,
            },
        ],
    };

    const pieOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'right', // Coloca a legenda à direita
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const label = context.label || '';
                        const value = context.parsed;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(1) + '%';
                        return `${label}: ${value} (${percentage})`;
                    }
                }
            }
        },
    };

    return (
        <div className="relatorios-container">
            <h2 className="dashboard-title">Dashboard de Desempenho Financeiro</h2>
         

            {/* ---------------- KPIs com Comparação ---------------- */}
            <div className="relatorios-kpis">
                <ComparisonCard 
                    title="Receita Total" 
                    current={kpis.totalReceita} 
                    previous={kpisAnteriores?.totalReceita}
                />
                
                <ComparisonCard 
                    title="Despesa Total" 
                    current={kpis.totalDespesa} 
                    previous={kpisAnteriores?.totalDespesa}
                />
                
                <ComparisonCard 
                    title="Saldo Financeiro" 
                    current={kpis.saldo} 
                    previous={kpisAnteriores?.saldo}
                />

                <ComparisonCard 
                    title="Total de Consultas" 
                    current={kpis.totalConsultas} 
                    previous={kpisAnteriores?.totalConsultas}
                    isCurrency={false}
                />
                <ComparisonCard 
                    title="Total de Pacientes" 
                    current={kpis.totalPacientes} 
                    previous={kpisAnteriores?.totalPacientes}
                    isCurrency={false}
                />
            </div>

            <hr />
            
            {/* ---------------- GRÁFICOS E TABELA ---------------- */}
            <div className="consultas-profissionais">
                <h3>Distribuição de Consultas por Profissional</h3>
                
                <div className="chart-and-list-container">
                    
                    {/* 💡 NOVO: GRÁFICO DE PIZZA */}
                    <div className="profissional-chart-box">
                        {/* Garante que o gráfico só renderize se houver dados */}
                        {Object.keys(consultasPorProfissional).length > 0 ? (
                            <Pie data={pieData} options={pieOptions} />
                        ) : (
                            <p>Nenhuma consulta registrada para o gráfico.</p>
                        )}
                    </div>

                    {/* LISTA DE CONSULTAS POR PROFISSIONAL (Mantido) */}
                    <div className="profissionais-grid">
                        {Object.keys(consultasPorProfissional).map((profissionalId) => (
                            <div key={profissionalId} className="profissional-card">
                                <h4>{consultasPorProfissional[profissionalId].nome}</h4>
                                <p>Consultas Agendadas: {consultasPorProfissional[profissionalId].quantidade}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}