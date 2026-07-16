import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from "../../services/supabaseClient";

export default function Directorio() {
  // 1. ATRAPAMOS LOS FILTROS GLOBALES DEL MENÚ IZQUIERDO
  const { filtrosGlobales } = useOutletContext();

  // Estados de los datos
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Estados de filtros locales y búsqueda
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('TODOS');
  const [filtroEstatus, setFiltroEstatus] = useState('TODOS');

  // Estados del Modal
  const [modalAbierto, setModalAbierto] = useState(false);
  const [idEditando, setIdEditando] = useState(null);
  
  // Estado del formulario del modal
  const [formData, setFormData] = useState({
    nombre_completo: '', generacion: '', telefono: '', numero_empleado: '',
    rol: 'Alumno', estatus: 'En proceso', empresa: '', unidad_negocio: '',
    lider: '', gerente: '', opt_asignado: '', certificacion_opt: 'No Aplica',
    fecha_entrega_operacion: '' 
  });

  // CARGAR DATOS REALES AL INICIAR LA PANTALLA
  const cargarUsuarios = async () => {
    setCargando(true);
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*');
      
      if (error) throw error;
      setUsuarios(data || []);
    } catch (err) {
      console.error("Error al cargar el directorio:", err);
      alert("Error al cargar el directorio: " + err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  // LÓGICA DE FILTRADO INTELIGENTE
  const usuariosFiltrados = usuarios.filter(u => {
    if (!filtrosGlobales) return true;

    // A. Filtros Globales
    let pasaGlobalGen = filtrosGlobales.generacion === 'TODOS' || u.generacion === filtrosGlobales.generacion;
    let pasaGlobalUni = filtrosGlobales.unidad === 'TODOS' || u.unidad_negocio === filtrosGlobales.unidad;
    let pasaGlobalLid = filtrosGlobales.lider === 'TODOS' || u.lider === filtrosGlobales.lider;
    let pasaGlobalGer = filtrosGlobales.gerente === 'TODOS' || u.gerente === filtrosGlobales.gerente;
    
    // Rango de fechas
    let d = u.created_at ? new Date(u.created_at) : (u.fecha_registro ? new Date(u.fecha_registro) : new Date());
    const fi = filtrosGlobales.desde ? new Date(filtrosGlobales.desde + 'T00:00:00') : new Date('2000-01-01');
    const ff = filtrosGlobales.hasta ? new Date(filtrosGlobales.hasta + 'T23:59:59') : new Date('2100-01-01');
    let pasaFecha = d >= fi && d <= ff;

    // B. Filtros Locales
    const pasaBusqueda = (u.nombre_completo?.toLowerCase() || '').includes(busqueda.toLowerCase()) || 
                         (u.numero_empleado?.toLowerCase() || '').includes(busqueda.toLowerCase());
    const pasaRol = filtroRol === 'TODOS' || u.rol === filtroRol;
    const pasaEstatus = filtroEstatus === 'TODOS' || u.estatus === filtroEstatus;
    
    return pasaGlobalGen && pasaGlobalUni && pasaGlobalLid && pasaGlobalGer && pasaFecha && pasaBusqueda && pasaRol && pasaEstatus;
  });

  const optDisponibles = usuarios.filter(u => u.rol === 'Tutor');

  // FUNCIONES DEL MODAL
  const handleChangeForm = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const abrirModalNuevo = () => {
    setIdEditando(null);
    setFormData({
      nombre_completo: '', generacion: '', telefono: '', numero_empleado: '',
      rol: 'Alumno', estatus: 'En proceso', empresa: '', unidad_negocio: '',
      lider: '', gerente: '', opt_asignado: '', certificacion_opt: 'No Aplica',
      fecha_entrega_operacion: '' 
    });
    setModalAbierto(true);
  };

  const abrirModalEditar = (usuario) => {
    setIdEditando(usuario.id);
    setFormData({
      nombre_completo: usuario.nombre_completo || '', generacion: usuario.generacion || '', 
      telefono: usuario.telefono || '', numero_empleado: usuario.numero_empleado || '',
      rol: usuario.rol || 'Alumno', estatus: usuario.estatus || 'En proceso', 
      empresa: usuario.empresa || '', unidad_negocio: usuario.unidad_negocio || '',
      lider: usuario.lider || '', gerente: usuario.gerente || '', 
      opt_asignado: usuario.opt_asignado || '', certificacion_opt: usuario.certificacion_opt || 'No Aplica',
      fecha_entrega_operacion: usuario.fecha_entrega_operacion ? usuario.fecha_entrega_operacion.split('T')[0] : ''
    });
    setModalAbierto(true);
  };

  // GUARDAR EXPEDIENTE DIRECTO EN SUPABASE CON DOBLE INYECCIÓN
  const guardarExpediente = async () => {
    if (!formData.nombre_completo || !formData.telefono) {
      return alert("El nombre y el celular son obligatorios.");
    }
    
    let datosAGuardar = { ...formData };
    
    if (datosAGuardar.fecha_entrega_operacion === '') {
        datosAGuardar.fecha_entrega_operacion = null;
    }

    try {
        if (!idEditando) {
            // Nuevo Registro Principal
            datosAGuardar.contrasena = formData.nombre_completo.substring(0,3).toUpperCase().replace(/ /g,'X') + (formData.numero_empleado || '123');
            const { error } = await supabase.from('usuarios').insert([datosAGuardar]);
            if (error) throw error;

            // 🚀 MOTOR DE DOBLE INYECCIÓN (Automatización a Catálogos)
            // Esto bifurca el nombre del usuario a su tabla correspondiente sin interrumpir el proceso
            try {
              const payloadCatalogo = { nombre: datosAGuardar.nombre_completo };
              if (datosAGuardar.rol === 'Gerente') {
                await supabase.from('cat_gerentes').insert([payloadCatalogo]);
              } else if (datosAGuardar.rol === 'Lider') {
                await supabase.from('cat_lideres').insert([payloadCatalogo]);
              } else if (datosAGuardar.rol === 'Tutor') {
                await supabase.from('cat_tutores').insert([payloadCatalogo]);
              } else if (datosAGuardar.rol === 'Alumno') {
                await supabase.from('cat_alumnos').insert([payloadCatalogo]);
              }
            } catch (errCatalogo) {
              console.warn("El usuario se guardó, pero hubo un detalle sincronizando el catálogo: ", errCatalogo);
            }

        } else {
            // Actualizar Registro
            const { error } = await supabase.from('usuarios').update(datosAGuardar).eq('id', idEditando);
            if (error) throw error;
        }

        setModalAbierto(false);
        cargarUsuarios(); 
    } catch (err) {
        console.error("Error al guardar:", err);
        alert("Error al guardar: " + err.message);
    }
  };

  // ELIMINAR DIRECTO EN SUPABASE
  const eliminarRegistro = async (id) => {
    if (window.confirm("⚠️ ATENCIÓN: ¿Deseas eliminar permanentemente a este usuario?")) {
        try {
            const { error } = await supabase.from('usuarios').delete().eq('id', id);
            if (error) throw error;
            cargarUsuarios();
        } catch (err) {
            console.error("Error al eliminar:", err);
            alert("Error al eliminar: " + err.message);
        }
    }
  };

  // KPIs Calculados
  const kpiActivos = usuariosFiltrados.filter(u => u.estatus === 'En proceso').length;
  const kpiLiberados = usuariosFiltrados.filter(u => u.estatus === 'Liberado').length;
  const kpiBajas = usuariosFiltrados.filter(u => u.estatus === 'Baja').length;
  const kpiIncapacidad = usuariosFiltrados.filter(u => u.estatus === 'Incapacidad').length;

  const inputStyle = { width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', boxSizing: 'border-box', fontSize: '14px', color: 'var(--text-light)', marginBottom: '15px' };
  const labelStyle = { display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '1px' };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '15px' }}>
        <h1 style={{ color: 'var(--text-light)', margin: 0, fontSize: '32px', fontWeight: 800, letterSpacing: '-0.5px' }}>Directorio Corporativo</h1>
        <button 
          onClick={abrirModalNuevo}
          style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, transition: '0.3s', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px var(--primary-glow)' }}
        >
          + Alta de Personal
        </button>
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>Usa el buscador local o los filtros del menú izquierdo para segmentar.</p>

      {/* BUSCADOR */}
      <input 
        type="text" 
        placeholder="🔎 Busca a un operador por su nombre o su número de empleado..." 
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        style={{ width: '100%', padding: '15px 20px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--primary)', borderRadius: '12px', color: 'white', fontSize: '15px', marginBottom: '20px', boxShadow: '0 0 15px rgba(217, 119, 6, 0.1)', boxSizing: 'border-box' }}
      />

      {/* FILTROS LOCALES */}
      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', marginBottom: '20px', display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: '140px' }}>
          <label style={labelStyle}>Filtrar Rol</label>
          <select style={inputStyle} value={filtroRol} onChange={e => setFiltroRol(e.target.value)}>
            <option value="TODOS">Todos los roles</option><option value="Alumno">Alumnos</option><option value="Tutor">Tutores (OPT)</option><option value="Lider">Líderes</option><option value="Gerente">Gerentes</option>
          </select>
        </div>
        <div style={{ flex: 1, minWidth: '140px' }}>
          <label style={labelStyle}>Filtrar Estatus</label>
          <select style={inputStyle} value={filtroEstatus} onChange={e => setFiltroEstatus(e.target.value)}>
            <option value="TODOS">Todos</option><option value="En proceso">Activos (En proceso)</option><option value="Liberado">Liberados</option><option value="Baja">Bajas</option><option value="Incapacidad">Incapacidad</option>
          </select>
        </div>
      </div>

      {/* KPIs SUPERIORES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        <div style={{ background: 'var(--card-bg)', padding: '15px', borderRadius: '16px', border: '1px solid var(--border-color)', borderTop: '4px solid var(--warning)' }}>
          <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-muted)', fontSize: '13px', textTransform: 'uppercase' }}>En Proceso (Activos)</h3><p style={{ margin: 0, fontSize: '32px', fontWeight: 800 }}>{kpiActivos}</p>
        </div>
        <div style={{ background: 'var(--card-bg)', padding: '15px', borderRadius: '16px', border: '1px solid var(--border-color)', borderTop: '4px solid var(--success)' }}>
          <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-muted)', fontSize: '13px', textTransform: 'uppercase' }}>Liberados</h3><p style={{ margin: 0, fontSize: '32px', fontWeight: 800 }}>{kpiLiberados}</p>
        </div>
        <div style={{ background: 'var(--card-bg)', padding: '15px', borderRadius: '16px', border: '1px solid var(--border-color)', borderTop: '4px solid var(--danger)' }}>
          <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-muted)', fontSize: '13px', textTransform: 'uppercase' }}>Bajas</h3><p style={{ margin: 0, fontSize: '32px', fontWeight: 800 }}>{kpiBajas}</p>
        </div>
        <div style={{ background: 'var(--card-bg)', padding: '15px', borderRadius: '16px', border: '1px solid var(--border-color)', borderTop: '4px solid #64748b' }}>
          <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-muted)', fontSize: '13px', textTransform: 'uppercase' }}>Incapacidad</h3><p style={{ margin: 0, fontSize: '32px', fontWeight: 800 }}>{kpiIncapacidad}</p>
        </div>
      </div>

      {/* TABLA PRINCIPAL */}
      <div style={{ background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'auto', boxShadow: '0 10px 20px rgba(0,0,0,0.3)', marginBottom: '30px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px', color: 'var(--text-light)' }}>
          <thead>
            <tr>
              <th style={{ padding: '18px 20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Nombre y Contacto</th>
              <th style={{ padding: '18px 20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Generación</th>
              <th style={{ padding: '18px 20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Rol Asignado</th>
              <th style={{ padding: '18px 20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Jerarquía y OPT</th>
              <th style={{ padding: '18px 20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Estatus</th>
              <th style={{ padding: '18px 20px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--primary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
               <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>Cargando información desde tu base de datos...</td></tr>
            ) : usuariosFiltrados.length === 0 ? (
               <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No se encontraron usuarios con estos filtros.</td></tr>
            ) : (
              usuariosFiltrados.map(u => {
                let colRol = u.rol === 'Lider' || u.rol === 'Gerente' ? { bg: 'rgba(14, 165, 233, 0.2)', text: '#38bdf8' } : u.rol === 'Tutor' ? { bg: 'rgba(139, 92, 246, 0.2)', text: '#a78bfa' } : { bg: 'rgba(148, 163, 184, 0.1)', text: '#cbd5e1' };
                let colEstatus = u.estatus === 'Liberado' ? { bg: 'rgba(16, 185, 129, 0.2)', text: '#34d399', b: 'rgba(16, 185, 129, 0.4)' } : u.estatus === 'Baja' || u.estatus === 'Incapacidad' ? { bg: 'rgba(244, 63, 94, 0.2)', text: '#fb7185', b: 'rgba(244, 63, 94, 0.4)' } : { bg: 'rgba(245, 158, 11, 0.2)', text: '#fbbf24', b: 'rgba(245, 158, 11, 0.4)' };

                return (
                  <tr key={u.id} style={{ transition: '0.2s' }}>
                    <td style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)' }}>
                      <strong>{u.nombre_completo || 'N/A'}</strong><br/>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>📱 {u.telefono} <br/> 🆔 Emp: {u.numero_empleado || '-'}</span>
                    </td>
                    <td style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)', color: 'var(--primary)', fontWeight: 'bold' }}>{u.generacion || '-'}</td>
                    <td style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)' }}>
                      <span style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, backgroundColor: colRol.bg, color: colRol.text }}>{u.rol}</span>
                    </td>
                    <td style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)', fontSize: '12px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Líder:</span> <b style={{ color: 'var(--info)' }}>{u.lider || <span style={{color:'var(--danger)'}}>N/A</span>}</b><br/>
                      <span style={{ color: 'var(--text-muted)' }}>OPT:</span> <b style={{ color: 'var(--purple)' }}>{u.opt_asignado || <span style={{color:'var(--danger)'}}>N/A</span>}</b>
                      {u.rol === 'Alumno' && u.fecha_entrega_operacion && (
                        <>
                          <br/>
                          <span style={{ color: 'var(--text-muted)' }}>Banderazo OPT:</span> <b style={{ color: 'var(--success)' }}>{u.fecha_entrega_operacion.split('T')[0]}</b>
                        </>
                      )}
                    </td>
                    <td style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)' }}>
                      <span style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, backgroundColor: colEstatus.bg, color: colEstatus.text, border: `1px solid ${colEstatus.b}` }}>
                        {u.estatus}
                      </span>
                    </td>
                    <td style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => abrirModalEditar(u)} style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>✏️ Editar</button>
                        <button onClick={() => eliminarRegistro(u.id)} style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--border-color)', color: '#f43f5e', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL ALTA / EDICIÓN DE PERSONAL (BLINDADO CON COLOR SÓLIDO Y BLUR) */}
      {modalAbierto && (
        <div style={{ position: 'fixed', zIndex: 9999, left: 0, top: 0, width: '100%', height: '100%', backgroundColor: 'rgba(11, 17, 33, 0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', boxSizing: 'border-box' }}>
          <div style={{ backgroundColor: '#1E293B', padding: '35px', borderRadius: '20px', width: '100%', maxWidth: '600px', boxShadow: '0 25px 50px rgba(0,0,0,0.8)', maxHeight: '90vh', overflowY: 'auto', border: '1px solid #334155' }}>
            <h2 style={{ marginTop: 0, color: 'var(--primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '15px', marginBottom: '20px', fontSize: '24px' }}>
              {idEditando ? 'Editar Expediente de Personal' : 'Alta de Nuevo Personal'}
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Nombre Completo *</label>
                <input type="text" name="nombre_completo" value={formData.nombre_completo} onChange={handleChangeForm} style={inputStyle} />
              </div>
              <div><label style={labelStyle}>Generación (Ej. G122)</label><input type="text" name="generacion" value={formData.generacion} onChange={handleChangeForm} style={inputStyle} /></div>
              <div><label style={labelStyle}>Teléfono Celular *</label><input type="tel" name="telefono" value={formData.telefono} onChange={handleChangeForm} style={inputStyle} /></div>
              <div><label style={labelStyle}>Número de Empleado</label><input type="text" name="numero_empleado" value={formData.numero_empleado} onChange={handleChangeForm} style={inputStyle} /></div>
              <div>
                <label style={labelStyle}>Rol en Sistema *</label>
                <select name="rol" value={formData.rol} onChange={handleChangeForm} style={inputStyle}>
                  <option value="Alumno">Alumno</option>
                  <option value="Tutor">Tutor (OPT)</option>
                  <option value="Lider">Líder Operativo</option>
                  <option value="Gerente">Gerente</option>
                  <option value="Admin">Administrador (Director)</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Estatus Operativo *</label>
                <select name="estatus" value={formData.estatus} onChange={handleChangeForm} style={inputStyle}>
                  <option value="En proceso">En proceso / Activo</option>
                  <option value="Liberado">Liberado</option>
                  <option value="Incapacidad">Incapacidad</option>
                  <option value="Baja">Baja</option>
                </select>
              </div>
              <div><label style={labelStyle}>Empresa</label><input type="text" name="empresa" value={formData.empresa} onChange={handleChangeForm} style={inputStyle} /></div>
              <div><label style={labelStyle}>Unidad de Negocio</label><input type="text" name="unidad_negocio" value={formData.unidad_negocio} onChange={handleChangeForm} style={inputStyle} /></div>
              <div><label style={labelStyle}>Líder Asignado</label><input type="text" name="lider" value={formData.lider} onChange={handleChangeForm} style={inputStyle} /></div>
              <div><label style={labelStyle}>Gerente Asignado</label><input type="text" name="gerente" value={formData.gerente} onChange={handleChangeForm} style={inputStyle} /></div>

              {formData.rol === 'Alumno' && (
                <div style={{ gridColumn: 'span 2', background: 'rgba(139, 92, 246, 0.1)', padding: '20px', borderRadius: '12px', border: '1px dashed var(--purple)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div>
                    <label style={{ ...labelStyle, color: 'var(--purple)' }}>👨‍🏫 Asignar Tutor (OPT)</label>
                    <select name="opt_asignado" value={formData.opt_asignado} onChange={handleChangeForm} style={{ ...inputStyle, marginBottom: 0, borderColor: 'var(--purple)' }}>
                      <option value="">Seleccionar Tutor...</option>
                      {optDisponibles.map(t => <option key={t.id} value={t.nombre_completo}>{t.nombre_completo}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ ...labelStyle, color: 'var(--purple)' }}>📅 Fecha de Entrega a la Operación (Banderazo OPT)</label>
                    <input 
                      type="date" 
                      name="fecha_entrega_operacion" 
                      value={formData.fecha_entrega_operacion} 
                      onChange={handleChangeForm} 
                      style={{ ...inputStyle, marginBottom: 0, borderColor: 'var(--purple)', colorScheme: 'dark' }} 
                    />
                    <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                      * Al ingresar esta fecha, los viajes se anclarán estrictamente a su semana calendario correspondiente. Los kilómetros extra se quedarán en la misma semana y no afectarán las metas subsecuentes.
                    </p>
                  </div>
                </div>
              )}

              {formData.rol === 'Tutor' && (
                <div style={{ gridColumn: 'span 2', background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
                  <label style={{ ...labelStyle, color: 'var(--primary)' }}>🛡️ Certificación Técnica</label>
                  <select name="certificacion_opt" value={formData.certificacion_opt} onChange={handleChangeForm} style={{ ...inputStyle, marginBottom: 0 }}>
                    <option value="Sin Certificación">Sin Certificación</option>
                    <option value="Certificado Oficialmente">Certificado Oficialmente</option>
                    <option value="No Aplica">No Aplica</option>
                  </select>
                </div>
              )}
            </div>

            <div style={{ textAlign: 'right', marginTop: '25px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
              <button onClick={() => setModalAbierto(false)} style={{ backgroundColor: 'transparent', color: 'var(--text-light)', border: '1px solid var(--border-color)', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginRight: '10px', transition: '0.3s' }}>Cancelar</button>
              <button onClick={guardarExpediente} style={{ backgroundColor: 'var(--primary)', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 15px var(--primary-glow)' }}>Guardar Expediente</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}