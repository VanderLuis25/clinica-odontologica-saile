import React, { useState, useEffect } from "react";
import { FaEdit, FaTrash, FaHospital } from "react-icons/fa";
import { apiService } from "../services/api.js";
import "./Usuarios.css"; // Reutilizando o CSS de usuários para consistência

export default function Clinicas() {
  const [clinicas, setClinicas] = useState([]);
  const [editando, setEditando] = useState(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const initialState = {
    nome: "",
    endereco: "",
    telefone: "",
    corIdentificacao: "#800580",
  };

  const [formData, setFormData] = useState(initialState);

  const carregarClinicas = async () => {
    setLoading(true);
    try {
      const { data } = await apiService.getClinicas();
      setClinicas(data);
    } catch (err) {
      setMsg("Erro ao carregar clínicas: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarClinicas();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const limparFormulario = () => {
    setFormData(initialState);
    setEditando(null);
    setMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      if (editando) {
        await apiService.updateClinica(editando, formData);
        setMsg("Clínica atualizada com sucesso!");
      } else {
        await apiService.createClinica(formData);
        setMsg("Clínica criada com sucesso!");
      }
      limparFormulario();
      await carregarClinicas();
    } catch (err) {
      setMsg("Erro ao salvar clínica: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleEditar = (clinica) => {
    setEditando(clinica._id);
    setFormData({
      nome: clinica.nome,
      endereco: clinica.endereco || "",
      telefone: clinica.telefone || "",
      corIdentificacao: clinica.corIdentificacao || "#800580",
    });
    window.scrollTo(0, 0);
  };

  const handleExcluir = async (id) => {
    if (window.confirm("Deseja realmente excluir esta clínica? Esta ação não pode ser desfeita.")) {
      setLoading(true);
      try {
        await apiService.deleteClinica(id);
        setMsg("Clínica excluída com sucesso!");
        await carregarClinicas();
      } catch (err) {
        setMsg("Erro ao excluir clínica: " + (err.response?.data?.error || err.message));
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="usuarios-container">
      <h2>Gerenciamento de Clínicas</h2>

      <div className="usuarios-form">
        <h3>{editando ? "Editar Clínica" : "Cadastrar Nova Clínica"}</h3>
        <form onSubmit={handleSubmit}>
          <input type="text" name="nome" placeholder="Nome da Clínica" value={formData.nome} onChange={handleChange} required />
          <input type="text" name="endereco" placeholder="Endereço" value={formData.endereco} onChange={handleChange} />
          <input type="text" name="telefone" placeholder="Telefone" value={formData.telefone} onChange={handleChange} />
          <label htmlFor="corIdentificacao">Cor de Identificação:</label>
          <input type="color" id="corIdentificacao" name="corIdentificacao" value={formData.corIdentificacao} onChange={handleChange} />

          <button type="submit" disabled={loading}>
            {loading ? "Salvando..." : (editando ? "Salvar Alterações" : "Cadastrar")}
          </button>
          {editando && (
            <button type="button" onClick={limparFormulario} className="btn-cancel">
              Cancelar Edição
            </button>
          )}
        </form>
        {msg && <p className="msg">{msg}</p>}
      </div>

      <div className="usuarios-lista">
        <h3>Lista de Clínicas</h3>
        {loading && clinicas.length === 0 ? <p>Carregando...</p> : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Endereço</th>
                <th>Telefone</th>
                <th>Cor</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {clinicas.map((c) => (
                <tr key={c._id}>
                  <td>{c.nome}</td>
                  <td>{c.endereco || "N/A"}</td>
                  <td>{c.telefone || "N/A"}</td>
                  <td>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      backgroundColor: c.corIdentificacao,
                      borderRadius: '50%',
                      border: '1px solid #ccc',
                      margin: 'auto'
                    }}></div>
                  </td>
                  <td>
                    <button className="btn-edit" onClick={() => handleEditar(c)}>
                      <FaEdit />
                    </button>
                    <button className="btn-delete" onClick={() => handleExcluir(c._id)}>
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && clinicas.length === 0 && <p>Nenhuma clínica cadastrada.</p>}
      </div>
    </div>
  );
}