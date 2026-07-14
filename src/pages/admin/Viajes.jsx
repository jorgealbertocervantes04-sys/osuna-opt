import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from "../../services/supabaseClient";

export default function Viajes() {
  const { filtrosGlobales } = useOutletContext(); 

  const [viajes, setViajes] = useState([]);
  const [alumnosDisponibles, setAlumnosDisponibles] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Estados del Modal (NUEVO: idEditando)
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [idEditando, setIdEditando] = useState(null);

  const [formViaje, setFormViaje] = useState({ id_alumno: '', ruta_nombre: '', km_recorridos: '', tiempo_total_minutos: '' });

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [resViajes, resUsers] = await Promise.all([
        supabase.from('viajes_diarios').select('*'),
        supabase.from('usuarios').select('id, nombre_completo, generacion, rol, lider, unidad_negocio')
      ]);

      if (resViajes.error) throw resViajes.error;
      if (resUsers.error) throw resUsers.error;

      const viajesData = resViajes.data || [];
      const usersData = resUsers.data || [];

      setAlumnosDisponibles(usersData.filter(u => u.rol === 'Alumno'));

      let viajesConNombres = viajesData.map(v => {
        const alumno = usersData.find(u => u.id === v.id_alumno) || { nombre_completo: 'Desconocido' };
        return { ...v, alumno };
      });

      if (filtrosGlobales) {
        const fi = filtrosGlobales.desde ? new Date(filtrosGlobales.desde + 'T00:00:00') : new Date('2000-01-01');
        const ff = filtrosGlobales.hasta ? new Date(filtrosGlobales.hasta + 'T23:59:59') : new Date('2100-01-01');

        viajesConNombres = viajesConNombres.filter(v => {
          const dateV = v.hora_inicio ? new Date(v.hora_inicio) : new Date();
          const pasaFecha = dateV >= fi && dateV <= ff;
          const pasaGen = filtrosGlobales.generacion === 'TODOS' || v.alumno.generacion === filtrosGlobales.generacion;
          const pasaUni = filtrosGlobales.unidad === 'TODOS' || v.alumno.unidad_negocio === filtrosGlobales.unidad;
          const pasaLid = filtrosGlobales.lider === 'TODOS' || v.alumno.lider === filtrosGlobales.lider;
          
          return pasaFecha && pasaGen && pasaUni && pasaLid;
        });
      }

      setViajes(viajesConNombres.sort((a,b) => new Date(b.hora_inicio) - new Date(a.hora_inicio)));
    } catch (error) {
      console.error("Error al cargar viajes:", error);
      alert("Error al cargar viajes: " + error.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarDatos(); }, [filtrosGlobales]);

  // MODALES (NUEVO: Abrir para editar)
  const abrirModalNuevo = () => {
    setIdEditando(null);
    setFormViaje({ id_alumno: '', ruta_nombre: '', km_recorridos: '', tiempo_total_minutos: '' });
    setModalAbierto(true);
  };

  const abrirModalEditar = (viaje) => {
    setIdEditando(viaje.id);
    setFormViaje({
      id_alumno: viaje.id_alumno,
      ruta_nombre: viaje.ruta_nombre,
      km_recorridos: viaje.km_recorridos,
      tiempo_total_minutos: viaje.tiempo_total_minutos
    });
    setModalAbierto(true);
  };

  // GUARDAR O ACTUALIZAR
  const guardarViaje = async () => {
    if (!formViaje.id_alumno || !formViaje.ruta_nombre || !formViaje.km_recorridos) {
      return alert("Por favor, llena los campos obligatorios.");
    }
    setGuardando(true);

    try {
      const payload = { 
        id_alumno: formViaje.id_alumno,
        ruta_nombre: formViaje.ruta_nombre,
        km_recorridos: parseFloat(formViaje.km_recorridos),
        tiempo_total_minutos: parseInt(formViaje.tiempo_total_minutos) || 0
      };

      if (!idEditando) {
        payload.hora_inicio = new Date().toISOString();
        const { error } = await supabase.from('viajes_diarios').insert([payload]);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('viajes_diarios').update(payload).eq('id', idEditando);
        if (error) throw error;
      }

      setModalAbierto(false); 
      setIdEditando(null);
      cargarDatos();
    } catch (error) {
      alert("Error al guardar: " + error.message);
    } finally {
      setGuardando(false);
    }
  };

  const eliminarViaje = async (id) => {
    if (window.confirm("⚠️ ¿Deseas eliminar permanentemente esta bitácora?")) {
      try {
        const { error } = await supabase.from('viajes_diarios').delete().eq('id', id);
        if (error) throw error;
        cargarDatos();
      } catch (error) {
        alert("Error al eliminar: " + error.message);
      }
    }
  };

  const totalKm = viajes.reduce((sum, v) => sum + (parseFloat(v.km_recorridos) || 0), 0);
  const totalViajes = viajes.length;

  const inputStyle = { width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', boxSizing: 'border-box', fontSize: '14px', color: 'var(--text-light)', marginBottom: '15px' };
  const labelStyle = { display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '1px' };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ color: 'var(--text-light)', margin: 0, fontSize: '32px', fontWeight: 800 }}>Bitácoras de Viaje</h1>
        </div>
        <button onClick={abrirModalNuevo} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, boxShadow: '0 4px 15px var(--primary-glow)' }}>
          + Registrar Viaje
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', borderLeft: '4px solid var(--primary)' }}>
          <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>Total Viajes Registrados</h3>
          <p style={{ margin: 0, fontSize: '32px', fontWeight: 900, color: 'var(--primary)' }}>{totalViajes}</p>
        </div>
        <div style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', borderLeft: '4px solid var(--success)' }}>
          <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>Kilómetros Totales</h3>
          <p style={{ margin: 0, fontSize: '32px', fontWeight: 900, color: 'var(--success)' }}>{totalKm.toLocaleString()} km</p>
        </div>
      </div>

      <div style={{ background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'auto', boxShadow: '0 10px 20px rgba(0,0,0,0.3)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px', color: 'var(--text-light)' }}>
          <thead>
            <tr>
              <th style={{ padding: '18px 20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase' }}>Fecha</th>
              <th style={{ padding: '18px 20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase' }}>Operador</th>
              <th style={{ padding: '18px 20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase' }}>Ruta</th>
              <th style={{ padding: '18px 20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase' }}>Distancia</th>
              <th style={{ padding: '18px 20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? <tr><td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando bitácoras...</td></tr>
            : viajes.length === 0 ? <tr><td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>No hay viajes registrados.</td></tr>
            : viajes.map(v => (
                <tr key={v.id} style={{ transition: '0.2s', borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '18px 20px' }}>{new Date(v.hora_inicio).toLocaleDateString()}</td>
                  <td style={{ padding: '18px 20px' }}><strong>{v.alumno.nombre_completo}</strong></td>
                  <td style={{ padding: '18px 20px' }}>{v.ruta_nombre}</td>
                  <td style={{ padding: '18px 20px', fontWeight: 'bold', color: 'var(--success)' }}>{v.km_recorridos} km</td>
                  <td style={{ padding: '18px 20px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => abrirModalEditar(v)} style={{ background: 'transparent', border: '1px solid var(--info)', color: 'var(--info)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>✏️</button>
                      <button onClick={() => eliminarViaje(v.id)} style={{ background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {modalAbierto && (
        <div style={{ position: 'fixed', zIndex: 2000, left: 0, top: 0, width: '100%', height: '100%', backgroundColor: 'rgba(5, 11, 20, 0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', boxSizing: 'border-box' }}>
          <div style={{ backgroundColor: 'var(--sidebar-bg)', padding: '35px', borderRadius: '20px', width: '100%', maxWidth: '500px', boxShadow: '0 0 40px rgba(0,0,0,0.8)', border: '1px solid var(--border-color)' }}>
            <h2 style={{ marginTop: 0, color: 'var(--primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '15px', marginBottom: '20px' }}>
              {idEditando ? '✏️ Editar Bitácora' : 'Registrar Bitácora'}
            </h2>
            
            <div>
              <label style={labelStyle}>Operador *</label>
              <select value={formViaje.id_alumno} onChange={e => setFormViaje({...formViaje, id_alumno: e.target.value})} style={{...inputStyle, background:'rgba(0,0,0,0.5)'}}>
                <option value="">Seleccionar...</option>
                {alumnosDisponibles.map(a => <option key={a.id} value={a.id}>{a.nombre_completo}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Ruta / Destino *</label>
              <input type="text" value={formViaje.ruta_nombre} onChange={e => setFormViaje({...formViaje, ruta_nombre: e.target.value})} placeholder="Ej. Laredo - MTY" style={inputStyle} />
            </div>
            <div style={{ display: 'flex', gap: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Kilómetros *</label>
                <input type="number" value={formViaje.km_recorridos} onChange={e => setFormViaje({...formViaje, km_recorridos: e.target.value})} placeholder="Ej. 250" style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Minutos de Viaje</label>
                <input type="number" value={formViaje.tiempo_total_minutos} onChange={e => setFormViaje({...formViaje, tiempo_total_minutos: e.target.value})} placeholder="Ej. 180" style={inputStyle} />
              </div>
            </div>

            <div style={{ textAlign: 'right', marginTop: '15px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
              <button onClick={() => { setModalAbierto(false); setIdEditando(null); }} style={{ backgroundColor: 'transparent', color: 'var(--text-light)', border: '1px solid var(--border-color)', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginRight: '10px' }}>Cancelar</button>
              <button onClick={guardarViaje} disabled={guardando} style={{ backgroundColor: 'var(--primary)', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 15px var(--primary-glow)' }}>
                {guardando ? 'Guardando...' : (idEditando ? 'Actualizar' : 'Guardar')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}