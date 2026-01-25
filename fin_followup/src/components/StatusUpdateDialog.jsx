import React, { useState, useRef } from 'react';
import '../styles/StatusUpdateDialog.css';
import { FaMicrophone, FaTrash, FaCheckCircle } from 'react-icons/fa';
import { FiX } from 'react-icons/fi';
import AudioPlayer from './AudioPlayer';

const StatusUpdateDialog = ({ customer, onClose, onUpdate, activeWorkflow }) => {
    const [outcome, setOutcome] = useState(activeWorkflow ? activeWorkflow.steps[0] : 'RESCHEDULE'); // Default to first step or standard default
    const [date, setDate] = useState('');
    const [time, setTime] = useState('09:00'); // Default to 9 AM
    const [note, setNote] = useState('');
    const [activeHistoryTab, setActiveHistoryTab] = useState('followups'); // 'followups' | 'calls'

    // Loading State
    const [isSaving, setIsSaving] = useState(false);

    // Audio Recorder State
    const [recording, setRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null); // Preview URL
    const [showToast, setShowToast] = useState(false);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);

    const toggleRecording = async () => {
        if (recording) {
            mediaRecorderRef.current.stop();
            setRecording(false);
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorderRef.current = new MediaRecorder(stream);
                chunksRef.current = [];
                mediaRecorderRef.current.ondataavailable = (e) => {
                    if (e.data.size > 0) chunksRef.current.push(e.data);
                };
                mediaRecorderRef.current.onstop = () => {
                    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                    setAudioBlob(blob);

                    // Create Preview URL
                    const url = URL.createObjectURL(blob);
                    setAudioUrl(url);

                    // Show Toast
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 3000);
                };
                mediaRecorderRef.current.start();
                setRecording(true);
            } catch (err) {
                console.error("Error accessing microphone:", err);
                alert("Could not access microphone.");
            }
        }
    };

    const handleDeleteAudio = () => {
        setAudioBlob(null);
        setAudioUrl(null);
        setShowToast(false);
    };

    const handleSave = async () => {
        if (!outcome) {
            alert("Please select an outcome");
            return;
        }

        setIsSaving(true);
        try {
            await onUpdate(customer.id, {
                status: outcome,
                outcome,
                nextDate: date,
                nextTime: time, // Include time
                note,
                audioBlob
            });
            onClose();
        } catch (error) {
            console.error("Save failed:", error);
            setIsSaving(false);
        }
    };

    return (
        <div className="dialog-overlay">
            {showToast && (
                <div className="toast-notification">
                    <FaCheckCircle /> Audio Added!
                </div>
            )}
            <div className="dialog-card">
                {/* Fixed Header */}
                <div className="dialog-header-row">
                    <h3>Update Status</h3>
                    <button className="close-btn" onClick={onClose} disabled={isSaving} aria-label="Close">
                        <FiX />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="dialog-scroll-area">

                    {/* Redesigned Profile Header */}
                    <div className="customer-profile-header">
                        <div className="profile-top-row">
                            {/* Avatar */}
                            <div className="profile-avatar-container">
                                {customer.profilePicUrl ? (
                                    <img src={customer.profilePicUrl} alt="Profile" className="profile-avatar-img" />
                                ) : (
                                    <div className="profile-avatar-placeholder">
                                        {customer.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="profile-info-container">
                                <h4 className="profile-name">{customer.name}</h4>
                                {customer.customerName && <p className="profile-subname">{customer.customerName}</p>}
                                {customer.loanType && <span className="profile-badge">{customer.loanType}</span>}
                            </div>
                        </div>

                        {/* Business Card (if exists) */}
                        {customer.photoUrl && (
                            <div className="business-card-section">
                                <div className="business-card-framed">
                                    <img src={customer.photoUrl} alt="Business Card" />
                                </div>
                                <span className="card-label">Business Card</span>
                            </div>
                        )}
                    </div>

                    {activeWorkflow ? (
                        /* WORKFLOW STEPS */
                        <div className="outcome-chips" style={{ flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                            {activeWorkflow.steps.map((step) => (
                                <button
                                    key={step}
                                    className={`chip ${outcome === step ? 'active' : ''}`}
                                    onClick={() => setOutcome(step)}
                                    style={{
                                        background: outcome === step ? 'var(--color-primary)' : '#f1f2f6',
                                        color: outcome === step ? 'white' : '#2d3436',
                                        border: 'none'
                                    }}
                                >
                                    {step}
                                </button>
                            ))}
                        </div>
                    ) : (
                        /* STANDARD CHIPS */
                        <div className="outcome-chips">
                            <button
                                className={`chip ${outcome === 'RESCHEDULE' ? 'active' : ''}`}
                                onClick={() => setOutcome('RESCHEDULE')}
                            >
                                📅 Follow Up
                            </button>
                            <button
                                className={`chip ${outcome === 'CONVERTED' ? 'active success' : ''}`}
                                onClick={() => setOutcome('CONVERTED')}
                            >
                                🎉 Deal Closed
                            </button>
                            <button
                                className={`chip ${outcome === 'NOT_INTERESTED' ? 'active danger' : ''}`}
                                onClick={() => setOutcome('NOT_INTERESTED')}
                            >
                                ❌ Not Interested
                            </button>
                        </div>
                    )}

                    {/* Standard Logic: Show Date Picker if RESCHEDULE or if using Workflow (assuming all workflow steps might need a next follow up date OR we allow it generically) */}
                    {/* For Workflow, we allow date picker always, or we could make it configurable. For now, let's allow it so they can schedule the "Next Step" meeting. */}
                    {(outcome === 'RESCHEDULE' || activeWorkflow) && (
                        <div className="date-picker-section">
                            <label>Next Follow Up</label>
                            <div className="preset-dates">
                                <button className="chip-sm" onClick={() => {
                                    const d = new Date(); d.setDate(d.getDate() + 1);
                                    setDate(d.toISOString().split('T')[0]);
                                }}>Tomw</button>
                                <button className="chip-sm" onClick={() => {
                                    const d = new Date(); d.setDate(d.getDate() + 3);
                                    setDate(d.toISOString().split('T')[0]);
                                }}>+3 Days</button>
                                <button className="chip-sm" onClick={() => {
                                    const d = new Date(); d.setDate(d.getDate() + 7);
                                    setDate(d.toISOString().split('T')[0]);
                                }}>+1 Week</button>
                            </div>

                            {/* Date and Time Input Row */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                                <div>
                                    <label style={{ fontSize: '0.85rem', color: '#636e72', marginBottom: '6px', display: 'block' }}>Date</label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="date-input"
                                        disabled={isSaving}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', color: '#636e72', marginBottom: '6px', display: 'block' }}>Time</label>
                                    <input
                                        type="time"
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                        className="date-input"
                                        style={{ fontFamily: 'inherit' }}
                                        disabled={isSaving}
                                    />
                                </div>
                            </div>

                            {/* Quick Time Presets */}
                            <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                                <button className="chip-sm" onClick={() => setTime('09:00')} style={{ fontSize: '0.75rem' }}>9 AM</button>
                                <button className="chip-sm" onClick={() => setTime('12:00')} style={{ fontSize: '0.75rem' }}>12 PM</button>
                                <button className="chip-sm" onClick={() => setTime('15:00')} style={{ fontSize: '0.75rem' }}>3 PM</button>
                                <button className="chip-sm" onClick={() => setTime('18:00')} style={{ fontSize: '0.75rem' }}>6 PM</button>
                                <button className="chip-sm" onClick={() => setTime('21:00')} style={{ fontSize: '0.75rem' }}>9 PM</button>
                            </div>
                        </div>
                    )}

                    {/* Voice Note Section */}
                    <div className="voice-section">
                        {!audioUrl ? (
                            <button
                                type="button"
                                onClick={toggleRecording}
                                className={`voice-btn ${recording ? 'recording' : ''}`}
                                disabled={isSaving}
                            >
                                <FaMicrophone />
                                {recording ? 'Stop Recording' : 'Add Voice Note'}
                            </button>
                        ) : (
                            <div className="audio-preview-container">
                                <div style={{ flex: 1 }}>
                                    <AudioPlayer src={audioUrl} title="New Recording" />
                                </div>
                                <button
                                    className="delete-audio-btn"
                                    onClick={handleDeleteAudio}
                                    title="Delete Recording"
                                    disabled={isSaving}
                                >
                                    <FaTrash />
                                </button>
                            </div>
                        )}
                    </div>
                    {audioBlob && showToast && <div className="voice-success">✓ Voice Note Recorded</div>}

                    <textarea
                        placeholder="Add a quick note..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="note-input"
                        disabled={isSaving}
                    />

                    <div className="dialog-actions">
                        <button className="btn-text" onClick={onClose} disabled={isSaving}>Cancel</button>
                        <button
                            className="btn-primary"
                            onClick={handleSave}
                            disabled={isSaving}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            {isSaving ? (
                                <>
                                    <span className="spinner-sm"></span> Saving...
                                </>
                            ) : (
                                'Save Update'
                            )}
                        </button>
                    </div>

                    {/* History Section with Tabs */}
                    <div className="history-section" style={{ marginTop: '24px' }}>
                        <div className="history-tabs" style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
                            <button
                                onClick={() => setActiveHistoryTab('followups')}
                                style={{
                                    flex: 1,
                                    padding: '8px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: activeHistoryTab === 'followups' ? '#e3f2fd' : 'transparent',
                                    color: activeHistoryTab === 'followups' ? '#0984e3' : '#636e72',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                📜 Follow Ups
                            </button>
                            <button
                                onClick={() => setActiveHistoryTab('calls')}
                                style={{
                                    flex: 1,
                                    padding: '8px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: activeHistoryTab === 'calls' ? '#e3f2fd' : 'transparent',
                                    color: activeHistoryTab === 'calls' ? '#0984e3' : '#636e72',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                📞 Call Logs
                            </button>
                        </div>

                        {/* Follow Up History List */}
                        {activeHistoryTab === 'followups' && (
                            <div className="history-list">
                                {customer.history && customer.history.length > 0 ? (
                                    customer.history.slice().reverse().map((item, index) => (
                                        <div key={index} className="history-item">
                                            <div className="history-header">
                                                <span className="history-date">{new Date(item.date).toLocaleDateString()}</span>
                                                <span className="history-action">{item.action}</span>
                                            </div>
                                            {item.note && <p className="history-note">"{item.note}"</p>}
                                            {item.audioUrl && (
                                                <AudioPlayer
                                                    src={item.audioUrl}
                                                    title={`Voice Note - ${new Date(item.date).toLocaleDateString()}`}
                                                />
                                            )}
                                            {item.nextFollowUp && <span className="history-next">Next: {item.nextFollowUp}</span>}
                                        </div>
                                    ))
                                ) : (
                                    <p style={{ textAlign: 'center', color: '#b2bec3', fontSize: '0.9rem', padding: '10px' }}>No follow-up history yet.</p>
                                )}
                            </div>
                        )}

                        {/* Call Logs List */}
                        {activeHistoryTab === 'calls' && (
                            <div className="history-list">
                                {customer.callHistory && customer.callHistory.length > 0 ? (
                                    customer.callHistory.slice().reverse().map((call, index) => (
                                        <div key={index} className="history-item" style={{ borderLeftColor: call.status === 'PICKED' ? '#00b894' : '#ff7675' }}>
                                            <div className="history-header">
                                                <span className="history-date">{new Date(call.date).toLocaleString()}</span>
                                                <span
                                                    className="history-action"
                                                    style={{
                                                        background: call.status === 'PICKED' ? 'rgba(0, 184, 148, 0.1)' : 'rgba(255, 118, 117, 0.1)',
                                                        color: call.status === 'PICKED' ? '#00b894' : '#d63031'
                                                    }}
                                                >
                                                    {call.status}
                                                </span>
                                            </div>
                                            {call.note && <p className="history-note">"{call.note}"</p>}
                                        </div>
                                    ))
                                ) : (
                                    <p style={{ textAlign: 'center', color: '#b2bec3', fontSize: '0.9rem', padding: '10px' }}>No call logs yet.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <style>{`
                @keyframes pulse {
                    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(231, 76, 60, 0.4); }
                    70% { transform: scale(1.02); box-shadow: 0 0 0 10px rgba(231, 76, 60, 0); }
                    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(231, 76, 60, 0); }
                }
                .spinner-sm {
                    width: 16px;
                    height: 16px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-radius: 50%;
                    border-top-color: #fff;
                    animation: spin 1s ease-in-out infinite;
                    display: inline-block;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default StatusUpdateDialog;
