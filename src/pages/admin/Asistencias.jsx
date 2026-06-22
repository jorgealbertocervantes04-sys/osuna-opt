import { useState, useEffect } from 'react';
import { dataService } from '../../services/dataService';

export default function Asistencias() {
  const [asistencias, setAsistencias] = useState([]);
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
    setCargando(false);
  };

  useEffect(() => { cargarDatos(); }, []);

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: 'var(--text-light)', fontSize: '32px', fontWeight: 800 }}>Auditoría de Asistencias (GPS)</h1>
        <button style={{ background: 'transparent', color: 'var(--primary)', border: '2px solid var(--primary)', padding: '10px 20px', borderRadius: '10px', fontWeight: 700 }}>📥 Descargar Excel</button>
      </div>

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
            {cargando ? <tr><td colSpan="5" style={{textAlign:'center', padding:'30px'}}>Cargando...</td></tr> : asistencias.map(a => (
              <tr key={a.id}>
                <td style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)' }}>{new Date(a.fecha_hora).toLocaleString()}</td>
                <td style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)' }}><strong>{a.usuario.nombre_completo}</strong></td>
                <td style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)' }}>{a.usuario.numero_empleado}</td>
                <td style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)' }}><b style={{ color: 'var(--primary)' }}>{a.actividad_sin_manejo || 'Conducción'}</b></td>
                <td style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)' }}>
                  {a.latitud ? <a href={`http://maps.google.com/maps?q=${a.latitud},${a.longitud}`} target="_blank" rel="noreferrer" style={{ color: 'var(--info)' }}>📍 Ver Mapa</a> : <span style={{color:'var(--danger)', fontSize:'11px'}}>Sin GPS</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}