import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
// IMPORTANTE: Asegúrate de que esta ruta apunte a tu archivo real de Supabase
import { supabase } from '../../services/supabaseClient'; 

export default function AdminLayout() {
  const navigate = useNavigate();

  // 1. ESTADOS PARA LLENAR LOS MENÚS DESPLEGABLES SOLITOS
  const [opcionesGen, setOpcionesGen] = useState([]);
  const [opcionesUni, setOpcionesUni] = useState([]);
  const [opcionesLid, setOpcionesLid] = useState([]);
  const [opcionesGer, setOpcionesGer] = useState([]);
  
  // Nuevos Estados de Utilidad e Interfaz
  const [cargandoFiltros, setCargandoFiltros] = useState(true);
  const [filtrosVisibles, setFiltrosVisibles] = useState(true);

  // 2. ESTADO QUE GUARDA QUÉ SELECCIONASTE EN LOS FILTROS
  const estadoInicialFiltros = {
    desde: '',
    hasta: '',
    generacion: 'TODOS',
    unidad: 'TODOS',
    lider: 'TODOS',
    gerente: 'TODOS'
  };

  const [filtrosGlobales, setFiltrosGlobales] = useState(estadoInicialFiltros);

  // 3. EFECTO: VALIDAR SESIÓN Y CARGAR FILTROS DESDE SUPABASE
  useEffect(() => {
    const inicializarPanel = async () => {
      // Mejora de Seguridad: Validar sesión activa en la entrada de administración
      const session = localStorage.getItem('udat_admin_session');
      if (!session) {
        navigate('/');
        return;
      }

      try {
        setCargandoFiltros(true);
        const { data, error } = await supabase
          .from('usuarios')
          .select('generacion, unidad_negocio, lider, gerente');
        
        if (error) throw error;

        if (data) {
          // Función mágica para extraer valores únicos y quitar vacíos
          const extraerUnicos = (campo) => [...new Set(data.map(u => u[campo]).filter(Boolean))].sort();
          
          setOpcionesGen(extraerUnicos('generacion'));
          setOpcionesUni(extraerUnicos('unidad_negocio'));
          setOpcionesLid(extraerUnicos('lider'));
          setOpcionesGer(extraerUnicos('gerente'));
        }
      } catch (err) {
        console.error("Error cargando filtros estructurales:", err.message);
      } finally {
        setCargandoFiltros(false);
      }
    };

    inicializarPanel();
  }, [navigate]);

  // Función para actualizar el estado cuando cambias un filtro
  const handleChangeFiltro = (e) => {
    setFiltrosGlobales({ ...filtrosGlobales, [e.target.name]: e.target.value });
  };

  // Nueva Función: Restablecer todos los filtros al estado original al instante
  const limpiarFiltros = () => {
    setFiltrosGlobales(estadoInicialFiltros);
  };

  // Función de cierre de sesión seguro
  const cerrarSesion = () => {
    localStorage.removeItem('udat_admin_session');
    navigate('/');
  };

  // Lógica para detectar si hay algún filtro activo actualmente en el Centro de Mando
  const tieneFiltrosActivos = 
    filtrosGlobales.desde !== '' || 
    filtrosGlobales.hasta !== '' || 
    filtrosGlobales.generacion !== 'TODOS' || 
    filtrosGlobales.unidad !== 'TODOS' || 
    filtrosGlobales.lider !== 'TODOS' || 
    filtrosGlobales.gerente !== 'TODOS';

  // Función para darle estilo automático al botón del menú activo
  const menuStyle = ({ isActive }) => ({
    background: isActive ? 'linear-gradient(90deg, rgba(217, 119, 6, 0.1) 0%, transparent 100%)' : 'none',
    backgroundColor: isActive ? 'var(--sidebar-hover)' : 'transparent',
    color: isActive ? 'var(--primary)' : 'var(--text-muted)',
    borderLeft: isActive ? '4px solid var(--primary)' : '4px solid transparent',
    padding: '14px 25px', textAlign: 'left', fontSize: '14px', fontWeight: isActive ? 700 : 600,
    cursor: 'pointer', transition: '0.3s', width: '100%', letterSpacing: '0.5px',
    display: 'block', textDecoration: 'none', boxSizing: 'border-box'
  });

  // Estilos base de los componentes de filtrado
  const inputStyle = { width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', marginBottom: '12px', boxSizing: 'border-box', background: 'rgba(0,0,0,0.3)', color: 'white', fontFamily: 'inherit', fontSize: '13px', outline: 'none' };
  const labelStyle = { fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'left' };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: 'var(--bg-body)' }}>
      
      {/* BARRA LATERAL (SIDEBAR) */}
      <div style={{ width: '290px', minWidth: '290px', backgroundColor: 'var(--sidebar-bg)', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', padding: '25px 0', boxShadow: '4px 0 20px rgba(0,0,0,0.5)', zIndex: 10, overflowY: 'auto' }}>
        <h2 style={{ textAlign: 'center', marginBottom: 0, fontSize: '28px', fontWeight: 800, letterSpacing: '1px', color: 'var(--text-light)' }}>UDAT</h2>
        <p style={{ textAlign: 'center', color: 'var(--primary)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '3px', marginBottom: '20px', fontWeight: 600 }}>Centro de Mando</p>
        
        {/* FILTROS GLOBALES DINÁMICOS */}
        <div style={{ backgroundColor: 'rgba(0,0,0,0.15)', padding: '18px 20px', marginBottom: '15px', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ color: 'var(--text-light)', fontSize: '12px', fontWeight: 800, letterSpacing: '0.5px' }}>
              FILTROS DE MANDO {tieneFiltrosActivos && <span style={{ color: 'var(--primary)', marginLeft: '4px' }}>●</span>}
            </span>
            <div style={{ display: 'flex', gap: '10px' }}>
              {tieneFiltrosActivos && (
                <button 
                  onClick={limpiarFiltros}
                  title="Restablecer filtros"
                  style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: '11px', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                >
                  Limpiar
                </button>
              )}
              <button 
                onClick={() => setFiltrosVisibles(!filtrosVisibles)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '11px', cursor: 'pointer', padding: 0 }}
              >
                {filtrosVisibles ? '▲ Ocultar' : '▼ Mostrar'}
              </button>
            </div>
          </div>
          
          {/* Contenedor colapsable de los selectores */}
          <div style={{ display: filtrosVisibles ? 'block' : 'none', animation: 'fadeIn 0.2s ease' }}>
            {cargandoFiltros ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', margin: '15px 0' }}>Sincronizando estructuras...</p>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Desde:</label>
                    <input type="date" name="desde" value={filtrosGlobales.desde} onChange={handleChangeFiltro} style={inputStyle} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Hasta:</label>
                    <input type="date" name="hasta" value={filtrosGlobales.hasta} onChange={handleChangeFiltro} style={inputStyle} />
                  </div>
                </div>

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
              </>
            )}
          </div>
        </div>

        {/* MENÚ DE NAVEGACIÓN */}
        <nav style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, paddingBottom: '20px' }}>
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
        <div style={{ padding: '0 25px', marginTop: 'auto' }}>
          <button 
            onClick={cerrarSesion} 
            style={{ width: '100%', padding: '12px', background: 'transparent', color: '#fda4af', border: '1px solid #fda4af', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(253,164,175,0.1)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            🚪 Cerrar Sesión
          </button>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL (El Centro de la Pantalla) */}
      <div style={{ flexGrow: 1, padding: '35px', overflowY: 'auto', backgroundImage: 'radial-gradient(circle at top right, rgba(217,119,6,0.04), transparent 45%)' }}>
        
        {/* MAGIA DE REACT: Le pasamos los filtros a TODAS las pantallas de adentro */}
        {/* Upgrade: Pasamos también 'limpiarFiltros' por si una vista interna quiere reiniciar los datos */}
        <Outlet context={{ filtrosGlobales, limpiarFiltros }} />
        
      </div>
    </div>
  );
}