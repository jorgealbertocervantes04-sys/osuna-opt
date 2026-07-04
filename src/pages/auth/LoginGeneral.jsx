import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';

export default function LoginGeneral() {
  const navigate = useNavigate();
  const [celular, setCelular] = useState('');
  const [pin, setPin] = useState('');
  const [autenticando, setAutenticando] = useState(false);

  const ejecutarInicioSesion = async (e) => {
    e.preventDefault();
    if (!celular || !pin) return alert("Ingresa tu número de celular y PIN.");
    
    setAutenticando(true);
    try {
      const { data: usuarioBD, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('celular', celular)
        .eq('pin_seguridad', pin)
        .single();

      if (error || !usuarioBD) throw new Error("Credenciales incorrectas o número no registrado.");

      // Validamos que SÓLO los directivos ("General") puedan entrar aquí
      if (usuarioBD.rol === 'General') {
        localStorage.setItem('udat_app_session', JSON.stringify(usuarioBD));
        navigate('/general'); // Redirige al dashboard corporativo
      } else {
        alert("Acceso denegado. No tienes permisos de Alta Dirección.");
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setAutenticando(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ background: '#1e293b', padding: '40px 35px', borderRadius: '16px', width: '100%', maxWidth: '350px', border: '1px solid #334155', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', textAlign: 'center' }}>
        <h2 style={{ color: '#f8fafc', margin: '0 0 10px 0', fontSize: '22px' }}>Alta Dirección</h2>
        <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '25px' }}>Ingresa tus credenciales corporativas.</p>
        
        <form onSubmit={ejecutarInicioSesion}>
          <input type="tel" value={celular} onChange={e => setCelular(e.target.value)} placeholder="Número Celular" style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#0f172a', color: '#fff', border: '1px solid #334155', marginBottom: '15px', boxSizing: 'border-box', outline: 'none' }} />
          <input type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder="PIN de Seguridad" style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#0f172a', color: '#fff', border: '1px solid #334155', marginBottom: '25px', boxSizing: 'border-box', outline: 'none' }} />
          <button type="submit" disabled={autenticando} style={{ width: '100%', padding: '14px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}>
            {autenticando ? 'Validando...' : 'Acceder al Tablero'}
          </button>
        </form>
      </div>
    </div>
  );
}