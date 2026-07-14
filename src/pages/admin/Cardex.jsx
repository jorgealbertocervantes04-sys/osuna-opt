import React, { useState, useEffect } from 'react';
import { solicitarAnalisisDeRiesgo } from '../../services/aiService'; // Integración de la IA
import { supabase } from "../../services/supabaseClient";

export default function Cardex() {
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Estados del Modal
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [idEditando, setIdEditando] = useState(null); // NUEVO: Para saber si estamos editando
  
  const [formData, setFormData] = useState({
    id_alumno: '', id_tutor: '', promedio_final: '', semaforo: 'Verde', notas_texto: ''
  });

  // Estados para el Análisis de IA
  const [cargandoIA, setCargandoIA] = useState(false);
  const [nivelRiesgo, setNivelRiesgo] = useState('');

  // 1. CARGA DE DATOS
  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [resEval, resUsuarios] = await Promise.all([
        supabase.from('evaluaciones_cardex').select('*').order('created_at', { ascending: false }),
        supabase.from('usuarios').select('id, nombre_completo, rol, estatus, generacion')
      ]);

      if (resEval.error) throw resEval.error;
      if (resUsuarios.error) throw resUsuarios.error;

      const datosEval = resEval.data || [];
      const datosUsuarios = resUsuarios.data || [];

      setUsuarios(datosUsuarios);

      const evalsConNombres = datosEval.map(ev => {
        const alumno = datosUsuarios.find(u => u.id === ev.id_alumno) || { nombre_completo: 'Usuario Eliminado' };
        const tutor = datosUsuarios.find(u => u.id === ev.id_tutor) || { nombre_completo: 'Sin Asignar' };
        return { ...ev, alumno, tutor };
      });

      setEvaluaciones(evalsConNombres);
    } catch (error) {
      console.error("Error al cargar el Cardex:", error);
      alert("Error al cargar el Cardex: " + error.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarDatos(); }, []);

  // 2. FUNCIÓN DE IA
  const handleAnalizarRiesgo = async (idPrueba, comentarioTutor) => {
    setCargandoIA(true);
    const resultadoIA = await solicitarAnalisisDeRiesgo(idPrueba, comentarioTutor);
    if (resultadoIA) {
      setNivelRiesgo(resultadoIA);
      alert(`Análisis de IA: ${resultadoIA}`);
    }
    setCargandoIA(false);
  };

  // 3. FUNCIONES DEL MODAL
  const handleChangeForm = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const abrirModalNuevo = () => {
    setIdEditando(null);
    setFormData({ id_alumno: '', id_tutor: '', promedio_final: '', semaforo: 'Verde', notas_texto: '' });
    setModalAbierto(true);
  };

  // NUEVO: Función para precargar datos y editar
  const abrirModalEditar = (evaluacion) => {
    setIdEditando(evaluacion.id);
    setFormData({
      id_alumno: evaluacion.id_alumno,
      id_tutor: evaluacion.id_tutor,
      promedio_final: evaluacion.promedio_final,
      semaforo: evaluacion.semaforo,
      notas_texto: evaluacion.notas_texto
    });
    setModalAbierto(true);
  };

  // NUEVO: Guardar adaptado para Crear / Actualizar
  const guardarEvaluacion = async () => {
    if (!formData.id_alumno || !formData.id_tutor || !formData.promedio_final || !formData.notas_texto) {
      return alert("Por favor llena todos los campos obligatorios.");
    }

    const prom = parseFloat(formData.promedio_final);
    if (prom < 1 || prom > 5) return alert("El promedio debe estar entre 1.0 y 5.0.");

    setGuardando(true);

    const payload = {
      id_alumno: formData.id_alumno,
      id_tutor: formData.id_tutor,
      promedio_final: prom,
      semaforo: formData.semaforo,
      notas_texto: formData.notas_texto
    };

    try {
      if (!idEditando) {
        // MODO CREAR
        payload.fecha_evaluacion = new Date().toISOString();
        const { error } = await supabase.from('evaluaciones_cardex').insert([payload]);
        if (error) throw error;
        alert("✓ Evaluación guardada con éxito.");
      } else {
        // MODO EDITAR
        const { error } = await supabase.from('evaluaciones_cardex').update(payload).eq('id', idEditando);
        if (error) throw error;
        alert("✓ Evaluación actualizada con éxito.");
      }
      
      setModalAbierto(false);
      cargarDatos();
    } catch (error) {
      alert("Error en BD: " + error.message);
    } finally {
      setGuardando(false);
    }
  };

  const eliminarRegistro = async (id) => {
    if (window.confirm("⚠️ ¿Deseas eliminar permanentemente esta evaluación?")) {
      try {
        const { error } = await supabase.from('evaluaciones_cardex').delete().eq('id', id);
        if (error) throw error;
        cargarDatos();
      } catch (error) {
        alert("Error al eliminar: " + error.message);
      }
    }
  };

  const listaAlumnos = usuarios.filter(u => u.rol === 'Alumno' && u.estatus !== 'Baja');
  const listaTutores = usuarios.filter(u => u.rol === 'Tutor');

  const inputStyle = { width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', boxSizing: 'border-box', fontSize: '14px', color: 'var(--text-light)', marginBottom: '15px' };
  const labelStyle = { display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '1px' };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <h1 style={{ color: 'var(--text-light)', margin: 0, fontSize: '32px', fontWeight: 800, letterSpacing: '-0.5px' }}>Cardex Oficial de Evaluaciones</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={abrirModalNuevo} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, transition: '0.3s', boxShadow: '0 4px 15px var(--primary-glow)' }}>
            + Nueva Evaluación
          </button>
        </div>
      </div>

      {nivelRiesgo && (
        <div style={{ background: 'rgba(14, 165, 233, 0.1)', border: '1px solid var(--primary)', padding: '15px', borderRadius: '10px', marginBottom: '20px' }}>
          <p style={{ margin: 0, color: 'var(--text-light)' }}>Último análisis IA: <strong>{nivelRiesgo}</strong></p>
        </div>
      )}

      {/* TABLA PRINCIPAL */}
      <div style={{ background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'auto', boxShadow: '0 10px 20px rgba(0,0,0,0.3)', marginBottom: '30px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px', color: 'var(--text-light)' }}>
          <thead>
            <tr>
              <th style={{ padding: '18px 20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Fecha</th>
              <th style={{ padding: '18px 20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Alumno Evaluado</th>
              <th style={{ padding: '18px 20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Tutor Auditor</th>
              <th style={{ padding: '18px 20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Promedio</th>
              <th style={{ padding: '18px 20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Detalles / Notas</th>
              <th style={{ padding: '18px 20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>Cargando cardex...</td></tr>
            : evaluaciones.length === 0 ? <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No hay evaluaciones.</td></tr>
            : evaluaciones.map(e => {
                const bgSemaforo = e.semaforo === 'Verde' ? 'rgba(16, 185, 129, 0.2)' : e.semaforo === 'Amarillo' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(244, 63, 94, 0.2)';
                const colorSemaforo = e.semaforo === 'Verde' ? '#34d399' : e.semaforo === 'Amarillo' ? '#fbbf24' : '#fb7185';
                const fechaFormateada = (e.fecha_evaluacion || e.created_at) ? new Date(e.fecha_evaluacion || e.created_at).toLocaleDateString() : 'S/F';

                return (
                  <tr key={e.id} style={{ transition: '0.2s' }}>
                    <td style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)' }}>{fechaFormateada}</td>
                    <td style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)' }}><strong style={{ color: 'var(--text-light)' }}>{e.alumno?.nombre_completo}</strong></td>
                    <td style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)' }}><span style={{ color: 'var(--text-muted)' }}>{e.tutor?.nombre_completo}</span></td>
                    <td style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)' }}>
                      <span style={{ display: 'block', fontWeight: 'bold', fontSize: '16px' }}>{e.promedio_final}</span>
                      <span style={{ padding: '4px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, backgroundColor: bgSemaforo, color: colorSemaforo }}>{e.semaforo}</span>
                    </td>
                    <td style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)', fontSize: '12px', maxWidth: '250px' }}>{e.notas_texto}</td>
                    <td style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button onClick={() => handleAnalizarRiesgo(e.id, e.notas_texto)} disabled={cargandoIA} style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)', borderRadius: '6px', cursor: cargandoIA ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 700 }}>🤖 IA</button>
                        <button onClick={() => abrirModalEditar(e)} style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--info)', color: 'var(--info)', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>✏️</button>
                        <button onClick={() => eliminarRegistro(e.id)} style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                )
              })
            }
          </tbody>
        </table>
      </div>

      {/* MODAL CREAR / EDITAR */}
      {modalAbierto && (
        <div style={{ position: 'fixed', zIndex: 2000, left: 0, top: 0, width: '100%', height: '100%', backgroundColor: 'rgba(5, 11, 20, 0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', boxSizing: 'border-box' }}>
          <div style={{ backgroundColor: 'var(--sidebar-bg)', padding: '35px', borderRadius: '20px', width: '100%', maxWidth: '600px', boxShadow: '0 0 40px rgba(0,0,0,0.8)', border: '1px solid var(--border-color)' }}>
            <h2 style={{ marginTop: 0, color: 'var(--primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '15px', marginBottom: '20px' }}>
              {idEditando ? '✏️ Editar Evaluación' : 'Nueva Evaluación (Auditoría)'}
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Alumno Evaluado *</label>
                <select name="id_alumno" value={formData.id_alumno} onChange={handleChangeForm} style={{ ...inputStyle, background: 'rgba(0,0,0,0.5)' }}>
                  <option value="">Selecciona Alumno...</option>
                  {listaAlumnos.map(a => <option key={a.id} value={a.id}>{a.nombre_completo} ({a.generacion || 'S/G'})</option>)}
                </select>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Tutor / Auditor Asignado *</label>
                <select name="id_tutor" value={formData.id_tutor} onChange={handleChangeForm} style={{ ...inputStyle, background: 'rgba(0,0,0,0.5)' }}>
                  <option value="">Selecciona Tutor...</option>
                  {listaTutores.map(t => <option key={t.id} value={t.id}>{t.nombre_completo}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Promedio (1.0 - 5.0) *</label>
                <input type="number" step="0.1" name="promedio_final" value={formData.promedio_final} onChange={handleChangeForm} placeholder="Ej. 4.5" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Semáforo *</label>
                <select name="semaforo" value={formData.semaforo} onChange={handleChangeForm} style={inputStyle}>
                  <option value="Verde">Verde (Óptimo)</option>
                  <option value="Amarillo">Amarillo (Regular)</option>
                  <option value="Rojo">Rojo (Riesgo)</option>
                </select>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Justificación / Notas *</label>
                <textarea name="notas_texto" value={formData.notas_texto} onChange={handleChangeForm} rows="3" style={{ ...inputStyle, height: '80px', fontFamily: 'inherit' }}></textarea>
              </div>
            </div>

            <div style={{ textAlign: 'right', marginTop: '25px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
              <button onClick={() => {setModalAbierto(false); setIdEditando(null);}} style={{ backgroundColor: 'transparent', color: 'var(--text-light)', border: '1px solid var(--border-color)', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginRight: '10px' }}>Cancelar</button>
              <button onClick={guardarEvaluacion} disabled={guardando} style={{ backgroundColor: 'var(--primary)', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '8px', cursor: guardando ? 'not-allowed' : 'pointer', fontWeight: 'bold', boxShadow: guardando ? 'none' : '0 4px 15px var(--primary-glow)' }}>
                {guardando ? 'Guardando...' : (idEditando ? 'Actualizar' : 'Crear Evaluación')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}