import { useState, useEffect } from 'react';
import { supabase } from "../../services/supabaseClient";

export default function AuditoriaOPT() {
  const [tutores, setTutores] = useState([]);
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargarDatos = async () => {
    setCargando(true);
    const [datosUsuarios, datosEval] = await Promise.all([
      supabase.from('usuarios').select('*'),
      supabase.from('evaluaciones').select('*')
    ]);

    // Filtrar solo tutores y calcular sus métricas
    const listaTutores = datosUsuarios.filter(u => u.rol === 'Tutor');
    
    const tutoresConMetricas = listaTutores.map(t => {
      const evalsTutor = datosEval.filter(e => e.id_tutor === t.id);
      const alumnosUnicos = new Set(evalsTutor.map(e => e.id_alumno));
      const sumaPromedios = evalsTutor.reduce((acc, e) => acc + (parseFloat(e.promedio_final) || 0), 0);
      const promedioFinal = evalsTutor.length > 0 ? (sumaPromedios / evalsTutor.length).toFixed(1) : '0.0';
      
      return { ...t, evals: evalsTutor.length, alumnos: alumnosUnicos.size, promedio: promedioFinal };
    });

    setTutores(tutoresConMetricas);
    setCargando(false);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <h1 style={{ color: 'var(--text-light)', margin: 0, fontSize: '32px', fontWeight: 800, letterSpacing: '-0.5px' }}>Auditoría de Tutores (OPT)</h1>
        <button style={{ background: 'transparent', color: 'var(--primary)', border: '2px solid var(--primary)', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 700 }}>📥 Descargar Excel</button>
      </div>

      <div style={{ background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'auto', boxShadow: '0 10px 20px rgba(0,0,0,0.3)', marginBottom: '30px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px', color: 'var(--text-light)' }}>
          <thead>
            <tr>
              <th style={{ padding: '18px 20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Nombre del Tutor</th>
              <th style={{ padding: '18px 20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Unidad</th>
              <th style={{ padding: '18px 20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Certificación</th>
              <th style={{ padding: '18px 20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Actividad</th>
              <th style={{ padding: '18px 20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Historial Alumnos</th>
              <th style={{ padding: '18px 20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Promedio</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>Cargando datos...</td></tr>
            ) : tutores.map(t => (
              <tr key={t.id}>
                <td style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)' }}><strong>{t.nombre_completo}</strong></td>
                <td style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)' }}>{t.unidad_negocio || '-'}</td>
                <td style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, backgroundColor: t.certificacion_opt === 'Certificado Oficialmente' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(244, 63, 94, 0.2)', color: t.certificacion_opt === 'Certificado Oficialmente' ? '#a78bfa' : '#fb7185' }}>
                    {t.certificacion_opt || 'Sin Certificación'}
                  </span>
                </td>
                <td style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)' }}>
                  {t.evals > 0 ? <span style={{ color: '#34d399' }}>En Ruta ({t.evals} Evals)</span> : <span style={{ color: 'var(--text-muted)' }}>Sin Evals</span>}
                </td>
                <td style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)' }}><b>{t.alumnos} Alumno(s)</b></td>
                <td style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)', fontWeight: 'bold', fontSize: '16px', color: 'var(--primary)' }}>⭐ {t.promedio}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}