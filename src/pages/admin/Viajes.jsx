import { useState, useEffect } from 'react';
import { dataService } from '../../../vite.config';

export default function Viajes() {
  const [viajes, setViajes] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Estados del Modal de Edición
  const [modalAbierto, setModalAbierto] = useState(false);
  const [idEditando, setIdEditando] = useState(null);
  const [formData, setFormData] = useState({
    nombre_opt: '', km_iniciales: '', km_finales: '', km_recorridos: '', tiempo_total_minutos: '', notas_novedad: ''
  });

  // 1. Cargar datos reales desde Supabase
  const cargarViajes = async () => {
    setCargando(true);
    // Traemos los viajes y también a los usuarios para poder mostrar el nombre del alumno
    const [datosViajes, datosUsuarios] = await Promise.all([
      dataService.obtenerViajes(),
      dataService.obtenerUsuarios()
    ]);

    // Cruzamos la información: A cada viaje le inyectamos los datos de su alumno correspondiente
    const viajesConAlumnos = datosViajes.map(viaje => {
      const alumno = datosUsuarios.find(u => u.id === viaje.id_alumno);
      return { ...viaje, alumno: alumno || { nombre_completo: 'Usuario Eliminado' } };
    });

    setViajes(viajesConAlumnos);
    setCargando(false);
  };

  useEffect(() => {
    cargarViajes();
  }, []);

  // 2. Funciones del Modal de Edición
  const abrirModalEditar = (viaje) => {
    setIdEditando(viaje.id);
    setFormData({
      nombre_opt: viaje.nombre_opt || '',
      km_iniciales: viaje.km_iniciales || '',
      km_finales: viaje.km_finales || '',
      km_recorridos: viaje.km_recorridos || '',
      tiempo_total_minutos: viaje.tiempo_total_minutos || '',
      notas_novedad: viaje.notas_novedad || ''
    });
    setModalAbierto(true);
  };

  const handleChangeForm = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const guardarEdicion = async () => {
    const payload = {
      nombre_opt: formData.nombre_opt,
      km_iniciales: parseFloat(formData.km_iniciales) || 0,
      km_finales: parseFloat(formData.km_finales) || 0,
      km_recorridos: parseFloat(formData.km_recorridos) || 0,
      tiempo_total_minutos: parseInt(formData.tiempo_total_minutos) || 0,
      notas_novedad: formData.notas_novedad
    };

    const { exito, error } = await dataService.guardarViaje(payload, idEditando);
    
    if (exito) {
      alert("✓ Viaje actualizado correctamente.");
      setModalAbierto(false);
      cargarViajes();
    } else {
      alert("Error al actualizar: " + error.message);
    }
  };

  // 3. Función para Eliminar
  const eliminarRegistro = async (id) => {
    if (window.confirm("⚠️ ¿Estás seguro de eliminar este registro de viaje de forma permanente?")) {
      const { exito, error } = await dataService.eliminarViaje(id);
      if (exito) {
        cargarViajes();
      } else {
        alert("Error al eliminar: " + error.message);
      }
    }
  };

  // Estilos
  const inputStyle = { width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', boxSizing: 'border-box', fontSize: '14px', color: 'var(--text-light)', marginBottom: '15px' };
  const labelStyle = { display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '1px' };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <h1 style={{ color: 'var(--text-light)', margin: 0, fontSize: '32px', fontWeight: 800, letterSpacing: '-0.5px' }}>Control de Rutas y Kilómetros</h1>
        <button style={{ background: 'transparent', color: 'var(--primary)', border: '2px solid var(--primary)', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, transition: '0.3s' }}>
          📥 Descargar Excel
        </button>
      </div>

      {/* TABLA PRINCIPAL */}
      <div style={{ background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'auto', boxShadow: '0 10px 20px rgba(0,0,0,0.3)', marginBottom: '30px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px', color: 'var(--text-light)' }}>
          <thead>
            <tr>
              <th style={{ padding: '18px 20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Fecha Inicio</th>
              <th style={{ padding: '18px 20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Nombre Operador</th>
              <th style={{ padding: '18px 20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Tutor / Evaluación</th>
              <th style={{ padding: '18px 20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Duración / Estado</th>
              <th style={{ padding: '18px 20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Kilómetros</th>
              <th style={{ padding: '18px 20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Evidencia</th>
              <th style={{ padding: '18px 20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>Cargando bitácoras desde Supabase...</td></tr>
            ) : viajes.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No hay viajes registrados aún.</td></tr>
            ) : (
              viajes.map(v => {
                // Cálculos para mostrar los datos limpios
                const fechaFormat = new Date(v.hora_inicio).toLocaleString();
                const tutorTxt = v.nombre_opt ? <b style={{ color: 'var(--text-light)' }}>{v.nombre_opt}</b> : <span style={{ color: 'var(--danger)' }}>Sin Asignar</span>;
                const enRuta = v.hora_fin === null;
                const estatusTxt = enRuta ? <span style={{ color: 'var(--warning)' }}>En Ruta...</span> : <span style={{ fontSize: '11px' }}>{v.notas_novedad || 'Terminado'}</span>;
                const kmsTxt = v.km_recorridos ? `${v.km_recorridos} KM` : '-';
                
                let evalPromedio = null;
                if (v.opt_calif_trato && v.opt_calif_instruccion) {
                  evalPromedio = ((v.opt_calif_trato + v.opt_calif_instruccion) / 2).toFixed(1);
                }

                return (
                  <tr key={v.id} style={{ transition: '0.2s' }}>
                    <td style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)' }}>{fechaFormat}</td>
                    <td style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)' }}><strong style={{ color: 'var(--text-light)' }}>{v.alumno.nombre_completo}</strong></td>
                    <td style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)' }}>
                      {tutorTxt}<br/>
                      {evalPromedio ? <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 'bold' }}>⭐ {evalPromedio}/5</span> : <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Sin evaluar</span>}
                    </td>
                    <td style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)', fontSize: '12px', maxWidth: '150px' }}>
                      {estatusTxt}
                    </td>
                    <td style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)', fontWeight: 'bold', color: 'var(--text-light)' }}>{kmsTxt}</td>
                    <td style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)' }}>
                      {v.foto_tablero_url ? <a href={v.foto_tablero_url} target="_blank" rel="noreferrer" style={{ color: 'var(--purple)', fontWeight: 'bold', textDecoration: 'none' }}>📸 Foto</a> : <span style={{ color: 'var(--text-muted)' }}>Sin Foto</span>}
                    </td>
                    <td style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => abrirModalEditar(v)} style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-light)', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>✏️</button>
                        <button onClick={() => eliminarRegistro(v.id)} style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--border-color)', color: '#f43f5e', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL EDITAR VIAJE */}
      {modalAbierto && (
        <div style={{ position: 'fixed', zIndex: 2000, left: 0, top: 0, width: '100%', height: '100%', backgroundColor: 'rgba(5, 11, 20, 0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', boxSizing: 'border-box' }}>
          <div style={{ backgroundColor: 'var(--sidebar-bg)', padding: '35px', borderRadius: '20px', width: '100%', maxWidth: '500px', boxShadow: '0 0 40px rgba(0,0,0,0.8)', border: '1px solid var(--border-color)' }}>
            <h2 style={{ marginTop: 0, color: 'var(--primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '15px', marginBottom: '20px', fontSize: '24px' }}>Editar Viaje</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Tutor / OPT en cabina</label>
                <input type="text" name="nombre_opt" value={formData.nombre_opt} onChange={handleChangeForm} style={inputStyle} />
              </div>
              <div><label style={labelStyle}>KM Iniciales</label><input type="number" name="km_iniciales" value={formData.km_iniciales} onChange={handleChangeForm} style={inputStyle} /></div>
              <div><label style={labelStyle}>KM Finales</label><input type="number" name="km_finales" value={formData.km_finales} onChange={handleChangeForm} style={inputStyle} /></div>
              <div><label style={labelStyle}>KM Recorridos</label><input type="number" name="km_recorridos" value={formData.km_recorridos} onChange={handleChangeForm} style={inputStyle} /></div>
              <div><label style={labelStyle}>Tiempo (Minutos)</label><input type="number" name="tiempo_total_minutos" value={formData.tiempo_total_minutos} onChange={handleChangeForm} style={inputStyle} /></div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Notas / Novedades</label>
                <textarea name="notas_novedad" value={formData.notas_novedad} onChange={handleChangeForm} style={{ ...inputStyle, height: '80px', fontFamily: 'inherit' }}></textarea>
              </div>
            </div>

            <div style={{ textAlign: 'right', marginTop: '25px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
              <button onClick={() => setModalAbierto(false)} style={{ backgroundColor: 'transparent', color: 'var(--text-light)', border: '1px solid var(--border-color)', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginRight: '10px', transition: '0.3s' }}>Cancelar</button>
              <button onClick={guardarEdicion} style={{ backgroundColor: 'var(--primary)', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 15px var(--primary-glow)' }}>Guardar Cambios</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}