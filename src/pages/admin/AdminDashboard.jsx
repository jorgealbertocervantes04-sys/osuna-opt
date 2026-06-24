import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
// IMPORTANTE: Respetamos la "C" mayúscula de supabaseClient que vimos en tus carpetas
import { supabase } from '../../services/supabaseClient';

import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

// Configuración global de Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);
ChartJS.defaults.color = '#94a3b8';
ChartJS.defaults.font.family = "'Plus Jakarta Sans', sans-serif";

export default function AdminDashboard() {
  const { filtrosGlobales } = useOutletContext();

  const [kpis, setKpis] = useState({ activos: 0, liberados: 0, km: 0, horas: 0, promedio: 0, riesgo: 0 });
  const [aiInsights, setAiInsights] = useState([]);
  const [chartData, setChartData] = useState({ progreso: null, semaforos: null, kmtAgrupados: null });
  const [retrasosLideres, setRetrasosLideres] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCritico, setErrorCritico] = useState(null); // Nuevo estado para manejo de errores
  
  const [vistaAgrupacion, setVistaAgrupacion] = useState('generacion'); 

  useEffect(() => {
    const calcularDashboard = async () => {
      setCargando(true);
      setErrorCritico(null);
      
      try {
        // A) TRAEMOS LA DATA DE SUPABASE
        const [resU, resV, resE] = await Promise.all([
          supabase.from('usuarios').select('id, nombre_completo, rol, estatus, generacion, unidad_negocio, lider, gerente, created_at'),
          supabase.from('viajes_diarios').select('id_alumno, km_recorridos, tiempo_total_minutos, hora_inicio'),
          supabase.from('evaluaciones_cardex').select('id_alumno, promedio_final, semaforo, fecha_evaluacion, id_tutor')
        ]);

        if (resU.error) throw resU.error;
        if (resV.error) throw resV.error;
        if (resE.error) throw resE.error;

        const usuarios = resU.data || [];
        const viajes = resV.data || [];
        const evaluaciones = resE.data || [];

        // B) APLICAMOS FILTROS DE FECHAS Y GLOBALES
        const fi = filtrosGlobales.desde ? new Date(filtrosGlobales.desde + 'T00:00:00') : new Date('2000-01-01');
        const ff = filtrosGlobales.hasta ? new Date(filtrosGlobales.hasta + 'T23:59:59') : new Date('2100-01-01');

        const alumnosFiltrados = usuarios.filter(u => {
          if (u.rol !== 'Alumno') return false; 
          let pasaGen = (filtrosGlobales.generacion === 'TODOS' || u.generacion === filtrosGlobales.generacion);
          let pasaUni = (filtrosGlobales.unidad === 'TODOS' || u.unidad_negocio === filtrosGlobales.unidad);
          let pasaLid = (filtrosGlobales.lider === 'TODOS' || u.lider === filtrosGlobales.lider);
          let pasaGer = (filtrosGlobales.gerente === 'TODOS' || u.gerente === filtrosGlobales.gerente);
          return pasaGen && pasaUni && pasaLid && pasaGer;
        });

        const idsAlumnos = alumnosFiltrados.map(a => a.id);
        const viajesFiltrados = viajes.filter(v => idsAlumnos.includes(v.id_alumno) && new Date(v.hora_inicio) >= fi && new Date(v.hora_inicio) <= ff);
        const evalsFiltradas = evaluaciones.filter(e => idsAlumnos.includes(e.id_alumno) && new Date(e.fecha_evaluacion) >= fi && new Date(e.fecha_evaluacion) <= ff);

        // C) CALCULAMOS KPIs SUPERIORES Y AGRUPACIONES DINÁMICAS
        let kmTotales = 0;
        let minTotales = 0;
        
        let agrupaciones = {
          generacion: {}, unidad_negocio: {}, lider: {}, alumno: {}
        };

        const dicAlumnos = {};
        alumnosFiltrados.forEach(a => dicAlumnos[a.id] = a);

        viajesFiltrados.forEach(v => {
          let km = parseFloat(v.km_recorridos) || 0;
          let mins = parseFloat(v.tiempo_total_minutos) || 0;
          kmTotales += km;
          minTotales += mins;

          let al = dicAlumnos[v.id_alumno];
          if (al) {
            const dims = [
              { tipo: 'generacion', valor: al.generacion || 'Sin Generación' },
              { tipo: 'unidad_negocio', valor: al.unidad_negocio || 'Sin Unidad' },
              { tipo: 'lider', valor: al.lider || 'Sin Líder' },
              { tipo: 'alumno', valor: al.nombre_completo || 'Desconocido' }
            ];

            dims.forEach(d => {
              if (!agrupaciones[d.tipo][d.valor]) agrupaciones[d.tipo][d.valor] = { km: 0, horas: 0 };
              agrupaciones[d.tipo][d.valor].km += km;
              agrupaciones[d.tipo][d.valor].horas += (mins / 60);
            });
          }
        });

        let promTotal = evalsFiltradas.length > 0 ? (evalsFiltradas.reduce((sum, e) => sum + parseFloat(e.promedio_final || 0), 0) / evalsFiltradas.length) : 0;
        
        setKpis({
          activos: alumnosFiltrados.filter(a => a.estatus === 'En proceso').length,
          liberados: alumnosFiltrados.filter(a => a.estatus === 'Liberado').length,
          km: kmTotales.toLocaleString('en-US', { maximumFractionDigits: 1 }),
          horas: (minTotales / 60).toLocaleString('en-US', { maximumFractionDigits: 1 }),
          promedio: promTotal.toFixed(1),
          riesgo: evalsFiltradas.filter(e => e.semaforo === 'Rojo').length
        });

        // D) CÁLCULO DE TIEMPO DE RETRASO OPT
        let primerosViajes = {};
        viajes.forEach(v => { 
          let fechaV = new Date(v.hora_inicio);
          if (!primerosViajes[v.id_alumno] || fechaV < primerosViajes[v.id_alumno]) {
            primerosViajes[v.id_alumno] = fechaV;
          }
        });

        let retrasosCalculados = alumnosFiltrados.map(a => {
          // Si no tiene fecha de creación por alguna razón, usamos la fecha de hoy para no romper la app
          let fechaInduccion = new Date(a.created_at || new Date()); 
          let diasPerdidos = 0;
          let estadoViaje = '';

          if (primerosViajes[a.id]) {
            diasPerdidos = (primerosViajes[a.id] - fechaInduccion) / (1000 * 60 * 60 * 24);
            estadoViaje = 'Asignado';
          } else {
            diasPerdidos = (new Date() - fechaInduccion) / (1000 * 60 * 60 * 24);
            estadoViaje = 'Sin Práctica';
          }

          return {
            lider: a.lider || 'Sin Líder',
            alumno: a.nombre_completo,
            diasPerdidos: Math.max(0, Math.round(diasPerdidos)),
            estado: estadoViaje
          };
        }).sort((a, b) => b.diasPerdidos - a.diasPerdidos); 

        setRetrasosLideres(retrasosCalculados);

        // E) IA E INSIGHTS
        let alertasIA = [];
        retrasosCalculados.filter(r => r.diasPerdidos > 7 && r.estado === 'Sin Práctica').slice(0, 2).forEach(r => {
          alertasIA.push({ tipo: 'rojo', color: '#fda4af', texto: `🚨 Retraso Crítico: El líder ${r.lider} tiene a ${r.alumno} estancado sin práctica por ${r.diasPerdidos} días.` });
        });

        for (const [id, stats] of Object.entries(agrupaciones.alumno)) {
          if (stats.km >= 4000) {
            alertasIA.push({ tipo: 'verde', color: '#6ee7b7', texto: `🏆 Meta Alcanzada: ${id} superó los 4,000 KM. Listo para evaluación final.` });
          }
        }
        setAiInsights(alertasIA.slice(0, 4));

        // F) GRÁFICAS DINÁMICAS
        let prog = [0, 0, 0, 0];
        Object.values(agrupaciones.alumno).forEach(stats => {
          if (stats.km <= 500) prog[0]++;
          else if (stats.km <= 1500) prog[1]++;
          else if (stats.km < 4000) prog[2]++;
          else prog[3]++;
        });

        let sem = { Rojo: 0, Amarillo: 0, Verde: 0 };
        evalsFiltradas.forEach(e => { if(sem[e.semaforo] !== undefined) sem[e.semaforo]++ });

        const dataAgrupadaActual = agrupaciones[vistaAgrupacion] || {};
        const labelsDinamicos = Object.keys(dataAgrupadaActual).sort();
        const dataKMDinamicos = labelsDinamicos.map(k => dataAgrupadaActual[k]?.km.toFixed(1) || 0);
        const dataHorasDinamicos = labelsDinamicos.map(k => dataAgrupadaActual[k]?.horas.toFixed(1) || 0);

        setChartData({
          progreso: { labels: ['0-500 KM', '500-1500 KM', '1.5k-4k KM', 'Meta +4k KM'], datasets: [{ label: 'Alumnos', data: prog, backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'], borderRadius: 4 }] },
          semaforos: { labels: ['Rojo', 'Amarillo', 'Verde'], datasets: [{ data: [sem.Rojo, sem.Amarillo, sem.Verde], backgroundColor: ['#f43f5e', '#f59e0b', '#10b981'], borderWidth: 0 }] },
          kmtAgrupados: {
            labels: labelsDinamicos,
            datasets: [
              { label: 'Kilómetros', data: dataKMDinamicos, backgroundColor: '#0ea5e9', borderRadius: 4 },
              { label: 'Horas Prácticas', data: dataHorasDinamicos, backgroundColor: '#8b5cf6', borderRadius: 4 }
            ]
          }
        });

      } catch (error) {
        console.error("Error al procesar el dashboard:", error);
        setErrorCritico("No se pudo conectar con la base de datos. Verifica tu conexión a internet o los permisos de Supabase.");
      } finally {
        setCargando(false);
      }
    };

    calcularDashboard();
  }, [filtrosGlobales, vistaAgrupacion]); 

  // Estilos
  const cardStyle = { background: 'var(--card-bg)', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', border: '1px solid var(--border-color)' };
  const chartBoxStyle = { ...cardStyle, height: '350px', display: 'flex', flexDirection: 'column' };
  const btnStyle = (activa) => ({ padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', border: 'none', background: activa ? 'var(--primary)' : 'rgba(255,255,255,0.1)', color: activa ? '#fff' : '#aaa', fontWeight: 'bold', transition: 'all 0.3s' });

  if (errorCritico) return <div style={{color: '#fca5a5', textAlign: 'center', marginTop: '50px', padding: '20px', border: '1px solid #fca5a5', borderRadius: '8px'}}><h3>⚠️ Error Crítico</h3><p>{errorCritico}</p></div>;
  if (cargando) return <h2 style={{color: 'var(--primary)', textAlign: 'center', marginTop: '50px'}}>Procesando Métricas Dinámicas...</h2>;

  return (
    <div style={{ animation: 'fadeIn 0.4s ease', paddingBottom: '40px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <h1 style={{ color: 'var(--text-light)', margin: 0, fontSize: '28px', fontWeight: 800 }}>Dashboard Directivo</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginBottom: '30px' }}>
        <div style={{ ...cardStyle, borderTop: '4px solid var(--info)' }}>
          <h3 style={{ margin: '0 0 5px 0', fontSize: '12px', textTransform: 'uppercase' }}>Alumnos Activos</h3>
          <p style={{ margin: 0, fontSize: '30px', fontWeight: 800 }}>{kpis.activos}</p>
        </div>
        <div style={{ ...cardStyle, borderTop: '4px solid var(--purple)' }}>
          <h3 style={{ margin: '0 0 5px 0', fontSize: '12px', textTransform: 'uppercase' }}>KM Totales</h3>
          <p style={{ margin: 0, fontSize: '30px', fontWeight: 800 }}>{kpis.km}</p>
        </div>
        <div style={{ ...cardStyle, borderTop: '4px solid #f472b6' }}>
          <h3 style={{ margin: '0 0 5px 0', fontSize: '12px', textTransform: 'uppercase' }}>Horas Prácticas</h3>
          <p style={{ margin: 0, fontSize: '30px', fontWeight: 800 }}>{kpis.horas} h</p>
        </div>
        <div style={{ ...cardStyle, borderTop: '4px solid var(--warning)' }}>
          <h3 style={{ margin: '0 0 5px 0', fontSize: '12px', textTransform: 'uppercase' }}>Promedio Global</h3>
          <p style={{ margin: 0, fontSize: '30px', fontWeight: 800 }}>{kpis.promedio}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        
        <div style={{ ...cardStyle, border: '1px solid var(--primary-glow)', background: 'linear-gradient(135deg, rgba(217, 119, 6, 0.05) 0%, rgba(0,0,0,0.3) 100%)' }}>
          <h3 style={{ marginTop: 0, color: 'var(--primary)', fontWeight: 800, fontSize: '18px' }}>🧠 Alertas de Flota e Inactividad</h3>
          {aiInsights.length === 0 ? <p>Todo en orden.</p> : aiInsights.map((insight, idx) => (
            <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderLeft: `4px solid ${insight.color}`, marginBottom: '8px', borderRadius: '6px', fontSize: '13px', color: insight.color }}>
              {insight.texto}
            </div>
          ))}
        </div>

        <div style={{ ...cardStyle, overflowY: 'auto', maxHeight: '300px' }}>
          <h3 style={{ marginTop: 0, color: '#f8fafc', fontWeight: 800, fontSize: '16px' }}>⏱️ Retraso de Asignación por Líder (Días sin práctica)</h3>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333' }}>
                <th style={{ padding: '8px' }}>Líder</th>
                <th style={{ padding: '8px' }}>Alumno</th>
                <th style={{ padding: '8px' }}>Estatus</th>
                <th style={{ padding: '8px' }}>Días Perdidos</th>
              </tr>
            </thead>
            <tbody>
              {retrasosLideres.slice(0, 10).map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #222', color: r.diasPerdidos > 10 ? '#fca5a5' : '#e2e8f0' }}>
                  <td style={{ padding: '8px' }}>{r.lider}</td>
                  <td style={{ padding: '8px' }}>{r.alumno}</td>
                  <td style={{ padding: '8px' }}>{r.estado}</td>
                  <td style={{ padding: '8px', fontWeight: 'bold' }}>{r.diasPerdidos} días</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ fontSize: '11px', color: '#888', marginTop: '10px' }}>*Muestra los 10 alumnos con mayor retraso desde su inducción.</p>
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        
        <div style={{ ...chartBoxStyle, gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', textTransform: 'uppercase' }}>Rendimiento: KM y Horas</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setVistaAgrupacion('generacion')} style={btnStyle(vistaAgrupacion === 'generacion')}>Por Generación</button>
              <button onClick={() => setVistaAgrupacion('unidad_negocio')} style={btnStyle(vistaAgrupacion === 'unidad_negocio')}>Por Unidad</button>
              <button onClick={() => setVistaAgrupacion('lider')} style={btnStyle(vistaAgrupacion === 'lider')}>Por Líder</button>
              <button onClick={() => setVistaAgrupacion('alumno')} style={btnStyle(vistaAgrupacion === 'alumno')}>Por Alumno</button>
            </div>
          </div>
          <div style={{ flexGrow: 1, position: 'relative' }}>
            {chartData.kmtAgrupados && <Bar data={chartData.kmtAgrupados} options={{ responsive: true, maintainAspectRatio: false, scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(255,255,255,0.05)' } } } }} />}
          </div>
        </div>

        <div style={chartBoxStyle}>
          <h3 style={{ marginTop: 0, fontSize: '14px', textTransform: 'uppercase' }}>Avance vs Metas (4,000 KM)</h3>
          <div style={{ flexGrow: 1, position: 'relative' }}>
            {chartData.progreso && <Bar data={chartData.progreso} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(255,255,255,0.05)' } } } }} />}
          </div>
        </div>

        <div style={chartBoxStyle}>
          <h3 style={{ marginTop: 0, fontSize: '14px', textTransform: 'uppercase' }}>Status Rúbricas (Semáforos)</h3>
          <div style={{ flexGrow: 1, position: 'relative' }}>
             {chartData.semaforos && <Doughnut data={chartData.semaforos} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#f8fafc' } } } }} />}
          </div>
        </div>

      </div>
    </div>
  );
}