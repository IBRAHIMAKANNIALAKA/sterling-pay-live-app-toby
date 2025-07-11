import React, { useState, useEffect } from 'react';
import axios from 'axios';
// This line has been cleaned up to only import the icons we actually use.
import { Globe, LogOut, UserPlus, Home, FileText, Plus, XCircle, Settings as SettingsIcon } from 'lucide-react';

// --- HELPER to get the auth token ---
const getAuthToken = () => localStorage.getItem('sterling-pay-token');

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
            const response = await axios.post('https://sterling-pay-server-final.onrender.com', { email, password });
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
            await axios.post('https://sterling-pay-server-final.onrender.com', { fullName, email, password });
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

// --- DASHBOARD COMPONENT ---
const Dashboard = () => {
    const [wallets, setWallets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWallets = async () => {
            const token = getAuthToken();
            if (!token) { setLoading(false); return; }

            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const response = await axios.get('https://sterling-pay-server-final.onrender.com', config);
                setWallets(response.data);
            } catch (err) {
                console.error("Could not fetch wallets", err);
            } finally {
                setLoading(false);
            }
        };
        fetchWallets();
    }, []);

    if (loading) return <div style={{ padding: '40px' }}>Loading dashboard...</div>;

    return (
        <div style={{ padding: '40px' }}>
            <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '24px' }}>Dashboard</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Your Balances</h3>
                {wallets.map(wallet => (
                    <div key={wallet.currency} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
                        <span style={{ fontSize: '1.125rem' }}>
                            {wallet.currency === 'GBP' ? '🇬🇧' : wallet.currency === 'USD' ? '🇺🇸' : '🇪🇺'} {wallet.currency}
                        </span>
                        <span style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>
                            {new Intl.NumberFormat('en-GB', { style: 'currency', currency: wallet.currency }).format(wallet.balance)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- INVOICES PAGE COMPONENT ---
const InvoicesPage = ({ openModal, invoiceListKey }) => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInvoices = async () => {
            setLoading(true);
            const token = getAuthToken();
            if (!token) { setLoading(false); return; }
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const response = await axios.get('https://sterling-pay-server-final.onrender.com', config);
                setInvoices(response.data);
            } catch (err) {
                console.error("Could not fetch invoices", err);
            } finally {
                setLoading(false);
            }
        };
        
        fetchInvoices();
    }, [invoiceListKey]);

    return (
         <div style={{ padding: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1f2937' }}>Invoices</h2>
                <button onClick={openModal} style={{ padding: '10px 16px', backgroundColor: '#0A2342', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={18} /> New Invoice
                </button>
            </div>
            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <th style={{ padding: '12px 16px' }}>Client</th>
                            <th style={{ padding: '12px 16px' }}>Amount</th>
                            <th style={{ padding: '12px 16px' }}>Due Date</th>
                            <th style={{ padding: '12px 16px' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4" style={{ textAlign: 'center', padding: '16px' }}>Loading invoices...</td></tr>
                        ) : invoices.length === 0 ? (
                            <tr><td colSpan="4" style={{ textAlign: 'center', padding: '16px' }}>No invoices found.</td></tr>
                        ) : (
                            invoices.map(invoice => (
                                <tr key={invoice.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                    <td style={{ padding: '12px 16px', fontWeight: '500' }}>{invoice.client_name}</td>
                                    <td style={{ padding: '12px 16px' }}>{new Intl.NumberFormat('en-GB', { style: 'currency', currency: invoice.currency }).format(invoice.amount)}</td>
                                    <td style={{ padding: '12px 16px' }}>{invoice.due_date}</td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <span style={{ padding: '4px 8px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600',
                                            backgroundColor: invoice.status === 'Paid' ? '#dcfce7' : '#fef9c3',
                                            color: invoice.status === 'Paid' ? '#166534' : '#713f12'
                                        }}>{invoice.status}</span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- NEW INVOICE MODAL COMPONENT ---
const NewInvoiceModal = ({ closeModal, onInvoiceCreated }) => {
    const [clientName, setClientName] = useState('');
    const [clientEmail, setClientEmail] = useState('');
    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState('GBP');
    const [dueDate, setDueDate] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const token = getAuthToken();
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const invoiceData = { clientName, clientEmail, amount, currency, dueDate };
            await axios.post('https://sterling-pay-server-final.onrender.com', invoiceData, config);
            onInvoiceCreated();
            closeModal();
        } catch (err) {
            setError('Failed to create invoice. Please check all fields.');
            setLoading(false);
        }
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', width: '100%', maxWidth: '500px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>New Invoice</h3>
                    <button onClick={closeModal}><XCircle /></button>
                </div>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <input type="text" placeholder="Client Name" value={clientName} onChange={e => setClientName(e.target.value)} required style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }} />
                    <input type="email" placeholder="Client Email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} required style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }} />
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <input type="number" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} required style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', flex: 1 }} />
                        <select value={currency} onChange={e => setCurrency(e.target.value)} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}>
                            <option>GBP</option>
                            <option>USD</option>
                            <option>EUR</option>
                        </select>
                    </div>
                    <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }} />
                    {error && <p style={{ color: 'red', fontSize: '0.875rem' }}>{error}</p>}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                        <button type="button" onClick={closeModal} style={{ padding: '10px 16px', borderRadius: '5px', border: '1px solid #ccc' }}>Cancel</button>
                        <button type="submit" disabled={loading} style={{ padding: '10px 16px', borderRadius: '5px', border: 'none', backgroundColor: '#0A2342', color: 'white', cursor: 'pointer' }}>
                            {loading ? 'Creating...' : 'Create Invoice'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- SETTINGS PAGE COMPONENT ---
const SettingsPage = () => {
    const [qrCode, setQrCode] = useState('');
    const [otp, setOtp] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');

    const handleGenerate = async () => {
        setMessage('');
        const token = getAuthToken();
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.post('https://sterling-pay-server-final.onrender.com', {}, config);
            setQrCode(response.data.qrCode);
        } catch (err) {
            setMessage('Could not generate QR code. Please try again.');
            setMessageType('error');
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        setMessage('');
        const token = getAuthToken();
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.post('https://sterling-pay-server-final.onrender.com', { token: otp }, config);
            if (response.data.verified) {
                setMessage('2FA has been enabled successfully!');
                setMessageType('success');
                setQrCode(''); 
            }
        } catch (err) {
            setMessage(err.response?.data?.error || 'Verification failed.');
            setMessageType('error');
        }
    };

    return (
        <div style={{ padding: '40px' }}>
            <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '24px' }}>Security Settings</h2>
            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Two-Factor Authentication (2FA)</h3>
                <p style={{ color: '#4b5563', marginTop: '8px' }}>Add an extra layer of security to your account.</p>
                
                {!qrCode && (
                    <button onClick={handleGenerate} style={{ marginTop: '16px', padding: '10px 16px', backgroundColor: '#0A2342', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                        Enable 2FA
                    </button>
                )}

                {qrCode && (
                    <div style={{ marginTop: '24px' }}>
                        <p>1. Scan this QR code with your authenticator app (like Google Authenticator).</p>
                        <img src={qrCode} alt="2FA QR Code" style={{ margin: '16px 0' }} />
                        <p>2. Enter the 6-digit code from your app to verify and complete setup.</p>
                        <form onSubmit={handleVerify} style={{ marginTop: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <input type="text" value={otp} onChange={e => setOtp(e.target.value)} maxLength="6" required style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', width: '120px', textAlign: 'center', fontSize: '1.25rem' }} />
                            <button type="submit" style={{ padding: '10px 16px', backgroundColor: '#2CA58D', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Verify</button>
                        </form>
                    </div>
                )}
                
                {message && (
                    <p style={{ marginTop: '16px', color: messageType === 'success' ? '#16a34a' : '#ef4444', fontWeight: '500' }}>
                        {message}
                    </p>
                )}
            </div>
        </div>
    );
};


// --- MAIN APP COMPONENT ---
const MainApp = ({ onLogout, userEmail }) => {
    const [activePage, setActivePage] = useState('dashboard');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [invoiceListKey, setInvoiceListKey] = useState(0); 

    const renderPage = () => {
        switch (activePage) {
            case 'dashboard': return <Dashboard />;
            case 'invoices': return <InvoicesPage key={invoiceListKey} openModal={() => setIsModalOpen(true)} />;
            case 'settings': return <SettingsPage />;
            default: return <Dashboard />;
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: 'sans-serif' }}>
            {isModalOpen && <NewInvoiceModal closeModal={() => setIsModalOpen(false)} onInvoiceCreated={() => setInvoiceListKey(prevKey => prevKey + 1)} />}
            <aside style={{ width: '256px', backgroundColor: 'white', borderRight: '1px solid #e5e7eb', padding: '16px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', marginBottom: '32px' }}>
                    <Globe style={{ color: '#2CA58D' }} size={32}/>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0A2342' }}>SterlingPay</h1>
                </div>
                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button onClick={() => setActivePage('dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', borderRadius: '8px', textAlign: 'left', background: activePage === 'dashboard' ? '#0A2342' : 'transparent', color: activePage === 'dashboard' ? 'white' : '#374151' }}><Home size={20} /> Dashboard</button>
                    <button onClick={() => setActivePage('invoices')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', borderRadius: '8px', textAlign: 'left', background: activePage === 'invoices' ? '#0A2342' : 'transparent', color: activePage === 'invoices' ? 'white' : '#374151' }}><FileText size={20} /> Invoices</button>
                    <button onClick={() => setActivePage('settings')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', borderRadius: '8px', textAlign: 'left', background: activePage === 'settings' ? '#0A2342' : 'transparent', color: activePage === 'settings' ? 'white' : '#374151' }}><SettingsIcon size={20} /> Settings</button>
                </nav>
                <button onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', borderRadius: '8px', textAlign: 'left', color: '#4b5563' }}><LogOut size={20} /> Logout</button>
            </aside>
            <div style={{ flex: 1 }}>
                <header style={{ padding: '16px 40px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', borderBottom: '1px solid #e5e7eb', backgroundColor: 'white' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{userEmail}</span>
                    </div>
                </header>
                <main>
                    {renderPage()}
                </main>
            </div>
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
