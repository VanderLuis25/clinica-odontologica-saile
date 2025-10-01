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

import React, { useState } from "react";
import { Routes, Route, Navigate, Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaHome, FaClipboardList, FaTooth, FaMoneyBill, FaFileMedical, FaChartBar, FaUserCog,
  FaBars, FaCalendarAlt, FaSignOutAlt, FaUserCircle
} from "react-icons/fa";

// Contexto Global
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

  const foto = localStorage.getItem("fotoUsuario"); // URL completa do backend

  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [imgError, setImgError] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  if (!token) return <Login />;

  return (
    <SystemDataProvider>
      <div className="app-container">
        <header className="header-logo">
          <img src={logo} alt="Logo" />
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

              {/* Menu do Profissional (Dr/Dra) */}
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
                    <Link to="/profissionais" className={location.pathname === "/profissionais" ? "active" : ""} onClick={() => setMobileMenu(false)}>
                      <FaUserCog className="icon" /><span className="label">Profissionais</span>
                    </Link>
                  </li>
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

              {/* Rotas exclusivas do Patrão */}
              {perfil === "patrao" && <Route path="/usuarios" element={<Usuarios />} />}
              {perfil === "patrao" && <Route path="/relatorios" element={<Relatorios />} />}
              {perfil === "patrao" && <Route path="/profissionais" element={<Profissionais />} />}

              <Route path="*" element={<Navigate to="/home" />} />
            </Routes>
          </main>
        </div>
      </div>
    </SystemDataProvider>
  );


  
}