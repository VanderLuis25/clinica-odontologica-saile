import React from 'react';
import './Modal.css'; // Importando CSS para estilização do modal

const Modal = ({ message, onConfirm, onCancel, showCancel }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <p>{message}</p>
        <button onClick={onConfirm}>OK</button>
        {showCancel && <button onClick={onCancel}>Cancelar</button>}
      </div>
    </div>
  );
};

export default Modal;