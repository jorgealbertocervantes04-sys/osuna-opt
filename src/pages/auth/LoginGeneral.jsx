import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';

export default function LoginGeneral() {
  const navigate = useNavigate();
  const [celular, setCelular] = useState('');
  const [pin, setPin] = useState('');
  const [autenticando, setAutenticando] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const ejecutarInicioSesion = async (e) => {
    e.preventDefault();
    if (!celular || !pin) return setErrorMsg("Ingresa tu número de celular y PIN.");
    
    setAutenticando(true);
    setErrorMsg('');
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
        navigate('/general'); 
      } else {
        setErrorMsg("Acceso denegado. No tienes permisos de Alta Dirección.");
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setAutenticando(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a', fontFamily: 'system-ui, sans-serif', padding: '15px' }}>
      <div style={{ background: '#1e293b', padding: '40px 35px', borderRadius: '20px', width: '100%', maxWidth: '350px', border: '1px solid #334155', boxShadow: '0 20px 40px rgba(0,0,0,0.6)', textAlign: 'center', boxSizing: 'border-box' }}>
        
        <h2 style={{ color: '#4f46e5', margin: '0 0 5px 0', fontSize: '28px', fontWeight: 900 }}>Alta Dirección</h2>
        <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '30px' }}>Credenciales corporativas (PIN)</p>
        
        {errorMsg && <p style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '10px', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', margin: '0 0 20px 0' }}>{errorMsg}</p>}

        <form onSubmit={ejecutarInicioSesion}>
          <input 
            type="tel" 
            value={celular} 
            onChange={e => setCelular(e.target.value)} 
            placeholder="Número Celular" 
            style={{ width: '100%', padding: '15px', borderRadius: '10px', background: '#0f172a', color: '#ffffff', border: '1px solid #475569', marginBottom: '20px', boxSizing: 'border-box', outline: 'none', fontSize: '16px' }} 
          />
          <input 
            type="password" 
            value={pin} 
            onChange={e => setPin(e.target.value)} 
            placeholder="PIN de Seguridad" 
            style={{ width: '100%', padding: '15px', borderRadius: '10px', background: '#0f172a', color: '#ffffff', border: '1px solid #475569', marginBottom: '30px', boxSizing: 'border-box', outline: 'none', fontSize: '16px', letterSpacing: '2px' }} 
          />
          <button 
            type="submit" 
            disabled={autenticando} 
            style={{ width: '100%', padding: '16px', background: '#4f46e5', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s', fontSize: '16px', boxShadow: autenticando ? 'none' : '0 4px 15px rgba(79, 70, 229, 0.4)', opacity: autenticando ? 0.7 : 1 }}
          >
            {autenticando ? 'Validando Identidad...' : 'Acceder al Tablero'}
          </button>
        </form>

        <button 
          onClick={() => navigate('/')}
          style={{ width: '100%', padding: '15px', background: 'transparent', color: '#94a3b8', border: '1px solid #475569', borderRadius: '10px', fontSize: '14px', marginTop: '15px', cursor: 'pointer' }}
        >
          Volver al Portal
        </button>
      </div>
    </div>
  );
}