import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

export default function Navbar() {
  const [nomeUsuario, setNomeUsuario] = useState(localStorage.getItem("nomeUsuario") || "Usuário");
  const [fotoUsuario, setFotoUsuario] = useState(localStorage.getItem("fotoUsuario") || "");
  const [funcionariosLogados, setFuncionariosLogados] = useState([]);

  useEffect(() => {
    const atualizarUsuario = () => {
      setNomeUsuario(localStorage.getItem("nomeUsuario") || "Usuário");
      setFotoUsuario(localStorage.getItem("fotoUsuario") || "");
    };
    window.addEventListener("usuarioLogado", atualizarUsuario);
    return () => window.removeEventListener("usuarioLogado", atualizarUsuario);
  }, []);

  useEffect(() => {
    socket.on("atualizarFuncionarios", (lista) => {
      setFuncionariosLogados(lista);
    });
    return () => socket.off("atualizarFuncionarios");
  }, []);

  const perfil = localStorage.getItem("perfil");

  return (
    <nav className="bg-blue-600 text-white p-4 flex justify-between items-center font-bold">
      <div>Clínica Odontológica</div>
      <div className="flex items-center gap-3">
        {fotoUsuario ? (
          <img src={`http://localhost:5000${fotoUsuario}`} alt="Avatar" className="w-10 h-10 rounded-full object-cover border-2 border-white" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-blue-600">{nomeUsuario.charAt(0)}</div>
        )}
        <span>{nomeUsuario}</span>

        {perfil === "patrao" && funcionariosLogados.length > 0 && (
          <div className="ml-4">
            <strong>Funcionários logados:</strong>
            <ul>
              {funcionariosLogados.map((f, idx) => (
                <li key={idx}>{f.nome}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
}
