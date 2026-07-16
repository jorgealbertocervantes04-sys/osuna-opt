import React, { useState, useEffect } from 'react';
import { supabase } from "../../services/supabaseClient";

export default function DashboardGeneral() {
  const [alumnos, setAlumnos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargarDatosOperativos = async () => {
    setCargando(true);
    try {
      // Solo traemos a los alumnos, que son el motor de la operación
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
  // 1. CÁLCULO DE KPIs PRINCIPALES
  // ==========================================
  const totalAlumnos = alumnos.length;
  const kpiActivos = alumnos.filter(a => a.estatus === 'En proceso').length;
  const kpiLiberados = alumnos.filter(a => a.estatus === 'Liberado').length;
  const kpiBajas = alumnos.filter(a => a.estatus === 'Baja').length;

  // ==========================================
  // 2. MOTORES DE AGRUPACIÓN (Gerentes, Líderes, Unidades)
  // ==========================================
  const agruparDatos = (llave) => {
    const conteo = alumnos.reduce((acc, alumno) => {
      const grupo = alumno[llave] || 'Sin Asignar';
      acc[grupo] = (acc[grupo] || 0) + 1;
      return acc;
    }, {});
    // Convertir a arreglo y ordenar de mayor a menor
    return Object.entries(conteo).sort((a, b) => b[1] - a[1]);
  };

  const alumnosPorGerente = agruparDatos('gerente');
  const alumnosPorLider = agruparDatos('lider');
  const alumnosPorUnidad = agruparDatos('unidad_negocio');

  // ==========================================
  // 3. RADAR DE ALERTAS CRÍTICAS (Tiempos muertos y falta de OPT)
  // ==========================================
  const hoy = new Date();
  
  const alertasCriticas = alumnos.filter(a => a.estatus === 'En proceso').map(alumno => {
    let diasSinOPT = 0;
    let diasDesdeBanderazo = 0;
    let tieneRiesgo = false;
    let mensajesRiesgo = [];

    // Alerta 1: Sin OPT asignado
    if (!alumno.opt_asignado || alumno.opt_asignado === 'Sin Asignar') {
      const fechaIngreso = new Date(alumno.created_at || hoy);
      diasSinOPT = Math.floor((hoy - fechaIngreso) / (1000 * 60 * 60 * 24));
      if (diasSinOPT > 3) { // Si pasan de 3 días sin instructor, es alerta roja
        tieneRiesgo = true;
        mensajesRiesgo.push(`⚠️ ${diasSinOPT} días en sistema sin OPT asignado.`);
      }
    }

    // Alerta 2: Días Inactivos (Por ahora calculado desde el banderazo, luego lo puedes conectar a tu tabla de GPS/Viajes)
    if (alumno.fecha_entrega_operacion) {
      const fechaBanderazo = new Date(alumno.fecha_entrega_operacion);
      diasDesdeBanderazo = Math.floor((hoy - fechaBanderazo) / (1000 * 60 * 60 * 24));
      // Aquí simulamos "días sin conducir". Idealmente esto leerá de tu tabla de 'bitacoras'
      if (diasDesdeBanderazo > 15) { 
        tieneRiesgo = true;
        mensajesRiesgo.push(`🛑 ${diasDesdeBanderazo} días desde banderazo (Revisar actividad).`);
      }
    }

    return { ...alumno, diasSinOPT, diasDesdeBanderazo, tieneRiesgo, mensajesRiesgo };
  }).filter(a => a.tieneRiesgo); // Solo mostramos los que traen focos rojos

  // ==========================================
  // ESTILOS REUTILIZABLES
  // ==========================================
  const cardStyle = { background: '#1e293b', borderRadius: '16px', padding: '20px', border: '1px solid #334155', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)' };
  const titleStyle = { color: '#94a3b8', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '15px', marginTop: 0, fontWeight: 700 };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease', color: 'white', paddingBottom: '40px' }}>
      
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ margin: '0 0 5px 0', fontSize: '32px', color: '#60a5fa', fontWeight: 900 }}>Visor Estratégico General</h1>
        <p style={{ color: '#94a3b8', margin: 0 }}>Métricas operativas en tiempo real. Vista de solo lectura.</p>
      </div>

      {cargando ? (
        <div style={{ textAlign: 'center', padding: '50px', color: '#94a3b8' }}>Sincronizando telemetría...</div>
      ) : (
        <>
          {/* 1. CLUSTER DE KPIs PRINCIPALES */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            <div style={{ ...cardStyle, borderLeft: '4px solid #3b82f6' }}>
              <h3 style={titleStyle}>Total Histórico</h3>
              <p style={{ margin: 0, fontSize: '38px', fontWeight: 900, color: 'white' }}>{totalAlumnos}</p>
            </div>
            <div style={{ ...cardStyle, borderLeft: '4px solid #fbbf24' }}>
              <h3 style={titleStyle}>En Proceso (Activos)</h3>
              <p style={{ margin: 0, fontSize: '38px', fontWeight: 900, color: '#fbbf24' }}>{kpiActivos}</p>
            </div>
            <div style={{ ...cardStyle, borderLeft: '4px solid #34d399' }}>
              <h3 style={titleStyle}>Liberados (Meta)</h3>
              <p style={{ margin: 0, fontSize: '38px', fontWeight: 900, color: '#34d399' }}>{kpiLiberados}</p>
            </div>
            <div style={{ ...cardStyle, borderLeft: '4px solid #f87171' }}>
              <h3 style={titleStyle}>Bajas</h3>
              <p style={{ margin: 0, fontSize: '38px', fontWeight: 900, color: '#f87171' }}>{kpiBajas}</p>
            </div>
          </div>

          {/* 2. MEDIDORES POR JERARQUÍA (GERENTES Y LÍDERES) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            
            {/* Panel Gerentes */}
            <div style={cardStyle}>
              <h3 style={titleStyle}>📊 Alumnos por Gerente</h3>
              {alumnosPorGerente.length === 0 ? <p style={{ color: '#64748b', fontSize: '14px' }}>Sin datos.</p> : alumnosPorGerente.map(([gerente, cantidad]) => (
                <div key={gerente} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}>
                    <span style={{ color: '#e2e8f0' }}>{gerente}</span>
                    <strong style={{ color: '#60a5fa' }}>{cantidad} alumnos</strong>
                  </div>
                  <div style={{ background: '#0f172a', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ background: '#3b82f6', height: '100%', width: `${(cantidad / totalAlumnos) * 100}%`, borderRadius: '4px' }}></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Panel Líderes */}
            <div style={cardStyle}>
              <h3 style={titleStyle}>🎯 Carga por Líder Operativo</h3>
              {alumnosPorLider.length === 0 ? <p style={{ color: '#64748b', fontSize: '14px' }}>Sin datos.</p> : alumnosPorLider.slice(0, 5).map(([lider, cantidad]) => (
                <div key={lider} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}>
                    <span style={{ color: '#e2e8f0' }}>{lider}</span>
                    <strong style={{ color: '#a855f7' }}>{cantidad} alumnos</strong>
                  </div>
                  <div style={{ background: '#0f172a', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ background: '#a855f7', height: '100%', width: `${(cantidad / totalAlumnos) * 100}%`, borderRadius: '4px' }}></div>
                  </div>
                </div>
              ))}
              {alumnosPorLider.length > 5 && <p style={{ fontSize: '11px', color: '#64748b', textAlign: 'center', marginTop: '10px' }}>Mostrando el Top 5 de Líderes</p>}
            </div>

            {/* Panel Unidades de Negocio */}
            <div style={cardStyle}>
              <h3 style={titleStyle}>🏢 Distribución por Base (Unidad)</h3>
              {alumnosPorUnidad.length === 0 ? <p style={{ color: '#64748b', fontSize: '14px' }}>Sin datos.</p> : alumnosPorUnidad.map(([unidad, cantidad]) => (
                <div key={unidad} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}>
                    <span style={{ color: '#e2e8f0' }}>{unidad}</span>
                    <strong style={{ color: '#10b981' }}>{cantidad} alumnos</strong>
                  </div>
                  <div style={{ background: '#0f172a', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ background: '#10b981', height: '100%', width: `${(cantidad / totalAlumnos) * 100}%`, borderRadius: '4px' }}></div>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* 3. RADAR DE ALERTAS CRÍTICAS */}
          <div style={{ ...cardStyle, border: '1px solid rgba(244, 63, 94, 0.3)', background: 'linear-gradient(180deg, #1e293b 0%, rgba(244, 63, 94, 0.05) 100%)' }}>
            <h3 style={{ ...titleStyle, color: '#fb7185' }}>🚨 Radar de Fugas Operativas (Atención Requerida)</h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px' }}>Muestra alumnos activos sin asignación de tutor (huérfanos) o con inactividad prolongada.</p>
            
            {alertasCriticas.length === 0 ? (
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '20px', borderRadius: '8px', textAlign: 'center', color: '#34d399', border: '1px dashed #34d399' }}>
                ✅ Excelente. No hay alertas críticas en la operación. Todos los alumnos están asignados y corriendo.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '10px' }}>
                {alertasCriticas.map(a => (
                  <div key={a.id} style={{ background: '#0f172a', padding: '15px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '3px solid #f43f5e' }}>
                    <div>
                      <h4 style={{ margin: '0 0 5px 0', color: '#f8fafc', fontSize: '15px' }}>{a.nombre_completo}</h4>
                      <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                        Líder: <b style={{color:'white'}}>{a.lider || 'N/A'}</b> | Unidad: <b style={{color:'white'}}>{a.unidad_negocio || 'N/A'}</b>
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {a.mensajesRiesgo.map((msg, idx) => (
                        <div key={idx} style={{ color: '#fb7185', fontSize: '12px', fontWeight: 'bold', background: 'rgba(244, 63, 94, 0.1)', padding: '4px 8px', borderRadius: '4px', marginBottom: '4px' }}>
                          {msg}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </>
      )}
    </div>
  );
}