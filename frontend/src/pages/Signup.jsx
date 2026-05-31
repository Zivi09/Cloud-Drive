import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';

const Signup = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await register(username, password);
    if (res.success) {
      navigate('/');
    } else {
      setError(res.message);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass-panel fade-in" style={{ padding: '40px', width: '100%', maxWidth: '400px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '30px' }}>
          <div style={{ background: '#e8f0fe', padding: '15px', borderRadius: '50%', marginBottom: '15px' }}>
            <UserPlus size={32} color="var(--primary)" />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '500', color: 'var(--text-main)' }}>Create Account</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Join Dobby Ads today</p>
        </div>

        {error && <div style={{ background: 'rgba(217, 48, 37, 0.1)', color: 'var(--danger)', padding: '10px', borderRadius: '4px', marginBottom: '20px', textAlign: 'center', fontSize: '14px' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>Username</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Choose a username" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required 
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>Password</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="Create a password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', padding: '14px', marginTop: '10px' }}>
            Sign Up
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '25px', fontSize: '14px', color: 'var(--text-muted)' }}>
          Already have an account? <Link to="/login" style={{ fontWeight: '500' }}>Log in</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
