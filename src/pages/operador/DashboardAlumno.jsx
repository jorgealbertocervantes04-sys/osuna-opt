import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../../services/dataService';
import { supabase } from "../../services/supabaseClient";

export default function DashboardAlumno() {
  const navigate = useNavigate();
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  
  // ==========================================
  // ETAPAS MAESTRAS
  // ==========================================
  const [etapaActual, setEtapaActual] = useState('Prueba Intermedia');
  const [pasoPrueba, setPasoPrueba] = useState('');
  const [motivoFallo, setMotivoFallo] = useState('');
  const [temaInduccion, setTemaInduccion] = useState('');
  const [duracionInduccion, setDuracionInduccion] = useState('');

  // Formulario Selección OPT
  const [mostrarModalActualizacion, setMostrarModalActualizacion] = useState(false);
  const [formActualizacion, setFormActualizacion] = useState({ unidad_negocio: '', lider: '', gerente: '', tutor: '' });

  // En tu DashboardAlumno.js
const [misViajes, todosUsuarios, todosMateriales, catalogos] = await Promise.all([
  dataService.obtenerViajesPorAlumno(user.id), // <--- Utiliza la nueva función y le pasas el ID
  dataService.obtenerUsuarios(),
  dataService.obtenerMaterialEstudio(),
  dataService.obtenerCatalogos()
]);

setViajes(misViajes);
  // ==========================================
  // ESTADOS RUTA OPT
  // ==========================================
  const [activeTab, setActiveTab] = useState('operacion');
  const [viajes, setViajes] = useState([]);
  const [listaOPTs, setListaOPTs] = useState([]);
  const [materiales, setMateriales] = useState([]);
  const [catUnidades, setCatUnidades] = useState([]);
  const [catLideres, setCatLideres] = useState([]);
  const [catGerentes, setCatGerentes] = useState([]);

  // Bitácora y Evaluaciones
  const [manejaHoy, setManejaHoy] = useState('SI');
  const [actividadSinManejo, setActividadSinManejo] = useState('Apoyo en Patio');
  const [asistenciaEnviada, setAsistenciaEnviada] = useState(false);
  const [registrandoAsistencia, setRegistrandoAsistencia] = useState(false);
  const [estadoViaje, setEstadoViaje] = useState('reposo');
  const [idViajeActivo, setIdViajeActivo] = useState(null);
  const [optSeleccionado, setOptSeleccionado] = useState('');
  const [kmInicial, setKmInicial] = useState('');
  const [kmFinal, setKmFinal] = useState('');
  
  // Storage de Imágenes
  const [fotoArchivoFisico, setFotoArchivoFisico] = useState(null);
  const [fotoPrevisualizacion, setFotoPrevisualizacion] = useState(null);

  const [evalTrato, setEvalTrato] = useState('');
  const [evalInstruccion, setEvalInstruccion] = useState('');
  const [comentarioOpt, setComentarioOpt] = useState('');

  // Evaluaciones 360
  const [encuestaTipo, setEncuestaTipo] = useState('');
  const [encuestaNombre, setEncuestaNombre] = useState('');
  const [encuestaEstrellas, setEncuestaEstrellas] = useState('');
  const [encuestaComentarios, setEncuestaComentarios] = useState('');

  const metasUDAT = [
    { sem: 1, km: 500, hrs: 10 }, { sem: 2, km: 1500, hrs: 25 }, { sem: 3, km: 2000, hrs: 28 },
    { sem: 4, km: 2400, hrs: 32 }, { sem: 5, km: 2400, hrs: 32 }, { sem: 6, km: 2400, hrs: 34 },
    { sem: 7, km: 2400, hrs: 34 }, { sem: 8, km: 2400, hrs: 35 }
  ];

  useEffect(() => {
    const cargarTodo = async () => {
      try {
        const session = localStorage.getItem('udat_app_session');
        if (!session) return navigate('/app');
        
        const user = JSON.parse(session);
        setUsuarioActual(user);
        setEtapaActual(user.etapa_actual || 'Prueba Intermedia');

        const [todosViajes, todosUsuarios, todosMateriales, catalogos] = await Promise.all([
          dataService.obtenerViajes(),
          dataService.obtenerUsuarios(),
          dataService.obtenerMaterialEstudio(),
          dataService.obtenerCatalogos()
        ]);

        const misViajes = todosViajes.filter(v => v.id_alumno === user.id);
        setViajes(misViajes);
        setListaOPTs(todosUsuarios.filter(u => u.rol === 'Tutor'));
        setMateriales(todosMateriales.filter(m => m.dirigido_a === 'Alumno' || m.dirigido_a === 'Ambos' || !m.dirigido_a));
        
        setCatUnidades(catalogos?.unidades || []);
        setCatLideres(catalogos?.lideres || []);
        setCatGerentes(catalogos?.gerentes || []);

        if (user.etapa_actual === 'OPT' && (!user.unidad_negocio || !user.lider || !user.gerente)) {
          setMostrarModalActualizacion(true);
        }

        const viajeAbierto = misViajes.find(v => v.hora_fin === null);
        if (viajeAbierto) {
          setIdViajeActivo(viajeAbierto.id);
          setEstadoViaje('progreso');
        }
      } catch (error) {
        console.error("Error al sincronizar datos:", error);
      } finally {
        setCargandoDatos(false);
      }
    };
    cargarTodo();
  }, [navigate]);

  useEffect(() => {
    if (etapaActual === 'Induccion' && typeof window !== 'undefined' && 'Notification' in window) {
      Notification.requestPermission().catch(err => console.log("Permisos bloqueados", err));
    }
  }, [etapaActual]);

  // ==========================================
  // FUNCIONES DE LAS NUEVAS ETAPAS 
  // ==========================================
  const registrarPruebaIntermedia = async (resultado) => {
    if (resultado === 'No' && !motivoFallo) return alert("Por favor, explica qué sucedió para que podamos ayudarte.");
    const nuevaEtapa = resultado === 'Si' ? 'Induccion' : 'Prueba Fallida';
    
    try {
      const { error } = await supabase.from('usuarios').update({ 
          etapa_actual: nuevaEtapa, 
          motivo_fallo_prueba: resultado === 'No' ? motivoFallo : null 
      }).eq('id', usuarioActual.id);

      if (!error) {
          alert(resultado === 'Si' ? "¡Felicidades! Avanzas a tu semana de Inducción." : "Registro enviado al panel de administración.");
          setEtapaActual(nuevaEtapa);
          localStorage.setItem('udat_app_session', JSON.stringify({...usuarioActual, etapa_actual: nuevaEtapa}));
      } else {
          alert("Error de red: " + error.message);
      }
    } catch (err) { alert("Falla de conexión: " + err.message); }
  };

  const registrarAvanceInduccion = async () => {
    if (!temaInduccion || !duracionInduccion) return alert("Completa el tema y la duración.");
    try {
      const payload = { id_alumno: usuarioActual.id, tema_visto: temaInduccion, duracion_minutos: parseInt(duracionInduccion), fecha_registro: new Date().toISOString() };
      const { error } = await supabase.from('registros_induccion').insert([payload]);
      if (!error) {
          alert("✓ Registro de inducción guardado correctamente.");
          setTemaInduccion(''); setDuracionInduccion('');
      } else { alert("Error al guardar: " + error.message); }
    } catch (err) { alert("Error inesperado: " + err.message); }
  };

  const finalizarInduccion = async () => {
    const confirmar = window.confirm("¿Confirmas que terminaste toda tu inducción teórica y estás listo para pasar a ruta (OPT)?");
    if (!confirmar) return;

    try {
      const { error } = await supabase.from('usuarios').update({ etapa_actual: 'OPT', fecha_inicio_opt: new Date().toISOString() }).eq('id', usuarioActual.id);
      if (!error) {
          setEtapaActual('OPT');
          setMostrarModalActualizacion(true);
          localStorage.setItem('udat_app_session', JSON.stringify({...usuarioActual, etapa_actual: 'OPT'}));
      }
    } catch(err) { alert("Error al finalizar etapa: " + err.message); }
  };

  const guardarActualizacionPerfil = async () => {
    if (!formActualizacion.unidad_negocio || !formActualizacion.lider || !formActualizacion.gerente) {
      return alert("Unidad, Líder y Gerente son obligatorios. (El Tutor puede quedar vacío).");
    }
    if (!usuarioActual || !usuarioActual.id) {
      return alert("Error crítico: No se detectó tu sesión. Cierra sesión y vuelve a entrar.");
    }
    
    try {
      const { error } = await supabase
        .from('usuarios')
        .update(formActualizacion)
        .eq('id', usuarioActual.id);

      if (!error) {
        const userActualizado = { ...usuarioActual, ...formActualizacion, fecha_actualizacion_perfil: new Date().toISOString() };
        localStorage.setItem('udat_app_session', JSON.stringify(userActualizado));
        setUsuarioActual(userActualizado);
        setMostrarModalActualizacion(false);
        alert("¡Perfil actualizado con éxito! Ya puedes registrar tus viajes.");
      } else {
        alert("Ocurrió un problema al guardar tu configuración: " + error.message);
      }
    } catch(err) {
      alert("Error de conexión al guardar el perfil: " + err.message);
    }
  };

  // ==========================================
  // OPERACIÓN EN RUTA OPT Y SUPABASE STORAGE
  // ==========================================
  const marcarAsistencia = () => {
    if (!navigator.geolocation) return alert("❌ Tu dispositivo no soporta GPS.");
    setRegistrandoAsistencia(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const payload = {
            id_usuario: usuarioActual.id,
            ubicacion_texto: `GPS: ${pos.coords.latitude}, ${pos.coords.longitude}`,
            latitud: pos.coords.latitude, longitud: pos.coords.longitude,
            actividad_sin_manejo: manejaHoy === 'NO' ? actividadSinManejo : null,
            fecha_hora: new Date().toISOString()
          };
          const { error } = await supabase.from('asistencias').insert([payload]);
          if(!error) {
            setAsistenciaEnviada(true);
            alert("✓ Asistencia validada por GPS exitosamente.");
          } else { alert("Error de base de datos: " + error.message); }
        } catch (err) { alert("Error al registrar asistencia: " + err.message); } 
        finally { setRegistrandoAsistencia(false); }
      },
      () => { setRegistrandoAsistencia(false); alert("⛔ CANDADO: Activa el GPS de tu celular para continuar."); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const procesarFotoOdometro = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFotoArchivoFisico(file);
      const reader = new FileReader();
      reader.onloadend = () => setFotoPrevisualizacion(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const iniciarRuta = async () => {
    if (!asistenciaEnviada) return alert("⚠️ CANDADO: Primero registra tu Asistencia con GPS.");
    if (!kmInicial) return alert("Captura el hodómetro inicial.");
    
    try {
      const payload = {
        id_alumno: usuarioActual.id, 
        nombre_opt: optSeleccionado || 'Sin Tutor Asignado',
        km_iniciales: parseFloat(kmInicial), 
        hora_inicio: new Date().toISOString()
      };
      
      const { data, error } = await supabase.from('viajes_diarios').insert([payload]).select();
      
      if (!error && data && data.length > 0) {
        setIdViajeActivo(data[0].id); 
        setEstadoViaje('progreso');
      } else {
        alert("Error al abrir la bitácora. Asegúrate de desactivar RLS en 'viajes_diarios': " + (error?.message || ''));
      }
    } catch(err) { alert("Error al iniciar ruta: " + err.message); }
  };

  const finalizarRuta = async () => {
    if (!kmFinal || !fotoArchivoFisico || !evalTrato || !evalInstruccion) {
      return alert("⚠️ CANDADO: Foto del odómetro y evaluación de la ruta son obligatorios.");
    }
    try {
      let urlFotoPublica = '';
      const tieneExtension = fotoArchivoFisico.name.includes('.');
      const fileExt = tieneExtension ? fotoArchivoFisico.name.split('.').pop() : 'jpg';
      const fileName = `${usuarioActual.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage.from('evidencias').upload(`odometros/${fileName}`, fotoArchivoFisico);
      if (uploadError) return alert("Error al subir la imagen a la nube corporativa: " + uploadError.message);
      
      const publicUrlResponse = supabase.storage.from('evidencias').getPublicUrl(`odometros/${fileName}`);
      urlFotoPublica = publicUrlResponse.data?.publicUrl || publicUrlResponse.publicURL || '';

      const viajeOriginal = viajes.find(v => v.id === idViajeActivo);
      const baseKm = viajeOriginal ? parseFloat(viajeOriginal.km_iniciales) : parseFloat(kmInicial);
      const kmRecorridos = parseFloat(kmFinal) - baseKm;
      
      if (kmRecorridos < 0) return alert("El hodómetro final no puede ser menor al inicial.");
      const horaInicio = viajeOriginal ? new Date(viajeOriginal.hora_inicio).getTime() : new Date().getTime();
      const mins = Math.floor((new Date().getTime() - horaInicio) / 60000);

      const payload = {
        hora_fin: new Date().toISOString(),
        km_finales: parseFloat(kmFinal),
        km_recorridos: kmRecorridos,
        tiempo_total_minutos: mins,
        notas_novedad: comentarioOpt,
        opt_calif_trato: parseInt(evalTrato),
        opt_calif_instruccion: parseInt(evalInstruccion),
        foto_odometro_url: urlFotoPublica
      };

      const { error: dbError } = await supabase.from('viajes_diarios').update(payload).eq('id', idViajeActivo);
      if (!dbError) {
        alert(`✓ ¡Reporte Enviado!\nRecorriste: ${kmRecorridos} KM.\nTu imagen se guardó en el Storage.`);
        setEstadoViaje('reposo'); setIdViajeActivo(null); 
        setFotoArchivoFisico(null); setFotoPrevisualizacion(null);
        setKmInicial(''); setKmFinal('');
        
        const todos = await dataService.obtenerViajes();
        setViajes(todos.filter(v => v.id_alumno === usuarioActual.id));
      } else {
        alert("Error al registrar en base de datos: " + dbError.message);
      }
    } catch(err) { alert("Error crítico al procesar el cierre de ruta: " + err.message); }
  };

  const enviarEncuesta = async () => {
    if (!encuestaTipo || !encuestaNombre || !encuestaEstrellas || !encuestaComentarios) return alert("Llena todos los campos.");
    try {
      const payload = {
        id_alumno: usuarioActual.id, nombre_alumno: usuarioActual.nombre_completo,
        tipo_evaluado: encuestaTipo, nombre_evaluado: encuestaNombre,
        calificacion_general: parseInt(encuestaEstrellas), comentarios: encuestaComentarios,
        fecha_creacion: new Date().toISOString()
      };
      const { error } = await supabase.from('encuestas').insert([payload]);
      if (!error) {
        alert("✓ Tu reporte 360 fue enviado de manera anónima a corporativo.");
        setEncuestaTipo(''); setEncuestaNombre(''); setEncuestaEstrellas(''); setEncuestaComentarios('');
      } else { alert("Hubo un error al enviar el reporte: " + error.message); }
    } catch(err) { alert("Error de conexión: " + err.message); }
  };

  const kmTotales = viajes.reduce((acc, v) => acc + (parseFloat(v.km_recorridos) || 0), 0);
  const xpInfo = kmTotales >= 4000 ? { nivel: 'Experto', progreso: 100 } : kmTotales >= 1500 ? { nivel: 'Intermedio', progreso: ((kmTotales - 1500) / 2500) * 100 } : { nivel: 'Novato', progreso: (kmTotales / 1500) * 100 };

  if (cargandoDatos) return <div style={{color: '#fff', textAlign: 'center', padding: '50px'}}>Sincronizando Sistema...</div>;

  let kmRestantesVisuales = kmTotales;

  // LÓGICA DE VENCIMIENTO DEL ALUMNO
  let diasDesdeEntrega = 0;
  let diasAtrasoCertificacion = 0;
  if (usuarioActual && (usuarioActual.fecha_entrega_operacion || usuarioActual.fecha_inicio_opt)) {
      const fechaInicioReal = usuarioActual.fecha_entrega_operacion || usuarioActual.fecha_inicio_opt;
      diasDesdeEntrega = Math.floor((new Date().getTime() - new Date(fechaInicioReal).getTime()) / (1000 * 60 * 60 * 24));
      if (diasDesdeEntrega >= 56 && etapaActual !== 'Certificado') {
        diasAtrasoCertificacion = diasDesdeEntrega - 56;
      }
  }

  return (
    <div style={{ padding: '20px', color: '#e2e8f0', fontFamily: 'system-ui' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '15px', marginBottom: '20px' }}>
        <div>
          <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 'bold', textTransform: 'uppercase' }}>ESTATUS: {etapaActual}</span>
          <h2 style={{ margin: 0, color: '#f8fafc' }}>{usuarioActual?.nombre_completo}</h2>
        </div>
        <button onClick={() => { localStorage.removeItem('udat_app_session'); navigate('/app'); }} style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '8px', padding: '5px 15px', cursor: 'pointer', fontWeight: 'bold' }}>Salir</button>
      </div>

      {etapaActual === 'Prueba Intermedia' && (
          <div style={{ background: '#1e293b', padding: '30px', borderRadius: '12px', textAlign: 'center', border: '1px solid #334155' }}>
              <h3 style={{ color: '#f8fafc', marginTop: 0 }}>📋 Registro de Prueba Intermedia</h3>
              <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '25px' }}>Por favor, indica si lograste aprobar tu prueba intermedia práctica.</p>
              
              {!pasoPrueba ? (
                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button onClick={() => registrarPruebaIntermedia('Si')} style={{ padding: '15px 30px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>✅ Sí, Aprobé</button>
                    <button onClick={() => setPasoPrueba('No')} style={{ padding: '15px 30px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>❌ No Aprobé</button>
                </div>
              ) : (
                <div style={{ textAlign: 'left', maxWidth: '400px', margin: '0 auto' }}>
                    <label style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '13px' }}>¿Qué sucedió o en qué fallaste?</label>
                    <textarea value={motivoFallo} onChange={e => setMotivoFallo(e.target.value)} style={{ width: '100%', padding: '10px', background: '#0f172a', color: '#fff', borderRadius: '8px', minHeight: '80px', marginTop: '10px', border: '1px solid #334155', boxSizing: 'border-box' }} placeholder="Desarrolla el motivo de la falla..."></textarea>
                    <button onClick={() => registrarPruebaIntermedia('No')} style={{ width: '100%', padding: '12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', marginTop: '15px', cursor: 'pointer' }}>Enviar Reporte a Base</button>
                </div>
              )}
          </div>
      )}

      {etapaActual === 'Induccion' && (
          <div>
            <div style={{ background: '#0284c7', padding: '15px', borderRadius: '12px', marginBottom: '20px', color: '#fff', boxShadow: '0 4px 10px rgba(2, 132, 199, 0.3)' }}>
                <strong>🔔 Notificaciones Activas:</strong> La app te alertará en tu celular para que registres tu avance diario.
            </div>
            
            <div style={{ background: '#1e293b', padding: '25px', borderRadius: '12px', border: '1px solid #334155', marginBottom: '20px' }}>
                <h3 style={{ marginTop: 0 }}>📚 Bitácora de Teoría (Semana de Inducción)</h3>
                
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px' }}>Tema cubierto el día de hoy:</label>
                <input type="text" value={temaInduccion} onChange={e => setTemaInduccion(e.target.value)} placeholder="Ej. Tiempos y Movimientos" style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#fff', marginBottom: '15px', boxSizing: 'border-box' }} />
                
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px' }}>Duración de la sesión (Minutos):</label>
                <input type="number" value={duracionInduccion} onChange={e => setDuracionInduccion(e.target.value)} placeholder="Ej. 60" style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#fff', marginBottom: '20px', boxSizing: 'border-box' }} />

                <button onClick={registrarAvanceInduccion} style={{ width: '100%', padding: '12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Guardar Avance del Día</button>
            </div>

            <button onClick={finalizarInduccion} style={{ width: '100%', padding: '15px', background: 'transparent', border: '1px solid #f59e0b', color: '#f59e0b', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                🏁 Terminé mi semana de Inducción, iniciar OPT
            </button>
          </div>
      )}

      {etapaActual === 'OPT' && (
        <>
            {mostrarModalActualizacion && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.95)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ background: '#1e293b', border: '1px solid #0284c7', borderRadius: '16px', padding: '30px', width: '90%', maxWidth: '400px' }}>
                        <h3 style={{ color: '#fff', marginTop: 0, textAlign: 'center' }}>Inician tus 8 Semanas OPT</h3>
                        <p style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', marginBottom: '20px' }}>Selecciona tu línea de mando corporativa.</p>
                        
                        <select value={formActualizacion.unidad_negocio} onChange={(e) => setFormActualizacion({...formActualizacion, unidad_negocio: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px', background: '#0f172a', color: 'white', border: '1px solid #334155' }}>
                            <option value="">-- Selecciona Unidad de Negocio --</option>
                            {catUnidades.map((u, i) => <option key={`un-${i}`} value={u.nombre}>{u.nombre}</option>)}
                        </select>
                        <select value={formActualizacion.gerente} onChange={(e) => setFormActualizacion({...formActualizacion, gerente: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px', background: '#0f172a', color: 'white', border: '1px solid #334155' }}>
                            <option value="">-- Selecciona Gerente --</option>
                            {catGerentes.map((g, i) => <option key={`ger-${i}`} value={g.nombre}>{g.nombre}</option>)}
                        </select>
                        <select value={formActualizacion.lider} onChange={(e) => setFormActualizacion({...formActualizacion, lider: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px', background: '#0f172a', color: 'white', border: '1px solid #334155' }}>
                            <option value="">-- Selecciona Líder Operativo --</option>
                            {catLideres.map((l, i) => <option key={`lid-${i}`} value={l.nombre}>{l.nombre}</option>)}
                        </select>
                        <select value={formActualizacion.tutor} onChange={(e) => setFormActualizacion({...formActualizacion, tutor: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '25px', borderRadius: '8px', background: '#0f172a', color: 'white', border: '1px solid #334155' }}>
                            <option value="">-- Selecciona Tutor OPT (Opcional) --</option>
                            {listaOPTs.map((t) => <option key={t.id} value={t.nombre_completo}>{t.nombre_completo}</option>)}
                        </select>

                        <button onClick={guardarActualizacionPerfil} style={{ width: '100%', padding: '14px', background: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Guardar e Iniciar Operación</button>
                        <p style={{ fontSize: '11px', color: '#64748b', textAlign: 'center', marginTop: '15px' }}>Nota: Si dejas el Tutor vacío, tu líder será notificado.</p>
                    </div>
                </div>
            )}

            <div style={{ background: '#1e293b', padding: '15px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #334155' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}>
                <span>Nivel de Desempeño: <strong>{xpInfo.nivel}</strong></span>
                <span>{xpInfo.progreso.toFixed(0)}%</span>
                </div>
                <div style={{ background: '#475569', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{ background: '#10b981', height: '100%', width: `${Math.min(xpInfo.progreso, 100)}%` }}></div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <button onClick={() => setActiveTab('operacion')} style={{ flex: 1, padding: '12px', borderRadius: '8px', background: activeTab === 'operacion' ? '#0284c7' : '#1e293b', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>📍 Operación</button>
                <button onClick={() => setActiveTab('avance')} style={{ flex: 1, padding: '12px', borderRadius: '8px', background: activeTab === 'avance' ? '#0284c7' : '#1e293b', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>🏆 8 Semanas</button>
                <button onClick={() => setActiveTab('academia')} style={{ flex: 1, padding: '12px', borderRadius: '8px', background: activeTab === 'academia' ? '#0284c7' : '#1e293b', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>📚 360 y PPTs</button>
            </div>

            {activeTab === 'operacion' && (
                <div style={{ animation: 'fadeIn 0.3s' }}>
                  <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
                    <h3 style={{ marginTop: 0, borderBottom: '1px solid #334155', paddingBottom: '10px' }}>1. Check-In GPS Diario</h3>
                    {!asistenciaEnviada ? (
                      <div>
                        <select value={manejaHoy} onChange={(e) => setManejaHoy(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', marginBottom: '10px', background: '#0f172a', color: '#fff', border: '1px solid #334155' }}><option value="SI">Sí manejo hoy</option><option value="NO">No voy a conducir</option></select>
                        {manejaHoy === 'NO' && <select value={actividadSinManejo} onChange={(e) => setActividadSinManejo(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', marginBottom: '10px', background: '#0f172a', color: '#fff', border: '1px solid #334155' }}><option value="Apoyo en Patio">Apoyo en Patio</option><option value="Teoría">Teoría</option><option value="Taller">Taller</option></select>}
                        <button onClick={marcarAsistencia} disabled={registrandoAsistencia} style={{ width: '100%', padding: '12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Validar Ubicación y Registrar Entrada</button>
                      </div>
                    ) : ( <div style={{ color: '#10b981', fontWeight: 'bold', textAlign: 'center', padding: '10px', background: 'rgba(16,185,129,0.1)', borderRadius: '8px' }}>✓ Asistencia Corporativa Registrada.</div> )}
                  </div>

                  <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px' }}>
                    <h3 style={{ marginTop: 0, borderBottom: '1px solid #334155', paddingBottom: '10px' }}>2. Control de Conducción</h3>
                    {estadoViaje === 'reposo' && <button onClick={() => setEstadoViaje('inicio')} style={{ width: '100%', padding: '12px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Nueva Bitácora de Viaje</button>}
                    
                    {estadoViaje === 'inicio' && (
                        <div>
                            <select value={optSeleccionado} onChange={(e) => setOptSeleccionado(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', marginBottom: '15px', background: '#0f172a', color: '#fff', border: '1px solid #334155' }}>
                                <option value="">¿Quién es tu tutor hoy?</option>
                                {listaOPTs.map(t => <option key={t.id} value={t.nombre_completo}>{t.nombre_completo}</option>)}
                            </select>
                            <input type="number" value={kmInicial} onChange={(e) => setKmInicial(e.target.value)} placeholder="Hodómetro Inicial en Tablero" style={{ width: '100%', padding: '10px', borderRadius: '6px', marginBottom: '15px', background: '#0f172a', color: '#fff', border: '1px solid #334155', boxSizing: 'border-box' }} />
                            <button onClick={iniciarRuta} style={{ width: '100%', padding: '12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Iniciar Ruta</button>
                        </div>
                    )}

                    {estadoViaje === 'progreso' && (
                        <div style={{ textAlign: 'center', padding: '10px 0' }}>
                            <p style={{ color: '#f59e0b', fontWeight: 'bold', marginBottom: '15px' }}>🚚 En Movimiento...</p>
                            <button onClick={() => setEstadoViaje('cierre')} style={{ width: '100%', padding: '12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Llegada a Destino (Cerrar Ruta)</button>
                        </div>
                    )}

                    {estadoViaje === 'cierre' && (
                        <div>
                            <input type="number" value={kmFinal} onChange={(e) => setKmFinal(e.target.value)} placeholder="Hodómetro Final" style={{ width: '100%', padding: '10px', borderRadius: '6px', marginBottom: '15px', background: '#0f172a', color: '#fff', border: '1px solid #334155', boxSizing: 'border-box' }} />
                            
                            <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px', color: '#f59e0b', fontWeight: 'bold' }}>📸 Subir Evidencia al Servidor (Obligatorio):</label>
                            <input type="file" accept="image/*" onChange={procesarFotoOdometro} style={{ marginBottom: '15px', display: 'block', width: '100%', color: '#94a3b8' }} />
                            {fotoPrevisualizacion && <img src={fotoPrevisualizacion} style={{ width: '100%', maxWidth: '250px', borderRadius: '6px', border: '1px solid #334155', marginBottom: '15px', display: 'block' }} alt="Evidencia" />}

                            <div style={{ background: '#0f172a', padding: '15px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #334155' }}>
                                <h4 style={{ margin: '0 0 10px 0', color: '#38bdf8' }}>Evaluación del Viaje</h4>
                                <select value={evalTrato} onChange={(e) => setEvalTrato(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#1e293b', color: '#fff', marginBottom: '10px', border: 'none' }}><option value="">Califica el trato del tutor...</option><option value="5">Excelente</option><option value="3">Regular</option><option value="1">Deficiente</option></select>
                                <select value={evalInstruccion} onChange={(e) => setEvalInstruccion(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#1e293b', color: '#fff', marginBottom: '10px', border: 'none' }}><option value="">Califica las instrucciones...</option><option value="5">Excelentes</option><option value="3">Regulares</option><option value="1">Deficientes</option></select>
                                <textarea value={comentarioOpt} onChange={(e) => setComentarioOpt(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#1e293b', color: '#fff', border: 'none', boxSizing: 'border-box' }} placeholder="Comentarios adicionales..."></textarea>
                            </div>
                            <button onClick={finalizarRuta} style={{ width: '100%', padding: '12px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Enviar Todo a Base de Datos</button>
                        </div>
                    )}
                  </div>
                </div>
            )}

            {activeTab === 'avance' && (
              <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', animation: 'fadeIn 0.3s' }}>
                <h3 style={{ marginTop: 0, borderBottom: '1px solid #334155', paddingBottom: '10px' }}>Avance Escalonado de Metas</h3>
                
                {/* BANNER DE VENCIMIENTO DE CERTIFICACIÓN */}
                {diasAtrasoCertificacion > 0 && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', padding: '15px', borderRadius: '8px', marginBottom: '20px', color: '#fca5a5' }}>
                    <h4 style={{ margin: '0 0 5px 0', color: '#ef4444' }}>⚠️ TIEMPO DE PRUEBA EXCEDIDO</h4>
                    <p style={{ margin: 0, fontSize: '13px' }}>Tus 8 semanas de operación han concluido. Tienes un atraso de <strong>{diasAtrasoCertificacion} días</strong> para finalizar tu certificación oficial. Contacta inmediatamente a tu Gerente ({usuarioActual?.gerente}) o Líder Asignado.</p>
                  </div>
                )}

                {metasUDAT.map((m, idx) => {
                  const kmEstaSemana = Math.min(kmRestantesVisuales, m.km);
                  kmRestantesVisuales = Math.max(0, kmRestantesVisuales - kmEstaSemana);
                  const pct = Math.min((kmEstaSemana / m.km) * 100, 100);
                  
                  return (
                    <div key={idx} style={{ marginBottom: '15px', background: '#0f172a', padding: '12px', borderRadius: '8px', border: pct >= 100 ? '1px solid #10b981' : '1px solid #334155' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '5px' }}>
                        <span style={{ fontWeight: 'bold', color: pct >= 100 ? '#10b981' : '#fff' }}>Semana {m.sem} (Meta: {m.km} KM)</span>
                        <span style={{ color: '#94a3b8' }}>{kmEstaSemana.toFixed(0)} KM ({pct.toFixed(0)}%)</span>
                      </div>
                      <div style={{ background: '#334155', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ background: pct >= 100 ? '#10b981' : '#38bdf8', height: '100%', width: `${pct}%`, transition: 'width 0.5s ease-in-out' }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'academia' && (
              <div style={{ animation: 'fadeIn 0.3s' }}>
                <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
                  <h3 style={{ marginTop: 0 }}>📚 Repositorio Corporativo</h3>
                  {materiales.length === 0 ? <p style={{ color: '#94a3b8', fontSize: '13px' }}>Aún no hay archivos de estudio disponibles.</p> : materiales.map(m => (
                    <div key={m.id} style={{ background: '#0f172a', padding: '15px', borderRadius: '8px', marginBottom: '10px', border: '1px solid #334155' }}>
                      <h4 style={{ margin: 0, color: '#38bdf8' }}>{m.titulo}</h4>
                      <p style={{ margin: '5px 0', fontSize: '13px', color: '#cbd5e1' }}>{m.descripcion}</p>
                      {m.url_documento_video && <a href={m.url_documento_video} target="_blank" rel="noreferrer" style={{ color: '#10b981', fontSize: '13px', textDecoration: 'none', fontWeight: 'bold', display: 'inline-block', marginTop: '5px' }}>🔗 Descargar PDF</a>}
                    </div>
                  ))}
                </div>

                <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px' }}>
                  <h3 style={{ marginTop: 0 }}>🗣️ Buzón de Evaluación 360 Anónimo</h3>
                  <select value={encuestaTipo} onChange={e => setEncuestaTipo(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', marginBottom: '15px', background: '#0f172a', color: '#fff', border: '1px solid #334155' }}>
                    <option value="">¿A quién vas a evaluar?</option>
                    <option value="LIDER">Líder Operativo</option>
                    <option value="GERENTE">Gerente de Unidad</option>
                    <option value="OPT">Tutor Técnico (OPT)</option>
                  </select>
                  
                  {encuestaTipo && (
                    <div style={{ animation: 'fadeIn 0.3s' }}>
                      <input type="text" value={encuestaNombre} onChange={e => setEncuestaNombre(e.target.value)} placeholder="Nombre de la persona evaluada..." style={{ width: '100%', padding: '12px', borderRadius: '8px', marginBottom: '15px', background: '#0f172a', color: '#fff', border: '1px solid #334155', boxSizing: 'border-box' }} />
                      <select value={encuestaEstrellas} onChange={e => setEncuestaEstrellas(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', marginBottom: '15px', background: '#0f172a', color: '#fff', border: '1px solid #334155' }}>
                        <option value="">Calificación General...</option>
                        <option value="5">⭐⭐⭐⭐⭐ Excelente</option>
                        <option value="3">⭐⭐⭐ Regular</option>
                        <option value="1">⭐ Deficiente / Problemático</option>
                      </select>
                      <textarea value={encuestaComentarios} onChange={e => setEncuestaComentarios(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#0f172a', color: '#fff', border: '1px solid #334155', minHeight: '100px', boxSizing: 'border-box' }} placeholder="Detalles de la incidencia (totalmente confidencial)..."></textarea>
                      <button onClick={enviarEncuesta} style={{ width: '100%', marginTop: '15px', padding: '14px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Enviar Reporte a Recursos Humanos</button>
                    </div>
                  )}
                </div>
              </div>
            )}
        </>
      )}
    </div>
  );
}