import React, { useState, useRef } from 'react';
import '../styles/StatusUpdateDialog.css';
import { FiX, FiCheck, FiCamera, FiLock, FiUser, FiBriefcase } from 'react-icons/fi';
import api from '../services/api';

const ProfileDialog = ({ user, onClose, onUpdateUser }) => {
    const [name, setName] = useState(user.name || '');
    const [agencyName, setAgencyName] = useState(user.agencyName || '');
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(user.photoUrl || null);

    // Password State
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('details'); // 'details' or 'security'
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('agencyName', agencyName);
            if (file) formData.append('photo', file);

            const { data } = await api.post('/auth/update-profile', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            // Update Local Storage
            localStorage.setItem('user', JSON.stringify(data.user));
            if (onUpdateUser) onUpdateUser(data.user);

            alert("Profile updated!");
            // Don't close, user might want to see the change
        } catch (error) {
            console.error(error);
            alert("Update failed");
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            alert("New passwords do not match!");
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/change-password', {
                oldPassword,
                newPassword
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            alert("Password updated successfully!");
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            alert(error.response?.data?.error || "Update failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dialog-overlay">
            <div className="dialog-card" style={{ maxWidth: '400px', padding: 0, overflow: 'hidden' }}>

                {/* Header with Gradient */}
                <div style={{
                    background: 'linear-gradient(135deg, #868CFF 0%, #4318FF 100%)',
                    padding: '24px',
                    color: 'white',
                    position: 'relative',
                    textAlign: 'center'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute', top: 16, right: 16,
                            background: 'rgba(255,255,255,0.2)', border: 'none',
                            borderRadius: '50%', width: 32, height: 32,
                            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                        }}
                    >
                        <FiX />
                    </button>

                    {/* Avatar */}
                    <div style={{ position: 'relative', display: 'inline-block', marginBottom: '16px' }}>
                        <div
                            style={{
                                width: '100px', height: '100px',
                                borderRadius: '50%',
                                background: 'white',
                                border: '4px solid rgba(255,255,255,0.3)',
                                overflow: 'hidden',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '32px', color: '#4318FF', fontWeight: 'bold'
                            }}
                        >
                            {preview ? (
                                <img src={preview} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                user.name?.charAt(0) || 'U'
                            )}
                        </div>
                        <button
                            onClick={() => fileInputRef.current.click()}
                            style={{
                                position: 'absolute', bottom: 0, right: 0,
                                background: '#FFF', border: 'none',
                                borderRadius: '50%', width: 32, height: 32,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#4318FF'
                            }}
                        >
                            <FiCamera size={16} />
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleFileChange}
                            accept="image/*"
                        />
                    </div>

                    <h2 style={{ margin: 0, fontSize: '20px' }}>{user.name}</h2>
                    <p style={{ margin: '4px 0 0', opacity: 0.8, fontSize: '14px' }}>{user.agencyName}</p>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid #eee' }}>
                    <button
                        style={{ flex: 1, padding: '16px', border: 'none', background: activeTab === 'details' ? '#fff' : '#f9f9f9', cursor: 'pointer', fontWeight: activeTab === 'details' ? 'bold' : 'normal', color: activeTab === 'details' ? '#4318FF' : '#666' }}
                        onClick={() => setActiveTab('details')}
                    >
                        Edit Profile
                    </button>
                    <button
                        style={{ flex: 1, padding: '16px', border: 'none', background: activeTab === 'security' ? '#fff' : '#f9f9f9', cursor: 'pointer', fontWeight: activeTab === 'security' ? 'bold' : 'normal', color: activeTab === 'security' ? '#4318FF' : '#666' }}
                        onClick={() => setActiveTab('security')}
                    >
                        Security
                    </button>
                </div>

                <div style={{ padding: '24px' }}>
                    {activeTab === 'details' && (
                        <form onSubmit={handleUpdateProfile}>
                            <div className="form-group" style={{ marginBottom: '16px' }}>
                                <label style={{ fontSize: '12px', color: '#666', marginBottom: '8px', display: 'block' }}>Full Name</label>
                                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: '8px', padding: '0 12px' }}>
                                    <FiUser color="#aaa" />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        style={{ border: 'none', padding: '12px', width: '100%', outline: 'none' }}
                                    />
                                </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: '24px' }}>
                                <label style={{ fontSize: '12px', color: '#666', marginBottom: '8px', display: 'block' }}>Agency Name</label>
                                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: '8px', padding: '0 12px' }}>
                                    <FiBriefcase color="#aaa" />
                                    <input
                                        type="text"
                                        value={agencyName}
                                        onChange={e => setAgencyName(e.target.value)}
                                        style={{ border: 'none', padding: '12px', width: '100%', outline: 'none' }}
                                    />
                                </div>
                            </div>
                            <button type="submit" className="save-btn" disabled={loading} style={{ width: '100%' }}>
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </form>
                    )}

                    {activeTab === 'security' && (
                        <form onSubmit={handleChangePassword}>
                            <div className="form-group" style={{ marginBottom: '16px' }}>
                                <label style={{ fontSize: '12px', color: '#666', marginBottom: '8px', display: 'block' }}>Current Password</label>
                                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: '8px', padding: '0 12px' }}>
                                    <FiLock color="#aaa" />
                                    <input
                                        type="password"
                                        value={oldPassword}
                                        onChange={e => setOldPassword(e.target.value)}
                                        placeholder="Verify it's you"
                                        style={{ border: 'none', padding: '12px', width: '100%', outline: 'none' }}
                                    />
                                </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: '16px' }}>
                                <label style={{ fontSize: '12px', color: '#666', marginBottom: '8px', display: 'block' }}>New Password</label>
                                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: '8px', padding: '0 12px' }}>
                                    <FiLock color="#aaa" />
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        placeholder="Create new password"
                                        style={{ border: 'none', padding: '12px', width: '100%', outline: 'none' }}
                                    />
                                </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: '24px' }}>
                                <label style={{ fontSize: '12px', color: '#666', marginBottom: '8px', display: 'block' }}>Confirm New Password</label>
                                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: '8px', padding: '0 12px' }}>
                                    <FiCheck color="#aaa" />
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm match"
                                        style={{ border: 'none', padding: '12px', width: '100%', outline: 'none' }}
                                    />
                                </div>
                            </div>
                            <button type="submit" className="save-btn danger" disabled={loading} style={{ width: '100%' }}>
                                {loading ? 'Updating...' : 'Update Password'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfileDialog;
