import React, { useState } from 'react';
import api from '../services/api';
import '../styles/Login.css';
import { useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import logo from '../assets/logo.png';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
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
            let msg = error.response?.data?.error || "Login Failed";
            if (typeof msg === 'object') msg = JSON.stringify(msg);
            alert(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-screen">
            <div className="login-content">
                <div className="logo-area">
                    <img src={logo} alt="Fin FollowUp" style={{ maxWidth: '280px', height: 'auto', marginBottom: '1rem' }} />
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
                    <div className="input-group" style={{ position: 'relative' }}>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="********"
                            className="full-width-input"
                        />
                        <div
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: 'absolute',
                                right: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                cursor: 'pointer',
                                color: '#aaa',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                        </div>
                    </div>

                    <div style={{ textAlign: 'right', marginTop: '8px' }}>
                        <span
                            style={{ fontSize: '13px', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: '500' }}
                            onClick={() => navigate('/forgot-password')}
                        >
                            Forgot Password?
                        </span>
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
