import { useState, useEffect } from 'react';
import { supabase } from "../../services/supabaseClient";

export default function Encuestas() {
  const [encuestas, setEncuestas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarEncuestas = async () => {
      setCargando(true);
      try {
        // Conexión directa a Supabase, reemplazando a dataService
        const { data, error } = await supabase
          .from('encuestas')
          .select('*')
          .order('created_at', { ascending: false }); // Las ordenamos de la más nueva a la más vieja

        if (error) throw error;
        
        setEncuestas(data || []);
      } catch (err) {
        console.error("Error al cargar el buzón de encuestas:", err);
        alert("Error al cargar las encuestas: " + err.message);
      } finally {
        setCargando(false);
      }
    };

    cargarEncuestas();
  }, []);

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <h1 style={{ color: 'var(--text-light)', fontSize: '32px', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>Buzón de Opinión</h1>
        <button style={{ background: 'transparent', color: 'var(--primary)', border: '2px solid var(--primary)', padding: '10px 20px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', transition: '0.3s' }}>
          📥 Descargar Excel
        </button>
      </div>

      {/* TABLA PRINCIPAL */}
      <div style={{ background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'auto', boxShadow: '0 10px 20px rgba(0,0,0,0.3)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px', color: 'var(--text-light)' }}>
          <thead>
            <tr>
              <th style={{ padding: '18px 20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Fecha</th>
              <th style={{ padding: '18px 20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Alumno</th>
              <th style={{ padding: '18px 20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Evalúa a</th>
              <th style={{ padding: '18px 20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Calificación</th>
              <th style={{ padding: '18px 20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Comentarios</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan="5" style={{textAlign:'center', padding:'30px', color: 'var(--text-muted)'}}>Cargando buzón de opiniones...</td></tr>
            ) : encuestas.length === 0 ? (
              <tr><td colSpan="5" style={{textAlign:'center', padding:'30px', color: 'var(--text-muted)'}}>El buzón está vacío en este momento.</td></tr>
            ) : (
              encuestas.map(e => {
                // Blindaje anti-crashes (Si no hay fecha o calificación)
                const fechaLimpia = e.fecha_creacion || e.created_at || null;
                const califLimpia = Number(e.calificacion_general) || 0;
                
                return (
                  <tr key={e.id} style={{ transition: '0.2s', borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '18px 20px' }}>
                      {fechaLimpia ? new Date(fechaLimpia).toLocaleDateString() : 'Sin Fecha'}
                    </td>
                    <td style={{ padding: '18px 20px', fontWeight: 'bold' }}>
                      {e.nombre_alumno || 'Anónimo'}
                    </td>
                    <td style={{ padding: '18px 20px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{e.tipo_evaluado || 'OPT'}:</span><br/>
                      {e.nombre_evaluado || 'S/A'}
                    </td>
                    <td style={{ padding: '18px 20px', fontSize: '16px', letterSpacing: '2px' }}>
                      {"⭐".repeat(Math.min(califLimpia, 5))}
                    </td>
                    <td style={{ padding: '18px 20px', fontStyle: 'italic', color: 'var(--text-muted)', maxWidth: '250px' }}>
                      "{e.comentarios || 'Sin comentarios adicionales.'}"
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}