import { useState, useEffect, useMemo } from 'react';
import { supabase } from "../../services/supabaseClient";
import { AlertCircle, MapPin, CalendarDays, UserCheck, ShieldAlert, Download } from 'lucide-react';

// --- FUNCIONES PRESTABLECIDAS DE CONTROL DE FECHAS ---
function getMonday(d) {
  const date = new Date(d);
  const day = date.getDay();
  // Ajuste para que el lunes sea el primer día (si es domingo, retrocede 6 días)
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

const formatDateKey = (date) => date.toISOString().split('T')[0];

const getDaysOfWeek = (monday) => {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }
  return days;
};

export default function Asistencias() {
  const [asistencias, setAsistencias] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [semanaSeleccionada, setSemanaSeleccionada] = useState('');
  const [cargando, setCargando] = useState(true);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [resAsist, resUsuarios] = await Promise.all([
        supabase.from('asistencias').select('*'),
        supabase.from('usuarios').select('id, nombre_completo, numero_empleado, rol, estatus')
      ]);

      if (resAsist.error) throw resAsist.error;
      if (resUsuarios.error) throw resUsuarios.error;

      const datosAsist = resAsist.data || [];
      const datosUsuarios = resUsuarios.data || [];

      // Cruzar para obtener el nombre del operador
      const asistenciasConNombres = datosAsist.map(a => ({
        ...a,
        usuario: datosUsuarios.find(u => u.id === a.id_usuario) || { nombre_completo: 'Usuario Eliminado', numero_empleado: 'N/A' }
      }));
      
      setAsistencias(asistenciasConNombres);
      
      // Solo tomamos en cuenta a los alumnos activos para revisar sus faltas
      const alumnosActivos = datosUsuarios.filter(u => u.rol === 'Alumno' && u.estatus !== 'Baja');
      setUsuarios(alumnosActivos);

      // Inicializar con la semana actual
      const hoyMon = getMonday(new Date());
      setSemanaSeleccionada(formatDateKey(hoyMon));
      
    } catch (error) {
      console.error("Error al cargar asistencias:", error);
      alert("Error al cargar datos: " + error.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarDatos(); }, []);

  // --- PROCESAMIENTO: LISTADO DE SEMANAS DISPONIBLES ---
  const opcionesSemanas = useMemo(() => {
    const semanas = new Set();
    semanas.add(formatDateKey(getMonday(new Date()))); // Asegura que la semana actual exista
    
    asistencias.forEach(a => {
      if(a.fecha_hora) {
          const mon = getMonday(a.fecha_hora);
          semanas.add(formatDateKey(mon));
      }
    });
    
    return Array.from(semanas).sort((a, b) => b.localeCompare(a));
  }, [asistencias]);

  // --- PROCESAMIENTO: FILTRADO Y DETECCIÓN DE FALTAS ---
  const datosProcesados = useMemo(() => {
    if (!semanaSeleccionada) return { asistenciasFiltradas: [], faltas: [] };

    const lunesActual = new Date(semanaSeleccionada + 'T00:00:00');
    const diasDeLaSemana = getDaysOfWeek(lunesActual);
    const hoy = new Date();

    // 1. Filtrar asistencias de la semana elegida
    const asistenciasFiltradas = asistencias.filter(a => {
      if(!a.fecha_hora) return false;
      const m = getMonday(a.fecha_hora);
      return formatDateKey(m) === semanaSeleccionada;
    });

    // 2. Detectar qué usuarios no asistieron qué días (Faltas)
    const faltas = [];
    
    usuarios.forEach(u => {
      diasDeLaSemana.forEach(dia => {
        // Clonar para comparar solo fechas sin horas
        const fechaDia = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate());
        const fechaHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
        
        // Evitar alertar sobre días futuros de la semana en curso
        if (fechaDia > fechaHoy) return;

        const tieneAsistencia = asistenciasFiltradas.some(a => {
          if(!a.fecha_hora) return false;
          const aDate = new Date(a.fecha_hora);
          return a.id_usuario === u.id && aDate.toDateString() === dia.toDateString();
        });

        if (!tieneAsistencia) {
          faltas.push({
            id_usuario: u.id,
            nombre: u.nombre_completo,
            numero_empleado: u.numero_empleado,
            diaTexto: dia.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' })
          });
        }
      });
    });

    return { asistenciasFiltradas, faltas };
  }, [semanaSeleccionada, asistencias, usuarios]);

  const formatNombreSemana = (monStr) => {
    const mon = new Date(monStr + 'T00:00:00');
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    return `📅 Semana: ${mon.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} al ${sun.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}`;
  };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* Encabezado y Filtro */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ color: 'var(--text-light)', fontSize: '32px', fontWeight: 900, margin: '0 0 10px 0', letterSpacing: '-0.5px' }}>
             Auditoría de Asistencias GPS
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '14px' }}>Control de pases de lista, ubicaciones en tiempo real y detección de inactividad.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          {/* Selector de Semanas PRO */}
          <div style={{ position: 'relative' }}>
             <select 
              value={semanaSeleccionada} 
              onChange={(e) => setSemanaSeleccionada(e.target.value)}
              style={{ appearance: 'none', padding: '12px 40px 12px 20px', borderRadius: '12px', background: 'var(--card-bg)', color: 'var(--primary)', border: '1px solid var(--primary)', fontWeight: 800, cursor: 'pointer', fontSize: '14px', boxShadow: '0 4px 15px rgba(217, 119, 6, 0.1)' }}
             >
              {opcionesSemanas.map(sem => (
                <option key={sem} value={sem}>{formatNombreSemana(sem)}</option>
              ))}
             </select>
          </div>

          <button style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px var(--primary-glow)' }}>
            <Download size={18}/> Exportar
          </button>
        </div>
      </div>

      {/* TARJETAS DE KPIs SUPERIORES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
         <div style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', borderLeft: '4px solid var(--primary)', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ background: 'rgba(217, 119, 6, 0.1)', padding: '15px', borderRadius: '12px', color: 'var(--primary)' }}><UserCheck size={28}/></div>
            <div>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '1px' }}>Pases de Lista</p>
              <h3 style={{ margin: 0, fontSize: '28px', fontWeight: 900, color: 'var(--text-light)' }}>{datosProcesados.asistenciasFiltradas.length}</h3>
            </div>
         </div>
         <div style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', borderLeft: '4px solid var(--danger)', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ background: 'rgba(244, 63, 94, 0.1)', padding: '15px', borderRadius: '12px', color: 'var(--danger)' }}><ShieldAlert size={28}/></div>
            <div>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '1px' }}>Alertas de Inactividad</p>
              <h3 style={{ margin: 0, fontSize: '28px', fontWeight: 900, color: 'var(--danger)' }}>{datosProcesados.faltas.length}</h3>
            </div>
         </div>
      </div>

      {/* DETECTOR DE INASISTENCIAS (ALERTAS PRO) */}
      {datosProcesados.faltas.length > 0 ? (
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--danger)', fontSize: '18px', fontWeight: 800, marginBottom: '15px' }}>
            <AlertCircle size={22}/> Operadores sin Registro (Días Perdidos)
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
            {datosProcesados.faltas.map((f, idx) => (
              <div key={idx} style={{ background: 'var(--card-bg)', border: '1px solid rgba(244, 63, 94, 0.3)', padding: '20px', borderRadius: '16px', position: 'relative', overflow: 'hidden', boxShadow: '0 10px 25px rgba(244, 63, 94, 0.05)' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--danger)' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <span style={{ color: 'var(--danger)', fontWeight: 800, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', background: 'rgba(244, 63, 94, 0.1)', padding: '4px 10px', borderRadius: '20px' }}>
                    FALTA - {f.diaTexto}
                  </span>
                </div>
                <h4 style={{ color: 'var(--text-light)', fontSize: '16px', fontWeight: 800, margin: '0 0 5px 0' }}>{f.nombre}</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>🆔 Emp: <b>{f.numero_empleado}</b></p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        !cargando && (
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success)', padding: '20px', borderRadius: '16px', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ background: 'var(--success)', color: 'white', padding: '10px', borderRadius: '50%' }}><UserCheck size={24}/></div>
            <div>
              <h4 style={{ margin: 0, color: 'var(--success)', fontSize: '16px', fontWeight: 800 }}>¡Flota al 100%!</h4>
              <p style={{ margin: '5px 0 0 0', color: 'var(--text-light)', fontSize: '14px' }}>No se han detectado inasistencias en los días transcurridos de esta semana.</p>
            </div>
          </div>
        )
      )}

      {/* TABLA SEMANAL DE REGISTROS REALIZADOS (PULIDA) */}
      <div style={{ background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px', color: 'var(--text-light)' }}>
          <thead>
            <tr>
              <th style={{ padding: '20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Fecha y Hora</th>
              <th style={{ padding: '20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Operador</th>
              <th style={{ padding: '20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Matrícula</th>
              <th style={{ padding: '20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Estatus / Actividad</th>
              <th style={{ padding: '20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Ubicación GPS</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Sincronizando radares...</td></tr>
            ) : datosProcesados.asistenciasFiltradas.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No hay pases de asistencia registrados en esta semana.</td></tr>
            ) : (
              datosProcesados.asistenciasFiltradas.map(a => {
                const fecha = new Date(a.fecha_hora);
                const diaNombre = fecha.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
                const hora = fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

                return (
                  <tr key={a.id} style={{ transition: '0.2s' }}>
                    <td style={{ padding: '15px 20px', borderBottom: '1px solid var(--border-color)' }}>
                      <span style={{ display: 'block', fontWeight: 800, fontSize: '14px', textTransform: 'capitalize' }}>{diaNombre}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{hora}</span>
                    </td>
                    <td style={{ padding: '15px 20px', borderBottom: '1px solid var(--border-color)' }}>
                      <strong style={{ color: 'var(--text-light)', fontSize: '14px' }}>{a.usuario?.nombre_completo}</strong>
                    </td>
                    <td style={{ padding: '15px 20px', borderBottom: '1px solid var(--border-color)' }}>
                      <span style={{ background: 'rgba(148, 163, 184, 0.1)', color: '#cbd5e1', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>
                        {a.usuario?.numero_empleado || 'N/A'}
                      </span>
                    </td>
                    <td style={{ padding: '15px 20px', borderBottom: '1px solid var(--border-color)' }}>
                      <span style={{ background: 'rgba(217, 119, 6, 0.1)', color: 'var(--primary)', padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 800, border: '1px solid rgba(217, 119, 6, 0.3)' }}>
                        {a.actividad_sin_manejo || 'En Conducción'}
                      </span>
                    </td>
                    <td style={{ padding: '15px 20px', borderBottom: '1px solid var(--border-color)' }}>
                      {a.latitud ? (
                        <a href={`https://www.google.com/maps?q=${a.latitud},${a.longitud}`} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#38bdf8', background: 'rgba(14, 165, 233, 0.1)', padding: '6px 12px', borderRadius: '8px', textDecoration: 'none', fontSize: '12px', fontWeight: 700, transition: '0.2s' }}>
                          <MapPin size={14}/> Ver Mapa
                        </a>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--danger)', fontSize: '12px', fontWeight: 700 }}>
                          <ShieldAlert size={14}/> GPS Inactivo
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}