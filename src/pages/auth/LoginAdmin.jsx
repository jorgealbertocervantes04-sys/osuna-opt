import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from "../../services/authService";

const { loginAdmin } = authService; // Asegura que authService esté correctamente exportado

export default function LoginAdmin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setErrorMsg(''); // Limpia errores previos al intentar iniciar sesión

    try {
      const resultado = await loginAdmin(email, password);

      if (resultado.exito) {
        navigate('/admin/dashboard'); // Redirección limpia al panel de control
      } else {
        setErrorMsg(resultado.mensaje || 'Credenciales inválidas. Verifica tu correo y contraseña.');
      }
    } catch (err) {
      setErrorMsg('Falla de conexión con la infraestructura de autenticación.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0f172a' }}>
      <form 
        onSubmit={handleSubmit} 
        style={{ 
          background: '#1e293b', 
          padding: '40px', 
          borderRadius: '12px', 
          width: '100%', 
          maxWidth: '400px', 
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)' 
        }}
      >
        <h2 style={{ color: '#fbbf24', textAlign: 'center', marginBottom: '20px' }}>UDAT Admin</h2>
        
        {/* Banner de error dinámico */}
        {errorMsg && (
          <div style={{ 
            backgroundColor: 'rgba(239, 68, 68, 0.2)', 
            color: '#f87171', 
            padding: '10px', 
            borderRadius: '6px', 
            marginBottom: '15px', 
            fontSize: '14px', 
            textAlign: 'center',
            border: '1px solid rgba(239, 68, 68, 0.4)'
          }}>
            {errorMsg}
          </div>
        )}

        {/* Campo de Correo Electrónico */}
        <label htmlFor="admin-email" style={{ color: '#94a3b8', display: 'block', marginBottom: '5px', fontSize: '14px' }}>
          Correo Electrónico
        </label>
        <input 
          id="admin-email"
          type="email" 
          required 
          autoComplete="email" // Resuelve advertencias del DOM y mejora experiencia de usuario
          value={email} 
          onChange={(e) => setEmail(e.target.value)}
          disabled={cargando}
          style={{ 
            width: '100%', 
            padding: '12px', 
            marginBottom: '20px', 
            borderRadius: '8px', 
            border: '1px solid #334155', 
            background: '#0f172a', 
            color: 'white', 
            boxSizing: 'border-box',
            opacity: cargando ? 0.6 : 1
          }}
        />

        {/* Campo de Contraseña */}
        <label htmlFor="admin-password" style={{ color: '#94a3b8', display: 'block', marginBottom: '5px', fontSize: '14px' }}>
          Contraseña
        </label>
        <input 
          id="admin-password"
          type="password" 
          required 
          autoComplete="current-password" // ELIMINA EL WARNING DE LA CONSOLA DEFINITIVAMENTE
          value={password} 
          onChange={(e) => setPassword(e.target.value)}
          disabled={cargando}
          style={{ 
            width: '100%', 
            padding: '12px', 
            marginBottom: '30px', 
            borderRadius: '8px', 
            border: '1px solid #334155', 
            background: '#0f172a', 
            color: 'white', 
            boxSizing: 'border-box',
            opacity: cargando ? 0.6 : 1
          }}
        />

        {/* Botón de Envío Seguro */}
        <button 
          type="submit" 
          disabled={cargando}
          style={{ 
            width: '100%', 
            padding: '14px', 
            background: cargando ? '#64748b' : '#fbbf24', // Cambio de color visual si está cargando
            color: cargando ? '#cbd5e1' : '#0f172a', 
            border: 'none', 
            borderRadius: '8px', 
            fontWeight: 'bold', 
            cursor: cargando ? 'not-allowed' : 'pointer', 
            transition: '0.3s',
            boxShadow: cargando ? 'none' : '0 4px 12px rgba(251, 191, 36, 0.2)'
          }}
        >
          {cargando ? 'Verificando Credenciales...' : 'Entrar al Centro de Mando'}
        </button>
      </form>
    </div>
  );
}