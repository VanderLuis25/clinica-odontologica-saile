import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Sidebar() {
  const { logout, perfil } = useContext(AuthContext);
  const navigate = useNavigate();
  const isPatrao = perfil === "patrao";

  return (
    <aside className="w-64 bg-gray-800 text-white min-h-screen p-4 flex flex-col">
      <div className="flex-grow">
        <h1 className="text-2xl font-bold mb-6">Clínica Odontológica</h1>
        <nav>
          <ul>
            <li className="mb-2"><button onClick={() => navigate("/home")} className="w-full text-left py-2 px-4 rounded hover:bg-gray-700">Início</button></li>
            <li className="mb-2"><button onClick={() => navigate("/pacientes")} className="w-full text-left py-2 px-4 rounded hover:bg-gray-700">Pacientes</button></li>
            <li className="mb-2"><button onClick={() => navigate("/agendamentos")} className="w-full text-left py-2 px-4 rounded hover:bg-gray-700">Agendamentos</button></li>
            <li className="mb-2"><button onClick={() => navigate("/prontuarios")} className="w-full text-left py-2 px-4 rounded hover:bg-gray-700">Prontuários</button></li>
            <li className="mb-2"><button onClick={() => navigate("/procedimentos")} className="w-full text-left py-2 px-4 rounded hover:bg-gray-700">Procedimentos</button></li>
            {isPatrao && (
              <>
                <li className="mb-2"><button onClick={() => navigate("/financeiro")} className="w-full text-left py-2 px-4 rounded hover:bg-gray-700">Financeiro</button></li>
                <li className="mb-2"><button onClick={() => navigate("/relatorios")} className="w-full text-left py-2 px-4 rounded hover:bg-gray-700">Relatórios</button></li>
                <li className="mb-2"><button onClick={() => navigate("/gestao-usuarios")} className="w-full text-left py-2 px-4 rounded hover:bg-gray-700">Usuários</button></li>
              </>
            )}
          </ul>
        </nav>
      </div>
      <button onClick={() => { logout(); navigate("/login"); }} className="mt-auto w-full py-2 px-4 rounded bg-red-600 hover:bg-red-700">Sair</button>
    </aside>
  );
}
