import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { dataService } from '../../services/dataService'; 

export default function LoginApp() {
  const [pasoActual, setPasoActual] = useState('telefono'); // telefono | registro | password
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [usuarioActual, setUsuarioActual] = useState(null);
  
  // Estados para errores y carga
  const [errorMsg, setErrorMsg] = useState('');
  const [cargando, setCargando] = useState(false);

  // Estados para el Registro
  const [regData, setRegData] = useState({ generacion: '', nombre: '', empleado: '', empresa: '', unidad: '', lider: '', gerente: '', tutor: '' });
  const [esInduccion, setEsInduccion] = useState(false);

  // Estado para las Listas Desplegables
  const [catalogos, setCatalogos] = useState({ unidades: [], lideres: [], gerentes: [], tutores: [] });

  const navigate = useNavigate();

  // Cargar catálogos al llegar al paso de registro
  useEffect(() => {
    if (pasoActual === 'registro') {
      const cargarListas = async () => {
        const datos = await dataService.obtenerCatalogos();
        setCatalogos(datos);
      };
      cargarListas();
    }
  }, [pasoActual]);

  // 1. VERIFICAR NÚMERO CELULAR
  const verificarCelular = async () => {
    if (!telefono) return setErrorMsg("Ingresa tu número celular.");
    
    setCargando(true);
    setErrorMsg('');

    const { exito, datos, mensaje } = await authService.verificarCelular(telefono);

    if (exito) {
      setUsuarioActual(datos);
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
    const { generacion, nombre, empleado, empresa, unidad, lider, gerente, tutor } = regData;
    
    if (generacion && !/^G\d+$/.test(generacion.toUpperCase())) return setErrorMsg("Generación debe empezar con 'G' seguido de números.");
    if (!nombre || !empleado) return setErrorMsg('El Nombre y Número de Empleado son obligatorios.');
    if (!esInduccion && (!empresa || !unidad || !lider || !gerente || !tutor)) return setErrorMsg('Llena tu info de ruta completa, o marca la casilla de Inducción.');

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
      tutor: esInduccion ? '' : tutor,
      contrasena: pwdGenerada,
      fecha_registro: new Date().toISOString()
    };

    const { exito, mensaje } = await authService.activarCuenta(usuarioActual.id, payload);

    if (exito) {
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
      localStorage.setItem('udat_app_session', JSON.stringify(usuarioActual));
      if (usuarioActual.rol === 'Tutor') {
        navigate('/app/tutor');
      } else {
        navigate('/app/alumno');
      }
    } else {
      setErrorMsg('Contraseña incorrecta.');
    }
  };

  const handleRegChange = (e) => setRegData({ ...regData, [e.target.name]: e.target.value });

  // ESTILOS VISUALES
  const inputStyle = { width: '100%', padding: '14px', marginBottom: '20px', borderRadius: '10px', border: '1px solid #475569', background: '#0f172a', color: '#ffffff', textAlign: 'center', fontSize: '16px', boxSizing: 'border-box', outline: 'none' };
  const selectStyle = { ...inputStyle, cursor: 'pointer', appearance: 'auto' }; 
  const btnStyle = { width: '100%', padding: '16px', background: '#0ea5e9', color: '#ffffff', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: 800, cursor: cargando ? 'not-allowed' : 'pointer', boxShadow: cargando ? 'none' : '0 4px 15px rgba(14, 165, 233, 0.4)', opacity: cargando ? 0.7 : 1, transition: '0.3s' };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a', fontFamily: 'system-ui, sans-serif', padding: '15px' }}>
      <div style={{ background: '#1e293b', padding: '40px 30px', borderRadius: '20px', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)', width: '100%', maxWidth: '400px', boxSizing: 'border-box', border: '1px solid #334155' }}>
        
        <div style={{ marginBottom: '35px', textAlign: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '38px', fontWeight: 900, color: '#0ea5e9' }}>UDAT</h1>
          <p style={{ color: '#94a3b8', fontWeight: 600, margin: '5px 0 0 0', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '3px' }}>Forma Tu Camino</p>
        </div>

        {errorMsg && <p style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '10px', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', margin: '0 0 20px 0', textAlign: 'center' }}>{errorMsg}</p>}

        {/* SECCIÓN 1: INGRESO CELULAR */}
        {pasoActual === 'telefono' && (
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ color: '#f8fafc', marginBottom: '8px', fontSize: '22px' }}>Acceso de Personal</h3>
            <p style={{ fontSize: '14px', color: '#94a3b8', marginTop: 0, marginBottom: '25px' }}>Ingresa tu número celular registrado</p>
            
            <input type="tel" placeholder="811 234 5678" maxLength="15" value={telefono} onChange={(e) => setTelefono(e.target.value)} style={{ ...inputStyle, fontSize: '22px', fontWeight: 800, letterSpacing: '2px' }} />
            <button onClick={verificarCelular} disabled={cargando} style={btnStyle}>
              {cargando ? 'Buscando...' : 'Verificar Celular'}
            </button>
            <button onClick={() => navigate('/')} style={{ width: '100%', padding: '14px', background: 'transparent', color: '#94a3b8', border: '1px solid #475569', borderRadius: '10px', fontSize: '14px', marginTop: '15px', cursor: 'pointer' }}>Volver al Portal</button>
          </div>
        )}

        {/* SECCIÓN 2: ALTA DE OPERADOR (REGISTRO) */}
        {pasoActual === 'registro' && (
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ color: '#f8fafc', marginBottom: '5px', fontSize: '20px' }}>Alta de Operador</h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '25px' }}>Completa tu información de ruta</p>
            
            <input type="text" name="generacion" placeholder="Generación (Ej. G122)" value={regData.generacion} onChange={handleRegChange} style={inputStyle} />
            <input type="text" name="nombre" placeholder="Nombre Completo" value={regData.nombre} onChange={handleRegChange} style={inputStyle} />
            <input type="text" name="empleado" placeholder="Número de Empleado" value={regData.empleado} onChange={handleRegChange} style={inputStyle} />

            <div style={{ background: '#0f172a', padding: '15px', borderRadius: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #475569' }}>
              <input type="checkbox" id="induc-check" checked={esInduccion} onChange={(e) => setEsInduccion(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
              <label htmlFor="induc-check" style={{ margin: 0, fontSize: '13px', color: '#f8fafc', cursor: 'pointer' }}>Estoy en Inducción Teórica</label>
            </div>

            {!esInduccion && (
              <>
                <input type="text" name="empresa" placeholder="Empresa (Ej. Larmex)" value={regData.empresa} onChange={handleRegChange} style={inputStyle} />
                
                <select name="unidad" value={regData.unidad} onChange={handleRegChange} style={selectStyle}>
                  <option value="">Selecciona Unidad de Negocio...</option>
                  {catalogos.unidades.map((u, i) => <option key={i} value={u.nombre}>{u.nombre}</option>)}
                </select>

                <select name="lider" value={regData.lider} onChange={handleRegChange} style={selectStyle}>
                  <option value="">Selecciona tu Líder...</option>
                  {catalogos.lideres.map((l, i) => <option key={i} value={l.nombre}>{l.nombre}</option>)}
                </select>

                <select name="gerente" value={regData.gerente} onChange={handleRegChange} style={selectStyle}>
                  <option value="">Selecciona tu Gerente...</option>
                  {catalogos.gerentes.map((g, i) => <option key={i} value={g.nombre}>{g.nombre}</option>)}
                </select>

                <select name="tutor" value={regData.tutor} onChange={handleRegChange} style={selectStyle}>
                  <option value="">Selecciona tu Tutor (OPT)...</option>
                  {catalogos.tutores.map((t, i) => <option key={i} value={t.nombre}>{t.nombre}</option>)}
                </select>
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
            <h3 style={{ color: '#f8fafc', marginBottom: '5px', fontSize: '20px' }}>Clave de Seguridad</h3>
            <p style={{ fontSize: '14px', color: '#0ea5e9', fontWeight: 700, marginBottom: '25px' }}>
              ¡Bienvenido, {usuarioActual?.nombre_completo?.split(' ')[0] || 'Operador'}!
            </p>
            
            <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} style={{ ...inputStyle, fontSize: '24px', letterSpacing: '5px' }} />
            
            <button onClick={ingresarApp} style={btnStyle}>Validar e Ingresar</button>
            <button onClick={() => { setPasoActual('telefono'); setPassword(''); setErrorMsg(''); }} style={{ width: '100%', padding: '14px', background: 'transparent', color: '#94a3b8', border: '1px solid #475569', borderRadius: '10px', fontSize: '14px', marginTop: '15px', cursor: 'pointer' }}>Volver</button>
          </div>
        )}
      </div>
    </div>
  );
}