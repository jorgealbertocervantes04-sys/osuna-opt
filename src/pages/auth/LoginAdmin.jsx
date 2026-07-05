import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';

export default function LoginAdmin() {
  // Ahora guardamos el nombre de usuario en lugar del correo
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    // Validamos que los campos no estén vacíos
    if (!nombreUsuario || !password) {
      return setErrorMsg("Ingresa tu nombre completo y contraseña maestra.");
    }
    
    setCargando(true);
    setErrorMsg('');

    // Llamamos a tu nuevo servicio pasándole el nombre y la contraseña
    const { exito, datos, mensaje } = await authService.loginAdmin(nombreUsuario, password);

    if (exito) {
      // Guardamos la sesión y redirigimos al dashboard
      localStorage.setItem('udat_app_session', JSON.stringify(datos));
      navigate('/admin');
    } else {
      // Mostramos el error exacto que nos devuelva Supabase
      setErrorMsg(mensaje);
      setCargando(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'system-ui, sans-serif', padding: '15px' }}>
      <div style={{ background: '#1e293b', padding: '40px', borderRadius: '20px', width: '100%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.6)', border: '1px solid #334155', boxSizing: 'border-box' }}>
        
        <h1 style={{ margin: '0 0 5px 0', color: '#2563eb', fontWeight: 900, fontSize: '32px', letterSpacing: '1px' }}>Centro de Mando</h1>
        <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '30px' }}>Acceso a Dirección de Operaciones</p>
        
        {errorMsg && <p style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '10px', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', margin: '0 0 20px 0' }}>{errorMsg}</p>}

        <input 
          type="text" 
          placeholder="Nombre completo (Ej. Jorge Alberto...)" 
          value={nombreUsuario}
          onChange={(e) => setNombreUsuario(e.target.value)}
          style={{ width: '100%', padding: '15px', marginBottom: '20px', border: '1px solid #475569', borderRadius: '10px', boxSizing: 'border-box', fontSize: '15px', background: '#0f172a', color: '#ffffff', outline: 'none' }}
        />
        <input 
          type="password" 
          placeholder="Contraseña maestra" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: '100%', padding: '15px', marginBottom: '25px', border: '1px solid #475569', borderRadius: '10px', boxSizing: 'border-box', fontSize: '15px', background: '#0f172a', color: '#ffffff', outline: 'none' }}
        />
        
        <button 
          onClick={handleLogin}
          disabled={cargando}
          style={{ width: '100%', padding: '16px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '16px', cursor: cargando ? 'not-allowed' : 'pointer', transition: '0.3s', boxShadow: cargando ? 'none' : '0 4px 15px rgba(37, 99, 235, 0.4)', opacity: cargando ? 0.7 : 1 }}
        >
          {cargando ? 'Sincronizando bóveda...' : 'Ingresar a la Bóveda'}
        </button>

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