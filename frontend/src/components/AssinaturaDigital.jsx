import React, { useRef, useEffect, useState } from 'react';
import './AssinaturaDigital.css'; // Import the CSS file

const AssinaturaDigital = ({ onSignatureChange, signatureData, disabled = false }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Effect to draw existing signature or clear canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Clear canvas before drawing
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set styles
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (signatureData) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setHasSignature(true);
      };
      img.src = signatureData;
    } else {
      setHasSignature(false);
    }
  }, [signatureData, disabled]); // Rerun when signatureData or disabled status changes

  // Effect to handle canvas resizing
  useEffect(() => {
    const canvas = canvasRef.current;
    const resizeCanvas = () => {
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = 150; // Keep a fixed height or make it proportional
        // Redraw signature after resize
        if (signatureData) {
            const ctx = canvas.getContext('2d');
            const img = new Image();
            img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            img.src = signatureData;
        }
    };
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas(); // Initial resize

    return () => window.removeEventListener('resize', resizeCanvas);
  }, [signatureData]);

  const getCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || e.touches[0].clientX;
    const clientY = e.clientY || e.touches[0].clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  const startDrawing = (e) => {
    e.preventDefault();
    if (disabled) return;
    setIsDrawing(true);
    const { x, y } = getCoords(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing || disabled) return;
    const { x, y } = getCoords(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    const newSignatureData = canvas.toDataURL();
    setHasSignature(true);
    if (onSignatureChange) {
      onSignatureChange(newSignatureData);
    }
  };

  const clearSignature = () => {
    if (disabled) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    if (onSignatureChange) {
      onSignatureChange(null);
    }
  };

  return (
    <div className="assinatura-container">
      <div className="assinatura-header">
        <h4>Assinatura Digital</h4>
        {hasSignature && (
          <button 
            type="button" 
            onClick={clearSignature}
            className="btn-clear-signature"
            disabled={disabled}
          >
            Limpar Assinatura
          </button>
        )}
      </div>
      
      <div className="assinatura-area">
        <canvas
          ref={canvasRef}
          className="signature-canvas"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing} // Stop drawing if mouse leaves canvas
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{ cursor: disabled ? 'not-allowed' : 'crosshair' }}
        />
        <div className="assinatura-placeholder">
          {!hasSignature && (
            <span className="placeholder-text">
              {disabled ? 'Assinatura não disponível' : 'Assine aqui'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssinaturaDigital;