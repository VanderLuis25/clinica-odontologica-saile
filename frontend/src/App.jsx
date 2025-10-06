// Ignora erros de extensões que fecham a porta antes de responder
window.addEventListener("error", (event) => {
  if (
    event.message &&
    event.message.includes("The message port closed before a response was received")
  ) {
    event.stopImmediatePropagation();
    console.warn("Mensagem de extensão ignorada:", event.message);
  }
});

window.addEventListener("unhandledrejection", (event) => {
  if (
    event.reason &&
    event.reason.message &&
    event.reason.message.includes("The message port closed before a response was received")
  ) {
    event.preventDefault();
    console.warn("Promise rejeitada por extensão ignorada:", event.reason.message);
  }
});

import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaHome, FaClipboardList, FaTooth, FaMoneyBill, FaFileMedical, FaChartBar, FaUserCog, FaHospital,
  FaBars, FaCalendarAlt, FaSignOutAlt, FaUserCircle
} from "react-icons/fa";

// Contexto Global
import { apiService } from "./services/api.js"; // Importar apiService

import { SystemDataProvider } from "./context/SystemDataContext.jsx";

// Páginas
import Login from "./pages/Login.jsx";
import Home from "./pages/Home.jsx";
import Profissionais from "./pages/Profissionais.jsx"; // Adicione esta linha
import Pacientes from "./pages/Pacientes.jsx";
import Procedimentos from "./pages/Procedimentos.jsx";
import Agendamentos from "./pages/Agendamentos.jsx"; // Certifique-se de que esta importação está correta // Importando o componente Agendamento
import Prontuarios from "./pages/Prontuarios.jsx";
import Financeiro from "./pages/Financeiro.jsx";
import Clinicas from "./pages/Clinicas.jsx"; // 1. Importar a nova página
import Relatorios from "./pages/Relatorios.jsx";

import Usuarios from "./pages/Usuarios.jsx";

// CSS
import "./index.css";
import logo from "./assets/odontologia-logo.png";

export default function App() {
  const token = localStorage.getItem("token");
  const perfil = localStorage.getItem("perfil");
  const nome = localStorage.getItem("nomeUsuario");
  // ✅ 1. Obter o tipo de profissional (Dr(a), Atendente, etc.) do localStorage
  // Este valor é salvo no Login.jsx
  const tipoProfissional = localStorage.getItem("tipoProfissional");
  const nomeClinica = localStorage.getItem("nomeClinica"); // ✅ Obter nome da clínica

  const foto = localStorage.getItem("fotoUsuario"); // URL completa do backend

  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [imgError, setImgError] = useState(false);

  // 💡 NOVO: Estados para controle de clínicas
  const [clinicas, setClinicas] = useState([]);
  const [selectedClinicId, setSelectedClinicId] = useState(localStorage.getItem('selectedClinicId') || '');

  const location = useLocation();
  const navigate = useNavigate();

  // Carrega as clínicas disponíveis para o patrão
  useEffect(() => {
    if (perfil === 'patrao') {
      apiService.getClinicas()
        .then(response => {
          setClinicas(response.data);
          // ✅ CORREÇÃO: Garante que o valor inicial do seletor corresponda ao que está no localStorage.
          // Se não houver nada (padrão para Visão Geral), o valor será ''.
          const storedClinicId = localStorage.getItem('selectedClinicId');
          if (storedClinicId) setSelectedClinicId(storedClinicId);
        })
        .catch(err => console.error("Erro ao buscar clínicas:", err));
    }
  }, [perfil]);

  const handleClinicChange = (e) => {
    const newClinicId = e.target.value;
    setSelectedClinicId(newClinicId);
    localStorage.setItem('selectedClinicId', newClinicId);
    window.location.reload(); // Recarrega a página para atualizar todos os dados
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
    window.location.reload();
  };

  if (!token) return <Login />;

  return (
    <SystemDataProvider>
      <div className="app-container">
        <header className="header-logo">
          <img src={logo} alt="Logo" />

          {/* 💡 NOVO: Seletor de Clínica para o Patrão */}
          {perfil === 'patrao' && clinicas.length > 0 && (
            <div className="clinic-selector">
              <label htmlFor="clinic-select">Visualizando Clínica:</label>
              <select id="clinic-select" value={selectedClinicId} onChange={handleClinicChange}>
                {/* ✅ NOVO: Opção para a visão geral de todas as clínicas */}
                <option value="">
                  Visão Geral (Todas as Clínicas)
                </option>
                {clinicas.map(c => (
                  <option key={c._id} value={c._id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="user-info">
            {!imgError && foto ? (
              <img
                src={foto}
                alt="Foto do Usuário"
                className="user-photo"
                onError={() => setImgError(true)}
              />
            ) : (
              <FaUserCircle className="user-icon" />
            )}
            <span className="user-name">{nome || "Usuário"}</span>
            <span className="user-perfil">
              {/* ✅ 2. Exibir o perfil de forma mais detalhada */}
              ({perfil === "patrao" ? "Patrão(a)" : tipoProfissional || "Funcionário(a)"})
            </span>
            {/* Exibe o nome da clínica se o usuário não for o patrão e tiver uma clínica associada */}
            {perfil !== 'patrao' && nomeClinica && ( // Correctly wrapped conditional rendering
              <span className="user-clinic-name">
                - {nomeClinica}
              </span>
            )}
          </div>
        </header>

        <div className="layout">
          <nav className={`menu-lateral ${collapsed ? "collapsed" : ""} ${mobileMenu ? "show" : "mobile-hidden"}`}>
            <ul>
              <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}><FaBars /></button>
              <li>
                <Link to="/home" className={location.pathname === "/home" ? "active" : ""} onClick={() => setMobileMenu(false)}>
                  <FaHome className="icon" /><span className="label">Home</span>
                </Link>
              </li>
              {/* Menu do Atendente */}
              {(perfil === 'patrao' || tipoProfissional === 'Atendente') && (
                <>
                  <li>
                    <Link to="/pacientes" className={location.pathname === "/pacientes" ? "active" : ""} onClick={() => setMobileMenu(false)}>
                      <FaClipboardList className="icon" /><span className="label">Pacientes</span>
                    </Link>
                  </li>
                </>
              )}

              {/* Menu do Profissional (Dr/Dra) e Atendente */}
              {(perfil === 'patrao' || tipoProfissional === 'Dr(a)') && (
                <>
                  <li>
                    <Link to="/procedimentos" className={location.pathname === "/procedimentos" ? "active" : ""} onClick={() => setMobileMenu(false)}> 
                      <FaTooth className="icon" /><span className="label">Procedimentos</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/prontuarios" className={location.pathname === "/prontuarios" ? "active" : ""} onClick={() => setMobileMenu(false)}>
                      <FaFileMedical className="icon" /><span className="label">Prontuários</span>
                    </Link>
                  </li>
                </>
              )}
              
              {/* Menu de Profissionais (Patrão, Dr(a) e Atendente) */}
              {(perfil === 'patrao' || tipoProfissional === 'Dr(a)' || tipoProfissional === 'Atendente') && (
                <li>
                  <Link to="/profissionais" className={location.pathname === "/profissionais" ? "active" : ""} onClick={() => setMobileMenu(false)}>
                    <FaUserCog className="icon" /><span className="label">Profissionais</span>
                  </Link>
                </li>
              )}

              {/* Menu Comum para todos */}
              <li>
                <Link to="/agendamentos" className={location.pathname === "/agendamentos" ? "active" : ""} onClick={() => setMobileMenu(false)}>
                  <FaCalendarAlt className="icon" /><span className="label">Agendamentos</span>
                </Link>
              </li>

              {/* Menu Financeiro (Patrão e Atendente) */}
              {(perfil === 'patrao' || tipoProfissional === 'Atendente') && (
                <li>
                  <Link to="/financeiro" className={location.pathname === "/financeiro" ? "active" : ""} onClick={() => setMobileMenu(false)}>
                    <FaMoneyBill className="icon" /><span className="label">Financeiro</span>
                  </Link>
                </li>
              )}

              {/* Menu Exclusivo do Patrão */}
              {perfil === "patrao" && (
                <>
                  <li>
                    <Link to="/relatorios" className={location.pathname === "/relatorios" ? "active" : ""} onClick={() => setMobileMenu(false)}>
                      <FaChartBar className="icon" /><span className="label">Relatórios</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/usuarios" className={location.pathname === "/usuarios" ? "active" : ""} onClick={() => setMobileMenu(false)}>
                      <FaUserCog className="icon" /><span className="label">Usuários</span>
                    </Link>
                  </li>
                  {/* 2. Adicionar novo link no menu */}
                  <li>
                    <Link to="/clinicas" className={location.pathname === "/clinicas" ? "active" : ""} onClick={() => setMobileMenu(false)}>
                      <FaHospital className="icon" /><span className="label">Gerenciar Clínicas</span>
                    </Link>
                  </li>
                </>
              )}

              <li>
                <button className="logout-btn" onClick={handleLogout}>
                  <FaSignOutAlt className="icon" /><span className="label">Sair</span>
                </button>
              </li>
            </ul>
          </nav>

          <main className="main-content">
            <Routes>
              <Route path="/" element={<Navigate to="/home" />} />
              <Route path="/home" element={<Home />} />
              <Route path="/agendamentos" element={<Agendamentos />} />

              {/* Rotas do Atendente */}
              {(perfil === 'patrao' || tipoProfissional === 'Atendente') && (
                <>
                  <Route path="/pacientes" element={<Pacientes />} />
                  <Route path="/financeiro" element={<Financeiro />} />
                </>
              )}

              {/* Rotas do Profissional */}
              {(perfil === 'patrao' || tipoProfissional === 'Dr(a)') && (
                <><Route path="/procedimentos" element={<Procedimentos />} /><Route path="/prontuarios" element={<Prontuarios />} /></>
              )} 

              {/* Rota de Profissionais (Patrão, Dr(a) e Atendente) */}
              {(perfil === 'patrao' || tipoProfissional === 'Dr(a)' || tipoProfissional === 'Atendente') && (
                <Route path="/profissionais" element={<Profissionais />} />
              )} 

              {/* Rotas exclusivas do Patrão */}
              {perfil === "patrao" && <Route path="/usuarios" element={<Usuarios />} />}
              {perfil === "patrao" && <Route path="/relatorios" element={<Relatorios />} />}
              {perfil === "patrao" && <Route path="/clinicas" element={<Clinicas />} />} {/* 3. Adicionar nova rota */}

              <Route path="*" element={<Navigate to="/home" />} />
            </Routes>
          </main>
        </div>
      </div>
    </SystemDataProvider>
  );


  
}