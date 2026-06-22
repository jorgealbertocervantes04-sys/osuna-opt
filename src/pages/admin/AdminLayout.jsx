import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
// IMPORTANTE: Asegúrate de que esta ruta apunte a tu archivo real de Supabase
import { supabase } from '../../services/supabaseclient'; 

export default function AdminLayout() {
  const navigate = useNavigate();

  // 1. ESTADOS PARA LLENAR LOS MENÚS DESPLEGABLES SOLITOS
  const [opcionesGen, setOpcionesGen] = useState([]);
  const [opcionesUni, setOpcionesUni] = useState([]);
  const [opcionesLid, setOpcionesLid] = useState([]);
  const [opcionesGer, setOpcionesGer] = useState([]);

  // 2. ESTADO QUE GUARDA QUÉ SELECCIONASTE EN LOS FILTROS
  const [filtrosGlobales, setFiltrosGlobales] = useState({
    desde: '',
    hasta: '',
    generacion: 'TODOS',
    unidad: 'TODOS',
    lider: 'TODOS',
    gerente: 'TODOS'
  });

  // 3. EFECTO: IR A SUPABASE AL ABRIR LA PÁGINA PARA LLENAR LOS MENÚS
  useEffect(() => {
    const cargarFiltros = async () => {
      const { data } = await supabase.from('usuarios').select('generacion, unidad_negocio, lider, gerente');
      if (data) {
        // Función mágica para extraer valores únicos y quitar vacíos
        const extraerUnicos = (campo) => [...new Set(data.map(u => u[campo]).filter(Boolean))].sort();
        
        setOpcionesGen(extraerUnicos('generacion'));
        setOpcionesUni(extraerUnicos('unidad_negocio'));
        setOpcionesLid(extraerUnicos('lider'));
        setOpcionesGer(extraerUnicos('gerente'));
      }
    };
    cargarFiltros();
  }, []);

  // Función para actualizar el estado cuando cambias un filtro
  const handleChangeFiltro = (e) => {
    setFiltrosGlobales({ ...filtrosGlobales, [e.target.name]: e.target.value });
  };

  // Función de cierre de sesión seguro
  const cerrarSesion = () => {
    localStorage.removeItem('udat_admin_session');
    navigate('/');
  };

  // Función para darle estilo automático al botón del menú activo
  const menuStyle = ({ isActive }) => ({
    background: isActive ? 'linear-gradient(90deg, rgba(217, 119, 6, 0.1) 0%, transparent 100%)' : 'none',
    backgroundColor: isActive ? 'var(--sidebar-hover)' : 'transparent',
    color: isActive ? 'var(--primary)' : 'var(--text-muted)',
    borderLeft: isActive ? '4px solid var(--primary)' : '4px solid transparent',
    padding: '16px 25px', textAlign: 'left', fontSize: '14px', fontWeight: isActive ? 700 : 600,
    cursor: 'pointer', transition: '0.3s', width: '100%', letterSpacing: '0.5px',
    display: 'block', textDecoration: 'none', boxSizing: 'border-box'
  });

  // Estilo para los inputs de los filtros
  const inputStyle = { width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', marginBottom: '12px', boxSizing: 'border-box', background: 'rgba(0,0,0,0.3)', color: 'white', fontFamily: 'inherit', fontSize: '13px' };
  const labelStyle = { fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: 'var(--bg-body)' }}>
      
      {/* BARRA LATERAL (SIDEBAR) */}
      <div style={{ width: '280px', minWidth: '280px', backgroundColor: 'var(--sidebar-bg)', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', padding: '25px 0', boxShadow: '4px 0 20px rgba(0,0,0,0.5)', zIndex: 10, overflowY: 'auto' }}>
        <h2 style={{ textAlign: 'center', marginBottom: 0, fontSize: '28px', fontWeight: 800, letterSpacing: '1px', color: 'var(--text-light)' }}>UDAT</h2>
        <p style={{ textAlign: 'center', color: 'var(--primary)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '3px', marginBottom: '25px', fontWeight: 600 }}>Centro de Mando</p>
        
        {/* FILTROS GLOBALES DINÁMICOS */}
        <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '20px', marginBottom: '20px', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
          <h4 style={{ marginTop: 0, color: 'var(--text-light)', fontSize: '13px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '12px', textAlign: 'center' }}>FILTROS DE MANDO</h4>
          
          <label style={labelStyle}>Desde:</label>
          <input type="date" name="desde" value={filtrosGlobales.desde} onChange={handleChangeFiltro} style={inputStyle} />
          
          <label style={labelStyle}>Hasta:</label>
          <input type="date" name="hasta" value={filtrosGlobales.hasta} onChange={handleChangeFiltro} style={inputStyle} />

          <label style={labelStyle}>Generación:</label>
          <select name="generacion" value={filtrosGlobales.generacion} onChange={handleChangeFiltro} style={inputStyle}>
            <option value="TODOS">Todas</option>
            {opcionesGen.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>

          <label style={labelStyle}>Unidad de Negocio:</label>
          <select name="unidad" value={filtrosGlobales.unidad} onChange={handleChangeFiltro} style={inputStyle}>
            <option value="TODOS">Todas</option>
            {opcionesUni.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>

          <label style={labelStyle}>Líder Operativo:</label>
          <select name="lider" value={filtrosGlobales.lider} onChange={handleChangeFiltro} style={inputStyle}>
            <option value="TODOS">Todos</option>
            {opcionesLid.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>

          <label style={labelStyle}>Gerente:</label>
          <select name="gerente" value={filtrosGlobales.gerente} onChange={handleChangeFiltro} style={inputStyle}>
            <option value="TODOS">Todos</option>
            {opcionesGer.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>

        {/* MENÚ DE NAVEGACIÓN */}
        <nav style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
          <NavLink to="/admin/dashboard" style={menuStyle}>📊 Dashboard Directivo</NavLink>
          <NavLink to="/admin/directorio" style={menuStyle}>👨‍🎓 Directorio y Personal</NavLink>
          <NavLink to="/admin/auditoria-opt" style={menuStyle}>👨‍🏫 Auditoría Tutores (OPT)</NavLink>
          <NavLink to="/admin/academia" style={menuStyle}>📚 Academia y Exámenes</NavLink>
          <NavLink to="/admin/reportes" style={menuStyle}>📈 Reportes Operativos</NavLink>
          <NavLink to="/admin/asistencias" style={menuStyle}>📍 Asistencias GPS</NavLink>
          <NavLink to="/admin/viajes" style={menuStyle}>🚚 Bitácoras de Viaje</NavLink>
          <NavLink to="/admin/cardex" style={menuStyle}>📑 Cardex Tutorías</NavLink>
          <NavLink to="/admin/encuestas" style={menuStyle}>🗣️ Encuestas Opinión</NavLink>
        </nav>

        {/* BOTÓN CERRAR SESIÓN */}
        <div style={{ padding: '0 25px', marginTop: '20px', marginBottom: '20px' }}>
          <button 
            onClick={cerrarSesion} 
            style={{ width: '100%', padding: '12px', background: 'transparent', color: '#fda4af', border: '1px solid #fda4af', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            🚪 Cerrar Sesión
          </button>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL (El Centro de la Pantalla) */}
      <div style={{ flexGrow: 1, padding: '35px', overflowY: 'auto', backgroundImage: 'radial-gradient(circle at top right, rgba(217,119,6,0.05), transparent 40%)' }}>
        
        {/* MAGIA DE REACT: Le pasamos los filtros a TODAS las pantallas de adentro */}
        <Outlet context={{ filtrosGlobales }} />
        
      </div>
    </div>
  );
}