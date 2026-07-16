import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "../../services/supabaseClient";

export default function LoginGeneral() {
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

    try {
      // 1. Traemos TODOS los registros que coincidan con ese correo (sin límite)
      const { data: usuariosEncontrados, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('correo', email.trim().toLowerCase());

      if (error) {
        throw new Error("Error de conexión: " + error.message);
      }

      if (!usuariosEncontrados || usuariosEncontrados.length === 0) {
        throw new Error("Credenciales inválidas o correo no registrado.");
      }

      // 2. Buscamos entre los duplicados cuál es el que tiene la contraseña correcta
      const usuarioValido = usuariosEncontrados.find(u => u.password === password);

      // 3. Si ninguno de los duplicados tiene esa contraseña, rebotamos
      if (!usuarioValido) {
        throw new Error("Contraseña incorrecta. Intenta de nuevo.");
      }

      // 4. Verificamos que ese perfil exacto tenga permisos de mando
      if (usuarioValido.rol === 'Alumno' || usuarioValido.rol === 'Tutor') {
         throw new Error("Acceso denegado. Este perfil no tiene autorización de Mando.");
      }

      // 5. ¡Pase VIP! Guardamos la sesión del perfil correcto y entramos
      localStorage.setItem('udat_app_session', JSON.stringify(usuarioValido));
      navigate('/admin/dashboard'); 

    } catch (err) {
      setErrorMsg(err.message);
    } finally {
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
          type="email" 
          placeholder="Correo corporativo" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: '100%', padding: '15px', marginBottom: '20px', border: '1px solid #475569', borderRadius: '10px', boxSizing: 'border-box', fontSize: '15px', background: '#0f172a', color: '#ffffff', outline: 'none' }}
        />
        <input 
          type="password" 
          placeholder="Contraseña maestra" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()} 
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