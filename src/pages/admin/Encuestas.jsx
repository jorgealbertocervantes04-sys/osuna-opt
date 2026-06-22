import { useState, useEffect } from 'react';
import { dataService } from '../../services/dataService';

export default function Encuestas() {
  const [encuestas, setEncuestas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    dataService.obtenerEncuestas().then(data => { setEncuestas(data); setCargando(false); });
  }, []);

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: 'var(--text-light)', fontSize: '32px', fontWeight: 800 }}>Buzón de Opinión</h1>
        <button style={{ background: 'transparent', color: 'var(--primary)', border: '2px solid var(--primary)', padding: '10px 20px', borderRadius: '10px', fontWeight: 700 }}>📥 Descargar Excel</button>
      </div>

      <div style={{ background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'auto', boxShadow: '0 10px 20px rgba(0,0,0,0.3)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px', color: 'var(--text-light)' }}>
          <thead>
            <tr>
              <th style={{ padding: '18px 20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase' }}>Fecha</th>
              <th style={{ padding: '18px 20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase' }}>Alumno</th>
              <th style={{ padding: '18px 20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase' }}>Evalúa a</th>
              <th style={{ padding: '18px 20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase' }}>Calificación</th>
              <th style={{ padding: '18px 20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase' }}>Comentarios</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? <tr><td colSpan="5" style={{textAlign:'center', padding:'30px'}}>Cargando...</td></tr> : encuestas.map(e => (
              <tr key={e.id}>
                <td style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)' }}>{new Date(e.fecha_creacion).toLocaleDateString()}</td>
                <td style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)' }}>{e.nombre_alumno}</td>
                <td style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)' }}>{e.tipo_evaluado}: {e.nombre_evaluado}</td>
                <td style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)' }}>{"⭐".repeat(e.calificacion_general)}</td>
                <td style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)', fontStyle: 'italic', color: 'var(--text-muted)' }}>"{e.comentarios}"</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}