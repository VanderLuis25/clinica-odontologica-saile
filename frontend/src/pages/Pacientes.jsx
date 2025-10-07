import React, { useState, useEffect, useContext } from "react";
import './Pacientes.css';
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
    const initialMedicalHistory = {
        bloodType: '', allergies: '', chronicDiseases: '', habits: '',
        medications: '', surgeries: '', familyHistory: '', lastVisit: '', currentComplaints: ''
    };

    const [formData, setFormData] = useState({
        nome: '', idade: '', cpf: '', telefone: '', email: '', dataNascimento: '',
        medicalHistory: { ...initialMedicalHistory }
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

            const cleanedPatientData = {
                nome: cleanValue(patient.nome),
                // 💡 Idade calculada para preenchimento do campo (mas o valor salvo é a data)
                idade: calculateAge(patient.dataNascimento), 
                cpf: cleanValue(patient.cpf),
                telefone: cleanValue(patient.telefone),
                email: cleanValue(patient.email),
                dataNascimento: formatDate(patient.dataNascimento), 
                _id: patient._id
            };

            const patientHistory = patient.medicalHistory || {}; 
            const cleanedMedicalHistory = {};
            for (const key in initialMedicalHistory) {
                // Formatação para campos de data dentro do histórico
                cleanedMedicalHistory[key] = (key === 'lastVisit' && patientHistory[key]) 
                    ? formatDate(patientHistory[key]) 
                    : cleanValue(patientHistory[key]);
            }
            
            setFormData({
                ...cleanedPatientData,
                medicalHistory: cleanedMedicalHistory
            });
        }
    }, [patient]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updated = { ...prev, [name]: value };
            
            // 💡 Calcule a idade em tempo real ao mudar a data de nascimento
            if (name === 'dataNascimento') {
                 updated.idade = calculateAge(value);
            }
            
            return updated;
        });
    };

    const handleMedicalHistoryChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            medicalHistory: { ...prev.medicalHistory, [name]: value }
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Nota: O campo 'idade' será enviado, mas o backend deve ignorá-lo e usar 'dataNascimento'
        if (!formData.dataNascimento) { alert("Data de Nascimento é obrigatória."); return; }
        if (!formData.cpf || !validateCPF(formData.cpf)) { alert("CPF inválido. Formato: 000.000.000-00"); return; }
        if (formData.email && !validateEmail(formData.email)) { alert("Email inválido."); return; }
        if (formData.telefone && !validatePhone(formData.telefone)) { alert("Telefone inválido."); return; }
        
        onSave(formData);
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <span className="close-button" onClick={onClose}>&times;</span>
                <h2>{patient ? 'Editar Paciente' : 'Cadastrar Paciente'}</h2>
                <form onSubmit={handleSubmit}>
                    <label htmlFor="nome">Nome:</label>
                    <input id="nome" type="text" name="nome" value={formData.nome} onChange={handleChange} required /> 
                    
                    {/* Campo dataNascimento é a fonte de verdade */}
                    <label htmlFor="dataNascimento">Data de Nascimento:</label>
                    <input id="dataNascimento" type="date" name="dataNascimento" value={formData.dataNascimento} onChange={handleChange} required />
                    
                    {/* Idade calculada, apenas para visualização/preenchimento opcional */}
                    <label htmlFor="idade">Idade (Calculada):</label>
                    {/* 💡 Idade é calculada automaticamente (readOnly ou calculado no handleChange) */}
                    <input id="idade" type="number" name="idade" value={formData.idade} readOnly /> 
                    
                    <label htmlFor="cpf">CPF:</label>
                    <input id="cpf" type="text" name="cpf" value={formData.cpf} onChange={handleChange} placeholder="000.000.000-00" maxLength={14} required />
                    
                    <label htmlFor="telefone">Telefone:</label>
                    <input id="telefone" type="tel" name="telefone" value={formData.telefone} onChange={handleChange} />
                    
                    <label htmlFor="email">Email:</label>
                    <input id="email" type="email" name="email" value={formData.email} onChange={handleChange} />

                    {/* HISTÓRICO MÉDICO */}
                    <label htmlFor="bloodType">Tipo Sanguíneo:</label>
                    <input id="bloodType" type="text" name="bloodType" value={formData.medicalHistory.bloodType} onChange={handleMedicalHistoryChange} />
                    
                    <label htmlFor="allergies">Alergias:</label>
                    <textarea id="allergies" name="allergies" value={formData.medicalHistory.allergies} onChange={handleMedicalHistoryChange}></textarea>
                    
                    <label htmlFor="chronicDiseases">Doenças Crônicas:</label>
                    <textarea id="chronicDiseases" name="chronicDiseases" value={formData.medicalHistory.chronicDiseases} onChange={handleMedicalHistoryChange}></textarea>
                    
                    <label htmlFor="habits">Hábitos:</label>
                    <textarea id="habits" name="habits" value={formData.medicalHistory.habits} onChange={handleMedicalHistoryChange}></textarea>
                    
                    <label htmlFor="medications">Medicações:</label>
                    <textarea id="medications" name="medications" value={formData.medicalHistory.medications} onChange={handleMedicalHistoryChange}></textarea>
                    
                    <label htmlFor="surgeries">Cirurgias:</label>
                    <textarea id="surgeries" name="surgeries" value={formData.medicalHistory.surgeries} onChange={handleMedicalHistoryChange}></textarea>
                    
                    <label htmlFor="familyHistory">Histórico Familiar:</label>
                    <textarea id="familyHistory" name="familyHistory" value={formData.medicalHistory.familyHistory} onChange={handleMedicalHistoryChange}></textarea>
                    
                    <label htmlFor="lastVisit">Última Consulta:</label>
                    <input id="lastVisit" type="date" name="lastVisit" value={formData.medicalHistory.lastVisit} onChange={handleMedicalHistoryChange} />
                    
                    <label htmlFor="currentComplaints">Queixas Atuais:</label>
                    <textarea id="currentComplaints" name="currentComplaints" value={formData.medicalHistory.currentComplaints} onChange={handleMedicalHistoryChange}></textarea>

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
                <table>
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
                                    <button className="edit-button" onClick={() => { setSelectedPatient(p); setShowForm(true); }}>
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

            {showForm && (
                <PatientForm
                    patient={selectedPatient}
                    onClose={() => { setShowForm(false); setSelectedPatient(null); }}
                    onSave={handleSavePatient}
                />
            )}
        </div>
    );
}