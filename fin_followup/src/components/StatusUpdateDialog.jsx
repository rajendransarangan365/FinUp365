import React, { useState, useRef } from 'react';
import '../styles/StatusUpdateDialog.css';
import { FaMicrophone } from 'react-icons/fa';
import { FiX } from 'react-icons/fi';
import AudioPlayer from './AudioPlayer';

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
            <div className="dialog-card">
                {/* Header Action Row */}
                <div className="dialog-header-row">
                    <h3>Update Status</h3>
                    <button className="close-btn" onClick={onClose} aria-label="Close">
                        <FiX />
                    </button>
                </div>

                <p className="dialog-subtitle">For: <strong>{customer.name}</strong></p>

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
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="date-input"
                        />
                    </div>
                )}

                {/* Voice Note Section */}
                <div className="voice-section">
                    <button
                        type="button"
                        onClick={toggleRecording}
                        className={`voice-btn ${recording ? 'recording' : ''}`}
                    >
                        <FaMicrophone />
                        {recording ? 'Stop Recording' : (audioBlob ? 'Re-record Voice Note' : 'Add Voice Note')}
                    </button>
                    {audioBlob && <div className="voice-success">✓ Voice Note Recorded</div>}
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
                                        <AudioPlayer
                                            src={item.audioUrl}
                                            title={`Voice Note - ${new Date(item.date).toLocaleDateString()}`}
                                        />
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
                    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(231, 76, 60, 0.4); }
                    70% { transform: scale(1.02); box-shadow: 0 0 0 10px rgba(231, 76, 60, 0); }
                    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(231, 76, 60, 0); }
                }
            `}</style>
        </div>
    );
};

export default StatusUpdateDialog;
