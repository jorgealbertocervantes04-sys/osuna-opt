import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../../services/dataService';

export default function DashboardTutor() {
  const navigate = useNavigate();
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [alumnos, setAlumnos] = useState([]);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [enviando, setEnviando] = useState(false);

  // Estados del Formulario
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState('');
  const [notas, setNotas] = useState('');
  const [rubrica, setRubrica] = useState({
    seg1: '', seg2: '', seg3: '',
    tec1: '', tec2: '', tec3: '',
    act1: '', act2: '', act3: ''
  });

  // 1. Cargar Sesión y Lista de Alumnos reales
  useEffect(() => {
    const cargarTodo = async () => {
      const session = localStorage.getItem('udat_app_session');
      if (!session) {
        navigate('/app');
        return;
      }
      
      setUsuarioActual(JSON.parse(session));

      // Descargamos a todos los usuarios y filtramos solo a los Alumnos activos
      const todosUsuarios = await dataService.obtenerUsuarios();
      const soloAlumnos = todosUsuarios.filter(u => u.rol === 'Alumno' && u.estatus !== 'Baja');
      setAlumnos(soloAlumnos);
      
      setCargandoDatos(false);
    };

    cargarTodo();
  }, [navigate]);

  const handleChange = (campo, valor) => {
    setRubrica(prev => ({ ...prev, [campo]: valor }));
  };

  // 2. Enviar Evaluación a Supabase
  const enviarEvaluacionTutor = async () => {
    if (!alumnoSeleccionado) return alert("Paso 1: Selecciona alumno.");
    if (notas.trim().length < 15) return alert("Paso 3: Justificación requerida (Mín 15 letras).");

    // Validar que todas las preguntas estén contestadas (opcional, pero recomendado)
    const valores = Object.values(rubrica);
    if (valores.includes('')) {
      const confirmar = window.confirm("⚠️ Tienes preguntas sin calificar. ¿Deseas enviarlo así? Las vacías contarán como 0.");
      if (!confirmar) return;
    }

    setEnviando(true);

    // Calcular Promedio
    const suma = 
      (parseInt(rubrica.seg1) || 0) + (parseInt(rubrica.seg2) || 0) + (parseInt(rubrica.seg3) || 0) +
      (parseInt(rubrica.tec1) || 0) + (parseInt(rubrica.tec2) || 0) + (parseInt(rubrica.tec3) || 0) +
      (parseInt(rubrica.act1) || 0) + (parseInt(rubrica.act2) || 0) + (parseInt(rubrica.act3) || 0);
    
    const promedio = (suma / 9).toFixed(2);
    const semaforo = promedio >= 4.0 ? "Verde" : promedio >= 3.0 ? "Amarillo" : "Rojo";

    // Armar el paquete de datos para la base de datos
    const payload = {
      id_alumno: alumnoSeleccionado,
      id_tutor: usuarioActual.id,
      promedio_final: parseFloat(promedio),
      semaforo: semaforo,
      notas_texto: notas,
      fecha_evaluacion: new Date().toISOString()
    };

    const { exito, error } = await dataService.guardarEvaluacion(payload);

    if (exito) {
      alert(`✓ Calificación Emitida a Corporativo.\nPromedio: ${promedio}\nSemáforo: ${semaforo}`);
      // Limpiar formulario tras enviar exitosamente
      setAlumnoSeleccionado('');
      setNotas('');
      setRubrica({ seg1:'', seg2:'', seg3:'', tec1:'', tec2:'', tec3:'', act1:'', act2:'', act3:'' });
    } else {
      alert("Error al enviar la evaluación: " + error.message);
    }
    
    setEnviando(false);
  };

  if (cargandoDatos) return <div style={{ color: 'white', textAlign: 'center', padding: '50px' }}>Cargando expediente de operadores...</div>;

  return (
    <div className="seccion activa" style={{ animation: 'fadeIn 0.4s ease' }}>
      
      {/* CABECERA Y BOTÓN DE CLAVE */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid var(--border-color)', paddingBottom: '15px' }}>
        <div style={{ textAlign: 'left' }}>
          <p style={{ fontSize: '11px', color: 'var(--purple)', margin: 0, fontWeight: 700 }}>Tutor Certificado OPT</p>
          <p style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-light)', margin: '2px 0 0 0' }}>{usuarioActual?.nombre_completo}</p>
        </div>
        <button 
          onClick={() => { localStorage.removeItem('udat_app_session'); navigate('/app'); }} 
          style={{ background: 'transparent', border: '1px solid var(--border-color)', color: '#fda4af', width: 'auto', padding: '8px 12px', fontSize: '12px', margin: 0, borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
        >
          Cerrar Sesión
        </button>
      </div>

      {/* 1. EXPEDIENTE DEL ALUMNO */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '22px', marginBottom: '22px', textAlign: 'left' }}>
        <h4 style={{ marginTop: 0, color: 'var(--text-light)', marginBottom: '15px', fontSize: '16px', fontWeight: 800, borderBottom: 'none' }}>1. Expediente del Alumno</h4>
        <select 
          value={alumnoSeleccionado}
          onChange={(e) => setAlumnoSeleccionado(e.target.value)}
          style={{ width: '100%', padding: '14px 18px', margin: 0, border: '1px solid var(--border-color)', borderRadius: '12px', backgroundColor: 'rgba(0,0,0,0.3)', color: 'var(--text-light)', fontSize: '15px' }}
        >
          <option value="">-- Operador a evaluar --</option>
          {alumnos.map(a => (
            <option key={a.id} value={a.id}>{a.nombre_completo} ({a.generacion || 'S/G'})</option>
          ))}
        </select>
      </div>

      {/* 2. RÚBRICA DE EVALUACIÓN */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '22px', marginBottom: '22px', textAlign: 'left' }}>
        <h4 style={{ textAlign: 'center', marginTop: 0, marginBottom: '20px', background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', color: 'var(--text-light)', fontSize: '16px' }}>
          2. Rúbrica de Evaluación
        </h4>
        
        {/* SEGURIDAD */}
        <h4 style={{ color: 'var(--danger)', fontSize: '15px', margin: '20px 0 10px 0' }}>🛡️ Seguridad Crítica</h4>
        
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>1. Inspección Físico-Mecánica</label>
        <select value={rubrica.seg1} onChange={(e) => handleChange('seg1', e.target.value)} style={{ width: '100%', padding: '14px 18px', marginBottom: '15px', border: '1px solid var(--border-color)', borderRadius: '12px', backgroundColor: 'rgba(0,0,0,0.3)', color: 'var(--text-light)' }}>
          <option value="">-- Calificar --</option><option value="5">5 - Excelente</option><option value="4">4 - Bueno</option><option value="3">3 - Regular</option><option value="2">2 - Deficiente</option><option value="1">1 - Crítico</option>
        </select>

        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>2. Hábitos (Cinturón, Cero Celular)</label>
        <select value={rubrica.seg2} onChange={(e) => handleChange('seg2', e.target.value)} style={{ width: '100%', padding: '14px 18px', marginBottom: '15px', border: '1px solid var(--border-color)', borderRadius: '12px', backgroundColor: 'rgba(0,0,0,0.3)', color: 'var(--text-light)' }}>
          <option value="">-- Calificar --</option><option value="5">5 - Excelente</option><option value="4">4 - Bueno</option><option value="3">3 - Regular</option><option value="2">2 - Deficiente</option><option value="1">1 - Crítico</option>
        </select>

        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>3. Manejo Defensivo</label>
        <select value={rubrica.seg3} onChange={(e) => handleChange('seg3', e.target.value)} style={{ width: '100%', padding: '14px 18px', marginBottom: '25px', border: '1px solid var(--border-color)', borderRadius: '12px', backgroundColor: 'rgba(0,0,0,0.3)', color: 'var(--text-light)' }}>
          <option value="">-- Calificar --</option><option value="5">5 - Excelente</option><option value="4">4 - Bueno</option><option value="3">3 - Regular</option><option value="2">2 - Deficiente</option><option value="1">1 - Crítico</option>
        </select>

        {/* CONDUCCIÓN */}
        <h4 style={{ color: 'var(--info)', fontSize: '15px', margin: '20px 0 10px 0' }}>⚙️ Conducción Técnica</h4>
        
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>4. Rangos Económicos</label>
        <select value={rubrica.tec1} onChange={(e) => handleChange('tec1', e.target.value)} style={{ width: '100%', padding: '14px 18px', marginBottom: '15px', border: '1px solid var(--border-color)', borderRadius: '12px', backgroundColor: 'rgba(0,0,0,0.3)', color: 'var(--text-light)' }}>
          <option value="">-- Calificar --</option><option value="5">5 - Excelente</option><option value="4">4 - Bueno</option><option value="3">3 - Regular</option><option value="2">2 - Deficiente</option><option value="1">1 - Crítico</option>
        </select>

        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>5. Educación Vial</label>
        <select value={rubrica.tec2} onChange={(e) => handleChange('tec2', e.target.value)} style={{ width: '100%', padding: '14px 18px', marginBottom: '15px', border: '1px solid var(--border-color)', borderRadius: '12px', backgroundColor: 'rgba(0,0,0,0.3)', color: 'var(--text-light)' }}>
          <option value="">-- Calificar --</option><option value="5">5 - Excelente</option><option value="4">4 - Bueno</option><option value="3">3 - Regular</option><option value="2">2 - Deficiente</option><option value="1">1 - Crítico</option>
        </select>

        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>6. Freno de Motor / Patio</label>
        <select value={rubrica.tec3} onChange={(e) => handleChange('tec3', e.target.value)} style={{ width: '100%', padding: '14px 18px', marginBottom: '25px', border: '1px solid var(--border-color)', borderRadius: '12px', backgroundColor: 'rgba(0,0,0,0.3)', color: 'var(--text-light)' }}>
          <option value="">-- Calificar --</option><option value="5">5 - Excelente</option><option value="4">4 - Bueno</option><option value="3">3 - Regular</option><option value="2">2 - Deficiente</option><option value="1">1 - Crítico</option>
        </select>

        {/* ACTITUD */}
        <h4 style={{ color: 'var(--success)', fontSize: '15px', margin: '20px 0 10px 0' }}>🤝 Actitud y Emoción</h4>
        
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>7. Receptividad a Instrucción</label>
        <select value={rubrica.act1} onChange={(e) => handleChange('act1', e.target.value)} style={{ width: '100%', padding: '14px 18px', marginBottom: '15px', border: '1px solid var(--border-color)', borderRadius: '12px', backgroundColor: 'rgba(0,0,0,0.3)', color: 'var(--text-light)' }}>
          <option value="">-- Calificar --</option><option value="5">5 - Excelente</option><option value="4">4 - Bueno</option><option value="3">3 - Regular</option><option value="2">2 - Deficiente</option><option value="1">1 - Crítico</option>
        </select>

        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>8. Control del Estrés</label>
        <select value={rubrica.act2} onChange={(e) => handleChange('act2', e.target.value)} style={{ width: '100%', padding: '14px 18px', marginBottom: '15px', border: '1px solid var(--border-color)', borderRadius: '12px', backgroundColor: 'rgba(0,0,0,0.3)', color: 'var(--text-light)' }}>
          <option value="">-- Calificar --</option><option value="5">5 - Excelente</option><option value="4">4 - Bueno</option><option value="3">3 - Regular</option><option value="2">2 - Deficiente</option><option value="1">1 - Crítico</option>
        </select>

        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>9. Responsabilidad</label>
        <select value={rubrica.act3} onChange={(e) => handleChange('act3', e.target.value)} style={{ width: '100%', padding: '14px 18px', marginBottom: '10px', border: '1px solid var(--border-color)', borderRadius: '12px', backgroundColor: 'rgba(0,0,0,0.3)', color: 'var(--text-light)' }}>
          <option value="">-- Calificar --</option><option value="5">5 - Excelente</option><option value="4">4 - Bueno</option><option value="3">3 - Regular</option><option value="2">2 - Deficiente</option><option value="1">1 - Crítico</option>
        </select>
      </div>

      {/* 3. JUSTIFICACIÓN Y ENVÍO */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '22px', marginBottom: '22px', textAlign: 'left' }}>
        <h4 style={{ marginTop: 0, color: 'var(--text-light)', marginBottom: '15px', fontSize: '16px', fontWeight: 800, borderBottom: 'none' }}>3. Justificación</h4>
        <textarea 
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Motivos de la calificación (Obligatorio, mín. 15 letras)" 
          style={{ width: '100%', padding: '14px 18px', margin: 0, border: '1px solid var(--border-color)', borderRadius: '12px', backgroundColor: 'rgba(0,0,0,0.3)', color: 'var(--text-light)', height: '100px', boxSizing: 'border-box', fontFamily: 'inherit' }}
        ></textarea>
      </div>

      <button 
        onClick={enviarEvaluacionTutor}
        disabled={enviando}
        style={{ width: '100%', padding: '20px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '18px', fontWeight: 700, cursor: enviando ? 'not-allowed' : 'pointer', boxShadow: enviando ? 'none' : '0 4px 15px var(--primary-glow)', opacity: enviando ? 0.7 : 1 }}
      >
        {enviando ? 'Guardando en Bóveda...' : 'Emitir Calificación'}
      </button>
    </div>
  );
}