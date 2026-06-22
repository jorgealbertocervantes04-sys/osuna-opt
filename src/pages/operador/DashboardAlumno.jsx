import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../../services/dataService';

export default function DashboardAlumno() {
  const navigate = useNavigate();
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [activeTab, setActiveTab] = useState('operacion');
  const [cargandoDatos, setCargandoDatos] = useState(true);
  
  // Datos reales desde Supabase
  const [viajes, setViajes] = useState([]);
  const [listaOPTs, setListaOPTs] = useState([]);
  const [materiales, setMateriales] = useState([]);
  
  // Estados para Asistencia
  const [manejaHoy, setManejaHoy] = useState('SI');
  const [actividadSinManejo, setActividadSinManejo] = useState('Apoyo en Patio');
  const [asistenciaEnviada, setAsistenciaEnviada] = useState(false);

  // Estados para Viajes (Bitácora)
  const [estadoViaje, setEstadoViaje] = useState('reposo'); // reposo | inicio | progreso | cierre
  const [idViajeActivo, setIdViajeActivo] = useState(null);
  
  // Formularios de Viajes
  const [optSeleccionado, setOptSeleccionado] = useState('');
  const [optManual, setOptManual] = useState('');
  const [kmInicial, setKmInicial] = useState('');
  const [kmFinal, setKmFinal] = useState('');
  const [evalTrato, setEvalTrato] = useState('');
  const [evalInstruccion, setEvalInstruccion] = useState('');
  const [comentarioOpt, setComentarioOpt] = useState('');

  // Formularios de Encuestas
  const [encuestaTipo, setEncuestaTipo] = useState('');
  const [encuestaNombre, setEncuestaNombre] = useState('');
  const [encuestaEstrellas, setEncuestaEstrellas] = useState('');
  const [encuestaComentarios, setEncuestaComentarios] = useState('');

  const metasUDAT = [
    { sem: 1, km: 500, hrs: 10 }, { sem: 2, km: 1500, hrs: 25 },
    { sem: 3, km: 2000, hrs: 28 }, { sem: 4, km: 2400, hrs: 32 },
    { sem: 5, km: 2400, hrs: 32 }, { sem: 6, km: 2400, hrs: 34 },
    { sem: 7, km: 2400, hrs: 34 }, { sem: 8, km: 2400, hrs: 35 }
  ];

  // 1. CARGAR SESIÓN Y DATOS AL INICIAR
  useEffect(() => {
    const cargarTodo = async () => {
      const session = localStorage.getItem('udat_app_session');
      if (!session) {
        navigate('/app');
        return;
      }
      
      const user = JSON.parse(session);
      setUsuarioActual(user);

      // Traer todos los datos en paralelo
      const [todosViajes, todosUsuarios, todosMateriales] = await Promise.all([
        dataService.obtenerViajes(),
        dataService.obtenerUsuarios(),
        dataService.obtenerMaterialEstudio()
      ]);

      // Filtrar solo los viajes de este alumno
      const misViajes = todosViajes.filter(v => v.id_alumno === user.id);
      setViajes(misViajes);
      
      // Filtrar a los tutores para el menú desplegable
      setListaOPTs(todosUsuarios.filter(u => u.rol === 'Tutor'));
      setMateriales(todosMateriales);

      // Revisar si el alumno dejó un viaje abierto
      const viajeAbierto = misViajes.find(v => v.hora_fin === null);
      if (viajeAbierto) {
        setIdViajeActivo(viajeAbierto.id);
        setEstadoViaje('progreso');
      }

      setCargandoDatos(false);
    };

    cargarTodo();
  }, [navigate]);

  // 2. FUNCIONES DE ASISTENCIA
  const marcarAsistencia = async () => {
    const payload = {
      id_usuario: usuarioActual.id,
      ubicacion_texto: "Registro Web / App",
      actividad_sin_manejo: manejaHoy === 'NO' ? actividadSinManejo : null,
      fecha_hora: new Date().toISOString()
    };
    
    await dataService.registrarAsistencia(payload);
    setAsistenciaEnviada(true);
    alert("✓ Asistencia registrada corporativamente.");
  };

  // 3. FUNCIONES DE VIAJE
  const iniciarRuta = async () => {
    const tutorFinal = optSeleccionado === 'OTRO' ? optManual : optSeleccionado;
    
    if (!tutorFinal || !kmInicial) return alert("Selecciona tutor y kilometraje inicial.");
    if (parseFloat(kmInicial) < 0) return alert("Kilómetros inválidos.");

    const payload = {
      id_alumno: usuarioActual.id,
      nombre_opt: tutorFinal,
      km_iniciales: parseFloat(kmInicial),
      hora_inicio: new Date().toISOString()
    };

    const { exito, data, error } = await dataService.guardarViaje(payload);
    
    if (exito && data && data.length > 0) {
      setIdViajeActivo(data[0].id);
      setEstadoViaje('progreso');
    } else {
      alert("Error iniciando ruta: " + error?.message);
    }
  };

  const finalizarRuta = async () => {
    if (!kmFinal) return alert("Captura el Odómetro Final.");
    
    const viajeOriginal = viajes.find(v => v.id === idViajeActivo);
    const kmRecorridos = parseFloat(kmFinal) - (viajeOriginal?.km_iniciales || parseFloat(kmInicial));
    
    if (kmRecorridos < 0) return alert("El odómetro final no puede ser menor al inicial.");

    const horaFin = new Date();
    const horaInicioObj = viajeOriginal ? new Date(viajeOriginal.hora_inicio) : new Date();
    const tiempoMinutos = Math.floor((horaFin - horaInicioObj) / 60000);

    const payload = {
      hora_fin: horaFin.toISOString(),
      km_finales: parseFloat(kmFinal),
      km_recorridos: kmRecorridos,
      tiempo_total_minutos: tiempoMinutos,
      notas_novedad: `Tiempo: ${tiempoMinutos} min. ${comentarioOpt}`,
      opt_calif_trato: evalTrato ? parseInt(evalTrato) : null,
      opt_calif_instruccion: evalInstruccion ? parseInt(evalInstruccion) : null
    };

    const { exito, error } = await dataService.guardarViaje(payload, idViajeActivo);

    if (exito) {
      alert(`✓ ¡Reporte Enviado!\nRecorriste: ${kmRecorridos} KM\nTiempo: ${tiempoMinutos} min.`);
      setEstadoViaje('reposo');
      setIdViajeActivo(null);
      setKmInicial(''); setKmFinal(''); setEvalTrato(''); setEvalInstruccion(''); setComentarioOpt('');
      
      // Recargar viajes para actualizar la barra de progreso
      const data = await dataService.obtenerViajes();
      setViajes(data.filter(v => v.id_alumno === usuarioActual.id));
    } else {
      alert("Error al cerrar ruta: " + error?.message);
    }
  };

  // 4. FUNCIONES DE ENCUESTA
  const enviarEncuesta = async () => {
    if (!encuestaTipo || !encuestaNombre || !encuestaEstrellas || !encuestaComentarios) {
      return alert("Llena todos los campos de la encuesta.");
    }

    const payload = {
      id_alumno: usuarioActual.id,
      nombre_alumno: usuarioActual.nombre_completo,
      tipo_evaluado: encuestaTipo,
      nombre_evaluado: encuestaNombre,
      calificacion_general: parseInt(encuestaEstrellas),
      comentarios: encuestaComentarios,
      fecha_creacion: new Date().toISOString()
    };

    const { exito, error } = await dataService.guardarEncuesta(payload);
    
    if (exito) {
      alert("✓ ¡Gracias! Tu opinión fue enviada a corporativo.");
      setEncuestaTipo(''); setEncuestaNombre(''); setEncuestaEstrellas(''); setEncuestaComentarios('');
    } else {
      alert("Error: " + error?.message);
    }
  };

  // 5. CÁLCULOS DE RENDIMIENTO (METAS)
  const kmTotalesAcumulados = viajes.reduce((acc, v) => acc + (parseFloat(v.km_recorridos) || 0), 0);
  let kmRestantesCalculo = kmTotalesAcumulados;

  if (cargandoDatos) return <div style={{ color: 'white', textAlign: 'center', padding: '50px' }}>Sincronizando con base de datos...</div>;

  return (
    <div className="seccion activa" style={{ animation: 'fadeIn 0.4s ease' }}>
      
      {/* CABECERA Y BOTÓN DE CLAVE */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '15px' }}>
        <div style={{ textAlign: 'left' }}>
          <p style={{ fontSize: '11px', color: 'var(--primary)', margin: 0, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '1px' }}>Operador en Ruta</p>
          <p style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-light)', margin: '2px 0 0 0' }}>{usuarioActual?.nombre_completo}</p>
        </div>
        <button 
          onClick={() => { localStorage.removeItem('udat_app_session'); navigate('/app'); }} 
          style={{ background: 'transparent', border: '1px solid var(--border-color)', color: '#fda4af', width: 'auto', padding: '8px 12px', fontSize: '12px', margin: 0, fontWeight: 700, borderRadius: '8px', cursor: 'pointer' }}
        >
          Cerrar Sesión
        </button>
      </div>
      
      {/* PESTAÑAS (TABS) */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '10px' }}>
        <button onClick={() => setActiveTab('operacion')} style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', background: activeTab === 'operacion' ? 'var(--primary)' : 'rgba(0,0,0,0.3)', color: activeTab === 'operacion' ? 'white' : 'var(--text-muted)', border: activeTab === 'operacion' ? '1px solid var(--primary)' : '1px solid var(--border-color)', boxShadow: activeTab === 'operacion' ? '0 4px 12px var(--primary-glow)' : 'none' }}>📍 Operación</button>
        <button onClick={() => setActiveTab('avance')} style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', background: activeTab === 'avance' ? 'var(--primary)' : 'rgba(0,0,0,0.3)', color: activeTab === 'avance' ? 'white' : 'var(--text-muted)', border: activeTab === 'avance' ? '1px solid var(--primary)' : '1px solid var(--border-color)', boxShadow: activeTab === 'avance' ? '0 4px 12px var(--primary-glow)' : 'none' }}>🏆 Mis Logros</button>
        <button onClick={() => setActiveTab('estudio')} style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', background: activeTab === 'estudio' ? 'var(--primary)' : 'rgba(0,0,0,0.3)', color: activeTab === 'estudio' ? 'white' : 'var(--text-muted)', border: activeTab === 'estudio' ? '1px solid var(--primary)' : '1px solid var(--border-color)', boxShadow: activeTab === 'estudio' ? '0 4px 12px var(--primary-glow)' : 'none' }}>📚 Academia</button>
      </div>

      {/* CONTENIDO PESTAÑA 1: OPERACIÓN */}
      {activeTab === 'operacion' && (
        <div style={{ animation: 'slideUp 0.4s ease' }}>
          
          {/* Asistencia Diaria */}
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '22px', marginBottom: '22px', textAlign: 'left' }}>
            <h4 style={{ marginTop: 0, color: 'var(--text-light)', marginBottom: '15px', fontSize: '16px', fontWeight: 800, borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>📍 Asistencia Diaria</h4>
            {!asistenciaEnviada ? (
              <div>
                <select value={manejaHoy} onChange={(e) => setManejaHoy(e.target.value)} style={{ width: '100%', padding: '14px 18px', marginBottom: '20px', border: '1px solid var(--border-color)', borderRadius: '12px', backgroundColor: 'rgba(0,0,0,0.3)', color: 'var(--text-light)', fontSize: '15px' }}>
                  <option value="SI">Sí salgo a ruta / manejo hoy</option>
                  <option value="NO">No voy a conducir el día de hoy</option>
                </select>
                {manejaHoy === 'NO' && (
                  <select value={actividadSinManejo} onChange={(e) => setActividadSinManejo(e.target.value)} style={{ width: '100%', padding: '14px 18px', marginBottom: '20px', border: '1px solid var(--border-color)', borderRadius: '12px', backgroundColor: 'rgba(0,0,0,0.3)', color: 'var(--text-light)', fontSize: '15px' }}>
                    <option value="Apoyo en Patio">Apoyo en Patio</option>
                    <option value="Teoría / Capacitación">Teoría / Capacitación</option>
                    <option value="Viaje como Acompañante">Viaje como Acompañante</option>
                    <option value="Unidad en Taller">Unidad en Taller</option>
                  </select>
                )}
                <button onClick={marcarAsistencia} style={{ width: '100%', padding: '16px', background: 'var(--success)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}>
                  Registrar Entrada (GPS)
                </button>
              </div>
            ) : (
              <p style={{ color: 'var(--success)', fontWeight: 700, margin: '5px 0', fontSize: '14px', textAlign: 'center' }}>✓ Asistencia enviada.</p>
            )}
          </div>

          {/* Bitácora de Kilómetros */}
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '22px', marginBottom: '22px', textAlign: 'left' }}>
            <h4 style={{ marginTop: 0, color: 'var(--text-light)', marginBottom: '15px', fontSize: '16px', fontWeight: 800, borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>📊 Bitácora de Kilómetros</h4>
            
            {estadoViaje === 'reposo' && (
              <button onClick={() => setEstadoViaje('inicio')} style={{ width: '100%', padding: '16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 15px var(--primary-glow)' }}>
                Abrir Conteo de Bitácora
              </button>
            )}

            {estadoViaje === 'inicio' && (
              <div style={{ marginTop: '15px', borderTop: '1px solid var(--border-color)', paddingTop: '15px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Tutor (OPT) en cabina:</label>
                <select value={optSeleccionado} onChange={(e) => setOptSeleccionado(e.target.value)} style={{ width: '100%', padding: '14px 18px', marginBottom: '10px', border: '1px solid var(--border-color)', borderRadius: '12px', backgroundColor: 'rgba(0,0,0,0.3)', color: 'var(--text-light)' }}>
                  <option value="">Selecciona tu Tutor...</option>
                  {listaOPTs.map(t => <option key={t.id} value={t.nombre_completo}>{t.nombre_completo}</option>)}
                  <option value="OTRO">⭐ Otro (Escribir manual)</option>
                </select>
                
                {optSeleccionado === 'OTRO' && (
                  <input type="text" placeholder="Nombre del OPT" value={optManual} onChange={(e) => setOptManual(e.target.value)} style={{ width: '100%', padding: '14px 18px', marginBottom: '10px', border: '1px solid var(--border-color)', borderRadius: '12px', backgroundColor: 'rgba(0,0,0,0.3)', color: 'var(--text-light)', boxSizing: 'border-box' }} />
                )}

                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', marginTop: '10px' }}>Odómetro Inicial (KM):</label>
                <input type="number" value={kmInicial} onChange={(e) => setKmInicial(e.target.value)} placeholder="Ej. 120500" style={{ width: '100%', padding: '14px 18px', marginBottom: '20px', border: '1px solid var(--border-color)', borderRadius: '12px', backgroundColor: 'rgba(0,0,0,0.3)', color: 'var(--text-light)', boxSizing: 'border-box' }} />
                
                <button onClick={iniciarRuta} style={{ width: '100%', padding: '16px', background: 'var(--success)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 700, cursor: 'pointer', marginBottom: '10px' }}>
                  Comenzar Ruta
                </button>
                <button onClick={() => setEstadoViaje('reposo')} style={{ width: '100%', padding: '16px', background: 'transparent', color: 'var(--text-light)', border: '1px solid var(--border-color)', borderRadius: '12px', fontSize: '16px', fontWeight: 700, cursor: 'pointer' }}>
                  Cancelar
                </button>
              </div>
            )}

            {estadoViaje === 'progreso' && (
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '15px', margin: '15px 0' }}>🚚 Conducción Activa...</p>
                <button onClick={() => setEstadoViaje('cierre')} style={{ width: '100%', padding: '16px', background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(244, 63, 94, 0.3)' }}>
                  Cerrar Ruta / Registrar KM
                </button>
              </div>
            )}

            {estadoViaje === 'cierre' && (
              <div style={{ marginTop: '15px', borderTop: '1px solid var(--border-color)', paddingTop: '15px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Odómetro Final (KM):</label>
                <input type="number" value={kmFinal} onChange={(e) => setKmFinal(e.target.value)} placeholder="Debe ser mayor al inicial" style={{ width: '100%', padding: '14px 18px', marginBottom: '20px', border: '1px solid var(--border-color)', borderRadius: '12px', backgroundColor: 'rgba(0,0,0,0.3)', color: 'var(--text-light)', boxSizing: 'border-box' }} />
                
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '12px', margin: '20px 0', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ marginTop: 0, color: 'var(--primary)', fontSize: '14px', textAlign: 'center', border: 'none' }}>⭐ Evalúa a tu Tutor (Opcional)</h4>
                  
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Trato y Profesionalismo:</label>
                  <select value={evalTrato} onChange={(e) => setEvalTrato(e.target.value)} style={{ width: '100%', padding: '14px 18px', marginBottom: '15px', border: '1px solid var(--border-color)', borderRadius: '12px', backgroundColor: 'rgba(0,0,0,0.5)', color: 'var(--text-light)' }}>
                    <option value="">Omitir calificación...</option><option value="5">⭐⭐⭐⭐⭐ - Excelente</option><option value="4">⭐⭐⭐⭐ - Bueno</option><option value="3">⭐⭐⭐ - Regular</option><option value="2">⭐⭐ - Deficiente</option><option value="1">⭐ - Malo</option>
                  </select>

                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Claridad de Instrucción:</label>
                  <select value={evalInstruccion} onChange={(e) => setEvalInstruccion(e.target.value)} style={{ width: '100%', padding: '14px 18px', marginBottom: '15px', border: '1px solid var(--border-color)', borderRadius: '12px', backgroundColor: 'rgba(0,0,0,0.5)', color: 'var(--text-light)' }}>
                    <option value="">Omitir calificación...</option><option value="5">⭐⭐⭐⭐⭐ - Excelente</option><option value="4">⭐⭐⭐⭐ - Bueno</option><option value="3">⭐⭐⭐ - Regular</option><option value="2">⭐⭐ - Deficiente</option><option value="1">⭐ - Malo</option>
                  </select>
                </div>

                <button onClick={finalizarRuta} style={{ width: '100%', padding: '16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 700, cursor: 'pointer', marginBottom: '10px', boxShadow: '0 4px 15px var(--primary-glow)' }}>
                  Enviar Reporte a Base
                </button>
                <button onClick={() => setEstadoViaje('progreso')} style={{ width: '100%', padding: '16px', background: 'transparent', color: 'var(--text-light)', border: '1px solid var(--border-color)', borderRadius: '12px', fontSize: '16px', fontWeight: 700, cursor: 'pointer' }}>
                  Cancelar Cierre
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONTENIDO PESTAÑA 2: LOGROS */}
      {activeTab === 'avance' && (
        <div style={{ animation: 'slideUp 0.4s ease' }}>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '22px', marginBottom: '22px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '15px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <h4 style={{ margin: 0 }}>🏆 Mis Metas Oficiales</h4>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>RECORRIDO ACTUAL</span>
                <span style={{ fontSize: '16px', color: 'var(--success)', fontWeight: 800 }}>{kmTotalesAcumulados.toLocaleString()} KM</span>
              </div>
            </div>
            
            {metasUDAT.map((m, index) => {
              let kmEstaSemana = 0;
              if (kmRestantesCalculo >= m.km) {
                kmEstaSemana = m.km;
                kmRestantesCalculo -= m.km;
              } else {
                kmEstaSemana = kmRestantesCalculo;
                kmRestantesCalculo = 0;
              }

              const porcentaje = Math.floor((kmEstaSemana / m.km) * 100);
              const superada = porcentaje >= 100;

              return (
                <div key={index} style={{ background: superada ? 'rgba(16, 185, 129, 0.05)' : 'rgba(0,0,0,0.2)', border: `1px solid ${superada ? 'var(--success)' : 'var(--border-color)'}`, borderRadius: '12px', padding: '15px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontWeight: 800, color: superada ? 'var(--success)' : 'var(--primary)', fontSize: '15px' }}>Semana {m.sem}</span>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)' }}>{superada ? '✅ Superada' : `${kmEstaSemana.toFixed(0)} / ${m.km} KM`}</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.1)', height: '8px', borderRadius: '4px', width: '100%', overflow: 'hidden', marginBottom: '8px' }}>
                    <div style={{ background: superada ? 'var(--success)' : 'var(--primary)', height: '100%', width: `${porcentaje}%`, borderRadius: '4px', transition: 'width 1s ease' }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CONTENIDO PESTAÑA 3: ACADEMIA */}
      {activeTab === 'estudio' && (
        <div style={{ animation: 'slideUp 0.4s ease' }}>
          
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '22px', marginBottom: '22px', textAlign: 'left' }}>
            <h4 style={{ marginTop: 0, color: 'var(--text-light)', marginBottom: '15px', fontSize: '16px', fontWeight: 800, borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>📚 Material de Estudio</h4>
            {materiales.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Sin material disponible.</p>
            ) : (
              materiales.map(m => (
                <div key={m.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '12px', marginBottom: '12px', border: '1px solid var(--border-color)' }}>
                  <strong style={{ color:'var(--primary)', fontSize:'15px' }}>Semana {m.semana_asignada}: {m.titulo}</strong>
                  <p style={{ fontSize:'13px', color:'var(--text-muted)', margin: '5px 0' }}>{m.descripcion}</p>
                  {m.url_documento_video && <a href={m.url_documento_video} target="_blank" rel="noreferrer" style={{ display:'inline-block', padding:'8px 12px', background:'transparent', border:'1px solid var(--primary)', color:'var(--primary)', borderRadius:'8px', textDecoration:'none', fontSize:'12px', fontWeight:'bold', marginTop:'5px' }}>🔗 Abrir Material</a>}
                </div>
              ))
            )}
          </div>

          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '22px', marginBottom: '22px', textAlign: 'left' }}>
            <h4 style={{ marginTop: 0, color: 'var(--text-light)', marginBottom: '15px', fontSize: '16px', fontWeight: 800, borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>🗣️ Buzón de Opinión</h4>
            <select value={encuestaTipo} onChange={e => setEncuestaTipo(e.target.value)} style={{ width: '100%', padding: '14px 18px', marginBottom: '20px', border: '1px solid var(--border-color)', borderRadius: '12px', backgroundColor: 'rgba(0,0,0,0.3)', color: 'var(--text-light)', fontSize:'15px' }}>
              <option value="">¿A quién vas a evaluar?</option>
              <option value="LIDER">Líder Operativo</option>
              <option value="GERENTE">Gerente</option>
            </select>
            
            {encuestaTipo && (
              <>
                <input type="text" value={encuestaNombre} onChange={e => setEncuestaNombre(e.target.value)} placeholder="Nombre de la persona..." style={{ width: '100%', padding: '14px 18px', marginBottom: '20px', border: '1px solid var(--border-color)', borderRadius: '12px', backgroundColor: 'rgba(0,0,0,0.3)', color: 'var(--text-light)', boxSizing: 'border-box' }} />
                <select value={encuestaEstrellas} onChange={e => setEncuestaEstrellas(e.target.value)} style={{ width: '100%', padding: '14px 18px', marginBottom: '20px', border: '1px solid var(--border-color)', borderRadius: '12px', backgroundColor: 'rgba(0,0,0,0.3)', color: 'var(--text-light)' }}>
                  <option value="">Estrellas...</option><option value="5">⭐⭐⭐⭐⭐</option><option value="4">⭐⭐⭐⭐</option><option value="3">⭐⭐⭐</option><option value="2">⭐⭐</option><option value="1">⭐</option>
                </select>
                <textarea value={encuestaComentarios} onChange={e => setEncuestaComentarios(e.target.value)} placeholder="Cuéntanos tu experiencia..." style={{ width: '100%', padding: '14px 18px', marginBottom: '20px', border: '1px solid var(--border-color)', borderRadius: '12px', backgroundColor: 'rgba(0,0,0,0.3)', color: 'var(--text-light)', height: '80px', boxSizing: 'border-box', fontFamily: 'inherit' }}></textarea>
                <button onClick={enviarEncuesta} style={{ width: '100%', padding: '16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 15px var(--primary-glow)' }}>
                  Enviar Privado
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}