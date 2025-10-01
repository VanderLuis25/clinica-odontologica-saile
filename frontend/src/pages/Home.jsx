// src/pages/Home.jsx
import React, { useEffect, useContext } from "react";
import { SystemDataContext } from "../context/SystemDataContext.jsx";
import "./Home.css";

// IMPORTAR COMPONENTES DO RECHARTS (Instale se ainda não o fez)
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

export default function Home() {
  const { pacientes, procedimentos, agendamentos, fetchResumo } =
    useContext(SystemDataContext);

  // 1. DETERMINA A DATA E O DIA DA SEMANA
  const dataHoje = new Date();
  const hoje = dataHoje.toISOString().split("T")[0];
  const diaDaSemana = dataHoje.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado

  // Verifica se é domingo
  const isDomingo = diaDaSemana === 0;

  // 2. FILTRA AGENDAMENTOS (apenas se não for domingo)
  const agendamentosHoje = isDomingo
    ? []
    : agendamentos?.filter((a) => {
        if (!a?.data) return false;
        // Normaliza a data do agendamento
        const dataAgendamento = new Date(a.data)
          .toISOString()
          .split("T")[0];
        return dataAgendamento === hoje;
      }) || [];

  const dadosGrafico = [
    { label: "Pacientes", valor: pacientes?.length || 0, cor: "#800580" },
    { label: "Procedimentos", valor: procedimentos?.length || 0, cor: "#059669" },
    { label: "Agendamentos", valor: agendamentos?.length || 0, cor: "#f97316" },
  ];

  // Carrega dados inicialmente (só uma vez)
  useEffect(() => {
    fetchResumo(true); // força carregar todos os dados
  }, []);

  // -----------------------------------------------------
  // FUNÇÃO DE RENDERIZAÇÃO DA AGENDA
  // -----------------------------------------------------
  const renderAgenda = () => {
    if (isDomingo) {
      return (
        <p className="agenda-domingo-aviso">
          🗓️ <strong>Não há atendimentos programados para hoje (Domingo).</strong>
          <br />
          Seu sistema está configurado para não exibir agendamentos neste dia.
        </p>
      );
    }

    if (agendamentosHoje.length === 0) {
      return <p>Nenhum agendamento para hoje.</p>;
    }

    return (
      <ul>
        {agendamentosHoje.map((a) => {
          const ID_DO_PACIENTE = a.pacienteId || a.paciente?._id;
          const pacienteEncontrado = pacientes?.find(
            (p) => p._id === ID_DO_PACIENTE
          );

          const nomeDoPaciente =
            pacienteEncontrado?.nome || a.nomePaciente || "Paciente Desconhecido";

          const telefoneExibido = pacienteEncontrado?.telefone || "N/A";

          return (
            <li key={a._id} className="agendamento-item">
              <span className="nome">{nomeDoPaciente}</span>
              <span className="telefone">{telefoneExibido}</span>
              <span className="hora">{a.hora}</span>
            </li>
          );
        })}
      </ul>
    );
  };
  
  // -----------------------------------------------------
  // FUNÇÃO DE RENDERIZAÇÃO DA LEGENDA DA PIZZA
  // -----------------------------------------------------
  const renderLegenda = () => (
    <ul className="pizza-legenda">
      {dadosGrafico.map((d, index) => (
        <li key={index}>
          <span className="legenda-cor" style={{ backgroundColor: d.cor }}></span>
          <span className="legenda-label">{d.label}</span>
          <span className="legenda-valor">({d.valor})</span>
        </li>
      ))}
    </ul>
  );
  
  // -----------------------------------------------------

  return (
    <div className="home-container">
      <h2>Dashboard</h2>

      {/* Cards de resumo */}
      <div className="resumo-cards">
        {dadosGrafico.map((d, idx) => (
          <div key={idx} className="card" style={{ borderLeftColor: d.cor }}>
            <h3>{d.label}</h3>
            <p>{d.valor}</p>
          </div>
        ))}
      </div>

      {/* Gráfico de Pizza (NOVA ESTRUTURA) */}
      <div className="grafico">
        <h3>Resumo Gráfico de Itens</h3>
        <div className="pizza-chart-container">
            {/* ResponsiveContainer com width="100%" para o CSS controlar o tamanho */}
            <ResponsiveContainer width="100%" height={300}> 
                <PieChart>
                    <Pie
                        data={dadosGrafico}
                        dataKey="valor"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        innerRadius={80} // Gráfico de Donut
                        outerRadius={110}
                        paddingAngle={5}
                        fill="#8884d8"
                        labelLine={false}
                    >
                        {dadosGrafico.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.cor} />
                        ))}
                    </Pie>
                    <Tooltip 
                        formatter={(value, name, props) => [`${value} ${props.payload.label}`, 'Total']}
                    />
                </PieChart>
            </ResponsiveContainer>
            
            {/* Legenda */}
            {renderLegenda()}
        </div>
      </div>

      {/* Agenda de hoje */}
      <div className="agenda-hoje">
        <h3>Agendamentos de Hoje</h3>
        {renderAgenda()}
      </div>
    </div>
  );
}