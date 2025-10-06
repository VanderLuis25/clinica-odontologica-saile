// src/context/SystemDataContext.jsx
import React, { createContext, useState, useCallback, useMemo } from "react";
import { apiService } from "../services/api.js"; // 1. Importar o novo apiService

export const SystemDataContext = createContext({});

export const SystemDataProvider = ({ children }) => {
  // ---------- Estados Globais ----------
  const [financeiro, setFinanceiro] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [procedimentos, setProcedimentos] = useState([]);
  const [profissionais, setProfissionais] = useState([]); // Add state for professionals
  const [agendamentos, setAgendamentos] = useState([]);

  const [loading, setLoading] = useState({
    financeiro: false,
    pacientes: false,
    procedimentos: false,
    profissionais: false, // Add loading state
    agendamentos: false,
  });

  const [error, setError] = useState({
    financeiro: null,
    pacientes: null,
    procedimentos: null,
    profissionais: null, // Add error state
    agendamentos: null,
  });

 // ---------- Searchers ----------
 const searchPacientes = useCallback(
    async (query) => {
      try {
        // 2. Usar apiService e extrair `data` da resposta do axios
        const { data } = await apiService.searchPacientes(query);
        return data;
      } catch (err) {
        console.error("Erro ao buscar pacientes:", err);
        return []; // Retorna array vazio em caso de erro
      }
    }, []);

  // ---------- Fetchers (Mantidos como estão) ----------
  const fetchFinanceiro = useCallback(async () => {
    setLoading((prev) => ({ ...prev, financeiro: true }));
    try {
      const { data } = await apiService.getFinanceiro();
      setFinanceiro(data || []);
      setError((prev) => ({ ...prev, financeiro: null }));
    } catch (err) {
      console.error("Erro financeiro:", err);
      setError((prev) => ({ ...prev, financeiro: err.message }));
    } finally {
      setLoading((prev) => ({ ...prev, financeiro: false }));
    }
  }, []);

  const fetchPacientes = useCallback(async () => {
    setLoading((prev) => ({ ...prev, pacientes: true }));
    try {
      const { data } = await apiService.getPacientes();
      setPacientes(data || []);
      setError((prev) => ({ ...prev, pacientes: null }));
    } catch (err) {
      console.error("Erro pacientes:", err);
      setError((prev) => ({ ...prev, pacientes: err.message }));
    } finally {
      setLoading((prev) => ({ ...prev, pacientes: false }));
    }
  }, []);

  const fetchProcedimentos = useCallback(async () => {
    setLoading((prev) => ({ ...prev, procedimentos: true }));
    try {
      const { data } = await apiService.getProcedimentos();
      setProcedimentos(data || []);
      setError((prev) => ({ ...prev, procedimentos: null }));
    } catch (err) {
      console.error("Erro procedimentos:", err);
      setError((prev) => ({ ...prev, procedimentos: err.message }));
    } finally {
      setLoading((prev) => ({ ...prev, procedimentos: false }));
    }
  }, []);

  const fetchAgendamentos = useCallback(async () => {
    setLoading((prev) => ({ ...prev, agendamentos: true }));
    try {
      const { data } = await apiService.getAgendamentos();
      setAgendamentos(data || []);
      setError((prev) => ({ ...prev, agendamentos: null }));
    } catch (err) {
      console.error("Erro agendamentos:", err);
      setError((prev) => ({ ...prev, agendamentos: err.message }));
    } finally {
      setLoading((prev) => ({ ...prev, agendamentos: false }));
    }
  }, []);

  const fetchProfissionais = useCallback(async () => {
    setLoading((prev) => ({ ...prev, profissionais: true }));
    try {
      const { data } = await apiService.getProfissionais();
      setProfissionais(data || []);
      setError((prev) => ({ ...prev, profissionais: null }));
    } catch (err) {
      console.error("Erro ao buscar profissionais:", err);
      setError((prev) => ({ ...prev, profissionais: err.message }));
    } finally {
      setLoading((prev) => ({ ...prev, profissionais: false }));
    }
  }, []);

  const fetchResumo = useCallback(async () => {
    await fetchPacientes();
    await fetchProcedimentos();
    await fetchAgendamentos();
  }, [fetchPacientes, fetchProcedimentos, fetchAgendamentos]);

  // ---------- Financeiro (Lógica de atualização ajustada) ----------
  const createFinanceiro = useCallback(
    async (novoRegistro) => {
      try {
        const { data: registroSalvo } = await apiService.createFinanceiro(novoRegistro);
        // 🚨 MUDANÇA: Em vez de atualizar o estado local, recarrega do servidor
        // Isso garante que o status (e outros campos) retornado seja exibido.
        await fetchFinanceiro(); 
        return registroSalvo;
      } catch (err) {
        console.error("Erro ao cadastrar registro financeiro:", err);
        throw err;
      }
    },
    [fetchFinanceiro] // Adicionado fetchFinanceiro às dependências
  );

  const updateFinanceiro = useCallback(
    async (id, dados) => {
      try {
        const { data: registroAtualizado } = await apiService.updateFinanceiro(id, dados);
        // Mantém a recarga para refletir a atualização do status
        await fetchFinanceiro(); 
        return registroAtualizado;
      } catch (err) {
        console.error("Erro ao atualizar registro financeiro:", err);
        throw err;
      }
    },
    [fetchFinanceiro]
  );

  const deleteFinanceiro = useCallback(
    async (id) => {
      try {
        await apiService.deleteFinanceiro(id);
        // Mantém a atualização local otimizada para remoção
        setFinanceiro((prev) => prev.filter((f) => f._id !== id));
      } catch (err) {
        console.error("Erro ao deletar registro financeiro:", err);
        throw err;
      }
    }, []
  );
    
    // ---------- Agendamentos ----------
    const createAgendamento = useCallback(
      async (novoAgendamento) => {
        try {
          const { data: agendamentoSalvo } = await apiService.createAgendamento(novoAgendamento);
          // Recarrega a lista para garantir consistência, especialmente com dados populados
          await fetchAgendamentos();
          return agendamentoSalvo;
        } catch (err) {
          console.error("Erro ao criar agendamento:", err);
          throw err;
        }
      },
      [fetchAgendamentos]
    );

    const updateAgendamento = useCallback(
      async (id, dados) => {
        try {
          const { data: agendamentoAtualizado } = await apiService.updateAgendamento(id, dados);
          await fetchAgendamentos();
          return agendamentoAtualizado;
        } catch (err) {
          console.error("Erro ao atualizar agendamento:", err);
          throw err;
        }
      },
      [fetchAgendamentos]
    );

    const deleteAgendamento = useCallback(
      async (id) => {
        await apiService.deleteAgendamento(id);
        // A atualização via socket.io já vai chamar o fetchAgendamentos,
        // mas podemos manter uma atualização local para feedback imediato.
        setAgendamentos((prev) => prev.filter((ag) => ag._id !== id));
      }, []
    );

    // As outras funções (Procedimentos e Pacientes) foram mantidas como você enviou
    // pois a questão era específica sobre o status financeiro.

  // ---------- Procedimentos ----------
  const updateProcedimento = useCallback(
    async (id, dados) => {
      try {
        const { data: procedimentoAtualizado } = await apiService.updateProcedimento(id, dados);
        await fetchProcedimentos();
        return procedimentoAtualizado;
      } catch (err) {
        console.error("Erro ao atualizar procedimento:", err);
        throw err;
      }
    },
    [fetchProcedimentos]
  );

  // ---------- Pacientes ----------
  const createPaciente = useCallback(
    async (novoPaciente) => {
      try {
        // 1. Pega o ID da clínica do usuário logado
        const clinicaId = localStorage.getItem("clinicaId");
        // 2. Adiciona o ID da clínica aos dados do novo paciente
        const dadosCompletos = { ...novoPaciente, clinica: clinicaId };

        const { data: pacienteSalvo } = await apiService.createPaciente(dadosCompletos);
        setPacientes((prev) => [...prev, pacienteSalvo]); // Atualiza o estado local
        return pacienteSalvo; // Retorna o paciente salvo
      } catch (err) {
        console.error("Erro ao cadastrar paciente:", err);
        throw err;
      }
    }, []
  );

  const updatePaciente = useCallback(
    async (id, dados) => {
      try {
        const { data: pacienteAtualizado } = await apiService.updatePaciente(id, dados);
        await fetchPacientes();
        return pacienteAtualizado;
      } catch (err) {
        console.error("Erro ao atualizar paciente:", err);
        throw err;
      }
    },
    [fetchPacientes]
  );

  const deletePaciente = useCallback(
    async (id) => {
      try {
        await apiService.deletePaciente(id);
        setPacientes((prev) => prev.filter((p) => p._id !== id));
      } catch (err) {
        console.error("Erro ao deletar paciente:", err);
        throw err;
      }
    }, []
  );

  // ---------- Context Value ----------
  const contextValue = useMemo(
    () => ({
      financeiro,
      pacientes,
      procedimentos,
      profissionais, // Add state to context
      agendamentos,
      loading,
      error,
      fetchFinanceiro,
      fetchPacientes,
      fetchProcedimentos,
      fetchProfissionais, // Add function to context
      fetchAgendamentos,
      fetchResumo,
      createPaciente,
      updatePaciente,
      deletePaciente,
      createFinanceiro,
      updateFinanceiro,
      deleteFinanceiro,
      createAgendamento,
      updateAgendamento,
      deleteAgendamento,
      searchPacientes,
      updateProcedimento,
    }),
    [
      financeiro,
      pacientes,
      procedimentos,
      profissionais, // Add to dependency array
      agendamentos,
      loading,
      error,
      fetchFinanceiro,
      fetchPacientes,
      fetchProcedimentos,
      fetchProfissionais, // Add to dependency array
      fetchAgendamentos,
      fetchResumo,
      createPaciente,
      updatePaciente,
      deletePaciente,
      createFinanceiro,
      updateFinanceiro,
      deleteFinanceiro,
      createAgendamento,
      updateAgendamento,
      deleteAgendamento,
      searchPacientes,
      updateProcedimento,
    ]
  );

  return (
    <SystemDataContext.Provider value={contextValue}>
      {children}
    </SystemDataContext.Provider>
  );
};