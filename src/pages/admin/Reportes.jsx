import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from "../../services/supabaseClient";

export default function Reportes() {
  const { filtrosGlobales } = useOutletContext();
  
  const [datosReporte, setDatosReporte] = useState([]);
  const [kpis, setKpis] = useState({ viajes: 0, km: 0, tiempo: 0, velocidad: 0 });
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setCargando(true);
      try {
        const [resU, resV, resE] = await Promise.all([
          supabase.from('usuarios').select('*'),
          supabase.from('viajes_diarios').select('*'),
          supabase.from('encuestas').select('*') // <-- Cambiado a 'encuestas' (o ajusta al nombre real de tu tabla)
        ]);

        const usuarios = resU.data || [];
        const viajes = resV.data || [];
        const evaluaciones = resE.data || [];

        const fi = filtrosGlobales.desde ? new Date(filtrosGlobales.desde + 'T00:00:00') : new Date('2000-01-01');
        const ff = filtrosGlobales.hasta ? new Date(filtrosGlobales.hasta + 'T23:59:59') : new Date('2100-01-01');

        const alumnosFiltrados = usuarios.filter(u => {
          if (u.rol !== 'Alumno') return false;
          return (filtrosGlobales.generacion === 'TODOS' || u.generacion === filtrosGlobales.generacion) &&
                 (filtrosGlobales.unidad === 'TODOS' || u.unidad_negocio === filtrosGlobales.unidad) &&
                 (filtrosGlobales.lider === 'TODOS' || u.lider === filtrosGlobales.lider);
        });

        let totalViajes = 0, totalKm = 0, totalMinutos = 0;
        
        const reporte = alumnosFiltrados.map(al => {
          const viajesAl = viajes.filter(v => v.id_alumno === al.id && new Date(v.hora_inicio) >= fi && new Date(v.hora_inicio) <= ff);
          // Ojo aquí: Ajusté la búsqueda de ID para que coincida con la tabla de encuestas
          const evalsAl = evaluaciones.filter(e => e.id_alumno === al.id && new Date(e.created_at || e.fecha_evaluacion || '2000-01-01') >= fi && new Date(e.created_at || e.fecha_evaluacion || '2100-01-01') <= ff);

          let km = viajesAl.reduce((acc, v) => acc + (parseFloat(v.km_recorridos) || 0), 0);
          let min = viajesAl.reduce((acc, v) => acc + (parseInt(v.tiempo_total_minutos) || 0), 0);

          totalViajes += viajesAl.length;
          totalKm += km;
          totalMinutos += min;

          // Se ajustó para leer "calificacion_general" en vez de "promedio_final" basándome en tu estructura anterior
          let prom = evalsAl.length > 0 ? (evalsAl.reduce((s, e) => s + parseFloat(e.calificacion_general || e.promedio_final || 0), 0) / evalsAl.length).toFixed(1) : 'S/E';

          return { ...al, viajes: viajesAl.length, km, promedio: prom };
        });

        setKpis({ 
          viajes: totalViajes, 
          km: totalKm.toLocaleString(), 
          tiempo: (totalMinutos / 60).toFixed(1), 
          velocidad: (totalMinutos > 0 ? (totalKm / (totalMinutos / 60)).toFixed(1) : 0) 
        });
        
        setDatosReporte(reporte.filter(r => r.viajes > 0));
      } catch (e) {
        console.error("Error cargando reportes:", e);
      } finally {
        setCargando(false);
      }
    };
    
    // Evitamos renderizados en blanco si aún no cargan los filtros globales
    if (filtrosGlobales) {
        fetchData();
    }
  }, [filtrosGlobales]);

  return (
    <div style={{ animation: 'fadeIn 0.4s ease', color: 'var(--text-light)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1 style={{ margin: 0 }}>Reportes de Rendimiento</h1>
        <button onClick={() => window.print()} style={{ background: 'transparent', color: 'var(--primary)', border: '2px solid var(--primary)', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>🖨️ Imprimir</button>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        {Object.entries(kpis).map(([label, val]) => (
          <div key={label} style={{ flex: 1, background: 'var(--card-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.2)' }}>
            <h4 style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</h4>
            <p style={{ margin: '10px 0 0', fontSize: '24px', fontWeight: 800, color: 'var(--primary)' }}>{val}</p>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'auto', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
          <thead>
            <tr style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
              {['Operador', 'Gen', 'Líder', 'Viajes', 'KM', 'Promedio'].map(th => <th key={th} style={{ padding: '15px 20px', textAlign: 'left', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid var(--border-color)' }}>{th}</th>)}
            </tr>
          </thead>
          <tbody>
            {cargando ? <tr><td colSpan="6" style={{padding:'30px', textAlign:'center', color: 'var(--text-muted)'}}>Generando reporte métrico...</td></tr> : 
             datosReporte.length === 0 ? <tr><td colSpan="6" style={{padding:'30px', textAlign:'center', color: 'var(--text-muted)'}}>No se encontraron registros para estos filtros.</td></tr> :
             datosReporte.map(row => (
              <tr key={row.id} style={{ borderBottom: '1px solid var(--border-color)', transition: '0.2s' }}>
                <td style={{ padding: '15px 20px', fontWeight: 'bold' }}>{row.nombre_completo}</td>
                <td style={{ padding: '15px 20px' }}>{row.generacion}</td>
                <td style={{ padding: '15px 20px' }}>{row.lider}</td>
                <td style={{ padding: '15px 20px', color: 'var(--primary)', fontWeight: 'bold' }}>{row.viajes}</td>
                <td style={{ padding: '15px 20px' }}>{row.km}</td>
                <td style={{ padding: '15px 20px' }}>
                  {row.promedio === 'S/E' ? <span style={{color: 'var(--text-muted)', fontSize: '12px'}}>Sin Eval.</span> : <span style={{color: 'var(--warning)', fontWeight: 'bold'}}>⭐ {row.promedio}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}