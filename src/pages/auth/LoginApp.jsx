import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';

export default function LoginApp() {
  const [pasoActual, setPasoActual] = useState('telefono'); // telefono | registro | password
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [usuarioActual, setUsuarioActual] = useState(null);
  
  // Estados para errores y carga
  const [errorMsg, setErrorMsg] = useState('');
  const [cargando, setCargando] = useState(false);

  // Estados para el Registro
  const [regData, setRegData] = useState({ generacion: '', nombre: '', empleado: '', empresa: '', unidad: '', lider: '', gerente: '' });
  const [esInduccion, setEsInduccion] = useState(false);

  const navigate = useNavigate();

  // 1. VERIFICAR NÚMERO CELULAR
  const verificarCelular = async () => {
    if (!telefono) return setErrorMsg("Ingresa tu número celular.");
    
    setCargando(true);
    setErrorMsg('');

    const { exito, datos, mensaje } = await authService.verificarCelular(telefono);

    if (exito) {
      setUsuarioActual(datos);
      // Si no tiene nombre registrado, lo mandamos a la sección de Alta
      if (!datos.nombre_completo || !datos.numero_empleado) {
        setPasoActual('registro');
      } else {
        setPasoActual('password');
      }
    } else {
      setErrorMsg(mensaje);
    }
    setCargando(false);
  };

  // 2. ACTIVAR CUENTA (REGISTRO)
  const registrarUsuario = async () => {
    const { generacion, nombre, empleado, empresa, unidad, lider, gerente } = regData;
    
    if (generacion && !/^G\d+$/.test(generacion.toUpperCase())) return setErrorMsg("Generación debe empezar con 'G' seguido de números.");
    if (!nombre || !empleado) return setErrorMsg('El Nombre y Número de Empleado son obligatorios.');
    if (!esInduccion && (!empresa || !unidad || !lider || !gerente)) return setErrorMsg('Llena tu info de ruta, o marca la casilla de Inducción.');

    setCargando(true);
    setErrorMsg('');

    const pwdGenerada = nombre.substring(0, 3).toUpperCase().replace(/ /g, 'X') + empleado;
    
    const payload = {
      generacion: generacion.toUpperCase(),
      nombre_completo: nombre,
      numero_empleado: empleado,
      empresa: esInduccion ? '' : empresa,
      unidad_negocio: esInduccion ? '' : unidad,
      lider: esInduccion ? '' : lider,
      gerente: esInduccion ? '' : gerente,
      contrasena: pwdGenerada,
      fecha_registro: new Date().toISOString()
    };

    const { exito, mensaje } = await authService.activarCuenta(usuarioActual.id, payload);

    if (exito) {
      // Actualizamos el usuario en memoria y pasamos a password
      setUsuarioActual({ ...usuarioActual, ...payload });
      setPasoActual('password');
      alert(`Tu cuenta ha sido activada.\nTu clave temporal es: ${pwdGenerada}`);
    } else {
      setErrorMsg('Error de red: ' + mensaje);
    }
    setCargando(false);
  };

  // 3. INICIAR SESIÓN CON CONTRASEÑA
  const ingresarApp = () => {
    if (!password) return setErrorMsg("Ingresa tu contraseña.");

    if (password === usuarioActual.contrasena) {
      // Guardamos la sesión local para el dashboard móvil
      localStorage.setItem('udat_app_session', JSON.stringify(usuarioActual));
      
      // Redirigir según el rol de Supabase
      if (usuarioActual.rol === 'Tutor') {
        navigate('/app/tutor');
      } else {
        navigate('/app/alumno');
      }
    } else {
      setErrorMsg('Contraseña incorrecta.');
    }
  };

  // Manejador del formulario de registro
  const handleRegChange = (e) => setRegData({ ...regData, [e.target.name]: e.target.value });

  // Estilos reutilizables
  const inputStyle = { width: '100%', padding: '14px', marginBottom: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.3)', color: 'white', textAlign: 'center', fontSize: '16px', boxSizing: 'border-box' };
  const btnStyle = { width: '100%', padding: '16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 700, cursor: cargando ? 'not-allowed' : 'pointer', boxShadow: cargando ? 'none' : '0 4px 15px var(--primary-glow)', opacity: cargando ? 0.7 : 1 };

  return (
    <div className="login-container" style={{ background: 'var(--card-bg)', padding: '40px 30px', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)', width: '100%', maxWidth: '450px', boxSizing: 'border-box', border: '1px solid var(--border-color)', transition: 'all 0.5s ease', margin: '0 auto' }}>
      
      <div className="brand-header" style={{ marginBottom: '35px', textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '38px', fontWeight: 800, color: 'var(--primary)' }}>UDAT</h1>
        <p style={{ color: 'var(--text-muted)', fontWeight: 600, margin: '5px 0 0 0', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '3px' }}>Forma Tu Camino</p>
      </div>

      {errorMsg && <p style={{ color: '#fda4af', fontWeight: 'bold', fontSize: '13px', margin: '0 0 15px 0', textAlign: 'center' }}>{errorMsg}</p>}

      {/* SECCIÓN 1: INGRESO CELULAR */}
      {pasoActual === 'telefono' && (
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ color: 'var(--text-light)', marginBottom: '8px', fontSize: '22px' }}>Acceso de Personal</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: 0, marginBottom: '25px' }}>Ingresa tu número celular registrado</p>
          
          <input 
            type="tel" 
            placeholder="811 234 5678" 
            maxLength="15" 
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            style={{ ...inputStyle, fontSize: '24px', fontWeight: 800, letterSpacing: '2px' }} 
          />
          <button onClick={verificarCelular} disabled={cargando} style={btnStyle}>
            {cargando ? 'Buscando...' : 'Verificar Celular'}
          </button>
        </div>
      )}

      {/* SECCIÓN 2: ALTA DE OPERADOR (REGISTRO) */}
      {pasoActual === 'registro' && (
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ color: 'var(--text-light)', marginBottom: '5px', fontSize: '20px' }}>Alta de Operador</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '25px' }}>Completa tu información de ruta</p>
          
          <input type="text" name="generacion" placeholder="Generación (Ej. G122)" value={regData.generacion} onChange={handleRegChange} style={inputStyle} />
          <input type="text" name="nombre" placeholder="Nombre Completo" value={regData.nombre} onChange={handleRegChange} style={inputStyle} />
          <input type="text" name="empleado" placeholder="Número de Empleado" value={regData.empleado} onChange={handleRegChange} style={inputStyle} />

          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid var(--border-color)' }}>
            <input type="checkbox" id="induc-check" checked={esInduccion} onChange={(e) => setEsInduccion(e.target.checked)} style={{ width: 'auto', margin: 0, cursor: 'pointer' }} />
            <label htmlFor="induc-check" style={{ margin: 0, fontSize: '13px', color: 'var(--text-light)', cursor: 'pointer', textTransform: 'none' }}>Estoy en etapa de Inducción Teórica</label>
          </div>

          {!esInduccion && (
            <>
              <input type="text" name="empresa" placeholder="Empresa (Ej. Larmex)" value={regData.empresa} onChange={handleRegChange} style={inputStyle} />
              <input type="text" name="unidad" placeholder="Unidad de Negocio" value={regData.unidad} onChange={handleRegChange} style={inputStyle} />
              <input type="text" name="lider" placeholder="Nombre de tu Líder" value={regData.lider} onChange={handleRegChange} style={inputStyle} />
              <input type="text" name="gerente" placeholder="Nombre de tu Gerente" value={regData.gerente} onChange={handleRegChange} style={inputStyle} />
            </>
          )}

          <button onClick={registrarUsuario} disabled={cargando} style={btnStyle}>
            {cargando ? 'Activando...' : 'Activar Mi Cuenta'}
          </button>
        </div>
      )}

      {/* SECCIÓN 3: LOGIN CONTRASEÑA */}
      {pasoActual === 'password' && (
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ color: 'var(--text-light)', marginBottom: '5px', fontSize: '20px' }}>Clave de Seguridad</h3>
          <p style={{ fontSize: '14px', color: 'var(--primary)', fontWeight: 700, marginBottom: '25px' }}>
            ¡Bienvenido de vuelta, {usuarioActual?.nombre_completo.split(' ')[0]}!
          </p>
          
          <input 
            type="password" 
            placeholder="••••••••" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ ...inputStyle, fontSize: '24px', letterSpacing: '5px' }} 
          />
          
          <button onClick={ingresarApp} style={btnStyle}>Validar e Ingresar</button>
          
          <button 
            onClick={() => { setPasoActual('telefono'); setPassword(''); setErrorMsg(''); }}
            style={{ width: '100%', padding: '16px', background: 'transparent', color: 'var(--text-light)', border: '1px solid var(--border-color)', borderRadius: '12px', fontSize: '14px', marginTop: '10px', cursor: 'pointer' }}
          >
            Volver
          </button>
        </div>
      )}
    </div>
  );
}