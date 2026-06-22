import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../services/supabaseclient';

import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

// Configuración global de Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);
ChartJS.defaults.color = '#94a3b8';
ChartJS.defaults.font.family = "'Plus Jakarta Sans', sans-serif";

export default function AdminDashboard() {
  // 1. ATRAPAMOS LOS FILTROS DEL MENÚ LATERAL (Magia pura)
  const { filtrosGlobales } = useOutletContext();

  // 2. ESTADOS PARA GUARDAR LA INFORMACIÓN REAL
  const [kpis, setKpis] = useState({ activos: 0, liberados: 0, km: 0, promedio: 0, riesgo: 0 });
  const [aiInsights, setAiInsights] = useState([]);
  const [chartData, setChartData] = useState({ progreso: null, generaciones: null, semaforos: null, topTutores: null });
  const [cargando, setCargando] = useState(true);

  // 3. EFECTO MAESTRO: CADA VEZ QUE CAMBIE UN FILTRO, SE RECALCULA TODO
  useEffect(() => {
    const calcularDashboard = async () => {
      setCargando(true);
      
      // A) TRAEMOS LA DATA DE SUPABASE
      const [resU, resV, resE] = await Promise.all([
        supabase.from('usuarios').select('id, nombre_completo, rol, estatus, generacion, unidad_negocio, lider, gerente'),
        supabase.from('viajes_diarios').select('id_alumno, km_recorridos, tiempo_total_minutos, hora_inicio'),
        supabase.from('evaluaciones_cardex').select('id_alumno, promedio_final, semaforo, fecha_evaluacion, id_tutor, tutor:id_tutor(nombre_completo)')
      ]);

      if (resU.error || resV.error || resE.error) {
        console.error("Error cargando base de datos.");
        setCargando(false);
        return;
      }

      const usuarios = resU.data || [];
      const viajes = resV.data || [];
      const evaluaciones = resE.data || [];

      // B) APLICAMOS TUS FILTROS DIRECTIVOS
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

      // Filtramos viajes y evaluaciones en base a los alumnos y las fechas
      const viajesFiltrados = viajes.filter(v => idsAlumnos.includes(v.id_alumno) && new Date(v.hora_inicio) >= fi && new Date(v.hora_inicio) <= ff);
      const evalsFiltradas = evaluaciones.filter(e => idsAlumnos.includes(e.id_alumno) && new Date(e.fecha_evaluacion) >= fi && new Date(e.fecha_evaluacion) <= ff);

      // C) CALCULAMOS LOS KPIs SUPERIORES
      let kmTotales = viajesFiltrados.reduce((sum, v) => sum + (parseFloat(v.km_recorridos) || 0), 0);
      let promTotal = evalsFiltradas.length > 0 ? (evalsFiltradas.reduce((sum, e) => sum + parseFloat(e.promedio_final || 0), 0) / evalsFiltradas.length) : 0;
      
      setKpis({
        activos: alumnosFiltrados.filter(a => a.estatus === 'En proceso').length,
        liberados: alumnosFiltrados.filter(a => a.estatus === 'Liberado').length,
        km: kmTotales.toLocaleString('en-US'),
        promedio: promTotal.toFixed(1),
        riesgo: evalsFiltradas.filter(e => e.semaforo === 'Rojo').length
      });

      // D) CEREBRO DE INTELIGENCIA ARTIFICIAL
      let alertasIA = [];
      let kmPorAlumno = {};
      
      viajesFiltrados.forEach(v => {
        if (!kmPorAlumno[v.id_alumno]) kmPorAlumno[v.id_alumno] = 0;
        kmPorAlumno[v.id_alumno] += parseFloat(v.km_recorridos || 0);

        // IA: Alerta de Anomalía (Falso reporte de velocidad)
        if (v.tiempo_total_minutos > 0 && v.km_recorridos > 0) {
          let hrs = v.tiempo_total_minutos / 60;
          if ((v.km_recorridos / hrs) > 110) {
            let al = alumnosFiltrados.find(a => a.id === v.id_alumno);
            alertasIA.push({ tipo: 'rojo', color: '#fda4af', texto: `🚨 Alerta Velocidad: ${al?.nombre_completo} reportó ${v.km_recorridos} KM en ${hrs.toFixed(1)} hrs.` });
          }
        }
      });

      // IA: Alerta de Liberación
      for (const [id, totalKm] of Object.entries(kmPorAlumno)) {
        if (totalKm >= 4000) {
          let al = alumnosFiltrados.find(a => a.id === id);
          if (al && al.estatus === 'En proceso') {
            alertasIA.push({ tipo: 'verde', color: '#6ee7b7', texto: `🏆 Meta Alcanzada: ${al.nombre_completo} superó los 4,000 KM. Listo para liberar.` });
          }
        }
      }
      setAiInsights(alertasIA.slice(0, 3)); // Mostramos máximo 3 para no saturar

      // E) PROCESAMOS DATOS PARA LAS GRÁFICAS
      
      // 1. Progreso de Flota
      let prog = [0, 0, 0, 0];
      for (const totalKm of Object.values(kmPorAlumno)) {
        if (totalKm <= 500) prog[0]++;
        else if (totalKm <= 1500) prog[1]++;
        else if (totalKm < 4000) prog[2]++;
        else prog[3]++;
      }

      // 2. Evolución por Generaciones
      let promGen = {};
      alumnosFiltrados.forEach(a => {
        let evs = evalsFiltradas.filter(e => e.id_alumno === a.id);
        if (evs.length > 0) {
          let avg = evs.reduce((s, e) => s + parseFloat(e.promedio_final||0), 0) / evs.length;
          let g = a.generacion || 'Sin Gen';
          if(!promGen[g]) promGen[g] = { sum: 0, count: 0};
          promGen[g].sum += avg;
          promGen[g].count++;
        }
      });
      let labelsGen = Object.keys(promGen).sort();
      let dataGen = labelsGen.map(g => (promGen[g].sum / promGen[g].count).toFixed(1));

      // 3. Semáforos
      let sem = { Rojo: 0, Amarillo: 0, Verde: 0 };
      evalsFiltradas.forEach(e => { if(sem[e.semaforo] !== undefined) sem[e.semaforo]++ });

      // 4. Ranking Tutores
      let promTut = {};
      evalsFiltradas.forEach(e => {
        if(e.tutor?.nombre_completo) {
          if(!promTut[e.tutor.nombre_completo]) promTut[e.tutor.nombre_completo] = { sum:0, count:0 };
          promTut[e.tutor.nombre_completo].sum += parseFloat(e.promedio_final || 0);
          promTut[e.tutor.nombre_completo].count++;
        }
      });
      let tutRanking = Object.keys(promTut).map(t => ({ nombre: t, prom: (promTut[t].sum / promTut[t].count).toFixed(1) }))
        .sort((a,b) => b.prom - a.prom).slice(0,5);

      setChartData({
        progreso: { labels: ['0-500 KM', '500-1500 KM', '1.5k-4k KM', '+4k KM'], datasets: [{ data: prog, backgroundColor: ['#94a3b8', '#0ea5e9', '#10b981', '#8b5cf6'], borderRadius: 6 }] },
        generaciones: { labels: labelsGen, datasets: [{ label: 'Promedio', data: dataGen, backgroundColor: '#0ea5e9', borderRadius: 6 }] },
        semaforos: { labels: ['Rojo', 'Amarillo', 'Verde'], datasets: [{ data: [sem.Rojo, sem.Amarillo, sem.Verde], backgroundColor: ['#f43f5e', '#f59e0b', '#10b981'], borderWidth: 0 }] },
        topTutores: { labels: tutRanking.map(t => t.nombre), datasets: [{ label: 'Promedio', data: tutRanking.map(t => t.prom), backgroundColor: '#8b5cf6', borderRadius: 4 }] }
      });

      setCargando(false);
    };

    calcularDashboard();
  }, [filtrosGlobales]); // Si cambia el filtro, se vuelve a ejecutar la magia.

  // Estilos reutilizables
  const cardStyle = { background: 'var(--card-bg)', padding: '25px', borderRadius: '16px', boxShadow: '0 10px 20px rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', position: 'relative', overflow: 'hidden' };
  const chartBoxStyle = { ...cardStyle, height: '320px', display: 'flex', flexDirection: 'column' };

  if (cargando) return <h2 style={{color: 'var(--primary)', textAlign: 'center', marginTop: '50px'}}>Calculando Métricas Directivas...</h2>;

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <h1 style={{ color: 'var(--text-light)', margin: 0, fontSize: '32px', fontWeight: 800, letterSpacing: '-0.5px' }}>Rendimiento Estratégico</h1>
        <button onClick={() => window.print()} style={{ background: 'transparent', color: 'var(--primary)', border: '2px solid var(--primary)', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 700 }}>
          🖨️ Imprimir Resumen
        </button>
      </div>

      {/* KPIs SUPERIORES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ ...cardStyle, borderTop: '4px solid var(--info)' }}>
          <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-muted)', fontSize: '13px', textTransform: 'uppercase' }}>Alumnos en Proceso</h3>
          <p style={{ margin: 0, fontSize: '38px', fontWeight: 800, color: 'var(--text-light)' }}>{kpis.activos}</p>
        </div>
        <div style={{ ...cardStyle, borderTop: '4px solid var(--success)' }}>
          <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-muted)', fontSize: '13px', textTransform: 'uppercase' }}>Graduados (Liberados)</h3>
          <p style={{ margin: 0, fontSize: '38px', fontWeight: 800, color: 'var(--text-light)' }}>{kpis.liberados}</p>
        </div>
        <div style={{ ...cardStyle, borderTop: '4px solid var(--purple)' }}>
          <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-muted)', fontSize: '13px', textTransform: 'uppercase' }}>KM Prácticos Totales</h3>
          <p style={{ margin: 0, fontSize: '38px', fontWeight: 800, color: 'var(--text-light)' }}>{kpis.km}</p>
        </div>
        <div style={{ ...cardStyle, borderTop: '4px solid var(--warning)' }}>
          <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-muted)', fontSize: '13px', textTransform: 'uppercase' }}>Promedio Global</h3>
          <p style={{ margin: 0, fontSize: '38px', fontWeight: 800, color: 'var(--text-light)' }}>{kpis.promedio}</p>
        </div>
        <div style={{ ...cardStyle, borderTop: '4px solid var(--danger)' }}>
          <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-muted)', fontSize: '13px', textTransform: 'uppercase' }}>Focos Rojos (Riesgo)</h3>
          <p style={{ margin: 0, fontSize: '38px', fontWeight: 800, color: 'var(--text-light)' }}>{kpis.riesgo}</p>
        </div>
      </div>

      {/* PANEL INTELIGENCIA ARTIFICIAL */}
      <div style={{ background: 'linear-gradient(135deg, rgba(217, 119, 6, 0.05) 0%, rgba(0,0,0,0.3) 100%)', border: '1px solid var(--primary-glow)', borderRadius: '16px', padding: '25px', marginBottom: '30px' }}>
        <h3 style={{ marginTop: 0, color: 'var(--primary)', fontWeight: 800, fontSize: '20px' }}>🧠 Semáforo Predictivo AI</h3>
        
        {aiInsights.length === 0 ? (
           <div style={{ background: 'rgba(0,0,0,0.3)', padding: '18px', borderLeft: '4px solid var(--success)', borderRadius: '8px', fontSize: '14px', border: '1px solid var(--border-color)', color: '#6ee7b7' }}>
             ✅ Sistema Óptimo: Sin anomalías detectadas en la flotilla filtrada.
           </div>
        ) : (
          aiInsights.map((insight, idx) => (
            <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', padding: '18px', borderLeft: `4px solid ${insight.color}`, marginBottom: '12px', borderRadius: '8px', fontSize: '14px', border: '1px solid var(--border-color)', color: insight.color }}>
              {insight.texto}
            </div>
          ))
        )}
      </div>

      {/* GRÁFICAS REAELS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        
        <div style={{ ...chartBoxStyle, gridColumn: '1 / -1' }}>
          <h3 style={{ marginTop: 0, color: 'var(--text-muted)', fontSize: '13px', textTransform: 'uppercase' }}>Nivel de Progreso de Flota (Distribución por KM)</h3>
          <div style={{ flexGrow: 1, position: 'relative' }}>
            {chartData.progreso && <Bar data={chartData.progreso} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(255,255,255,0.05)' } } } }} />}
          </div>
        </div>

        <div style={chartBoxStyle}>
          <h3 style={{ marginTop: 0, color: 'var(--text-muted)', fontSize: '13px', textTransform: 'uppercase' }}>Evolución de Promedio por Generación</h3>
          <div style={{ flexGrow: 1, position: 'relative' }}>
            {chartData.generaciones?.labels.length > 0 ? <Bar data={chartData.generaciones} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { max: 5, grid: { color: 'rgba(255,255,255,0.05)' } } } }} /> : <p style={{textAlign:'center', marginTop:'50px', color: 'var(--text-muted)'}}>Sin datos suficientes</p>}
          </div>
        </div>

        <div style={chartBoxStyle}>
          <h3 style={{ marginTop: 0, color: 'var(--text-muted)', fontSize: '13px', textTransform: 'uppercase' }}>Status Rúbricas (Semáforos)</h3>
          <div style={{ flexGrow: 1, position: 'relative' }}>
             {chartData.semaforos && <Doughnut data={chartData.semaforos} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#f8fafc' } } } }} />}
          </div>
        </div>

        <div style={{ ...chartBoxStyle, gridColumn: '1 / -1' }}>
          <h3 style={{ marginTop: 0, color: 'var(--text-muted)', fontSize: '13px', textTransform: 'uppercase' }}>Ranking Eficiencia Tutores (OPT)</h3>
          <div style={{ flexGrow: 1, position: 'relative' }}>
            {chartData.topTutores?.labels.length > 0 ? <Bar data={chartData.topTutores} options={{ indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { max: 5, grid: { color: 'rgba(255,255,255,0.05)' } }, y: { grid: { display: false } } } }} /> : <p style={{textAlign:'center', marginTop:'50px', color: 'var(--text-muted)'}}>Aún no hay tutores calificados.</p>}
          </div>
        </div>

      </div>
    </div>
  );
}