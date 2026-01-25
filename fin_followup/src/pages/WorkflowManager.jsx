import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaTrash, FaCheck, FaArrowLeft, FaEdit } from 'react-icons/fa';
import api from '../services/api';
import '../styles/Home.css'; // Reusing Home styles for consistency

const WorkflowManager = () => {
    const navigate = useNavigate();
    const [workflows, setWorkflows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));

    const [isEditing, setIsEditing] = useState(false);
    const [currentWorkflow, setCurrentWorkflow] = useState({
        name: '',
        steps: ['New', 'In Progress', 'Closed'], // Default steps
        description: ''
    });

    useEffect(() => {
        fetchWorkflows();
    }, []);

    const fetchWorkflows = async () => {
        try {
            const { data } = await api.get(`/workflows/${user._id || user.id}`);
            setWorkflows(data);

            // Refresh user to get latest activeWorkflowId
            // In a real app we might have a user context or refetch /me
            const localUser = JSON.parse(localStorage.getItem('user'));
            if (localUser) {
                // We rely on the active workflow id being correct in local storage or 
                // we need to fetch the user again? 
                // For now, let's trust the logic where activation updates the list.
                // Or better, let's assume we need to know who is active.
                // The workflow object has 'isActive' logic on server? 
                // No, User has activeWorkflowId.
            }
        } catch (error) {
            console.error("Failed to fetch workflows", error);
        } finally {
            setLoading(false);
        }
    };

    const handleActivate = async (workflowId) => {
        try {
            const { data } = await api.patch(`/workflows/${workflowId}/activate`, {
                userId: user._id || user.id,
                isActive: true
            });

            // Update local user
            const updatedUser = { ...user, activeWorkflowId: data.activeWorkflowId };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);

            // Refresh list to potentially show active state UI
            fetchWorkflows();
            alert('Workflow activated! Dashboard will now use this workflow.');
        } catch (error) {
            console.error(error);
            alert('Failed to activate workflow');
        }
    };

    const handleDeactivate = async (workflowId) => {
        try {
            const { data } = await api.patch(`/workflows/${workflowId}/activate`, {
                userId: user._id || user.id,
                isActive: false
            });

            // Update local user
            const updatedUser = { ...user, activeWorkflowId: null };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);

            fetchWorkflows();
            alert('Workflow deactivated. Dashboard returned to standard view.');
        } catch (error) {
            console.error(error);
            alert('Failed to deactivate');
        }
    };

    const handleSave = async () => {
        if (!currentWorkflow.name.trim()) return alert("Name is required");
        if (currentWorkflow.steps.length < 2) return alert("At least 2 steps required");

        try {
            if (currentWorkflow._id) {
                // Update
                await api.put(`/workflows/${currentWorkflow._id}`, currentWorkflow);
            } else {
                // Create
                await api.post('/workflows', {
                    ...currentWorkflow,
                    userId: user._id || user.id
                });
            }
            setIsEditing(false);
            setCurrentWorkflow({ name: '', steps: ['New', 'In Progress', 'Closed'], description: '' });
            fetchWorkflows();
        } catch (error) {
            console.error(error);
            alert('Failed to save workflow');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await api.delete(`/workflows/${id}`);
            fetchWorkflows();
        } catch (error) {
            console.error(error);
        }
    };

    // --- Steps Management ---
    const updateStep = (index, val) => {
        const newSteps = [...currentWorkflow.steps];
        newSteps[index] = val;
        setCurrentWorkflow({ ...currentWorkflow, steps: newSteps });
    };

    const addStep = () => {
        setCurrentWorkflow({ ...currentWorkflow, steps: [...currentWorkflow.steps, 'Next Step'] });
    };

    const removeStep = (index) => {
        const newSteps = currentWorkflow.steps.filter((_, i) => i !== index);
        setCurrentWorkflow({ ...currentWorkflow, steps: newSteps });
    };

    return (
        <div className="crm-dashboard" style={{ background: '#f8f9fa', minHeight: '100vh', padding: '20px' }}>
            <header className="crm-header" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>
                        <FaArrowLeft />
                    </button>
                    <h2 style={{ margin: 0 }}>Workflow Manager</h2>
                </div>
            </header>

            {isEditing ? (
                <div className="crm-section" style={{ maxWidth: '600px', margin: '0 auto', background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                    <h3>{currentWorkflow._id ? 'Edit Workflow' : 'Create New Workflow'}</h3>

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Workflow Name</label>
                        <input
                            type="text"
                            className="crm-input"
                            value={currentWorkflow.name}
                            onChange={(e) => setCurrentWorkflow({ ...currentWorkflow, name: e.target.value })}
                            placeholder="e.g. Sales Pipeline"
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                        />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Steps</label>
                        {currentWorkflow.steps.map((step, index) => (
                            <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                <span style={{ padding: '10px', background: '#eee', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>{index + 1}</span>
                                <input
                                    type="text"
                                    value={step}
                                    onChange={(e) => updateStep(index, e.target.value)}
                                    style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #eee' }}
                                />
                                <button onClick={() => removeStep(index)} style={{ color: 'red', background: 'none', border: 'none' }}><FaTrash /></button>
                            </div>
                        ))}
                        <button onClick={addStep} style={{ color: 'var(--color-primary)', background: 'none', border: 'none', fontWeight: 'bold', marginTop: '5px' }}>+ Add Step</button>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                        <button onClick={() => setIsEditing(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #ddd', background: 'white' }}>Cancel</button>
                        <button onClick={handleSave} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'black', color: 'white' }}>Save Workflow</button>
                    </div>
                </div>
            ) : (
                <div className="crm-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3>My Workflows</h3>
                        <button onClick={() => {
                            setCurrentWorkflow({ name: '', steps: ['New', 'In Progress', 'Closed'], description: '' });
                            setIsEditing(true);
                        }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'black', color: 'white', borderRadius: '30px', border: 'none' }}>
                            <FaPlus /> New Workflow
                        </button>
                    </div>

                    <div style={{ display: 'grid', gap: '15px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                        {workflows.map(wf => {
                            const isActive = user.activeWorkflowId === wf._id;
                            return (
                                <div key={wf._id} style={{
                                    background: 'white',
                                    padding: '20px',
                                    borderRadius: '12px',
                                    border: isActive ? '2px solid var(--color-primary)' : '1px solid #eee',
                                    position: 'relative'
                                }}>
                                    {isActive && <div style={{ position: 'absolute', top: '10px', right: '10px', color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}><FaCheck /> ACTIVE</div>}

                                    <h4 style={{ margin: '0 0 10px 0', fontSize: '1.2rem' }}>{wf.name}</h4>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '20px' }}>
                                        {wf.steps.map((s, i) => (
                                            <span key={i} style={{ fontSize: '0.75rem', padding: '4px 8px', background: '#f0f0f0', borderRadius: '4px', color: '#555' }}>
                                                {s} {i < wf.steps.length - 1 && '→'}
                                            </span>
                                        ))}
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                                        <div>
                                            <button onClick={() => {
                                                setCurrentWorkflow(wf);
                                                setIsEditing(true);
                                            }} style={{ marginRight: '10px', background: 'none', border: 'none', color: '#666' }}><FaEdit /> Edit</button>
                                            <button onClick={() => handleDelete(wf._id)} style={{ background: 'none', border: 'none', color: '#ff4d4f' }}><FaTrash /> Delete</button>
                                        </div>

                                        {!isActive ? (
                                            <button onClick={() => handleActivate(wf._id)} style={{ padding: '6px 12px', background: '#e6f7ff', color: '#1890ff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Activate</button>
                                        ) : (
                                            <button onClick={() => handleDeactivate(wf._id)} style={{ padding: '6px 12px', background: '#fff1f0', color: '#ff4d4f', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Deactivate</button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {workflows.length === 0 && !loading && (
                            <p style={{ color: '#888', fontStyle: 'italic', gridColumn: '1/-1', textAlign: 'center', marginTop: '40px' }}>
                                No custom workflows yet. Create one to get started!
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkflowManager;
