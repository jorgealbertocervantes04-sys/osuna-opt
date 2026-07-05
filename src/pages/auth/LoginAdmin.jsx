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
      localStorage.setItem('udat_app_session', JSON.stringify(datos)); // Unificado a una sola llave
      navigate('/admin');
    } else {
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
// Función de diagnóstico para el login de Administrador
async function loginAdminDiagnostico(correo, contrasena) {
  try {
    console.log("1. Iniciando login para el correo:", correo);

    // Buscamos al usuario solo por correo primero para ver si existe
    const { data: usuario, error: errorUsuario } = await supabase
      .from('usuarios')
      .select('*')
      .eq('correo', correo)
      .maybeSingle();

    if (errorUsuario) {
      console.error("Error en la base de datos:", errorUsuario.message);
      throw new Error("Falla en la conexión con la base de datos.");
    }

    if (!usuario) {
      console.warn("2. El correo no existe en la base de datos.");
      throw new Error("Usuario no encontrado.");
    }

    console.log("3. Usuario encontrado. Rol actual en DB:", usuario.rol);

    // Verificamos el rol (Ajusta 'Admin' por el rol exacto que uses en tu tabla)
    if (usuario.rol !== 'Admin' && usuario.rol !== 'Administración') {
      console.warn("4. El usuario no tiene privilegios de administrador.");
      throw new Error("No tienes permisos para entrar aquí.");
    }

    // Verificamos la contraseña
    if (usuario.contrasena !== contrasena) {
      console.warn("5. La contraseña es incorrecta.");
      throw new Error("Credenciales incorrectas.");
    }

    console.log("6. ¡Login exitoso!");
    return { exito: true, datos: usuario };

  } catch (error) {
    return { exito: false, mensaje: error.message };
  }
}
}
