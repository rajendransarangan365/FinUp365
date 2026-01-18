import React, { useState, useRef } from 'react';
import '../styles/StatusUpdateDialog.css';
import { FaMicrophone } from 'react-icons/fa';
import { FiX } from 'react-icons/fi';

const StatusUpdateDialog = ({ customer, onClose, onUpdate }) => {
    const [outcome, setOutcome] = useState('RESCHEDULE'); // RESCHEDULE | CONVERTED | NOT_INTERESTED
    const [date, setDate] = useState('');
    const [note, setNote] = useState('');

    // Audio Recorder State
    const [recording, setRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
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
                };
                mediaRecorderRef.current.start();
                setRecording(true);
            } catch (err) {
                console.error("Error accessing microphone:", err);
                alert("Could not access microphone.");
            }
        }
    };

    const handleSave = () => {
        onUpdate(customer.id, {
            status: outcome, // Pass 'RESCHEDULE', 'CONVERTED', or 'NOT_INTERESTED'
            outcome,
            nextDate: date,
            note,
            audioBlob // Pass the recorded audio blob
        });
        onClose();
    };

    return (
        <div className="dialog-overlay">
            <div className="dialog-card" style={{ position: 'relative' }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: 16, right: 16,
                        background: '#f1f2f6', border: 'none',
                        borderRadius: '50%', width: 32, height: 32,
                        color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                        zIndex: 10
                    }}
                >
                    <FiX size={18} />
                </button>
                <h3>Update Status: {customer.name}</h3>
                <p>What happened?</p>

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

                {outcome === 'RESCHEDULE' && (
                    <div className="date-picker-section">
                        <label>Next Follow Up:</label>
                        <div className="preset-dates">
                            <button className="chip-sm" onClick={() => {
                                const d = new Date(); d.setDate(d.getDate() + 1);
                                setDate(d.toISOString().split('T')[0]);
                            }}>+1 Day</button>
                            <button className="chip-sm" onClick={() => {
                                const d = new Date(); d.setDate(d.getDate() + 7);
                                setDate(d.toISOString().split('T')[0]);
                            }}>+1 Week</button>
                            <button className="chip-sm" onClick={() => {
                                const d = new Date(); d.setMonth(d.getMonth() + 1);
                                setDate(d.toISOString().split('T')[0]);
                            }}>+1 Month</button>
                        </div>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="date-input"
                        />
                    </div>
                )}

                {/* Voice Note Section */}
                <div style={{ marginBottom: '12px' }}>
                    <button
                        type="button"
                        onClick={toggleRecording}
                        className={recording ? 'voice-btn recording' : 'voice-btn'}
                        style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '12px',
                            border: '1px solid #eee',
                            background: recording ? '#fee2e2' : '#f8f9fa',
                            color: recording ? '#e74c3c' : '#555',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            cursor: 'pointer', fontWeight: '500',
                            animation: recording ? 'pulse 1.5s infinite' : 'none'
                        }}
                    >
                        <FaMicrophone />
                        {recording ? 'Stop Recording' : (audioBlob ? 'Re-record Voice Note' : 'Add Voice Note')}
                    </button>
                    {audioBlob && <div style={{ fontSize: '12px', color: '#27ae60', marginTop: '4px', textAlign: 'center' }}>✓ Voice Note Recorded</div>}
                </div>

                <textarea
                    placeholder="Add a quick note..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="note-input"
                />

                <div className="dialog-actions">
                    <button className="btn-text" onClick={onClose}>Cancel</button>
                    <button className="btn-primary" onClick={handleSave}>Save Update</button>
                </div>

                {/* History Section */}
                {customer.history && customer.history.length > 0 && (
                    <div className="history-section">
                        <h4>📜 History</h4>
                        <div className="history-list">
                            {customer.history.slice().reverse().map((item, index) => (
                                <div key={index} className="history-item">
                                    <div className="history-header">
                                        <span className="history-date">{new Date(item.date).toLocaleDateString()}</span>
                                        <span className="history-action">{item.action}</span>
                                    </div>
                                    {item.note && <p className="history-note">"{item.note}"</p>}
                                    {item.audioUrl && (
                                        <div style={{ marginTop: '8px' }}>
                                            <audio controls src={item.audioUrl} style={{ width: '100%', height: '32px' }} />
                                        </div>
                                    )}
                                    {item.nextFollowUp && <span className="history-next">Next: {item.nextFollowUp}</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <style>{`
                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.02); }
                    100% { transform: scale(1); }
                }
            `}</style>
        </div>
    );
};

export default StatusUpdateDialog;
