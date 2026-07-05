import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import * as dataService from '../../services/dataService';

export default function Academia() {
  const { filtrosGlobales } = useOutletContext(); // Por si quieres filtrar los resultados

  const [materiales, setMateriales] = useState([]);
  const [examenes, setExamenes] = useState([]);
  const [alumnosDisponibles, setAlumnosDisponibles] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Modales
  const [modalMaterial, setModalMaterial] = useState(false);
  const [modalExamen, setModalExamen] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Formularios
  const [formMat, setFormMat] = useState({ semana_asignada: '', titulo: '', descripcion: '', url_documento_video: '' });
  const [formExa, setFormExa] = useState({ id_alumno: '', semana: '', calificacion: '' });

  const cargarDatos = async () => {
    setCargando(true);
    const [mats, exas, users] = await Promise.all([
      dataService.dataService.obtenerMaterialEstudio(),
      dataService.dataService.obtenerExamenes(),
      dataService.dataService.obtenerUsuarios()
    ]);

    setMateriales(mats);
    setAlumnosDisponibles(users.filter(u => u.rol === 'Alumno'));

    // Cruzar exámenes con el nombre del alumno
    const exasConAlumno = exas.map(e => ({
      ...e,
      alumno: users.find(u => u.id === e.id_alumno) || { nombre_completo: 'Usuario Borrado', generacion: '-' }
    }));

    // Aplicar filtros globales solo a los exámenes
    const fi = filtrosGlobales.desde ? new Date(filtrosGlobales.desde + 'T00:00:00') : new Date('2000-01-01');
    const ff = filtrosGlobales.hasta ? new Date(filtrosGlobales.hasta + 'T23:59:59') : new Date('2100-01-01');

    const exasFiltrados = exasConAlumno.filter(e => {
       const dateEx = e.fecha_realizacion ? new Date(e.fecha_realizacion) : new Date();
       const pasaFecha = dateEx >= fi && dateEx <= ff;
       const pasaGen = filtrosGlobales.generacion === 'TODOS' || e.alumno.generacion === filtrosGlobales.generacion;
       return pasaFecha && pasaGen;
    });

    setExamenes(exasFiltrados);
    setCargando(false);
  };

  useEffect(() => { cargarDatos(); }, [filtrosGlobales]);

  // ACCIONES BASE DE DATOS
  const guardarMaterial = async () => {
    if(!formMat.titulo || !formMat.semana_asignada) return alert("Título y Semana obligatorios.");
    setGuardando(true);
    const { exito, error } = await dataService.dataService.guardarMaterial(formMat);
    if(exito) { setModalMaterial(false); setFormMat({ semana_asignada:'', titulo:'', descripcion:'', url_documento_video:'' }); cargarDatos(); }
    else alert(error.message);
    setGuardando(false);
  };

  const borrarMaterial = async (id) => {
    if(window.confirm("¿Borrar material?")) {
      await dataService.dataService.eliminarMaterial(id);
      cargarDatos();
    }
  };

  const guardarExamen = async () => {
    if(!formExa.id_alumno || !formExa.semana || !formExa.calificacion) return alert("Llena todos los campos.");
    setGuardando(true);
    const payload = { ...formExa, fecha_realizacion: new Date().toISOString() };
    const { exito, error } = await dataService.dataService.guardarExamen(payload);
    if(exito) { setModalExamen(false); setFormExa({ id_alumno:'', semana:'', calificacion:'' }); cargarDatos(); }
    else alert(error.message);
    setGuardando(false);
  };

  const inputStyle = { width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', boxSizing: 'border-box', fontSize: '14px', color: 'var(--text-light)', marginBottom: '15px' };
  const labelStyle = { display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '1px' };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      {/* SECCIÓN 1: MATERIALES */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <h1 style={{ color: 'var(--text-light)', margin: 0, fontSize: '32px', fontWeight: 800 }}>Academia UDAT</h1>
        <button onClick={() => setModalMaterial(true)} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, boxShadow: '0 4px 15px var(--primary-glow)' }}>
          + Nuevo Material
        </button>
      </div>

      <div style={{ background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'auto', boxShadow: '0 10px 20px rgba(0,0,0,0.3)', marginBottom: '40px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px', color: 'var(--text-light)' }}>
          <thead>
            <tr>
              <th style={{ padding: '18px 20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase' }}>Semana</th>
              <th style={{ padding: '18px 20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase' }}>Título del Material</th>
              <th style={{ padding: '18px 20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase' }}>Descripción</th>
              <th style={{ padding: '18px 20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase' }}>Adjunto</th>
              <th style={{ padding: '18px 20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? <tr><td colSpan="5" style={{padding:'20px', textAlign:'center'}}>Cargando...</td></tr>
            : materiales.length === 0 ? <tr><td colSpan="5" style={{padding:'20px', textAlign:'center'}}>No hay material.</td></tr> 
            : materiales.map(m => (
              <tr key={m.id}>
                <td style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)' }}><b style={{ color: 'var(--primary)' }}>Sem. {m.semana_asignada}</b></td>
                <td style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)' }}><strong style={{ color: 'var(--text-light)' }}>{m.titulo}</strong></td>
                <td style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)' }}>{m.descripcion || '-'}</td>
                <td style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)' }}>{m.url_documento_video ? <a href={m.url_documento_video} target="_blank" rel="noreferrer" style={{color:'var(--info)'}}>🔗 Abrir Enlace</a> : 'Sin adjunto'}</td>
                <td style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)' }}><button onClick={() => borrarMaterial(m.id)} style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--border-color)', color: '#f43f5e', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>🗑️ Borrar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* SECCIÓN 2: EXÁMENES */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <h3 style={{ color: 'var(--primary)', margin: 0, fontSize: '24px' }}>Resultados de Exámenes</h3>
        <button onClick={() => setModalExamen(true)} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, boxShadow: '0 4px 15px var(--primary-glow)' }}>+ Cargar Calificación</button>
      </div>

      <div style={{ background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'auto', boxShadow: '0 10px 20px rgba(0,0,0,0.3)', marginBottom: '30px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px', color: 'var(--text-light)' }}>
          <thead>
            <tr>
              <th style={{ padding: '18px 20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase' }}>Fecha</th>
              <th style={{ padding: '18px 20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase' }}>Alumno</th>
              <th style={{ padding: '18px 20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase' }}>Generación</th>
              <th style={{ padding: '18px 20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase' }}>Semana</th>
              <th style={{ padding: '18px 20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase' }}>Calificación</th>
              <th style={{ padding: '18px 20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase' }}>Estatus</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? <tr><td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando...</td></tr>
            : examenes.length === 0 ? <tr><td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Sin evaluaciones.</td></tr>
            : examenes.map(ex => {
              const c = parseFloat(ex.calificacion);
              const col = c >= 80 ? '#34d399' : c >= 60 ? '#fbbf24' : '#fb7185';
              const txt = c >= 80 ? 'Aprobado' : c >= 60 ? 'Regular' : 'Reprobado';
              return (
                <tr key={ex.id}>
                  <td style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)' }}>{new Date(ex.fecha_realizacion).toLocaleDateString()}</td>
                  <td style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)' }}><strong>{ex.alumno.nombre_completo}</strong></td>
                  <td style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)', color: 'var(--primary)', fontWeight: 'bold' }}>{ex.alumno.generacion}</td>
                  <td style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)' }}>Sem. {ex.semana}</td>
                  <td style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)', fontWeight: 'bold', fontSize: '16px' }}>{c}/100</td>
                  <td style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)' }}><span style={{ color: col, fontWeight: 'bold' }}>{txt}</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL MATERIAL */}
      {modalMaterial && (
        <div style={{ position: 'fixed', zIndex: 2000, left: 0, top: 0, width: '100%', height: '100%', backgroundColor: 'rgba(5, 11, 20, 0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', boxSizing: 'border-box' }}>
          <div style={{ backgroundColor: 'var(--sidebar-bg)', padding: '35px', borderRadius: '20px', width: '100%', maxWidth: '500px', boxShadow: '0 0 40px rgba(0,0,0,0.8)', border: '1px solid var(--border-color)' }}>
            <h2 style={{ marginTop: 0, color: 'var(--primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '15px', marginBottom: '20px' }}>Cargar Material</h2>
            <div><label style={labelStyle}>Semana</label><input type="number" value={formMat.semana_asignada} onChange={e=>setFormMat({...formMat, semana_asignada: e.target.value})} style={inputStyle} /></div>
            <div><label style={labelStyle}>Título *</label><input type="text" value={formMat.titulo} onChange={e=>setFormMat({...formMat, titulo: e.target.value})} style={inputStyle} /></div>
            <div><label style={labelStyle}>Descripción</label><textarea value={formMat.descripcion} onChange={e=>setFormMat({...formMat, descripcion: e.target.value})} style={{...inputStyle, fontFamily: 'inherit'}} rows="2"></textarea></div>
            <div><label style={labelStyle}>Enlace URL</label><input type="url" value={formMat.url_documento_video} onChange={e=>setFormMat({...formMat, url_documento_video: e.target.value})} style={inputStyle} /></div>
            <div style={{ textAlign: 'right', marginTop: '15px' }}>
              <button onClick={() => setModalMaterial(false)} style={{ backgroundColor: 'transparent', color: 'var(--text-light)', border: '1px solid var(--border-color)', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginRight: '10px' }}>Cancelar</button>
              <button onClick={guardarMaterial} disabled={guardando} style={{ backgroundColor: 'var(--primary)', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>{guardando ? 'Guardando...' : 'Publicar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EXAMEN */}
      {modalExamen && (
        <div style={{ position: 'fixed', zIndex: 2000, left: 0, top: 0, width: '100%', height: '100%', backgroundColor: 'rgba(5, 11, 20, 0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', boxSizing: 'border-box' }}>
          <div style={{ backgroundColor: 'var(--sidebar-bg)', padding: '35px', borderRadius: '20px', width: '100%', maxWidth: '500px', boxShadow: '0 0 40px rgba(0,0,0,0.8)', border: '1px solid var(--border-color)' }}>
            <h2 style={{ marginTop: 0, color: 'var(--primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '15px', marginBottom: '20px' }}>Cargar Calificación</h2>
            <div><label style={labelStyle}>Alumno Evaluado *</label>
              <select value={formExa.id_alumno} onChange={e=>setFormExa({...formExa, id_alumno: e.target.value})} style={{...inputStyle, background:'rgba(0,0,0,0.5)'}}>
                <option value="">Selecciona Alumno...</option>
                {alumnosDisponibles.map(a => <option key={a.id} value={a.id}>{a.nombre_completo} ({a.generacion})</option>)}
              </select>
            </div>
            <div><label style={labelStyle}>Semana de Estudio *</label><input type="number" value={formExa.semana} onChange={e=>setFormExa({...formExa, semana: e.target.value})} placeholder="Ej. 1" style={inputStyle} /></div>
            <div><label style={labelStyle}>Calificación (0-100) *</label><input type="number" value={formExa.calificacion} onChange={e=>setFormExa({...formExa, calificacion: e.target.value})} placeholder="Ej. 85" style={inputStyle} /></div>
            <div style={{ textAlign: 'right', marginTop: '15px' }}>
              <button onClick={() => setModalExamen(false)} style={{ backgroundColor: 'transparent', color: 'var(--text-light)', border: '1px solid var(--border-color)', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginRight: '10px' }}>Cancelar</button>
              <button onClick={guardarExamen} disabled={guardando} style={{ backgroundColor: 'var(--primary)', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>{guardando ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}