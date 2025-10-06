import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiService } from "../services/api.js";
import { FaEye, FaEyeSlash, FaUser, FaLock } from 'react-icons/fa'; // Ícones para Usuário, Senha e mostrar/esconder senha
import logo from '../assets/odontologia-logo.png'; // 💡 1. Importar a imagem
import "../index.css";
// Nota: Certifique-se de que o CSS para .login-container e .input-group foi atualizado
// para suportar o design de duas colunas (lateral esquerda/direita) conforme sua descrição.

export default function Login() {
  const navigate = useNavigate();

  // O perfil foi removido dos estados e da tela, pois a lógica é agora gerenciada pelo backend.
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");
  const [showPassword, setShowPassword] = useState(false); // Novo estado para mostrar/esconder senha

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro("");

    try {
      // CORREÇÃO: Removemos o estado 'perfil' da chamada de login.
      // O backend agora deve identificar o perfil com base apenas em username/password.
      const { data: res } = await apiService.login(username, password); 

      if (res && res.token && res.user && res.user.perfil && res.user.id) {
        // O sucesso continua salvando os dados e o perfil para redirecionamento.
        localStorage.setItem("token", res.token);
        localStorage.setItem("perfil", res.user.perfil); // ESSENCIAL para o redirecionamento
        localStorage.setItem("nomeUsuario", res.user.nome);
        localStorage.setItem("userId", res.user.id);
        localStorage.setItem("tipoProfissional", res.user.profissional); // ✅ SALVAR O TIPO DE PROFISSIONAL
        localStorage.setItem("nomeClinica", res.user.clinica?.nome || ''); // ✅ SALVAR O NOME DA CLÍNICA
        localStorage.setItem("clinicaId", res.user.clinica?._id || ''); // ✅ NOVO: SALVAR O ID DA CLÍNICA

        // ✅ NOVO: Garante que o patrão comece na visão geral.
        // Limpa a seleção de clínica anterior ao fazer login.
        if (res.user.perfil === 'patrao') {
            localStorage.removeItem('selectedClinicId');
        }

        // Salva foto com URL completa do backend
        const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const fotoUrl = res.user.foto
          ? `${baseURL}${res.user.foto}`
          : "";
        localStorage.setItem("fotoUsuario", fotoUrl);

        // Dispara evento para atualização da interface
        window.dispatchEvent(new Event("usuarioLogado"));

        // Redirecionamento Personalizado (Baseado na descrição)
        const userPerfil = res.user.perfil.toLowerCase();
        
        // Você pode implementar uma lógica de redirecionamento mais robusta aqui,
        // mas por enquanto, mantemos o redirecionamento simples para a Home (/).
        // O gerenciamento das rotas específicas (Agenda, Dashboard) deve ser feito no componente Home/Router.
        navigate("/"); 
        
      } else {
        setErro("Credenciais inválidas. Verifique Usuário e Senha.");
      }
    } catch (err) {
      console.error("Erro no login:", err);
      // Mensagem de erro padrão mais clara
      setErro("Usuário ou senha inválidos. Tente novamente.");
    }
  };

  return (
    // Estrutura para Lateral Esquerda (Identidade) e Direita (Formulário)
    <div className="login-container dual-layout"> 
      
      {/* 1. Lateral Esquerda: Identidade e Design (60%) */}
      {/* Você deve garantir que a classe 'login-identity' tenha um design apropriado no seu CSS */}
      <div className="login-identity">
          <img
            src={logo} // 💡 2. Usar a imagem importada
            alt="Logotipo da Clínica"
            className="logo-large" // Classe para logotipo em destaque
          />
          <h1 className="welcome-message">Sua gestão completa, mais sorrisos e resultados.</h1>
          {/* Outros elementos visuais/texto podem ir aqui */}
      </div>

      {/* 2. Lateral Direita: O Formulário de Acesso (40%) */}
      <div className="login-box">
          
        <h2>Acesso ao Sistema</h2>
        
        {/* Removemos o seletor de perfil */}
        {/* <div className="perfil-selection">...</div> */}

        {erro && <p className="login-error">{erro}</p>}

        <form onSubmit={handleLogin}>
          
          {/* Campo de Usuário (E-mail/CPF) */}
          <div className={`input-group ${username ? "focused" : ""}`}>
            <label htmlFor="username">Usuário (nome)</label>
            <FaUser className="input-icon" /> {/* Ícone de Usuário */}
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          {/* Campo de Senha com Toggle (Mostrar/Esconder) */}
          <div className={`input-group ${password ? "focused" : ""}`}>
            <label htmlFor="password">Senha</label>
            <FaLock className="input-icon" /> {/* Ícone de Cadeado */}
            <input
              id="password"
              // ALTERAÇÃO: Tipo de input baseado no estado
              type={showPassword ? "text" : "password"} 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {/* Botão de Toggle (Olho) */}
            <button 
              type="button" 
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          {/* Checkbox Lembrar-me (Opcional) */}
          <div className="login-options">
            <label>
              <input type="checkbox" name="rememberMe" />
              Lembrar-me
            </label>
            
            {/* Link Esqueci Minha Senha */}
            <a href="/esqueci-senha" className="forgot-password-link">Esqueci minha senha</a>
          </div>


          <button type="submit" className="btn-login primary-button">
            ACESSAR
          </button>
        </form>
      </div>
    </div>
  );
}