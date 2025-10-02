import axios from 'axios';

// Define a URL base da API.
// Em produção (quando `VITE_API_URL` é definido pelo Netlify), usa a rota relativa '/api'.
// Em desenvolvimento, usa o servidor local 'http://localhost:5000'.
// A rota '/api' é redirecionada para a nossa Netlify Function pelo arquivo `netlify.toml`.
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
  login: (username, password) => api.post('/usuarios/login', { username, password }),

  // ------------------ Usuários / Profissionais ------------------
  getUsuarios: (perfil = "") => api.get(perfil ? `/usuarios?perfil=${perfil}` : '/usuarios'),
  getProfissionais: () => api.get('/profissionais'),
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

  // ------------------ Prontuários ------------------
  getProntuarios: () => api.get('/prontuarios'),
  createProntuario: (item) => api.post('/prontuarios', item),
  updateProntuario: (id, item) => api.put(`/prontuarios/${id}`, item),
  deleteProntuario: (id) => api.delete(`/prontuarios/${id}`),
};