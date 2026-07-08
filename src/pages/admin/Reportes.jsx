import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from "../../services/supabaseClient";
import { dataService } from '../../services/dataService';

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
          supabase.from('evaluaciones_cardex').select('*')
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
          const evalsAl = evaluaciones.filter(e => e.id_alumno === al.id && new Date(e.fecha_evaluacion) >= fi && new Date(e.fecha_evaluacion) <= ff);

          let km = viajesAl.reduce((acc, v) => acc + (parseFloat(v.km_recorridos) || 0), 0);
          let min = viajesAl.reduce((acc, v) => acc + (parseInt(v.tiempo_total_minutos) || 0), 0);

          totalViajes += viajesAl.length;
          totalKm += km;
          totalMinutos += min;

          let prom = evalsAl.length > 0 ? (evalsAl.reduce((s, e) => s + parseFloat(e.promedio_final || 0), 0) / evalsAl.length).toFixed(1) : 'S/E';

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
        console.error(e);
      } finally {
        setCargando(false);
      }
    };
    fetchData();
  }, [filtrosGlobales]);

  return (
    <div style={{ animation: 'fadeIn 0.4s ease', color: 'var(--text-light)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1 style={{ margin: 0 }}>Reportes de Rendimiento</h1>
        <button onClick={() => window.print()} style={{ background: 'transparent', color: 'var(--primary)', border: '2px solid var(--primary)', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer' }}>Imprimir</button>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        {Object.entries(kpis).map(([label, val]) => (
          <div key={label} style={{ flex: 1, background: 'var(--card-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
            <h4 style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</h4>
            <p style={{ margin: '10px 0 0', fontSize: '24px', fontWeight: 800, color: 'var(--primary)' }}>{val}</p>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
              {['Operador', 'Gen', 'Líder', 'Viajes', 'KM', 'Promedio'].map(th => <th key={th} style={{ padding: '15px', textAlign: 'left', color: 'var(--primary)' }}>{th}</th>)}
            </tr>
          </thead>
          <tbody>
            {cargando ? <tr><td colSpan="6" style={{padding:'20px', textAlign:'center'}}>Cargando...</td></tr> : datosReporte.map(row => (
              <tr key={row.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '15px' }}>{row.nombre_completo}</td>
                <td style={{ padding: '15px' }}>{row.generacion}</td>
                <td style={{ padding: '15px' }}>{row.lider}</td>
                <td style={{ padding: '15px' }}>{row.viajes}</td>
                <td style={{ padding: '15px' }}>{row.km}</td>
                <td style={{ padding: '15px' }}>{row.promedio}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}