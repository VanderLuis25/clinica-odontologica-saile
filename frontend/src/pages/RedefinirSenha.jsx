import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../index.css';

const RedefinirSenha = () => {
  const { token } = useParams(); // Pega o token da URL
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await axios.post(`${baseURL}/usuarios/redefinir-senha/${token}`, { password });
      setMessage(response.data.message + ' Você será redirecionado para o login em 3 segundos.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Ocorreu um erro. O link pode ter expirado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box" style={{ flex: 'none', margin: 'auto' }}>
        <h2>Crie sua Nova Senha</h2>

        {message && <p style={{ color: 'green', marginBottom: '15px' }}>{message}</p>}
        {error && <p className="login-error">{error}</p>}

        {!message && (
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="password">Nova Senha</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="confirmPassword">Confirme a Nova Senha</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-login primary-button" disabled={loading}>
              {loading ? 'Salvando...' : 'Redefinir Senha'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default RedefinirSenha;