import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';
import { FiUser, FiBriefcase, FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';

const Register = () => {
    const [name, setName] = useState('');
    const [agencyName, setAgencyName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data } = await api.post('/auth/register', {
                email,
                password,
                name,
                agencyName
            });

            // Store Token
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            window.location.href = "/";
        } catch (error) {
            console.error("Registration error:", error);
            let msg = error.response?.data?.error || error.message || "Registration Failed";
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
                    <h1>Create Account</h1>
                    <p>Join Fin FollowUp today.</p>
                </div>

                <div className="card login-card">
                    <form onSubmit={handleRegister}>
                        {/* Name Field */}
                        <label>Full Name</label>
                        <div className="input-group">
                            <FiUser color="var(--color-secondary)" size={20} style={{ marginRight: 12 }} />
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Raja Sarangan"
                                required
                            />
                        </div>

                        {/* Agency Field */}
                        <label>Agency / Business Name</label>
                        <div className="input-group">
                            <FiBriefcase color="var(--color-secondary)" size={20} style={{ marginRight: 12 }} />
                            <input
                                type="text"
                                value={agencyName}
                                onChange={(e) => setAgencyName(e.target.value)}
                                placeholder="e.g. FinUp Services"
                                required
                            />
                        </div>

                        {/* Email Field */}
                        <label>Email Address</label>
                        <div className="input-group">
                            <FiMail color="var(--color-secondary)" size={20} style={{ marginRight: 12 }} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="agent@example.com"
                                required
                            />
                        </div>

                        {/* Password Field */}
                        <label>Password</label>
                        <div className="input-group" style={{ position: 'relative' }}>
                            <FiLock color="var(--color-secondary)" size={20} style={{ marginRight: 12 }} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Create a strong password"
                                required
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

                        <button
                            type="submit"
                            className="btn-primary full-width"
                            disabled={loading}
                        >
                            {loading ? 'Creating Account...' : 'Sign Up'}
                        </button>
                    </form>

                    <button
                        className="btn-text"
                        style={{ marginTop: 24, width: '100%', textAlign: 'center' }}
                        onClick={() => navigate('/login')}
                    >
                        Already have an account? <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Log In</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Register;
