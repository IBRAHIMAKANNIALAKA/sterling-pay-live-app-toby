import React, { useState, useEffect } from 'react';
import axios from 'axios';
// This line has been cleaned up to only import the icons we actually use.
import { Globe, LogOut, UserPlus } from 'lucide-react';

// --- LOGIN COMPONENT ---
const LoginPage = ({ onLoginSuccess, onNavigateToRegister }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            // This URL must match the address of your running server
            const response = await axios.post('http://localhost:5000/api/login', { email, password });
            onLoginSuccess(response.data.token);
        } catch (err) {
            setError('Invalid email or password. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: 'sans-serif' }}>
            <div style={{ width: '100%', maxWidth: '400px', padding: '32px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
                        <Globe style={{ color: '#2CA58D' }} size={40}/>
                        <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', color: '#0A2342' }}>SterlingPay</h1>
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>Welcome Back</h2>
                    <p style={{ marginTop: '8px', color: '#4b5563' }}>Sign in to manage your global payments.</p>
                </div>
                <form style={{ marginTop: '32px' }} onSubmit={handleLogin}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <input id="email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: '8px' }} placeholder="Email address" />
                        <input id="password" name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: '8px' }} placeholder="Password" />
                    </div>
                    {error && <p style={{ fontSize: '0.875rem', textAlign: 'center', color: '#ef4444', marginTop: '16px' }}>{error}</p>}
                    <div style={{ marginTop: '24px' }}>
                        <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px 16px', border: '1px solid transparent', fontSize: '0.875rem', fontWeight: '500', borderRadius: '8px', color: 'white', backgroundColor: '#0A2342', cursor: 'pointer' }}>
                            {loading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </div>
                </form>
                 <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.875rem', color: '#4b5563' }}>
                    Don't have an account?{' '}
                    <button onClick={onNavigateToRegister} style={{ fontWeight: '500', color: '#2CA58D', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                        Sign Up
                    </button>
                </p>
            </div>
        </div>
    );
};

// --- REGISTER PAGE COMPONENT ---
const RegisterPage = ({ onNavigateToLogin }) => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            await axios.post('http://localhost:5000/api/register', { fullName, email, password });
            setSuccess('Registration successful! Please log in.');
            setTimeout(() => {
                onNavigateToLogin();
            }, 2000);
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Registration failed. Please try again.';
            setError(errorMessage);
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: 'sans-serif' }}>
            <div style={{ width: '100%', maxWidth: '400px', padding: '32px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
                        <UserPlus style={{ color: '#2CA58D' }} size={40}/>
                        <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', color: '#0A2342' }}>Create Account</h1>
                    </div>
                    <p style={{ marginTop: '8px', color: '#4b5563' }}>Join SterlingPay and start making global payments.</p>
                </div>
                <form style={{ marginTop: '32px' }} onSubmit={handleRegister}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <input id="fullName" name="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: '8px' }} placeholder="Full Name" />
                        <input id="email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: '8px' }} placeholder="Email address" />
                        <input id="password" name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: '8px' }} placeholder="Password" />
                    </div>
                    {error && <p style={{ fontSize: '0.875rem', textAlign: 'center', color: '#ef4444', marginTop: '16px' }}>{error}</p>}
                    {success && <p style={{ fontSize: '0.875rem', textAlign: 'center', color: '#16a34a', marginTop: '16px' }}>{success}</p>}
                    <div style={{ marginTop: '24px' }}>
                        <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px 16px', border: '1px solid transparent', fontSize: '0.875rem', fontWeight: '500', borderRadius: '8px', color: 'white', backgroundColor: '#0A2342', cursor: 'pointer' }}>
                            {loading ? 'Creating Account...' : 'Sign Up'}
                        </button>
                    </div>
                </form>
                 <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.875rem', color: '#4b5563' }}>
                    Already have an account?{' '}
                    <button onClick={onNavigateToLogin} style={{ fontWeight: '500', color: '#2CA58D', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                        Log In
                    </button>
                </p>
            </div>
        </div>
    );
};

// --- MAIN APP COMPONENT ---
const MainApp = ({ onLogout, userEmail }) => {
    return (
        <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', color: '#0A2342' }}>Welcome to SterlingPay!</h1>
                <button onClick={onLogout} style={{ padding: '10px 15px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <LogOut size={16} />
                    Logout
                </button>
            </div>
            <hr style={{ margin: '20px 0' }} />
            <p style={{ fontSize: '1.25rem' }}>You are logged in as: <strong>{userEmail}</strong></p>
        </div>
    );
};

// --- ROOT APP COMPONENT ---
export default function App() {
    const [token, setToken] = useState(null);
    const [userEmail, setUserEmail] = useState('');
    const [currentPage, setCurrentPage] = useState('login'); 

    useEffect(() => {
        const storedToken = localStorage.getItem('sterling-pay-token');
        if (storedToken) {
            const storedEmail = localStorage.getItem('sterling-pay-email');
            setToken(storedToken);
            setUserEmail(storedEmail || '');
        }
    }, []);

    const handleLoginSuccess = (newToken) => {
        localStorage.setItem('sterling-pay-token', newToken);
        setToken(newToken);
        try {
            const emailUsedToLogin = JSON.parse(atob(newToken.split('.')[1])).user.email;
            localStorage.setItem('sterling-pay-email', emailUsedToLogin);
            setUserEmail(emailUsedToLogin);
        } catch (e) {
            console.error("Failed to decode token", e);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('sterling-pay-token');
        localStorage.removeItem('sterling-pay-email');
        setToken(null);
        setUserEmail('');
        setCurrentPage('login');
    };

    if (token) {
        return <MainApp onLogout={handleLogout} userEmail={userEmail} />;
    }

    if (currentPage === 'login') {
        return <LoginPage onLoginSuccess={handleLoginSuccess} onNavigateToRegister={() => setCurrentPage('register')} />;
    } else {
        return <RegisterPage onNavigateToLogin={() => setCurrentPage('login')} />;
    }
}
