import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dataService } from "../../services/dataService";
import { supabase } from "../../services/supabaseClient";

export default function DashboardTutor() {
  const navigate = useNavigate();
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [enviando, setEnviando] = useState(false);

  // Estados de Datos de Supabase
  const [alumnos, setAlumnos] = useState([]);
  const [viajes, setViajes] = useState([]); 
  const [materialesTutor, setMaterialesTutor] = useState([]);
  const [catUnidades, setCatUnidades] = useState([]);
  const [catLideres, setCatLideres] = useState([]);
  const [catGerentes, setCatGerentes] = useState([]);

  // Modal de Configuración de Perfil del Tutor
  const [mostrarModalActualizacion, setMostrarModalActualizacion] = useState(false);
  const [formActualizacion, setFormActualizacion] = useState({ unidad_negocio: '', lider: '', gerente: '' });

  // Formulario y Rúbrica Completa (9 Criterios Oficiales)
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState('');
  const [notas, setNotas] = useState('');
  const [rubrica, setRubrica] = useState({
    seg1: '', seg2: '', seg3: '',
    tec1: '', tec2: '', tec3: '',
    act1: '', act2: '', act3: ''
  });

  // Carga inicial y recuperación de borradores (Drafts)
  useEffect(() => {
    const cargarTodo = async () => {
      const session = localStorage.getItem('udat_app_session');
      if (!session) return navigate('/app');
      
      const user = JSON.parse(session);
      setUsuarioActual(user);

      try {
        const [todosUsuarios, todosMateriales, todosViajes, catalogos] = await Promise.all([
          dataService.obtenerUsuarios(),
          dataService.obtenerMaterialEstudio(),
          dataService.obtenerViajes(),
          dataService.obtenerCatalogos()
        ]);
        
        setAlumnos(todosUsuarios.filter(u => u.rol === 'Alumno' && u.estatus !== 'Baja'));
        setMaterialesTutor(todosMateriales.filter(m => m.dirigido_a === 'Tutor' || m.dirigido_a === 'Ambos'));
        setViajes(todosViajes);
        
        setCatUnidades(catalogos?.unidades || []);
        setCatLideres(catalogos?.lideres || []);
        setCatGerentes(catalogos?.gerentes || []);

        // Validar si el tutor ya configuró su perfil obligatorio de línea de mando
        if (!user.unidad_negocio || !user.lider || !user.gerente) {
          setMostrarModalActualizacion(true);
        }

      } catch (err) {
        console.error("Error cargando entorno del Tutor:", err);
      } finally {
        setCargandoDatos(false);
      }
    };

    cargarTodo();

    // Recuperar el borrador automático de la rúbrica si existía
    const borradorGuardado = localStorage.getItem('draft_evaluacion_tutor');
    if (borradorGuardado) {
      const { draftAlumno, draftNotas, draftRubrica } = JSON.parse(borradorGuardado);
      if (draftAlumno) setAlumnoSeleccionado(draftAlumno);
      if (draftNotas) setNotas(draftNotas);
      if (draftRubrica) setRubrica(draftRubrica);
    }
  }, [navigate]);

  // Motor Activo de Autoguardado Local
  useEffect(() => {
    if (alumnoSeleccionado !== '' || notas !== '') {
      const draft = { draftAlumno: alumnoSeleccionado, draftNotas: notas, draftRubrica: rubrica };
      localStorage.setItem('draft_evaluacion_tutor', JSON.stringify(draft));
    }
  }, [alumnoSeleccionado, notas, rubrica]);

  const handleChange = (campo, valor) => setRubrica(prev => ({ ...prev, [campo]: valor }));

  const limpiarFormulario = () => {
    setAlumnoSeleccionado('');
    setNotas('');
    setRubrica({ seg1:'', seg2:'', seg3:'', tec1:'', tec2:'', tec3:'', act1:'', act2:'', act3:'' });
    localStorage.removeItem('draft_evaluacion_tutor');
  };

  const guardarActualizacionPerfil = async () => {
    if (!formActualizacion.unidad_negocio || !formActualizacion.lider || !formActualizacion.gerente) {
      return alert("Por favor, selecciona tu Unidad, Líder y Gerente.");
    }
    const { exito } = await dataService.actualizarPerfilAlumno(usuarioActual.id, formActualizacion);
    if (exito) {
      const userActualizado = { ...usuarioActual, ...formActualizacion };
      localStorage.setItem('udat_app_session', JSON.stringify(userActualizado));
      setUsuarioActual(userActualizado);
      setMostrarModalActualizacion(false);
      alert("¡Perfil de tutor configurado con éxito!");
    }
  };

  // Cálculo aritmético en tiempo real del promedio de rúbricas
  const obtenerCalculosEnVivo = () => {
    const valores = Object.values(rubrica);
    const respondidas = valores.filter(v => v !== '').length;
    const suma = valores.reduce((acc, curr) => acc + (parseInt(curr) || 0), 0);
    const promedio = respondidas > 0 ? (suma / respondidas).toFixed(2) : "0.00";
    
    let semaforo = "Rojo"; let colorHex = "#ef4444";
    if (parseFloat(promedio) >= 4.0) { semaforo = "Verde"; colorHex = "#10b981"; } 
    else if (parseFloat(promedio) >= 3.0) { semaforo = "Amarillo"; colorHex = "#f59e0b"; }

    return { promedio, semaforo, colorHex, respondidas };
  };

  const { promedio, semaforo, colorHex, respondidas } = obtenerCalculosEnVivo();
  
  // ==========================================
  // EXTRACCIÓN Y CRUCEO DE EXPEDIENTE DEL ALUMNO
  // ==========================================
  const infoAlumnoActivo = alumnos.find(a => a.id === alumnoSeleccionado);
  let estadisticasAlumno = null;

  if (infoAlumnoActivo) {
    const viajesAlumno = viajes.filter(v => v.id_alumno === alumnoSeleccionado);
    const kmTotales = viajesAlumno.reduce((sum, v) => sum + (parseFloat(v.km_recorridos) || 0), 0);
    
    // Cálculo exacto de días transcurridos sin registros prácticos de conducción
    let diasSinConducir = 0;
    if (viajesAlumno.length > 0) {
      const fechas = viajesAlumno.map(v => new Date(v.hora_inicio || Date.now()).getTime());
      const ultimoViaje = Math.max(...fechas);
      diasSinConducir = Math.max(0, Math.floor((new Date().getTime() - ultimoViaje) / (1000 * 60 * 60 * 24)));
    } else if (infoAlumnoActivo.fecha_inicio_opt) {
      const inicio = new Date(infoAlumnoActivo.fecha_inicio_opt).getTime();
      diasSinConducir = Math.max(0, Math.floor((new Date().getTime() - inicio) / (1000 * 60 * 60 * 24)));
    }

    estadisticasAlumno = {
      km: kmTotales,
      diasInactivo: diasSinConducir,
      calificacionExamen: infoAlumnoActivo.calificacion_teorica || 'Pendiente'
    };
  }

  const enviarEvaluacionTutor = async () => {
    if (!alumnoSeleccionado) return alert("Paso 1: Selecciona un operador en práctica.");
    if (notes.trim().length < 15) return alert("Paso 3: Justificación técnica obligatoria (Mínimo 15 caracteres).");
    if (respondidas < 9) return alert("⚠️ CANDADO ACTIVO: Debes calificar los 9 puntos de la rúbrica corporativa.");

    setEnviando(true);
    const payload = {
      id_alumno: alumnoSeleccionado, id_tutor: usuarioActual.id,
      promedio_final: parseFloat(promedio), semaforo: semaforo,
      notes_texto: notas, fecha_evaluacion: new Date().toISOString()
    };

    const res = await dataService.guardarEvaluacion(payload);
    if (res.exito) {
      alert("✓ Calificación y semáforo enviados con éxito al expediente central.");
      limpiarFormulario();
    } else {
      alert("Error de red al guardar: " + res.error.message);
    }
    setEnviando(false);
  };

  if (cargandoDatos) return <div style={{ color: '#fff', textAlign: 'center', padding: '50px' }}>Sincronizando expedientes operativos LARMEX...</div>;

  return (
    <div style={{ padding: '20px', color: '#e2e8f0', fontFamily: 'system-ui', maxWidth: '800px', margin: '0 auto' }}>
      
      {/* MODAL CONFIGURACIÓN OBLIGATORIA DEL TUTOR */}
      {mostrarModalActualizacion && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.95)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ background: '#1e293b', border: '1px solid #a855f7', borderRadius: '16px', padding: '30px', width: '90%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
                <h3 style={{ color: '#fff', marginTop: 0, textAlign: 'center' }}>Configuración de Perfil (Mando)</h3>
                <p style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', marginBottom: '20px' }}>Vincula tu cuenta a tu Unidad de Negocio, Gerente y Líder antes de operar.</p>
                
                <select value={formActualizacion.unidad_negocio} onChange={(e) => setFormActualizacion({...formActualizacion, unidad_negocio: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px', background: '#0f172a', color: 'white', border: '1px solid #334155', outline: 'none' }}>
                    <option value="">-- Selecciona Unidad de Negocio --</option>
                    {catUnidades.map((u, i) => <option key={i} value={u.nombre}>{u.nombre}</option>)}
                </select>
                <select value={formActualizacion.gerente} onChange={(e) => setFormActualizacion({...formActualizacion, gerente: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px', background: '#0f172a', color: 'white', border: '1px solid #334155', outline: 'none' }}>
                    <option value="">-- Selecciona Gerente --</option>
                    {catGerentes.map((g, i) => <option key={i} value={g.nombre}>{g.nombre}</option>)}
                </select>
                <select value={formActualizacion.lider} onChange={(e) => setFormActualizacion({...formActualizacion, lider: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '25px', borderRadius: '8px', background: '#0f172a', color: 'white', border: '1px solid #334155', outline: 'none' }}>
                    <option value="">-- Selecciona Líder Operativo --</option>
                    {catLideres.map((l, i) => <option key={i} value={l.nombre}>{l.nombre}</option>)}
                </select>

                <button onClick={guardarActualizacionPerfil} style={{ width: '100%', padding: '14px', background: '#a855f7', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Guardar Perfil Corporativo</button>
            </div>
        </div>
      )}

      {/* CABECERA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '15px', marginBottom: '20px' }}>
        <div>
          <span style={{ fontSize: '12px', color: '#a855f7', fontWeight: 'bold' }}>TUTOR CERTIFICADO OPT (LARMEX)</span>
          <h2 style={{ margin: 0, color: '#f8fafc' }}>{usuarioActual?.nombre_completo}</h2>
        </div>
        <button onClick={() => { localStorage.removeItem('udat_app_session'); navigate('/app'); }} style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '8px', padding: '5px 15px', cursor: 'pointer', fontWeight: 'bold' }}>Cerrar Sesión</button>
      </div>

      {/* BIBLIOTECA MULTIMEDIA (PPT/PDF) */}
      <div style={{ background: '#1e293b', padding: '15px', borderRadius: '12px', marginBottom: '22px', border: '1px solid #a855f7', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <h3 style={{ marginTop: 0, fontSize: '15px', color: '#a855f7' }}>📚 biblioteca Técnica de Instructores</h3>
        {materialesTutor.length === 0 ? <p style={{ fontSize: '12px', color: '#94a3b8' }}>No hay manuales específicos para tutores disponibles hoy.</p> : materialesTutor.map(m => (
          <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', background: '#0f172a', padding: '10px', borderRadius: '6px', marginBottom: '5px', border: '1px solid #334155', alignItems: 'center' }}>
            <span style={{ fontSize: '13px' }}>{m.titulo}</span>
            <a href={m.url_documento_video} target="_blank" rel="noreferrer" style={{ color: '#10b981', textDecoration: 'none', fontSize: '12px', fontWeight: 'bold' }}>🔗 Descargar PDF/PPT</a>
          </div>
        ))}
      </div>

      {/* SELECCIÓN DE OPERADOR Y EXPEDIENTE EN VIVO */}
      <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #334155' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#38bdf8' }}>1. Seleccionar Operador a Evaluar:</label>
          {localStorage.getItem('draft_evaluacion_tutor') && <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 'bold' }}>⚠️ Borrador recuperado</span>}
        </div>
        
        <select value={alumnoSeleccionado} onChange={e => setAlumnoSeleccionado(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '8px', background: '#0f172a', color: '#fff', border: '1px solid #334155', marginBottom: '15px', outline: 'none', cursor: 'pointer' }}>
          <option value="">-- Buscar Alumno en Base de Datos --</option>
          {alumnos.map(a => <option key={a.id} value={a.id}>{a.nombre_completo} ({a.generacion})</option>)}
        </select>

        {/* EXPEDIENTE EN VIVO DEL ALUMNO (KM, EXÁMENES, ASISTENCIAS) */}
        {estadisticasAlumno && (
          <div style={{ background: '#0f172a', border: '1px solid #475569', padding: '15px', borderRadius: '8px', animation: 'fadeIn 0.3s' }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#f8fafc', borderBottom: '1px solid #334155', paddingBottom: '5px', fontSize: '14px' }}>📋 Rendimiento Académico y Asistencias: {infoAlumnoActivo.nombre_completo}</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
              <div style={{ background: '#1e293b', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: 'bold' }}>Métricas de Ruta</span>
                <strong style={{ fontSize: '15px', color: '#38bdf8' }}>{estadisticasAlumno.km.toLocaleString()} / 4,000 KM</strong>
              </div>
              <div style={{ background: '#1e293b', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: 'bold' }}>Calificación Examen</span>
                <strong style={{ fontSize: '15px', color: '#10b981' }}>{estadisticasAlumno.calificacionExamen}</strong>
              </div>
              <div style={{ background: '#1e293b', padding: '10px', borderRadius: '6px', textAlign: 'center', border: estadisticasAlumno.diasInactivo > 5 ? '1px solid #ef4444' : 'none' }}>
                <span style={{ display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: 'bold' }}>Días sin Conducir</span>
                <strong style={{ fontSize: '15px', color: estadisticasAlumno.diasInactivo > 5 ? '#ef4444' : '#fff' }}>{estadisticasAlumno.diasInactivo} días</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MONITOR DE CÁLCULO REACTIVO */}
      <div style={{ background: 'rgba(30, 41, 59, 0.7)', border: `2px solid ${colorHex}`, borderRadius: '16px', padding: '15px 22px', marginBottom: '22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'border-color 0.3s ease' }}>
        <div>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 'bold' }}>Cálculo de Competencia en Vivo</span>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>Evaluadas: <strong style={{ color: respondidas === 9 ? '#10b981' : '#fff' }}>{respondidas} de 9</strong> criterios obligatorios</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '28px', fontWeight: 900, color: colorHex }}>{promedio}</div>
          <span style={{ backgroundColor: colorHex, color: '#0f172a', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>{semaforo}</span>
        </div>
      </div>

      {/* RÚBRICA DE EVALUACIÓN COMPLETA SIN CORTES */}
      <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #334155' }}>
        <h3 style={{ color: '#38bdf8', fontSize: '16px', borderBottom: '1px solid #334155', paddingBottom: '10px', marginTop: 0 }}>2. Rúbrica de Criterios Prácticos en Flota</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
          {/* SECCIÓN 1: SEGURIDAD CRÍTICA */}
          <div>
            <label style={{ fontSize: '12px', color: '#ef4444', fontWeight: 'bold' }}>🛡️ SEGURIDAD: Inspección Físico-Mecánica</label>
            <select value={rubrica.seg1} onChange={e => handleChange('seg1', e.target.value)} style={{ width: '100%', padding: '12px', background: '#0f172a', color: '#fff', borderRadius: '6px', border: rubrica.seg1 ? '1px solid #334155' : '1px dashed #ef4444', marginTop: '5px', outline: 'none' }}>
              <option value="">-- Evaluar --</option><option value="5">5 - Excelente</option><option value="3">3 - Regular</option><option value="1">1 - Crítico</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', color: '#ef4444', fontWeight: 'bold' }}>🛡️ SEGURIDAD: Hábitos (Cinturón, Celular)</label>
            <select value={rubrica.seg2} onChange={e => handleChange('seg2', e.target.value)} style={{ width: '100%', padding: '12px', background: '#0f172a', color: '#fff', borderRadius: '6px', border: rubrica.seg2 ? '1px solid #334155' : '1px dashed #ef4444', marginTop: '5px', outline: 'none' }}>
              <option value="">-- Evaluar --</option><option value="5">5 - Excelente</option><option value="3">3 - Regular</option><option value="1">1 - Crítico</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', color: '#ef4444', fontWeight: 'bold' }}>🛡️ SEGURIDAD: Manejo Defensivo</label>
            <select value={rubrica.seg3} onChange={e => handleChange('seg3', e.target.value)} style={{ width: '100%', padding: '12px', background: '#0f172a', color: '#fff', borderRadius: '6px', border: rubrica.seg3 ? '1px solid #334155' : '1px dashed #ef4444', marginTop: '5px', outline: 'none' }}>
              <option value="">-- Evaluar --</option><option value="5">5 - Excelente</option><option value="3">3 - Regular</option><option value="1">1 - Crítico</option>
            </select>
          </div>

          {/* SECCIÓN 2: CONDUCCIÓN TÉCNICA */}
          <div>
            <label style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 'bold' }}>⚙️ TÉCNICA: Rangos Económicos RPM</label>
            <select value={rubrica.tec1} onChange={e => handleChange('tec1', e.target.value)} style={{ width: '100%', padding: '12px', background: '#0f172a', color: '#fff', borderRadius: '6px', border: rubrica.tec1 ? '1px solid #334155' : '1px dashed #f59e0b', marginTop: '5px', outline: 'none' }}>
              <option value="">-- Evaluar --</option><option value="5">5 - Excelente</option><option value="3">3 - Regular</option><option value="1">1 - Crítico</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 'bold' }}>⚙️ TÉCNICA: Educación Vial</label>
            <select value={rubrica.tec2} onChange={e => handleChange('tec2', e.target.value)} style={{ width: '100%', padding: '12px', background: '#0f172a', color: '#fff', borderRadius: '6px', border: rubrica.tec2 ? '1px solid #334155' : '1px dashed #f59e0b', marginTop: '5px', outline: 'none' }}>
              <option value="">-- Evaluar --</option><option value="5">5 - Excelente</option><option value="3">3 - Regular</option><option value="1">1 - Crítico</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 'bold' }}>⚙️ TÉCNICA: Freno de Motor / Patio</label>
            <select value={rubrica.tec3} onChange={e => handleChange('tec3', e.target.value)} style={{ width: '100%', padding: '12px', background: '#0f172a', color: '#fff', borderRadius: '6px', border: rubrica.tec3 ? '1px solid #334155' : '1px dashed #f59e0b', marginTop: '5px', outline: 'none' }}>
              <option value="">-- Evaluar --</option><option value="5">5 - Excelente</option><option value="3">3 - Regular</option><option value="1">1 - Crítico</option>
            </select>
          </div>

          {/* SECCIÓN 3: ACTITUD Y EMOCIÓN */}
          <div>
            <label style={{ fontSize: '12px', color: '#10b981', fontWeight: 'bold' }}>🤝 ACTITUD: Receptividad a Instrucción</label>
            <select value={rubrica.act1} onChange={e => handleChange('act1', e.target.value)} style={{ width: '100%', padding: '12px', background: '#0f172a', color: '#fff', borderRadius: '6px', border: rubrica.act1 ? '1px solid #334155' : '1px dashed #10b981', marginTop: '5px', outline: 'none' }}>
              <option value="">-- Evaluar --</option><option value="5">5 - Excelente</option><option value="3">3 - Regular</option><option value="1">1 - Crítico</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', color: '#10b981', fontWeight: 'bold' }}>🤝 ACTITUD: Control del Estrés</label>
            <select value={rubrica.act2} onChange={e => handleChange('act2', e.target.value)} style={{ width: '100%', padding: '12px', background: '#0f172a', color: '#fff', borderRadius: '6px', border: rubrica.act2 ? '1px solid #334155' : '1px dashed #10b981', marginTop: '5px', outline: 'none' }}>
              <option value="">-- Evaluar --</option><option value="5">5 - Excelente</option><option value="3">3 - Regular</option><option value="1">1 - Crítico</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', color: '#10b981', fontWeight: 'bold' }}>🤝 ACTITUD: Responsabilidad General</label>
            <select value={rubrica.act3} onChange={e => handleChange('act3', e.target.value)} style={{ width: '100%', padding: '12px', background: '#0f172a', color: '#fff', borderRadius: '6px', border: rubrica.act3 ? '1px solid #334155' : '1px dashed #10b981', marginTop: '5px', outline: 'none' }}>
              <option value="">-- Evaluar --</option><option value="5">5 - Excelente</option><option value="3">3 - Regular</option><option value="1">1 - Crítico</option>
            </select>
          </div>
        </div>

        {/* JUSTIFICACIÓN */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
          <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#38bdf8' }}>3. Justificación e Informe Técnico Obligatorio:</label>
          <span style={{ fontSize: '11px', color: notas.trim().length >= 15 ? '#10b981' : '#ef4444' }}>{notas.trim().length} / 15 caracteres mín.</span>
        </div>
        <textarea value={notas} onChange={e => setNotas(e.target.value)} style={{ width: '100%', padding: '12px', background: '#0f172a', color: '#fff', borderRadius: '8px', minHeight: '100px', boxSizing: 'border-box', border: '1px solid #334155', outline: 'none' }} placeholder="Escribe un informe técnico detallando maniobras en patio, acoplamiento, fallas de frenado o hábitos detectados en carretera..."></textarea>
      </div>

      {/* BOTONES DE ACCIÓN */}
      <div style={{ display: 'flex', gap: '15px' }}>
        <button onClick={limpiarFormulario} disabled={enviando} style={{ width: '30%', padding: '15px', background: 'transparent', border: '1px solid #64748b', color: '#cbd5e1', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Limpiar Formulario</button>
        <button onClick={enviarEvaluacionTutor} disabled={enviando} style={{ width: '70%', padding: '15px', background: '#a855f7', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: enviando ? 'not-allowed' : 'pointer', boxShadow: enviando ? 'none' : '0 4px 10px rgba(168, 85, 247, 0.3)' }}>
          {enviando ? 'Cifrando en Bóveda Kárdex...' : 'Someter Rúbrica Oficial a Corporativo'}
        </button>
      </div>

    </div>
  );
}