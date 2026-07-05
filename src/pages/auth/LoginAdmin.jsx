import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService'; // Ajusta la ruta si es necesario

export default function LoginAdmin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    setErrorMsg('');

    const resultado = await authService.loginAdmin(email, password);

    if (resultado.exito) {
      navigate('/admin/dashboard'); // Redirige al panel si es exitoso
    } else {
      setErrorMsg(resultado.mensaje);
    }
    setCargando(false);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0f172a' }}>
      <form onSubmit={handleSubmit} style={{ background: '#1e293b', padding: '40px', borderRadius: '12px', width: '100%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
        <h2 style={{ color: '#fbbf24', textAlign: 'center', marginBottom: '20px' }}>UDAT Admin</h2>
        
        {errorMsg && <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px', textAlign: 'center' }}>{errorMsg}</div>}

        <label style={{ color: '#94a3b8', display: 'block', marginBottom: '5px', fontSize: '14px' }}>Correo Electrónico</label>
        <input 
          type="email" 
          required 
          value={email} 
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: 'white', boxSizing: 'border-box' }}
        />

        <label style={{ color: '#94a3b8', display: 'block', marginBottom: '5px', fontSize: '14px' }}>Contraseña</label>
        <input 
          type="password" 
          required 
          value={password} 
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: '100%', padding: '12px', marginBottom: '30px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: 'white', boxSizing: 'border-box' }}
        />

        <button 
          type="submit" 
          disabled={cargando}
          style={{ width: '100%', padding: '14px', background: '#fbbf24', color: '#0f172a', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' }}
        >
          {cargando ? 'Iniciando sesión...' : 'Entrar al Centro de Mando'}
        </button>
      </form>
    </div>
  );
}