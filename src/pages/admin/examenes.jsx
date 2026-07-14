import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from "../../services/supabaseClient";

export default function Examenes() {
  const { filtrosGlobales } = useOutletContext(); 

  const [examenes, setExamenes] = useState([]);
  const [alumnosDisponibles, setAlumnosDisponibles] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Modales y formularios (NUEVO: idEditando para saber si estamos creando o modificando)
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [idEditando, setIdEditando] = useState(null);
  const [formExa, setFormExa] = useState({ id_alumno: '', semana: '', calificacion: '' });

  // 1. CARGA DE DATOS
  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [resExas, resUsers] = await Promise.all([
        supabase.from('examenes').select('*'),
        supabase.from('usuarios').select('id, nombre_completo, generacion, rol, unidad_negocio, lider')
      ]);

      if (resExas.error) throw resExas.error;
      if (resUsers.error) throw resUsers.error;

      const exasData = resExas.data || [];
      const usersData = resUsers.data || [];

      setAlumnosDisponibles(usersData.filter(u => u.rol === 'Alumno'));

      let exasConAlumno = exasData.map(e => {
        const alumno = usersData.find(u => u.id === e.id_alumno) || { nombre_completo: 'Usuario Borrado', generacion: '-' };
        return { ...e, alumno };
      });

      if (filtrosGlobales) {
        const fi = filtrosGlobales.desde ? new Date(filtrosGlobales.desde + 'T00:00:00') : new Date('2000-01-01');
        const ff = filtrosGlobales.hasta ? new Date(filtrosGlobales.hasta + 'T23:59:59') : new Date('2100-01-01');

        exasConAlumno = exasConAlumno.filter(e => {
          const dateEx = e.fecha_realizacion ? new Date(e.fecha_realizacion) : new Date();
          const pasaFecha = dateEx >= fi && dateEx <= ff;
          const pasaGen = filtrosGlobales.generacion === 'TODOS' || e.alumno.generacion === filtrosGlobales.generacion;
          const pasaUni = filtrosGlobales.unidad === 'TODOS' || e.alumno.unidad_negocio === filtrosGlobales.unidad;
          const pasaLid = filtrosGlobales.lider === 'TODOS' || e.alumno.lider === filtrosGlobales.lider;
          
          return pasaFecha && pasaGen && pasaUni && pasaLid;
        });
      }

      setExamenes(exasConAlumno.sort((a,b) => new Date(b.fecha_realizacion) - new Date(a.fecha_realizacion)));

    } catch (error) {
      console.error("Error al cargar exámenes:", error);
      alert("Error al cargar los exámenes: " + error.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { 
    cargarDatos(); 
  }, [filtrosGlobales]);

  // 2. FUNCIONES DE MODAL (NUEVO: Función para Editar)
  const abrirModalNuevo = () => {
    setIdEditando(null);
    setFormExa({ id_alumno: '', semana: '', calificacion: '' });
    setModalAbierto(true);
  };

  const abrirModalEditar = (examen) => {
    setIdEditando(examen.id);
    setFormExa({ 
      id_alumno: examen.id_alumno, 
      semana: examen.semana, 
      calificacion: examen.calificacion 
    });
    setModalAbierto(true);
  };

  // 3. FUNCIONES DE BASE DE DATOS (Guardar y Actualizar)
  const guardarExamen = async () => {
    if (!formExa.id_alumno || !formExa.semana || !formExa.calificacion) {
      return alert("Por favor, llena todos los campos obligatorios.");
    }
    
    setGuardando(true);
    try {
      const payload = { 
        id_alumno: formExa.id_alumno,
        semana: parseInt(formExa.semana),
        calificacion: parseFloat(formExa.calificacion)
      };

      if (!idEditando) {
        // MODO CREAR: Le agregamos la fecha del momento
        payload.fecha_realizacion = new Date().toISOString();
        const { error } = await supabase.from('examenes').insert([payload]);
        if (error) throw error;
      } else {
        // MODO EDITAR: Solo actualizamos los datos, no tocamos la fecha original
        const { error } = await supabase.from('examenes').update(payload).eq('id', idEditando);
        if (error) throw error;
      }

      setModalAbierto(false); 
      setFormExa({ id_alumno: '', semana: '', calificacion: '' }); 
      setIdEditando(null);
      cargarDatos();
    } catch (error) {
      alert("Error al guardar la calificación: " + error.message);
    } finally {
      setGuardando(false);
    }
  };

  const eliminarExamen = async (id) => {
    if (window.confirm("⚠️ ¿Estás seguro que deseas eliminar permanentemente este registro?")) {
      try {
        const { error } = await supabase.from('examenes').delete().eq('id', id);
        if (error) throw error;
        cargarDatos();
      } catch (error) {
        alert("Error al eliminar: " + error.message);
      }
    }
  };

  // KPIs Dinámicos
  const aprobados = examenes.filter(e => parseFloat(e.calificacion) >= 80).length;
  const reprobados = examenes.filter(e => parseFloat(e.calificacion) < 80).length;
  const promGlobal = examenes.length > 0 ? (examenes.reduce((acc, e) => acc + parseFloat(e.calificacion), 0) / examenes.length).toFixed(1) : 0;

  // Estilos base
  const inputStyle = { width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', boxSizing: 'border-box', fontSize: '14px', color: 'var(--text-light)', marginBottom: '15px' };
  const labelStyle = { display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '1px' };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ color: 'var(--text-light)', margin: 0, fontSize: '32px', fontWeight: 800 }}>Gestión de Exámenes Teóricos</h1>
          <p style={{ color: 'var(--text-muted)', margin: '5px 0 0 0', fontSize: '14px' }}>Control de evaluaciones semanales y métricas de aprobación.</p>
        </div>
        <button onClick={abrirModalNuevo} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, boxShadow: '0 4px 15px var(--primary-glow)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          + Cargar Calificación
        </button>
      </div>

      {/* TARJETAS KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', borderLeft: '4px solid var(--info)' }}>
          <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>Promedio Global</h3>
          <p style={{ margin: 0, fontSize: '32px', fontWeight: 900, color: 'var(--info)' }}>{promGlobal}</p>
        </div>
        <div style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', borderLeft: '4px solid var(--success)' }}>
          <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>Exámenes Aprobados</h3>
          <p style={{ margin: 0, fontSize: '32px', fontWeight: 900, color: 'var(--success)' }}>{aprobados}</p>
        </div>
        <div style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', borderLeft: '4px solid var(--danger)' }}>
          <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>Exámenes Reprobados</h3>
          <p style={{ margin: 0, fontSize: '32px', fontWeight: 900, color: 'var(--danger)' }}>{reprobados}</p>
        </div>
      </div>

      {/* TABLA PRINCIPAL */}
      <div style={{ background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'auto', boxShadow: '0 10px 20px rgba(0,0,0,0.3)', marginBottom: '30px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px', color: 'var(--text-light)' }}>
          <thead>
            <tr>
              <th style={{ padding: '18px 20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase' }}>Fecha</th>
              <th style={{ padding: '18px 20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase' }}>Alumno</th>
              <th style={{ padding: '18px 20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase' }}>Gen / Sem</th>
              <th style={{ padding: '18px 20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase' }}>Calificación</th>
              <th style={{ padding: '18px 20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? <tr><td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando evaluaciones...</td></tr>
            : examenes.length === 0 ? <tr><td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>No se encontraron registros de exámenes.</td></tr>
            : examenes.map(ex => {
              const c = parseFloat(ex.calificacion);
              const colText = c >= 80 ? '#34d399' : c >= 60 ? '#fbbf24' : '#fb7185';
              const colBg = c >= 80 ? 'rgba(16, 185, 129, 0.1)' : c >= 60 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(244, 63, 94, 0.1)';
              const txt = c >= 80 ? 'Aprobado' : c >= 60 ? 'Regular' : 'Reprobado';
              
              return (
                <tr key={ex.id} style={{ transition: '0.2s', borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '18px 20px' }}>{new Date(ex.fecha_realizacion).toLocaleDateString()}</td>
                  <td style={{ padding: '18px 20px' }}><strong>{ex.alumno.nombre_completo}</strong></td>
                  <td style={{ padding: '18px 20px' }}>
                    <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{ex.alumno.generacion}</span><br/>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Semana {ex.semana}</span>
                  </td>
                  <td style={{ padding: '18px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{c}/100</span>
                      <span style={{ background: colBg, color: colText, padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>{txt}</span>
                    </div>
                  </td>
                  <td style={{ padding: '18px 20px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {/* BOTÓN DE EDITAR AGREGADO */}
                      <button onClick={() => abrirModalEditar(ex)} style={{ background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>
                        ✏️ Editar
                      </button>
                      <button onClick={() => eliminarExamen(ex.id)} style={{ background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL NUEVO / EDITAR EXAMEN */}
      {modalAbierto && (
        <div style={{ position: 'fixed', zIndex: 2000, left: 0, top: 0, width: '100%', height: '100%', backgroundColor: 'rgba(5, 11, 20, 0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', boxSizing: 'border-box' }}>
          <div style={{ backgroundColor: 'var(--sidebar-bg)', padding: '35px', borderRadius: '20px', width: '100%', maxWidth: '500px', boxShadow: '0 0 40px rgba(0,0,0,0.8)', border: '1px solid var(--border-color)' }}>
            <h2 style={{ marginTop: 0, color: 'var(--primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '15px', marginBottom: '20px' }}>
              {idEditando ? '✏️ Editar Calificación' : '+ Cargar Calificación'}
            </h2>
            
            <div>
              <label style={labelStyle}>Alumno Evaluado *</label>
              <select value={formExa.id_alumno} onChange={e => setFormExa({...formExa, id_alumno: e.target.value})} style={{...inputStyle, background:'rgba(0,0,0,0.5)'}}>
                <option value="">Selecciona Alumno...</option>
                {alumnosDisponibles.map(a => <option key={a.id} value={a.id}>{a.nombre_completo} ({a.generacion})</option>)}
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Semana de Estudio *</label>
                <input type="number" value={formExa.semana} onChange={e => setFormExa({...formExa, semana: e.target.value})} placeholder="Ej. 1" style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Calificación (0-100) *</label>
                <input type="number" value={formExa.calificacion} onChange={e => setFormExa({...formExa, calificacion: e.target.value})} placeholder="Ej. 85" style={inputStyle} />
              </div>
            </div>

            <div style={{ textAlign: 'right', marginTop: '15px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
              <button onClick={() => { setModalAbierto(false); setIdEditando(null); }} style={{ backgroundColor: 'transparent', color: 'var(--text-light)', border: '1px solid var(--border-color)', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginRight: '10px' }}>
                Cancelar
              </button>
              <button onClick={guardarExamen} disabled={guardando} style={{ backgroundColor: 'var(--primary)', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 15px var(--primary-glow)' }}>
                {guardando ? 'Guardando...' : (idEditando ? 'Actualizar' : 'Guardar')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}