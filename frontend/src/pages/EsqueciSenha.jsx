import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios'; // Usando axios para simplicidade
import '../index.css'; // Reutilizar estilos do login

const EsqueciSenha = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await axios.post('http://localhost:5000/usuarios/esqueci-senha', { email });
      setMessage(response.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Ocorreu um erro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box" style={{ flex: 'none', margin: 'auto' }}>
        <h2>Redefinir Senha</h2>
        <p style={{ marginBottom: '20px', color: '#666' }}>
          Digite seu e-mail cadastrado e enviaremos um link para você redefinir sua senha.
        </p>

        {message && <p style={{ color: 'green', marginBottom: '15px' }}>{message}</p>}
        {error && <p className="login-error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-login primary-button" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar Link de Redefinição'}
          </button>
        </form>
        <Link to="/login" style={{ marginTop: '20px', display: 'block' }}>Voltar para o Login</Link>
      </div>
    </div>
  );
};

export default EsqueciSenha;