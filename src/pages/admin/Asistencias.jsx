import { useState, useEffect, useMemo } from 'react';
import { supabase } from "../../services/supabaseClient";

// --- FUNCIONES PRESTABLECIDAS DE CONTROL DE FECHAS ---
const getMonday = (d) => {
  const date = new Date(d);
  const day = date.getDay();
  // Ajuste para que el lunes sea el primer día (si es domingo, retrocede 6 días)
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

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
    const [datosAsist, datosUsuarios] = await Promise.all([
      dataService.obtenerAsistencias(),
      dataService.obtenerUsuarios()
    ]);

    // Cruzar para obtener el nombre del operador
    const asistenciasConNombres = datosAsist.map(a => ({
      ...a,
      usuario: datosUsuarios.find(u => u.id === a.id_usuario) || { nombre_completo: 'Usuario Eliminado', numero_empleado: 'N/A' }
    }));
    
    setAsistencias(asistenciasConNombres);
    setUsuarios(datosUsuarios);

    // Inicializar con la semana actual
    const hoyMon = getMonday(new Date());
    setSemanaSeleccionada(formatDateKey(hoyMon));
    
    setCargando(false);
  };

  useEffect(() => { cargarDatos(); }, []);

  // --- PROCESAMIENTO: LISTADO DE SEMANAS DISPONIBLES ---
  const opcionesSemanas = useMemo(() => {
    const semanas = new Set();
    semanas.add(formatDateKey(getMonday(new Date()))); // Asegura que la semana actual exista
    
    asistencias.forEach(a => {
      const mon = getMonday(a.fecha_hora);
      semanas.add(formatDateKey(mon));
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
    return `Semana: ${mon.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} al ${sun.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}`;
  };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease', padding: '20px' }}>
      
      {/* Encabezado y Filtro */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ color: 'var(--text-light)', fontSize: '32px', fontWeight: 800, margin: 0 }}>Auditoría de Asistencias (GPS)</h1>
          
          {/* Selector de Semanas */}
          <select 
            value={semanaSeleccionada} 
            onChange={(e) => setSemanaSeleccionada(e.target.value)}
            style={{ marginTop: '10px', padding: '10px', borderRadius: '8px', background: 'var(--card-bg)', color: 'var(--text-light)', border: '1px solid var(--border-color)', fontWeight: 600, cursor: 'pointer' }}
          >
            {opcionesSemanas.map(sem => (
              <option key={sem} value={sem}>{formatNombreSemana(sem)}</option>
            ))}
          </select>
        </div>
        <button style={{ background: 'transparent', color: 'var(--primary)', border: '2px solid var(--primary)', padding: '10px 20px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>📥 Descargar Excel</button>
      </div>

      {/* DETECTOR DE INASISTENCIAS (ALERTAS) */}
      <div style={{ background: 'rgba(231, 76, 60, 0.1)', border: '1px solid var(--danger)', borderRadius: '16px', padding: '20px', marginBottom: '30px' }}>
        <h2 style={{ color: 'var(--danger)', margin: '0 0 15px 0', fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
          ⚠️ Días sin Registro de Asistencia Detectados
        </h2>
        {cargando ? (
          <p style={{ color: 'var(--text-light)' }}>Calculando ausencias...</p>
        ) : datosProcesados.faltas.length === 0 ? (
          <p style={{ color: '#2ecc71', margin: 0, fontWeight: 600 }}>¡Excelente! Todos los operadores registrados cuentan con sus asistencias al día.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {datosProcesados.faltas.map((f, idx) => (
              <div key={idx} style={{ background: 'var(--card-bg)', border: '1px solid rgba(231, 76, 60, 0.3)', padding: '12px', borderRadius: '10px' }}>
                <span style={{ color: 'var(--danger)', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', display: 'block' }}>Falta el {f.diaTexto}</span>
                <strong style={{ color: 'var(--text-light)', fontSize: '15px' }}>{f.nombre}</strong>
                <span style={{ display: 'block', fontSize: '13px', color: 'gray' }}>Emp: {f.numero_empleado}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TABLA SEMANAL DE REGISTROS REALIZADOS */}
      <div style={{ background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'auto', boxShadow: '0 10px 20px rgba(0,0,0,0.3)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px', color: 'var(--text-light)' }}>
          <thead>
            <tr>
              <th style={{ padding: '18px 20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase' }}>Fecha y Hora</th>
              <th style={{ padding: '18px 20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase' }}>Nombre Operador</th>
              <th style={{ padding: '18px 20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase' }}># Empleado</th>
              <th style={{ padding: '18px 20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase' }}>Actividad</th>
              <th style={{ padding: '18px 20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase' }}>Ubicación</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px' }}>Cargando datos de Supabase...</td></tr>
            ) : datosProcesados.asistenciasFiltradas.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'gray' }}>No hay pases de asistencia registrados en esta semana.</td></tr>
            ) : (
              datosProcesados.asistenciasFiltradas.map(a => (
                <tr key={a.id}>
                  <td style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)' }}>{new Date(a.fecha_hora).toLocaleString()}</td>
                  <td style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)' }}><strong>{a.usuario.nombre_completo}</strong></td>
                  <td style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)' }}>{a.usuario.numero_empleado}</td>
                  <td style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)' }}><b style={{ color: 'var(--primary)' }}>{a.actividad_sin_manejo || 'Conducción'}</b></td>
                  <td style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)' }}>
                    {a.latitud ? (
                      <a href={`https://www.google.com/maps?q=${a.latitud},${a.longitud}`} target="_blank" rel="noreferrer" style={{ color: 'var(--info)' }}>📍 Ver Mapa</a>
                    ) : (
                      <span style={{ color: 'var(--danger)', fontSize: '11px' }}>Sin GPS</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}