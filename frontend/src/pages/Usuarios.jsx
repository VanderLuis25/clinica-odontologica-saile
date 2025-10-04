import React, { useState, useEffect } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { apiService } from "../services/api.js";
import "./Usuarios.css";

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Usuarios() {
  const navigate = useNavigate();
  const [funcionarios, setFuncionarios] = useState([]);
  const [perfil] = useState(localStorage.getItem("perfil") || "funcionario");
  
  const initialState = {
    nome: "",
    cpf: "",
    tel: "",
    email: "",
    funcao: "",
    username: "",
    password: "", // Senha deve ser controlada separadamente
    profissional: "Atendente",
    cro: "",
    foto: null,
  };

  const [editando, setEditando] = useState(null);
  const [novoFuncionario, setNovoFuncionario] = useState(initialState);

  const [previewFoto, setPreviewFoto] = useState(null);
  const [msg, setMsg] = useState("");

  const carregarFuncionarios = async () => {
    try {
      const { data: lista } = await apiService.getUsuarios();
      const funcionariosFiltrados = lista.filter((u) => u.perfil !== "patrao");
      setFuncionarios(funcionariosFiltrados);
    } catch (err) {
      console.error(err);
      if (err.message && err.message.includes("401")) {
        setMsg("Sessão expirada. Faça login novamente.");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setMsg("Erro ao carregar funcionários: " + err.message);
      }
    }
  };

  useEffect(() => {
    if (perfil === "patrao") carregarFuncionarios();
  }, [perfil, navigate]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files && files[0]) {
      setNovoFuncionario({ ...novoFuncionario, [name]: files[0] });
      setPreviewFoto(URL.createObjectURL(files[0]));
    } else if (name === "profissional" && value !== "Dr(a)") {
      setNovoFuncionario({ ...novoFuncionario, [name]: value, cro: "" });
    } else {
      setNovoFuncionario({ ...novoFuncionario, [name]: value });
    }
  };

  const limparFormulario = () => {
    setNovoFuncionario(initialState);
    setPreviewFoto(null);
    setEditando(null);
    setMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (novoFuncionario.profissional === "Dr(a)" && !novoFuncionario.cro) {
        setMsg("O campo CRO é obrigatório para profissionais Dr(a).");
        return;
      }

      const formData = new FormData();
      Object.keys(novoFuncionario).forEach((key) => {
        const value = novoFuncionario[key];
        if (value !== null && value !== "" && !(editando && key === "password" && value === "")) {
          formData.append(key, value);
        }
      });

      if (!editando) {
        if (!novoFuncionario.password) {
          setMsg("Senha é obrigatória para novo funcionário.");
          return;
        }
        formData.append("perfil", "funcionario");
        await apiService.createUsuario(formData);
        setMsg("Funcionário criado com sucesso!");
      } else {
        await apiService.updateUsuario(editando, formData);
        setMsg("Funcionário editado com sucesso!");
      }

      limparFormulario();
      carregarFuncionarios();
    } catch (err) {
      console.error("Erro no handleSubmit:", err);
      if (err.message && err.message.includes("401")) {
        setMsg("Sessão expirada. Faça login novamente.");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setMsg(err.message || "Erro ao salvar funcionário.");
      }
    }
  };

  const handleEditar = (func) => {
    setNovoFuncionario({
      nome: func.nome || "",
      cpf: func.cpf || "",
      tel: func.tel || "",
      email: func.email || "",
      funcao: func.funcao || "",
      username: func.username || "",
      password: "",
      profissional: func.profissional || "Atendente",
      cro: func.cro || "",
      foto: null,
    });
    setPreviewFoto(func.foto ? `${baseURL}${func.foto}` : null);
    setEditando(func._id);
    setMsg("");
  };

  const handleExcluir = async (id) => {
    if (window.confirm("Deseja realmente excluir este funcionário?")) {
      try {
        await apiService.deleteUsuario(id);
        setMsg("Funcionário excluído com sucesso!");
        carregarFuncionarios();
      } catch (err) {
        if (err.message && err.message.includes("401")) {
          setMsg("Sessão expirada. Faça login novamente.");
          setTimeout(() => navigate("/login"), 2000);
        } else {
          setMsg(err.message || "Erro ao excluir funcionário");
        }
      }
    }
  };

  if (perfil !== "patrao")
    return <p>Você não tem permissão para acessar esta página.</p>;

  return (
    <div className="usuarios-container">
      <h2>Gerenciamento de Funcionários</h2>

      <div className="usuarios-form">
        <h3>{editando ? "Editar Funcionário" : "Cadastrar Novo Funcionário"}</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="nome"
            placeholder="Nome"
            value={novoFuncionario.nome}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="cpf"
            placeholder="CPF"
            value={novoFuncionario.cpf}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="tel"
            placeholder="Telefone"
            value={novoFuncionario.tel}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={novoFuncionario.email}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="funcao"
            placeholder="Especialidade/Função"
            value={novoFuncionario.funcao}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="username"
            placeholder="Usuário"
            value={novoFuncionario.username}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder={editando ? "Nova Senha (opcional)" : "Senha"}
            value={novoFuncionario.password}
            onChange={handleChange}
          />

          <select
            name="profissional"
            value={novoFuncionario.profissional}
            onChange={handleChange}
            required
          >
            <option value="Dr(a)">Dr(a) - Profissional de Saúde</option>
            <option value="Atendente">Atendente/Secretária</option>
            <option value="Dona">Dona/Gerência</option>
          </select>

          {novoFuncionario.profissional === "Dr(a)" && (
            <input
              type="text"
              name="cro"
              placeholder="CRO (Registro Profissional)"
              value={novoFuncionario.cro}
              onChange={handleChange}
              required
            />
          )}

          <input type="file" name="foto" onChange={handleChange} />
          {previewFoto && (
            <img src={previewFoto} alt="Preview" className="preview-foto" />
          )}

          <button type="submit">
            {editando ? "Salvar Alterações" : "Cadastrar"}
          </button>
          {editando && (
            <button
              type="button"
              onClick={limparFormulario}
              className="btn-cancel"
            >
              Cancelar Edição
            </button>
          )}
        </form>
        {msg && <p className="msg">{msg}</p>}
      </div>

      <div className="usuarios-lista">
        <h3>Lista de Funcionários</h3>
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>CRO</th>
              <th>Telefone</th>
              <th>Email</th>
              <th>Função/Especialidade</th>
              <th>Tipo</th>
              <th>Usuário</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {funcionarios.map((f) => (
              <tr key={f._id}>
                <td>{f.nome}</td>
                <td>{f.profissional === 'Dr(a)' ? f.cro : "N/A"}</td>
                <td>{f.tel}</td>
                <td>{f.email}</td>
                <td>{f.funcao}</td>
                <td>{f.profissional}</td>
                <td>{f.username}</td>
                <td>
                  <button className="btn-edit" onClick={() => handleEditar(f)}>
                    <FaEdit />
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleExcluir(f._id)}
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
