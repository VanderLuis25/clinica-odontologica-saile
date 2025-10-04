import React, { useState, useEffect, useCallback } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { apiService } from "../services/api.js";
import "./Usuarios.css";

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
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
  
// Hook para gerenciar o formulário de funcionário
const useFormularioFuncionario = (onSuccess) => {
    const [funcionario, setFuncionario] = useState(initialState);
    const [editando, setEditando] = useState(null);
    const [previewFoto, setPreviewFoto] = useState(null);
    const [msg, setMsg] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (files && files[0]) {
            setFuncionario({ ...funcionario, [name]: files[0] });
            setPreviewFoto(URL.createObjectURL(files[0]));
        } else if (name === "profissional" && value !== "Dr(a)") {
            setFuncionario({ ...funcionario, [name]: value, cro: "" });
        } else {
            setFuncionario({ ...funcionario, [name]: value });
        }
    };

    const limparFormulario = useCallback(() => {
        setFuncionario(initialState);
        setPreviewFoto(null);
        setEditando(null);
        setMsg("");
    }, []);

    const handleEditar = useCallback((func) => {
        setFuncionario({
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
        window.scrollTo(0, 0); // Rola para o topo para ver o formulário
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg("");

        try {
            if (funcionario.profissional === "Dr(a)" && !funcionario.cro) {
                setMsg("O campo CRO é obrigatório para profissionais Dr(a).");
                return;
            }

            const formData = new FormData();
            Object.keys(funcionario).forEach((key) => {
                const value = funcionario[key];
                if (value !== null && value !== "" && !(editando && key === "password" && value === "")) {
                    formData.append(key, value);
                }
            });

            if (editando) {
                await apiService.updateUsuario(editando, formData);
                setMsg("Funcionário atualizado com sucesso!");
            } else {
                if (!funcionario.password) {
                    setMsg("Senha é obrigatória para novo funcionário.");
                    return;
                }
                formData.append("perfil", "funcionario");
                await apiService.createUsuario(formData);
                setMsg("Funcionário criado com sucesso!");
            }

            limparFormulario();
            onSuccess(); // Chama o callback para recarregar a lista
        } catch (err) {
            console.error("Erro ao salvar funcionário:", err);
            setMsg(err.message || "Ocorreu um erro ao salvar.");
        } finally {
            setLoading(false);
        }
    };

    return { funcionario, editando, previewFoto, msg, loading, handleChange, handleSubmit, handleEditar, limparFormulario };
};

// Hook para gerenciar a lista de funcionários
const useFuncionarios = () => {
    const [funcionarios, setFuncionarios] = useState([]);
    const [msg, setMsg] = useState("");
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const carregarFuncionarios = useCallback(async () => {
        setLoading(true);
        try {
            const { data: lista } = await apiService.getUsuarios();
            const funcionariosFiltrados = lista.filter((u) => u.perfil !== "patrao");
            setFuncionarios(funcionariosFiltrados);
        } catch (err) {
            console.error("Erro ao carregar funcionários:", err);
            setMsg(err.message || "Erro ao carregar funcionários.");
        } finally {
            setLoading(false);
        }
    }, []);

    const handleExcluir = async (id) => {
        if (window.confirm("Deseja realmente excluir este funcionário?")) {
            try {
                await apiService.deleteUsuario(id);
                setMsg("Funcionário excluído com sucesso!");
                carregarFuncionarios(); // Recarrega a lista
            } catch (err) {
                console.error("Erro ao excluir funcionário:", err);
                setMsg(err.message || "Erro ao excluir funcionário.");
            }
        }
    };

    useEffect(() => {
        carregarFuncionarios();
    }, [carregarFuncionarios]);

    return { funcionarios, loading, msg, carregarFuncionarios, handleExcluir };
};

export default function Usuarios() {
  const perfil = localStorage.getItem("perfil");
  const { funcionarios, loading: loadingLista, msg: msgLista, carregarFuncionarios, handleExcluir } = useFuncionarios();
  const { funcionario, editando, previewFoto, msg: msgForm, loading: loadingForm, handleChange, handleSubmit, handleEditar, limparFormulario } = useFormularioFuncionario(carregarFuncionarios);

  // Proteção de Rota
  if (perfil !== "patrao") {
    return <p>Você não tem permissão para acessar esta página.</p>;
  }

  const handleApiError = (error) => {
    const navigate = useNavigate();
    try {
        // Lógica para lidar com erros de API, como redirecionar para o login em caso de 401
    } catch (e) {
        //...
    }
  }

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
            value={funcionario.nome}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="cpf"
            placeholder="CPF"
            value={funcionario.cpf}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="tel"
            placeholder="Telefone"
            value={funcionario.tel}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={funcionario.email}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="funcao"
            placeholder="Especialidade/Função"
            value={funcionario.funcao}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="username"
            placeholder="Usuário"
            value={funcionario.username}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder={editando ? "Nova Senha (opcional)" : "Senha"}
            value={funcionario.password}
            onChange={handleChange}
          />

          <select
            name="profissional"
            value={funcionario.profissional}
            onChange={handleChange}
            required
          >
            <option value="Dr(a)">Dr(a) - Profissional de Saúde</option>
            <option value="Atendente">Atendente/Secretária</option>
            <option value="Dona">Dona/Gerência</option>
          </select>

          {funcionario.profissional === "Dr(a)" && (
            <input
              type="text"
              name="cro"
              placeholder="CRO (Registro Profissional)"
              value={funcionario.cro}
              onChange={handleChange}
              required
            />
          )}

          <input type="file" name="foto" onChange={handleChange} />
          {previewFoto && (
            <img src={previewFoto} alt="Preview" className="preview-foto" />
          )}

          <button type="submit" disabled={loadingForm}>
            {loadingForm ? "Salvando..." : (editando ? "Salvar Alterações" : "Cadastrar")}
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
        {msgForm && <p className="msg">{msgForm}</p>}
      </div>

      <div className="usuarios-lista">
        <h3>Lista de Funcionários</h3>
        {loadingLista && <p>Carregando funcionários...</p>}
        {!loadingLista && <table>
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
        </table>}
        {msgLista && <p className="msg">{msgLista}</p>}
      </div>
    </div>
  );
}
