import React, { useState, useEffect, useContext, useMemo } from "react";
import { FaSearch } from "react-icons/fa";
import './Pacientes.css';
import { apiService } from "../services/api.js"; // ✅ CORREÇÃO: Importa o apiService
import { SystemDataContext } from "../context/SystemDataContext.jsx"; 

// 💡 FUNÇÃO DE CÁLCULO DE IDADE
const calculateAge = (birthDateString) => {
    if (!birthDateString) return "";
    
    const birthDate = new Date(birthDateString);
    const today = new Date();
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age > 0 ? age.toString() : "";
};

// --- Validações ---
const validateCPF = (cpf) => /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(cpf);
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePhone = (tel) => /^\(?\d{2}\)?[\s-]?\d{4,5}-?\d{4}$/.test(tel);

// --- Formulário ---
const PatientForm = ({ patient, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        nome: '',
        dataNascimento: '',
        sexo: '',
        profissao: '',
        telefone: '',
        email: '',
        rg: '',
        cpf: '',
        endereco: {
            rua: '', numero: '', bairro: '', cidade: '', estado: '', cep: ''
        }
    });

    useEffect(() => {
        if (patient) {
            const cleanValue = (val) => val ?? '';
            
            const formatDate = (dateString) => {
                if (!dateString) return '';
                const date = new Date(dateString);
                // Formato YYYY-MM-DD
                return date.toISOString().split('T')[0];
            };

            setFormData({
                _id: patient._id,
                nome: cleanValue(patient.nome),
                dataNascimento: formatDate(patient.dataNascimento),
                sexo: cleanValue(patient.sexo),
                profissao: cleanValue(patient.profissao),
                telefone: cleanValue(patient.telefone),
                email: cleanValue(patient.email), // Corrigido
                rg: cleanValue(patient.rg),
                cpf: cleanValue(patient.cpf),
                endereco: {
                    rua: cleanValue(patient.endereco?.rua),
                    numero: cleanValue(patient.endereco?.numero),
                    bairro: cleanValue(patient.endereco?.bairro),
                    cidade: cleanValue(patient.endereco?.cidade),
                    estado: cleanValue(patient.endereco?.estado),
                    cep: cleanValue(patient.endereco?.cep), // Corrigido
                }
            });
        }
    }, [patient]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            return { ...prev, [name]: value };
        });
    };

    const handleEnderecoChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            endereco: { ...prev.endereco, [name]: value }
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Nota: O campo 'idade' será enviado, mas o backend deve ignorá-lo e usar 'dataNascimento'
        if (!formData.dataNascimento) { alert("Data de Nascimento é obrigatória."); return; }
        if (formData.email && !validateEmail(formData.email)) { alert("Email inválido."); return; }
        if (formData.telefone && !validatePhone(formData.telefone)) { alert("Telefone inválido."); return; }
        
        onSave(formData);
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <span className="close-button" onClick={onClose}>&times;</span>
                <h2>{patient ? 'Editar Paciente' : 'Cadastrar Paciente'}</h2>
                <form onSubmit={handleSubmit} className="patient-form-grid">
                    <div className="form-group span-3"><label>Paciente:</label><input type="text" name="nome" value={formData.nome} onChange={handleChange} required /></div>
          _         <div className="form-group span-1"><label>Nasc.:</label><input type="date" name="dataNascimento" value={formData.dataNascimento} onChange={handleChange} required /></div>
                    <div className="form-group span-1"><label>Sexo:</label><input type="text" name="sexo" value={formData.sexo} onChange={handleChange} /></div>
                    <div className="form-group span-3"><label>End.:</label><input type="text" name="rua" value={formData.endereco.rua} onChange={handleEnderecoChange} /></div>
                    <div className="form-group span-1"><label>Nº:</label><input type="text" name="numero" value={formData.endereco.numero} onChange={handleEnderecoChange} /></div>
                    <div className="form-group span-2"><label>Bairro:</label><input type="text" name="bairro" value={formData.endereco.bairro} onChange={handleEnderecoChange} /></div>
                    <div className="form-group span-1"><label>Estado:</label><input type="text" name="estado" value={formData.endereco.estado} onChange={handleEnderecoChange} /></div>
                    <div className="form-group span-2"><label>Cidade:</label><input type="text" name="cidade" value={formData.endereco.cidade} onChange={handleEnderecoChange} /></div>
                    <div className="form-group span-1"><label>CEP:</label><input type="text" name="cep" value={formData.endereco.cep} onChange={handleEnderecoChange} /></div>
                    <div className="form-group span-3"><label>Profissão:</label><input type="text" name="profissao" value={formData.profissao} onChange={handleChange} /></div>
                    <div className="form-group span-2"><label>Tel/Cel:</label><input type="tel" name="telefone" value={formData.telefone} onChange={handleChange} /></div>
                    <div className="form-group span-3"><label>E-mail:</label><input type="email" name="email" value={formData.email} onChange={handleChange} /></div>
                    <div className="form-group span-2"><label>RG:</label><input type="text" name="rg" value={formData.rg} onChange={handleChange} /></div>
                    <div className="form-group span-2"><label>CPF:</label><input type="text" name="cpf" value={formData.cpf} onChange={handleChange} required /></div>
                    <div className="form-actions">
                        <button type="submit">Salvar</button>
                        <button type="button" onClick={onClose}>Cancelar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Página Pacientes (CORREÇÃO DO LOOP E EXIBIÇÃO DA IDADE) ---
export default function Pacientes() {
    const { pacientes, fetchPacientes, createPaciente, updatePaciente, deletePaciente, loading } = useContext(SystemDataContext);

    const [selectedPatient, setSelectedPatient] = useState(null);
    const [editingPatientData, setEditingPatientData] = useState(null); // ✅ NOVO: Estado para os dados completos do paciente em edição
    const [searchTerm, setSearchTerm] = useState(""); // ✅ NOVO: Estado para a busca
    const [showForm, setShowForm] = useState(false);

    // Garante que o fetch ocorra SÓ na montagem
    useEffect(() => {
        fetchPacientes();
    }, []); // ⬅️ ARRAY DE DEPENDÊNCIAS VAZIO!

    // ✅ NOVO: Filtra os pacientes com base no termo de busca
    const filteredPacientes = useMemo(() => {
        if (!searchTerm) return pacientes;
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return pacientes.filter(p => 
            (p.nome?.toLowerCase() || "").includes(lowerCaseSearchTerm) ||
            (p.cpf?.toLowerCase() || "").includes(lowerCaseSearchTerm)
        );
    }, [pacientes, searchTerm]);

    const handleSavePatient = async (patientData) => {
        try {
            if (patientData._id) await updatePaciente(patientData._id, patientData);
            else await createPaciente(patientData);
            
            setShowForm(false);
            setSelectedPatient(null);
            // Rebusca para atualizar a lista com o novo ou editado paciente
            fetchPacientes(); 
        } catch (error) { 
            console.error(error); 
            alert('Erro ao salvar paciente. Verifique o console para detalhes.'); 
        }
    };

    // ✅ NOVA FUNÇÃO: Lida com o clique no botão de editar
    const handleEditClick = async (patientId) => {
        try {
            // 1. Busca os dados completos do paciente na API
            const { data: fullPatientData } = await apiService.getPacienteById(patientId);
            // 2. Armazena esses dados no novo estado
            setEditingPatientData(fullPatientData);
            // 3. Abre o formulário
            setShowForm(true);
        } catch (error) {
            console.error("Erro ao buscar dados do paciente para edição:", error);
            alert("Não foi possível carregar os dados completos do paciente.");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Tem certeza que deseja excluir este paciente?")) {
            try { 
                await deletePaciente(id); 
                fetchPacientes(); // Atualiza a lista
            }
            catch (error) { 
                console.error(error); 
                alert('Erro ao excluir paciente. Verifique o console para detalhes.'); 
            }
        }
    };

    if (loading.pacientes || pacientes === null) {
        return (
            <div className="container">
                <p>Carregando pacientes...</p>
            </div>
        );
    }
    
    return (
        <div className="container">
            <h2>Gerenciamento de Pacientes</h2>
            <button className="add-button" onClick={() => { setShowForm(true); setSelectedPatient(null); }}>
                + Cadastrar Novo Paciente
            </button>

            {/* ✅ NOVO: Barra de pesquisa */}
            <div className="search-bar-pacientes">
                <FaSearch className="search-icon" />
                <input 
                    type="text"
                    placeholder="Pesquisar por nome ou CPF..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {(filteredPacientes.length === 0) ? <p>Nenhum paciente encontrado.</p> : (
                <table className="pacientes-table-desktop">
                    <thead>
                        <tr><th>Nome</th><th>Idade</th><th>CPF</th><th>Telefone</th><th>Clínica</th><th>Ações</th></tr>
                    </thead>
                    <tbody>
                        {filteredPacientes.map(p => (
                            <tr key={p._id}>
                                <td>{p.nome}</td>
                                {/* 💡 A IDADE É CALCULADA AQUI */}
                                <td>{calculateAge(p.dataNascimento)}</td> 
                                <td>{p.cpf}</td>
                                <td>{p.telefone}</td>
                                <td>{p.clinica?.nome || 'N/A'}</td>
                                <td className="actions-cell">
                                    <button className="edit-button" onClick={() => handleEditClick(p._id)}>
                                        Editar
                                    </button>
                                    <button className="delete-button" onClick={() => handleDelete(p._id)}>
                                        Excluir
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* ✅ NOVO: Cards para visualização em Mobile */}
            <div className="pacientes-cards-mobile">
                {filteredPacientes.length === 0 && !loading.pacientes ? <p>Nenhum paciente encontrado.</p> : (
                    filteredPacientes.map(p => (
                        <div key={p._id} className="paciente-card-mobile">
                            <div className="card-header-paciente">
                                <span>{p.nome}</span>
                            </div>
                            <div className="card-body-paciente">
                                <p><strong>Idade:</strong> {calculateAge(p.dataNascimento)}</p>
                                <p><strong>CPF:</strong> {p.cpf || 'N/A'}</p>
                                <p><strong>Telefone:</strong> {p.telefone || 'N/A'}</p>
                                <p><strong>Clínica:</strong> {p.clinica?.nome || 'N/A'}</p>
                            </div>
                            <div className="card-actions-paciente">
                                <button className="edit-button" onClick={() => handleEditClick(p._id)}>
                                    Editar
                                </button>
                                <button className="delete-button" onClick={() => handleDelete(p._id)}>
                                    Excluir
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showForm && (
                <PatientForm
                    patient={editingPatientData} // ✅ Passa os dados completos para o formulário
                    onClose={() => { setShowForm(false); setEditingPatientData(null); }} // Limpa o estado ao fechar
                    onSave={handleSavePatient}
                />
            )}
        </div>
    );
}