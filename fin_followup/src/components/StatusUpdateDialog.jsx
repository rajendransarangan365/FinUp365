import React, { useState } from 'react';
import '../styles/StatusUpdateDialog.css';

const StatusUpdateDialog = ({ customer, onClose, onUpdate }) => {
    const [outcome, setOutcome] = useState('RESCHEDULE'); // RESCHEDULE | CONVERTED | NOT_INTERESTED
    const [date, setDate] = useState('');
    const [note, setNote] = useState('');

    const handleSave = () => {
        onUpdate(customer.id, {
            status: outcome, // Pass 'RESCHEDULE', 'CONVERTED', or 'NOT_INTERESTED'
            outcome,
            nextDate: date,
            note
        });
        onClose();
    };

    return (
        <div className="dialog-overlay">
            <div className="dialog-card">
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
                                    {item.nextFollowUp && <span className="history-next">Next: {item.nextFollowUp}</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatusUpdateDialog;
