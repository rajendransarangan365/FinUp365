import React, { useState, useEffect } from 'react';
import { FaTimes, FaWhatsapp, FaPlus, FaTrash } from 'react-icons/fa';
import api from '../services/api';
import '../styles/SettingsDialog.css'; // Reusing settings styles for consistency

const TemplateManagerDialog = ({ isOpen, onClose }) => {
    const [templates, setTemplates] = useState([]);
    const [newTemplate, setNewTemplate] = useState({ title: '', content: '' });
    const [isAddingTemplate, setIsAddingTemplate] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Get user from local storage
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        if (isOpen && user?._id) {
            fetchTemplates();
        }
    }, [isOpen]);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            // Handle both _id and id just in case
            const userId = user._id || user.id;
            const { data } = await api.get(`/templates/${userId}`);
            setTemplates(data);
            setError('');
        } catch (error) {
            console.error("Failed to load templates", error);
            setError('Failed to load templates. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddTemplate = async () => {
        if (!newTemplate.title || !newTemplate.content) {
            alert("Title and Message are required");
            return;
        }

        try {
            setLoading(true);
            const userId = user._id || user.id;

            console.log("Adding template for user:", userId); // Debug log

            await api.post('/templates', {
                userId: userId,
                title: newTemplate.title,
                content: newTemplate.content
            });

            setNewTemplate({ title: '', content: '' });
            setIsAddingTemplate(false);
            fetchTemplates();
        } catch (error) {
            console.error("Add template failed:", error.response || error);
            alert(`Failed to add template: ${error.response?.data?.error || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTemplate = async (id) => {
        if (!window.confirm("Delete this template?")) return;
        try {
            await api.delete(`/templates/${id}`);
            fetchTemplates();
        } catch (error) {
            console.error("Delete failed:", error);
            alert("Failed to delete template");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="dialog-overlay" onClick={onClose}>
            <div className="settings-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                <header className="dialog-header">
                    <h2><FaWhatsapp style={{ color: '#25D366' }} /> Message Templates</h2>
                    <button className="close-btn" onClick={onClose}>
                        <FaTimes />
                    </button>
                </header>

                <div className="dialog-body" style={{ height: '400px', overflowY: 'auto', padding: '20px' }}>
                    {error && <div className="message error">{error}</div>}

                    {!isAddingTemplate ? (
                        <>
                            <button
                                className="btn-primary"
                                onClick={() => setIsAddingTemplate(true)}
                                style={{ width: '100%', marginBottom: '20px', background: '#25D366', borderColor: '#25D366' }}
                            >
                                <FaPlus /> Add New Template
                            </button>

                            {loading && <p style={{ textAlign: 'center' }}>Loading...</p>}

                            <div className="templates-list" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {!loading && templates.length === 0 ? (
                                    <div className="empty-state" style={{ textAlign: 'center', padding: '40px 20px', color: '#b2bec3' }}>
                                        <div style={{
                                            background: '#f1f2f6',
                                            width: '80px',
                                            height: '80px',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            margin: '0 auto 15px auto'
                                        }}>
                                            <FaWhatsapp size={40} color="#dfe6e9" />
                                        </div>
                                        <h4 style={{ margin: '0 0 5px 0', color: '#636e72' }}>No Templates Yet</h4>
                                        <p style={{ margin: 0, fontSize: '0.9rem' }}>Create your first WhatsApp template to get started.</p>
                                    </div>
                                ) : (
                                    templates.map(t => (
                                        <div key={t._id} className="template-card" style={{ padding: '15px', border: '1px solid #eee', borderRadius: '8px', position: 'relative' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                <h4 style={{ margin: 0 }}>{t.title}</h4>
                                                <button
                                                    onClick={() => handleDeleteTemplate(t._id)}
                                                    style={{ background: 'none', border: 'none', color: '#ff7675', cursor: 'pointer' }}
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#636e72', whiteSpace: 'pre-line' }}>
                                                {t.content}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="add-template-form">
                            <h3>New Template</h3>
                            <input
                                type="text"
                                placeholder="Template Title (e.g. Bike Loan Docs)"
                                value={newTemplate.title}
                                onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
                                style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                            />
                            <textarea
                                placeholder="Message Content (Emojis supported 😃)"
                                value={newTemplate.content}
                                onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                                style={{ width: '100%', padding: '10px', minHeight: '120px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #ddd', fontFamily: 'inherit' }}
                            />
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    className="btn-secondary"
                                    onClick={() => setIsAddingTemplate(false)}
                                    style={{ flex: 1 }}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn-primary"
                                    onClick={handleAddTemplate}
                                    style={{ flex: 1, background: '#25D366', borderColor: '#25D366' }}
                                    disabled={loading}
                                >
                                    {loading ? 'Saving...' : 'Save Template'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};

export default TemplateManagerDialog;
