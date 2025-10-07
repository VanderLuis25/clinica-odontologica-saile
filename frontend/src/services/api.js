import axios from 'axios';

// 1. Pega a URL da API da variável de ambiente VITE_API_URL.
// 2. Se a variável não existir (em desenvolvimento), usa o localhost como padrão.
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: baseURL,
});

// Interceptor para adicionar o token de autenticação em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;

      // ✅ CORREÇÃO: Prioriza a clínica selecionada pelo patrão, 
      // mas usa a clínica do próprio usuário (salva no login) como padrão.
      const selectedClinicId = localStorage.getItem('selectedClinicId'); // Usado pelo Patrão
      const userClinicId = localStorage.getItem('clinicaId'); // Salvo no login
      const clinicIdToSend = selectedClinicId || userClinicId;

      if (clinicIdToSend) config.headers['x-clinic-id'] = clinicIdToSend;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros, como 401 (Não Autorizado)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Ex: deslogar o usuário se o token for inválido
      localStorage.removeItem('token');
      // Opcional: redirecionar para a página de login
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Exporta um objeto com todas as funções da API
export const apiService = {
  // ------------------ Autenticação ------------------
  login: (username, password) => api.post('/auth/login', { username, password }),

  // ------------------ Clínicas (NOVO) ------------------
  getClinicas: () => api.get('/api/clinicas'),
  createClinica: (data) => api.post('/api/clinicas', data),
  updateClinica: (id, data) => api.put(`/api/clinicas/${id}`, data),
  deleteClinica: (id) => api.delete(`/api/clinicas/${id}`),


  // ------------------ Usuários / Profissionais ------------------
  getUsuarios: (perfil = "") => api.get(perfil ? `/usuarios?perfil=${perfil}` : '/usuarios'),
  getProfissionais: () => api.get('/profissionais'),
  getUsuarioById: (id) => api.get(`/usuarios/${id}`), // ✅ Rota para buscar um usuário específico
  createUsuario: (formData) => api.post('/usuarios', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateUsuario: (id, data) => {
    const headers = data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {};
    return api.put(`/usuarios/${id}`, data, { headers });
  },
  deleteUsuario: (id) => api.delete(`/usuarios/${id}`),

  // ------------------ Pacientes ------------------
  getPacientes: () => api.get('/pacientes'),
  createPaciente: (item) => api.post('/pacientes', item),
  updatePaciente: (id, item) => api.put(`/pacientes/${id}`, item),
  deletePaciente: (id) => api.delete(`/pacientes/${id}`),
  searchPacientes: (query) => api.get(`/pacientes?q=${encodeURIComponent(query)}`),

  // ------------------ Procedimentos ------------------
  getProcedimentos: () => api.get('/procedimentos'),
  createProcedimento: (item) => api.post('/procedimentos', item),
  updateProcedimento: (id, item) => api.put(`/procedimentos/${id}`, item),
  deleteProcedimento: (id) => api.delete(`/procedimentos/${id}`),

  // ------------------ Agendamentos ------------------
  getAgendamentos: () => api.get('/agendamentos'),
  createAgendamento: (item) => api.post('/agendamentos', item),
  updateAgendamento: (id, item) => api.put(`/agendamentos/${id}`, item),
  deleteAgendamento: (id) => api.delete(`/agendamentos/${id}`),

  // ------------------ Financeiro ------------------
  getFinanceiro: () => api.get('/financeiro'),
  createFinanceiro: (item) => api.post('/financeiro', item),
  updateFinanceiro: (id, item) => api.put(`/financeiro/${id}`, item),
  deleteFinanceiro: (id) => api.delete(`/financeiro/${id}`),

  // ------------------ Relatórios (NOVO) ------------------
  getRelatorioFinanceiro: () => api.get('/relatorios/financeiro'),


  // ------------------ Prontuários ------------------
  getProntuarios: () => api.get('/prontuarios'),
  createProntuario: (item) => api.post('/prontuarios', item),
  updateProntuario: (id, item) => api.put(`/prontuarios/${id}`, item),
  deleteProntuario: (id) => api.delete(`/prontuarios/${id}`),
};