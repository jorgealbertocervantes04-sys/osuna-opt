import React, { useState, useEffect } from 'react';
import { supabase } from "../../services/supabaseClient";

export default function AdminDashboardGeneral() {
  const [alumnos, setAlumnos] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  // ESTADO PARA CONTROLAR LAS 5 PESTAÑAS (Tabs)
  const [pestanaActiva, setPestanaActiva] = useState('semaforos');

  const cargarDatosOperativos = async () => {
    setCargando(true);
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('rol', 'Alumno');

      if (error) throw error;
      setAlumnos(data || []);
    } catch (err) {
      console.error("Falla en el radar:", err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatosOperativos();
  }, []);

  // ==========================================
  // 1. CÁLCULO DE KPIs GLOBALES
  // ==========================================
  const totalAlumnos = alumnos.length;
  const kpiActivos = alumnos.filter(a => a.estatus === 'En proceso').length;
  const kpiLiberados = alumnos.filter(a => a.estatus === 'Liberado').length;
  const kpiBajas = alumnos.filter(a => a.estatus === 'Baja').length;

  const agruparDatos = (llave) => {
    const conteo = alumnos.reduce((acc, alumno) => {
      const grupo = alumno[llave] || 'Sin Asignar';
      acc[grupo] = (acc[grupo] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(conteo).sort((a, b) => b[1] - a[1]);
  };

  const alumnosPorGerente = agruparDatos('gerente');
  const alumnosPorLider = agruparDatos('lider');
  const alumnosPorUnidad = agruparDatos('unidad_negocio');

  // ==========================================
  // 2. PROCESAMIENTO DE ALERTAS Y RIESGOS DE BAJA
  // ==========================================
  const hoy = new Date();
  let listaAlertas = [];
  let listaRiesgoBaja = [];

  alumnos.filter(a => a.estatus === 'En proceso').forEach(alumno => {
    let diasSinOPT = 0;
    let diasDesdeBanderazo = 0;
    let nivelRiesgo = 0; 
    let mensajesAlerta = [];

    // Fuga 1: Huérfanos de OPT
    if (!alumno.opt_asignado || alumno.opt_asignado === 'Sin Asignar') {
      const fechaIngreso = new Date(alumno.created_at || hoy);
      diasSinOPT = Math.floor((hoy - fechaIngreso) / (1000 * 60 * 60 * 24));
      
      if (diasSinOPT >= 3 && diasSinOPT < 7) {
        nivelRiesgo += 1;
        mensajesAlerta.push(`⚠️ ${diasSinOPT} días sin OPT asignado.`);
      } else if (diasSinOPT >= 7) {
        nivelRiesgo += 2; 
        mensajesAlerta.push(`🚨 CRÍTICO: ${diasSinOPT} días sin OPT asignado.`);
      }
    }

    // Fuga 2: Inactividad Operativa
    if (alumno.fecha_entrega_operacion) {
      const fechaBanderazo = new Date(alumno.fecha_entrega_operacion);
      diasDesdeBanderazo = Math.floor((hoy - fechaBanderazo) / (1000 * 60 * 60 * 24));
      
      if (diasDesdeBanderazo >= 15 && diasDesdeBanderazo < 25) {
        nivelRiesgo += 1;
        mensajesAlerta.push(`🛑 ${diasDesdeBanderazo} días desde banderazo (Baja actividad).`);
      } else if (diasDesdeBanderazo >= 25) {
        nivelRiesgo += 2;
        mensajesAlerta.push(`💀 ${diasDesdeBanderazo} días sin liberación (Alta probabilidad de abandono).`);
      }
    }

    if (nivelRiesgo === 1) {
      listaAlertas.push({ ...alumno, mensajesAlerta });
    } else if (nivelRiesgo >= 2) {
      listaRiesgoBaja.push({ ...alumno, mensajesAlerta, nivelRiesgo });
    }
  });

  // ==========================================
  // ESTILOS DE COMPONENTES
  // ==========================================
  const cardStyle = { background: '#1e293b', borderRadius: '16px', padding: '20px', border: '1px solid #334155', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)' };
  const titleStyle = { color: '#94a3b8', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '15px', marginTop: 0, fontWeight: 700 };
  
  const btnTabBase = { padding: '12px 18px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', border: 'none', transition: 'all 0.3s ease', fontSize: '13px', flex: '1 1 auto', textAlign: 'center' };
  const btnInactivo = { ...btnTabBase, background: 'transparent', color: '#94a3b8', border: '1px solid #334155' };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease', color: 'white', paddingBottom: '40px' }}>
      
      {/* ENCABEZADO Y SISTEMA DE 5 PESTAÑAS */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '32px', color: '#60a5fa', fontWeight: 900 }}>Visor Estratégico General</h1>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '20px' }}>
          <button 
            onClick={() => setPestanaActiva('semaforos')} 
            style={pestanaActiva === 'semaforos' ? { ...btnTabBase, background: '#3b82f6', color: 'white', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)' } : btnInactivo}
          >
            🚦 Distribución
          </button>
          <button 
            onClick={() => setPestanaActiva('asistencias')} 
            style={pestanaActiva === 'asistencias' ? { ...btnTabBase, background: '#8b5cf6', color: 'white', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)' } : btnInactivo}
          >
            📅 Asistencias
          </button>
          <button 
            onClick={() => setPestanaActiva('metas')} 
            style={pestanaActiva === 'metas' ? { ...btnTabBase, background: '#10b981', color: 'white', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)' } : btnInactivo}
          >
            🏆 Metas de Liberación
          </button>
          <button 
            onClick={() => setPestanaActiva('alertas')} 
            style={pestanaActiva === 'alertas' ? { ...btnTabBase, background: '#f59e0b', color: 'white', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)' } : btnInactivo}
          >
            ⚠️ Alertas ({listaAlertas.length})
          </button>
          <button 
            onClick={() => setPestanaActiva('riesgo')} 
            style={pestanaActiva === 'riesgo' ? { ...btnTabBase, background: '#e11d48', color: 'white', boxShadow: '0 4px 12px rgba(225, 29, 72, 0.4)' } : btnInactivo}
          >
            🚨 Riesgo Baja ({listaRiesgoBaja.length})
          </button>
        </div>
      </div>

      {cargando ? (
        <div style={{ textAlign: 'center', padding: '50px', color: '#94a3b8' }}>Sincronizando telemetría...</div>
      ) : (
        <>
          {/* ======================================================== */}
          {/* PESTAÑA 1: DISTRIBUCIÓN Y SEMÁFOROS (Solo cargas de trabajo) */}
          {/* ======================================================== */}
          {pestanaActiva === 'semaforos' && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div style={{ ...cardStyle, borderLeft: '4px solid #3b82f6' }}><h3 style={titleStyle}>Histórico General</h3><p style={{ margin: 0, fontSize: '32px', fontWeight: 900 }}>{totalAlumnos}</p></div>
                <div style={{ ...cardStyle, borderLeft: '4px solid #fbbf24' }}><h3 style={titleStyle}>Activos (Proceso)</h3><p style={{ margin: 0, fontSize: '32px', fontWeight: 900, color: '#fbbf24' }}>{kpiActivos}</p></div>
                <div style={{ ...cardStyle, borderLeft: '4px solid #34d399' }}><h3 style={titleStyle}>Liberados</h3><p style={{ margin: 0, fontSize: '32px', fontWeight: 900, color: '#34d399' }}>{kpiLiberados}</p></div>
                <div style={{ ...cardStyle, borderLeft: '4px solid #f87171' }}><h3 style={titleStyle}>Bajas</h3><p style={{ margin: 0, fontSize: '32px', fontWeight: 900, color: '#f87171' }}>{kpiBajas}</p></div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                <div style={cardStyle}>
                  <h3 style={titleStyle}>📊 Carga por Gerente</h3>
                  {alumnosPorGerente.map(([gerente, cantidad]) => (
                    <div key={gerente} style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}><span>{gerente}</span><strong style={{ color: '#60a5fa' }}>{cantidad}</strong></div>
                      <div style={{ background: '#0f172a', height: '6px', borderRadius: '3px' }}><div style={{ background: '#3b82f6', height: '100%', width: `${(cantidad / totalAlumnos) * 100}%`, borderRadius: '3px' }}></div></div>
                    </div>
                  ))}
                </div>

                <div style={cardStyle}>
                  <h3 style={titleStyle}>🎯 Carga por Líder Operativo</h3>
                  {alumnosPorLider.slice(0, 5).map(([lider, cantidad]) => (
                    <div key={lider} style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}><span>{lider}</span><strong style={{ color: '#a855f7' }}>{cantidad}</strong></div>
                      <div style={{ background: '#0f172a', height: '6px', borderRadius: '3px' }}><div style={{ background: '#a855f7', height: '100%', width: `${(cantidad / totalAlumnos) * 100}%`, borderRadius: '3px' }}></div></div>
                    </div>
                  ))}
                </div>

                <div style={cardStyle}>
                  <h3 style={titleStyle}>🏢 Distribución por Base (Unidad)</h3>
                  {alumnosPorUnidad.map(([unidad, cantidad]) => (
                    <div key={unidad} style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}><span>{unidad}</span><strong style={{ color: '#10b981' }}>{cantidad}</strong></div>
                      <div style={{ background: '#0f172a', height: '6px', borderRadius: '3px' }}><div style={{ background: '#10b981', height: '100%', width: `${(cantidad / totalAlumnos) * 100}%`, borderRadius: '3px' }}></div></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* PESTAÑA 2: ASISTENCIAS (Módulo Exclusivo) */}
          {/* ======================================================== */}
          {pestanaActiva === 'asistencias' && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <div style={{ ...cardStyle, background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.1) 0%, #1e293b 100%)', border: '1px solid rgba(139, 92, 246, 0.3)', marginBottom: '20px' }}>
                <h3 style={{ ...titleStyle, color: '#a78bfa' }}>📅 Monitor de Asistencia y Permanencia</h3>
                <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px' }}>Vista exclusiva para evaluar la presentación física de los alumnos y tutores.</p>
                
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 8px 0' }}>Cumplimiento Semanal (Promedio)</p>
                    <div style={{ background: '#0f172a', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
                       <div style={{ background: '#8b5cf6', height: '100%', width: `88%` }}></div>
                    </div>
                    <p style={{ margin: '5px 0 0 0', fontSize: '24px', fontWeight: 'bold', color: '#a78bfa' }}>88% <span style={{fontSize:'12px', color:'#94a3b8', fontWeight:'normal'}}>Asistencia</span></p>
                  </div>
                  <div style={{ flex: 1, minWidth: '200px', display: 'flex', gap: '15px' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)', width: '100%' }}>
                      <span style={{ display: 'block', fontSize: '11px', color: '#34d399' }}>PRESENTES HOY</span>
                      <b style={{ fontSize: '22px' }}>--</b>
                    </div>
                    <div style={{ background: 'rgba(244, 63, 94, 0.1)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(244, 63, 94, 0.2)', width: '100%' }}>
                      <span style={{ display: 'block', fontSize: '11px', color: '#fb7185' }}>FALTAS HOY</span>
                      <b style={{ fontSize: '22px' }}>--</b>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Tabla de registros (Lista para conectarse a tu futura tabla de asistencias) */}
              <div style={cardStyle}>
                <h3 style={titleStyle}>📋 Bitácora de Registro Reciente</h3>
                <div style={{ background: '#0f172a', padding: '30px', textAlign: 'center', borderRadius: '10px', color: '#64748b', border: '1px dashed #334155' }}>
                  El motor de telemetría de asistencias está en preparación. Aquí se reflejará el pase de lista en tiempo real.
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* PESTAÑA 3: METAS DE LIBERACIÓN (Rendimiento) */}
          {/* ======================================================== */}
          {pestanaActiva === 'metas' && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <div style={{ ...cardStyle, background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, #1e293b 100%)', border: '1px solid rgba(16, 185, 129, 0.3)', marginBottom: '20px' }}>
                <h3 style={{ ...titleStyle, color: '#34d399' }}>🏆 Avance de Metas de Liberación</h3>
                <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px' }}>Monitorea cuántos alumnos logran culminar su proceso y asegurar su estancia en la empresa.</p>
                
                <div style={{ background: '#0f172a', padding: '20px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
                  <div>
                    <h4 style={{ margin: 0, color: 'white', fontSize: '18px' }}>Tasa de Retención y Éxito</h4>
                    <p style={{ margin: '5px 0 0 0', color: '#94a3b8', fontSize: '13px' }}>Alumnos liberados vs Total de alumnos (sin contar activos)</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {/* Fórmula simple para sacar porcentaje de éxito de los que ya no están en proceso */}
                    <span style={{ fontSize: '36px', fontWeight: 900, color: '#10b981' }}>
                      {((kpiLiberados / (kpiLiberados + kpiBajas || 1)) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                <div style={cardStyle}>
                  <h3 style={titleStyle}>📈 Liberados vs Bajas (Por Base)</h3>
                  <div style={{ background: '#0f172a', padding: '40px', textAlign: 'center', borderRadius: '10px', color: '#64748b', border: '1px dashed #334155' }}>
                    Módulo de gráficas comparativas en calibración.
                  </div>
                </div>
                <div style={cardStyle}>
                  <h3 style={titleStyle}>⏱️ Tiempo Promedio de Liberación</h3>
                   <div style={{ background: '#0f172a', padding: '40px', textAlign: 'center', borderRadius: '10px', color: '#64748b', border: '1px dashed #334155' }}>
                    Calculadora de días en proceso (Banderazo - Liberación) en calibración.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* PESTAÑA 4: ALERTAS OPERATIVAS */}
          {/* ======================================================== */}
          {pestanaActiva === 'alertas' && (
            <div style={{ animation: 'fadeIn 0.3s ease', ...cardStyle, border: '1px solid rgba(245, 158, 11, 0.3)', background: 'linear-gradient(180deg, #1e293b 0%, rgba(245, 158, 11, 0.05) 100%)' }}>
              <h3 style={{ ...titleStyle, color: '#fbbf24' }}>⚠️ Fugas y Retrasos Operativos</h3>
              <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px' }}>Alumnos con retrasos menores en asignación o inactividad temprana.</p>
              
              {listaAlertas.length === 0 ? (
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '20px', borderRadius: '8px', textAlign: 'center', color: '#34d399', border: '1px dashed #34d399' }}>✅ Sin alertas menores pendientes.</div>
              ) : (
                <div style={{ display: 'grid', gap: '10px' }}>
                  {listaAlertas.map(a => (
                    <div key={a.id} style={{ background: '#0f172a', padding: '15px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '3px solid #f59e0b', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <h4 style={{ margin: '0 0 5px 0', color: '#f8fafc', fontSize: '15px' }}>{a.nombre_completo}</h4>
                        <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>Líder: <b style={{color:'white'}}>{a.lider || 'N/A'}</b> | Base: <b style={{color:'white'}}>{a.unidad_negocio || 'N/A'}</b></p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        {a.mensajesAlerta.map((msg, idx) => (
                          <div key={idx} style={{ color: '#fbbf24', fontSize: '12px', fontWeight: 'bold', background: 'rgba(245, 158, 11, 0.1)', padding: '4px 8px', borderRadius: '4px', marginBottom: '4px' }}>{msg}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* PESTAÑA 5: RIESGO DE BAJA */}
          {/* ======================================================== */}
          {pestanaActiva === 'riesgo' && (
            <div style={{ animation: 'fadeIn 0.3s ease', ...cardStyle, border: '1px solid rgba(225, 29, 72, 0.3)', background: 'linear-gradient(180deg, #1e293b 0%, rgba(225, 29, 72, 0.05) 100%)' }}>
              <h3 style={{ ...titleStyle, color: '#fb7185' }}>🚨 Focos Rojos: Riesgo Inminente de Baja</h3>
              <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px' }}>Alumnos con inactividad crítica o abandono prolongado. Alta probabilidad de deserción.</p>
              
              {listaRiesgoBaja.length === 0 ? (
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '20px', borderRadius: '8px', textAlign: 'center', color: '#34d399', border: '1px dashed #34d399' }}>✅ Sistema estable. No hay alumnos detectados con riesgo inminente de baja.</div>
              ) : (
                <div style={{ display: 'grid', gap: '10px' }}>
                  {listaRiesgoBaja.map(a => (
                    <div key={a.id} style={{ background: '#0f172a', padding: '15px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid #e11d48', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <h4 style={{ margin: '0 0 5px 0', color: '#f8fafc', fontSize: '15px' }}>{a.nombre_completo} <span style={{ background: '#e11d48', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', marginLeft: '10px' }}>CRÍTICO</span></h4>
                        <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>Tel: <b style={{color:'white'}}>{a.telefono}</b> | Gerente: <b style={{color:'white'}}>{a.gerente || 'N/A'}</b></p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        {a.mensajesAlerta.map((msg, idx) => (
                          <div key={idx} style={{ color: '#fb7185', fontSize: '12px', fontWeight: 'bold', background: 'rgba(225, 29, 72, 0.1)', padding: '4px 8px', borderRadius: '4px', marginBottom: '4px' }}>{msg}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}