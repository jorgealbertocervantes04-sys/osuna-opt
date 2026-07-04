import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../../services/dataService';

export default function DashboardAlumno() {
  const navigate = useNavigate();
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [activeTab, setActiveTab] = useState('operacion');
  const [cargandoDatos, setCargandoDatos] = useState(true);
  
  // Datos desde Supabase
  const [viajes, setViajes] = useState([]);
  const [listaOPTs, setListaOPTs] = useState([]);
  const [materiales, setMateriales] = useState([]);
  
  // Catálogos Dinámicos
  const [catUnidades, setCatUnidades] = useState([]);
  const [catLideres, setCatLideres] = useState([]);
  const [catGerentes, setCatGerentes] = useState([]);

  // Modales y Estados de Candados
  const [mostrarModalActualizacion, setMostrarModalActualizacion] = useState(false);
  const [formActualizacion, setFormActualizacion] = useState({ unidad_negocio: '', lider: '', gerente: '' });
  const [mostrarModalExamen, setMostrarModalExamen] = useState(false);
  const [tiempoExamen, setTiempoExamen] = useState(600); // 10 minutos en segundos

  // Asistencia y Geolocalización
  const [manejaHoy, setManejaHoy] = useState('SI');
  const [actividadSinManejo, setActividadSinManejo] = useState('Apoyo en Patio');
  const [asistenciaEnviada, setAsistenciaEnviada] = useState(false);
  const [registrandoAsistencia, setRegistrandoAsistencia] = useState(false);

  // Bitácora de Viajes
  const [estadoViaje, setEstadoViaje] = useState('reposo');
  const [idViajeActivo, setIdViajeActivo] = useState(null);
  const [optSeleccionado, setOptSeleccionado] = useState('');
  const [kmInicial, setKmInicial] = useState('');
  const [kmFinal, setKmFinal] = useState('');
  const [fotoOdometro, setFotoOdometro] = useState(null);

  // Evaluación 360 Obligatoria de Tutor en bitácora
  const [evalTrato, setEvalTrato] = useState('');
  const [evalInstruccion, setEvalInstruccion] = useState('');
  const [comentarioOpt, setComentarioOpt] = useState('');

  // Buzón de opinión general (Líder / Gerente / OPT)
  const [encuestaTipo, setEncuestaTipo] = useState('');
  const [encuestaNombre, setEncuestaNombre] = useState('');
  const [encuestaEstrellas, setEncuestaEstrellas] = useState('');
  const [encuestaComentarios, setEncuestaComentarios] = useState('');

  const metasUDAT = [
    { sem: 1, km: 500, hrs: 10 },
    { sem: 2, km: 1500, hrs: 25 },
    { sem: 3, km: 2000, hrs: 28 },
    { sem: 4, km: 2400, hrs: 32 },
    { sem: 5, km: 2400, hrs: 32 },
    { sem: 6, km: 2400, hrs: 34 },
    { sem: 7, km: 2400, hrs: 34 },
    { sem: 8, km: 2400, hrs: 35 }
  ];

  useEffect(() => {
    const cargarTodo = async () => {
      const session = localStorage.getItem('udat_app_session');
      if (!session) return navigate('/app');
      
      const user = JSON.parse(session);
      setUsuarioActual(user);

      try {
        const [todosViajes, todosUsuarios, todosMateriales, catalogos] = await Promise.all([
          dataService.obtenerViajes(),
          dataService.obtenerUsuarios(),
          dataService.obtenerMaterialEstudio(),
          dataService.obtenerCatalogos()
        ]);

        const misViajes = todosViajes.filter(v => v.id_alumno === user.id);
        setViajes(misViajes);
        setListaOPTs(todosUsuarios.filter(u => u.rol === 'Tutor'));
        
        // Filtrar materiales dirigidos a Alumnos o Ambos
        const mtFiltrado = todosMateriales.filter(m => m.dirigido_a === 'Alumno' || m.dirigido_a === 'Ambos' || !m.dirigido_a);
        setMateriales(mtFiltrado);
        
        setCatUnidades(catalogos?.unidades || []);
        setCatLideres(catalogos?.lideres || []);
        setCatGerentes(catalogos?.gerentes || []);

        const fechaUltima = user.fecha_actualizacion_perfil ? new Date(user.fecha_actualizacion_perfil) : new Date(0);
        const diasTranscurridos = (new Date().getTime() - fechaUltima.getTime()) / (1000 * 60 * 60 * 24);

        if (!user.unidad_negocio || !user.lider || !user.gerente || diasTranscurridos >= 7) {
          setMostrarModalActualizacion(true);
        }

        const viajeAbierto = misViajes.find(v => v.hora_fin === null);
        if (viajeAbierto) {
          setIdViajeActivo(viajeAbierto.id);
          setEstadoViaje('progreso');
        }
      } catch (error) {
        console.error("Error cargando datos del alumno:", error);
      } finally {
        setCargandoDatos(false);
      }
    };

    cargarTodo();
  }, [navigate]);

  // Temporizador de Examen
  useEffect(() => {
    let timer;
    if (mostrarModalExamen && tiempoExamen > 0) {
      timer = setInterval(() => setTiempoExamen(prev => prev - 1), 1000);
    } else if (tiempoExamen === 0) {
      alert("Tiempo agotado. El examen se enviará automáticamente.");
      setMostrarModalExamen(false);
    }
    return () => clearInterval(timer);
  }, [mostrarModalExamen, tiempoExamen]);

  const marcarAsistencia = () => {
    if (!navigator.geolocation) {
      return alert("❌ Geolocalización no soportada.");
    }
    setRegistrandoAsistencia(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const payload = {
          id_usuario: usuarioActual.id,
          ubicacion_texto: `GPS: ${pos.coords.latitude}, ${pos.coords.longitude}`,
          latitud: pos.coords.latitude,
          longitud: pos.coords.longitude,
          actividad_sin_manejo: manejaHoy === 'NO' ? actividadSinManejo : null,
          fecha_hora: new Date().toISOString()
        };
        try {
          await dataService.registrarAsistencia(payload);
          setAsistenciaEnviada(true);
          alert("✓ Asistencia validada por GPS exitosamente.");
        } catch (err) {
          alert("Error: " + err.message);
        } finally {
          setRegistrandoAsistencia(false);
        }
      },
      () => {
        setRegistrandoAsistencia(false);
        alert("⛔ CANDADO: Es obligatorio activar el GPS para registrar asistencia.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const procesarFotoOdometro = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFotoOdometro(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const iniciarRuta = async () => {
    if (!asistenciaEnviada) return alert("⚠️ CANDADO: Primero debes registrar tu Asistencia Diaria con GPS.");
    if (!optSeleccionado || !kmInicial) return alert("Completa los campos obligatorios.");
    
    const payload = {
      id_alumno: usuarioActual.id,
      nombre_opt: optSeleccionado,
      km_iniciales: parseFloat(kmInicial),
      hora_inicio: new Date().toISOString()
    };
    const res = await dataService.guardarViaje(payload);
    if (res.exito && res.data?.[0]) {
      setIdViajeActivo(res.data[0].id);
      setEstadoViaje('progreso');
    }
  };

  const finalizarRuta = async () => {
    if (!kmFinal || !fotoOdometro || !evalTrato || !evalInstruccion) {
      return alert("⚠️ CANDADO ACTIVO: Foto de odómetro y evaluación del tutor son mandatorios.");
    }
    const viajeOriginal = viajes.find(v => v.id === idViajeActivo);
    const baseKm = viajeOriginal ? parseFloat(viajeOriginal.km_iniciales) : parseFloat(kmInicial);
    const kmRecorridos = parseFloat(kmFinal) - baseKm;

    if (kmRecorridos < 0) return alert("El conteo final no puede ser menor al inicial.");

    const mins = Math.floor((new Date().getTime() - new Date(viajeOriginal.hora_inicio).getTime()) / 60000);

    const payload = {
      hora_fin: new Date().toISOString(),
      km_finales: parseFloat(kmFinal),
      km_recorridos: kmRecorridos,
      tiempo_total_minutos: mins,
      notas_novedad: comentarioOpt,
      opt_calif_trato: parseInt(evalTrato),
      opt_calif_instruccion: parseInt(evalInstruccion),
      foto_odometro: fotoOdometro
    };

    const res = await dataService.guardarViaje(payload, idViajeActivo);
    if (res.exito) {
      alert("✓ Reporte enviado a validación del Tutor.");
      setEstadoViaje('reposo');
      setIdViajeActivo(null);
      setFotoOdometro(null);
      // Recargar bitácora
      const todos = await dataService.obtenerViajes();
      setViajes(todos.filter(v => v.id_alumno === usuarioActual.id));
    }
  };

  const enviarEncuesta = async () => {
    if (!encuestaTipo || !encuestaNombre || !encuestaEstrellas || !encuestaComentarios) {
      return alert("Por favor, llena toda la evaluación 360.");
    }
    const payload = {
      id_alumno: usuarioActual.id,
      nombre_alumno: usuarioActual.nombre_completo,
      tipo_evaluado: encuestaTipo, // 'LIDER', 'GERENTE', o 'OPT'
      nombre_evaluado: encuestaNombre,
      calificacion_general: parseInt(encuestaEstrellas),
      comentarios: encuestaComentarios,
      fecha_creacion: new Date().toISOString()
    };
    const res = await dataService.guardarEncuesta(payload);
    if (res.exito) {
      alert(`✓ Evaluación corporativa para el ${encuestaTipo} enviada.`);
      setEncuestaTipo(''); setEncuestaNombre(''); setEncuestaEstrellas(''); setEncuestaComentarios('');
    }
  };

  const kmTotales = viajes.reduce((acc, v) => acc + (parseFloat(v.km_recorridos) || 0), 0);
  const calcularNivelXP = (km) => {
    if (km >= 4000) return { nivel: 'Experto', progreso: 100 };
    if (km >= 1500) return { nivel: 'Intermedio', progreso: Math.min(((km - 1500) / 2500) * 100, 100) };
    return { nivel: 'Novato', progreso: (km / 1500) * 100 };
  };
  const xpInfo = calcularNivelXP(kmTotales);

  if (cargandoDatos) return <div style={{color: '#fff', textAlign: 'center', padding: '50px'}}>Sincronizando Sistema Cardex Corporativo...</div>;

  return (
    <div style={{ padding: '20px', color: '#e2e8f0', fontFamily: 'system-ui' }}>
      
      {/* CABECERA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '15px', marginBottom: '20px' }}>
        <div>
          <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 'bold' }}>PORTAL ALUMNO LARMEX</span>
          <h2 style={{ margin: 0, color: '#f8fafc' }}>{usuarioActual?.nombre_completo}</h2>
          <span style={{ fontSize: '13px', color: '#a1a1aa' }}>Rango UDAT: <strong>{xpInfo.nivel} ({kmTotales} KM Totales)</strong></span>
        </div>
        <button onClick={() => { localStorage.removeItem('udat_app_session'); navigate('/app'); }} style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '8px', padding: '5px 15px', cursor: 'pointer' }}>Salir</button>
      </div>

      {/* GAMIFICACIÓN DE XP */}
      <div style={{ background: '#1e293b', padding: '15px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #334155' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}>
          <span>Progreso de Nivel de Competencia</span>
          <span>{xpInfo.progreso.toFixed(0)}% para el siguiente rango</span>
        </div>
        <div style={{ background: '#475569', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
          <div style={{ background: '#10b981', height: '100%', width: `${xpInfo.progreso}%`, transition: 'width 0.5s' }}></div>
        </div>
      </div>

      {/* NAVEGACIÓN */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => setActiveTab('operacion')} style={{ flex: 1, padding: '12px', borderRadius: '8px', background: activeTab === 'operacion' ? '#0284c7' : '#1e293b', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>📍 Operación y Bitácora</button>
        <button onClick={() => setActiveTab('avance')} style={{ flex: 1, padding: '12px', borderRadius: '8px', background: activeTab === 'avance' ? '#0284c7' : '#1e293b', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>🏆 Mis 8 Semanas</button>
        <button onClick={() => setActiveTab('academia')} style={{ flex: 1, padding: '12px', borderRadius: '8px', background: activeTab === 'academia' ? '#0284c7' : '#1e293b', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>📚 Aula Virtual e Inconformidades</button>
      </div>

      {/* PESTAÑA 1: OPERACIÓN */}
      {activeTab === 'operacion' && (
        <div>
          {/* Asistencia Candado */}
          <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
            <h3 style={{ marginTop: 0, borderBottom: '1px solid #334155', paddingBottom: '10px' }}>1. Check-In de Asistencia Diario</h3>
            {!asistenciaEnviada ? (
              <div>
                <select value={manejaHoy} onChange={(e) => setManejaHoy(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', marginBottom: '10px', background: '#0f172a', color: '#fff' }}>
                  <option value="SI">Sí salgo a ruta el día de hoy</option>
                  <option value="NO">No voy a conducir hoy (Actividad interna)</option>
                </select>
                {manejaHoy === 'NO' && (
                  <select value={actividadSinManejo} onChange={(e) => setActividadSinManejo(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', marginBottom: '10px', background: '#0f172a', color: '#fff' }}>
                    <option value="Apoyo en Patio">Apoyo en Patio</option>
                    <option value="Teoría / Capacitación">Teoría / Capacitación</option>
                    <option value="Unidad en Taller">Unidad en Taller</option>
                  </select>
                )}
                <button onClick={marcarAsistencia} disabled={registrandoAsistencia} style={{ width: '100%', padding: '12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  {registrandoAsistencia ? 'Sincronizando GPS...' : 'Verificar Ubicación y Registrar Entrada'}
                </button>
              </div>
            ) : (
              <div style={{ color: '#10b981', fontWeight: 'bold', textAlign: 'center' }}>✓ Asistencia registrada corporativamente hoy.</div>
            )}
          </div>

          {/* Bitácora de Viajes */}
          <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px' }}>
            <h3 style={{ marginTop: 0, borderBottom: '1px solid #334155', paddingBottom: '10px' }}>2. Control de Hodómetros</h3>
            {estadoViaje === 'reposo' && (
              <button onClick={() => setEstadoViaje('inicio')} style={{ width: '100%', padding: '12px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Abrir Nueva Bitácora de Conducción</button>
            )}

            {estadoViaje === 'inicio' && (
              <div>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px' }}>Tutor en Cabina:</label>
                <select value={optSeleccionado} onChange={(e) => setOptSeleccionado(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', marginBottom: '15px', background: '#0f172a', color: '#fff' }}>
                  <option value="">Selecciona tu Tutor...</option>
                  {listaOPTs.map(t => <option key={t.id} value={t.nombre_completo}>{t.nombre_completo}</option>)}
                </select>

                <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px' }}>Hodómetro Inicial (Lectura en Tablero):</label>
                <input type="number" value={kmInicial} onChange={(e) => setKmInicial(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', marginBottom: '15px', background: '#0f172a', color: '#fff', border: '1px solid #334155' }} placeholder="Ej. 245100" />

                <button onClick={iniciarRuta} style={{ width: '100%', padding: '12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Iniciar Cronómetro de Conducción</button>
              </div>
            )}

            {estadoViaje === 'progreso' && (
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: '#f59e0b', fontWeight: 'bold' }}>🚚 Unidad en Movimiento: Captura de datos bloqueada hasta destino.</p>
                <button onClick={() => setEstadoViaje('cierre')} style={{ width: '100%', padding: '12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Llegada a Destino (Cerrar Ruta)</button>
              </div>
            )}

            {estadoViaje === 'cierre' && (
              <div>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px' }}>Hodómetro Final:</label>
                <input type="number" value={kmFinal} onChange={(e) => setKmFinal(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', marginBottom: '15px', background: '#0f172a', color: '#fff', border: '1px solid #334155' }} />

                <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px', color: '#f59e0b' }}>📸 Foto Evidencia Odómetro (Obligatorio):</label>
                <input type="file" accept="image/*" onChange={procesarFotoOdometro} style={{ marginBottom: '15px', display: 'block' }} />
                {fotoOdometro && <img src={fotoOdometro} style={{ width: '150px', borderRadius: '6px', marginBottom: '15px', display: 'block' }} alt="Evidencia" />}

                {/* Evaluación del Tutor integrada sin perder datos */}
                <div style={{ background: '#0f172a', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#38bdf8' }}>Evaluación del OPT en este Viaje</h4>
                  <label style={{ fontSize: '12px' }}>Trato recibido:</label>
                  <select value={evalTrato} onChange={(e) => setEvalTrato(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#1e293b', color: '#fff', marginBottom: '10px' }}>
                    <option value="">Selecciona...</option>
                    <option value="5">Excelente</option>
                    <option value="3">Regular</option>
                    <option value="1">Deficiente</option>
                  </select>
                  <label style={{ fontSize: '12px' }}>Claridad técnica en las instrucciones:</label>
                  <select value={evalInstruccion} onChange={(e) => setEvalInstruccion(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#1e293b', color: '#fff', marginBottom: '10px' }}>
                    <option value="">Selecciona...</option>
                    <option value="5">Excelente</option>
                    <option value="3">Regular</option>
                    <option value="1">Deficiente</option>
                  </select>
                  <textarea value={comentarioOpt} onChange={(e) => setComentarioOpt(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#1e293b', color: '#fff' }} placeholder="Comentarios adicionales sobre el desempeño del tutor..."></textarea>
                </div>

                <button onClick={finalizarRuta} style={{ width: '100%', padding: '12px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Enviar Reporte Final a Bóveda</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PESTAÑA 2: AVANCE DE LAS 8 SEMANAS */}
      {activeTab === 'avance' && (
        <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px' }}>
          <h3>Avance Escalonado de Metas</h3>
          {metasUDAT.map((m, idx) => {
            const acumuladoSemana = viajes.slice(0, idx + 1).reduce((s, v) => s + (v.km_recorridos || 0), 0);
            const pct = Math.min((acumuladoSemana / m.km) * 100, 100);
            return (
              <div key={idx} style={{ marginBottom: '15px', background: '#0f172a', padding: '12px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '5px' }}>
                  <span>Semana {m.sem} (Meta: {m.km} KM)</span>
                  <span>{acumuladoSemana} KM logrados ({pct.toFixed(0)}%)</span>
                </div>
                <div style={{ background: '#334155', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ background: pct >= 100 ? '#10b981' : '#38bdf8', height: '100%', width: `${pct}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PESTAÑA 3: ACADEMIA Y EVALUACIÓN DE LÍDERES/GERENTES */}
      {activeTab === 'academia' && (
        <div>
          <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
            <h3>📚 Repositorio Corporativo y Material</h3>
            {materiales.map(m => (
              <div key={m.id} style={{ background: '#0f172a', padding: '12px', borderRadius: '8px', marginBottom: '10px' }}>
                <h4 style={{ margin: 0, color: '#38bdf8' }}>{m.titulo}</h4>
                <p style={{ margin: '5px 0', fontSize: '13px', color: '#cbd5e1' }}>{m.descripcion}</p>
                {m.url_documento_video && <a href={m.url_documento_video} target="_blank" rel="noreferrer" style={{ color: '#10b981', fontSize: '13px', textDecoration: 'none', fontWeight: 'bold' }}>🔗 Descargar Diapositivas / PDF</a>}
              </div>
            ))}
            <button onClick={() => { setMostrarModalExamen(true); setTiempoExamen(600); }} style={{ width: '100%', marginTop: '15px', padding: '12px', background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>📝 Iniciar Examen Teórico Semanal</button>
          </div>

          {/* BUZÓN DE OPINIÓN 360 OBLIGATORIO (SIN BORRAR NADA) */}
          <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px' }}>
            <h3>🗣️ Buzón de Evaluación Confidencial (360)</h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '-10px', marginBottom: '15px' }}>Usa este espacio para evaluar a tus superiores. Tus reportes alimentan de manera anónima el panel de incidencias de administración.</p>
            
            <select value={encuestaTipo} onChange={e => setEncuestaTipo(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', marginBottom: '10px', background: '#0f172a', color: '#fff' }}>
              <option value="">¿A quién vas a evaluar?</option>
              <option value="LIDER">Líder Operativo</option>
              <option value="GERENTE">Gerente de Unidad</option>
              <option value="OPT">Tutor Técnico (OPT)</option>
            </select>

            {encuestaTipo && (
              <div>
                <input type="text" value={encuestaNombre} onChange={e => setEncuestaNombre(e.target.value)} placeholder="Nombre de la persona..." style={{ width: '100%', padding: '10px', borderRadius: '6px', marginBottom: '10px', background: '#0f172a', color: '#fff', border: '1px solid #334155' }} />
                <select value={encuestaEstrellas} onChange={e => setEncuestaEstrellas(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', marginBottom: '10px', background: '#0f172a', color: '#fff' }}>
                  <option value="">Calificación General...</option>
                  <option value="5">⭐⭐⭐⭐⭐ Excelente trato</option>
                  <option value="3">⭐⭐⭐ Regular / Neutral</option>
                  <option value="1">⭐ Deficiente / Reportar Actitud</option>
                </select>
                <textarea value={encuestaComentarios} onChange={e => setEncuestaComentarios(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#0f172a', color: '#fff', minHeight: '8px' }} placeholder="Describe detalladamente situaciones de abuso de autoridad, faltas de respeto o mala coordinación..."></textarea>
                <button onClick={enviarEncuesta} style={{ width: '100%', marginTop: '10px', padding: '12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Emitir Reporte de Incidencia</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* EXAMEN INTERACTIVO MODAL */}
      {mostrarModalExamen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.95)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1e293b', padding: '30px', borderRadius: '16px', maxWidth: '500px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '10px', marginBottom: '15px' }}>
              <h3 style={{ margin: 0 }}>Examen Teórico - Seguridad Vial</h3>
              <span style={{ color: '#ef4444', fontWeight: 'bold' }}>⏱️ {Math.floor(tiempoExamen / 60)}:{(tiempoExamen % 60).toString().padStart(2, '0')}</span>
            </div>
            <p><strong>Pregunta 1:</strong> ¿Cuál es el rango óptimo de revoluciones por minuto (RPM) en un motor diésel acoplado para conducción económica en LARMEX?</p>
            <label style={{ display: 'block', margin: '10px 0' }}><input type="radio" name="p1" /> a) 1100 a 1400 RPM</label>
            <label style={{ display: 'block', margin: '10px 0' }}><input type="radio" name="p1" /> b) 1800 a 2200 RPM</label>
            <button onClick={() => { alert("✓ Examen guardado en Cardex."); setMostrarModalExamen(false); }} style={{ width: '100%', marginTop: '20px', padding: '12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Concluir y Guardar Evaluación</button>
          </div>
        </div>
      )}
    </div>
  );
}