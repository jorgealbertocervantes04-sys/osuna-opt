import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';

export default function LoginAdmin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      return setErrorMsg("Ingresa tu correo y contraseña maestra.");
    }
    
    setCargando(true);
    setErrorMsg('');

    const { exito, datos, mensaje } = await authService.loginAdmin(email, password);

    if (exito) {
      // Guardamos la sesión localmente para que el panel sepa quién entró
      localStorage.setItem('udat_admin_session', JSON.stringify(datos));
      navigate('/admin/dashboard');
    } else {
      setErrorMsg(mensaje);
      setCargando(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'linear-gradient(135deg, var(--bg-body) 0%, var(--sidebar-bg) 100%)',
      zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
      <div style={{
        background: 'var(--card-bg)', padding: '40px', borderRadius: '20px',
        width: '100%', maxWidth: '400px', textAlign: 'center',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)', border: '1px solid var(--border-color)', boxSizing: 'border-box'
      }}>
        <h1 style={{ margin: '0 0 5px 0', color: 'var(--primary)', fontWeight: 800, fontSize: '32px', letterSpacing: '1px' }}>UDAT Admin</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '25px' }}>Acceso exclusivo a Dirección de Operaciones</p>
        
        <input 
          type="email" 
          placeholder="Correo electrónico corporativo" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: '100%', padding: '15px', marginBottom: '15px', border: '1px solid var(--border-color)', borderRadius: '10px', boxSizing: 'border-box', fontSize: '15px', background: 'rgba(0,0,0,0.2)', color: 'white' }}
        />
        <input 
          type="password" 
          placeholder="Contraseña maestra" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: '100%', padding: '15px', marginBottom: '15px', border: '1px solid var(--border-color)', borderRadius: '10px', boxSizing: 'border-box', fontSize: '15px', background: 'rgba(0,0,0,0.2)', color: 'white' }}
        />
        
        {errorMsg && <p style={{ color: '#fda4af', fontWeight: 'bold', fontSize: '13px', margin: '10px 0' }}>{errorMsg}</p>}

        <button 
          onClick={handleLogin}
          disabled={cargando}
          style={{ width: '100%', padding: '15px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '16px', cursor: cargando ? 'not-allowed' : 'pointer', transition: '0.3s', boxShadow: cargando ? 'none' : '0 4px 15px var(--primary-glow)', opacity: cargando ? 0.7 : 1 }}
        >
          {cargando ? 'Sincronizando bóveda...' : 'Ingresar a la Bóveda'}
        </button>

        <button 
          onClick={() => navigate('/')}
          style={{ width: '100%', padding: '15px', background: 'transparent', color: 'var(--text-light)', border: '1px solid var(--border-color)', borderRadius: '10px', fontSize: '14px', marginTop: '10px', cursor: 'pointer' }}
        >
          Volver al Portal
        </button>
      </div>
    </div>
  );
}