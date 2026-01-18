import React, { useState } from 'react';
import api from '../services/api';
import '../styles/Login.css';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async () => {
        setLoading(true);
        try {
            const { data } = await api.post('/auth/login', { email, password });

            // Store Token
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Redirect
            window.location.href = '/';

        } catch (error) {
            console.error(error);
            alert(error.response?.data?.error || "Login Failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-screen">
            <div className="login-content">
                <div className="logo-area">
                    <h1>Fin FollowUp</h1>
                    <p>Track your leads, close more deals.</p>
                </div>

                <div className="card login-card">
                    <label>Email Address</label>
                    <div className="input-group">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="agent@example.com"
                            autoFocus
                            className="full-width-input"
                        />
                    </div>

                    <label style={{ marginTop: 16 }}>Password</label>
                    <div className="input-group">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="********"
                            className="full-width-input"
                        />
                    </div>

                    <button
                        className="btn-primary full-width"
                        onClick={handleLogin}
                        disabled={loading || !email || !password}
                    >
                        {loading ? 'Logging in...' : 'Log In'}
                    </button>

                    <div style={{ marginTop: '24px', textAlign: 'center' }}>
                        <p style={{ fontSize: '14px', color: 'var(--color-secondary)' }}>
                            New User? <br />
                            <span
                                style={{ color: 'var(--color-primary)', fontWeight: '500', cursor: 'pointer' }}
                                onClick={() => navigate('/register')}
                            >
                                Create an account
                            </span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
