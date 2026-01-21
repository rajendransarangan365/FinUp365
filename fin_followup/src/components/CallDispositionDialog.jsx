import React, { useState } from 'react';
import { FaPhone, FaTimes, FaCheck, FaBan, FaArrowRight } from 'react-icons/fa';
import '../styles/StatusUpdateDialog.css'; // Reusing styles for consistency

const CallDispositionDialog = ({ customer, onClose, onSave }) => {
    const [status, setStatus] = useState(null); // 'PICKED', 'DECLINED', 'REJECTED'
    const [note, setNote] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!status) {
            alert("Please select call status");
            return;
        }
        setIsSaving(true);
        try {
            await onSave(customer.id, {
                status,
                note
            });
            onClose();
        } catch (error) {
            console.error("Save failed", error);
            setIsSaving(false);
        }
    };

    return (
        <div className="dialog-overlay">
            <div className="dialog-card center-dialog" style={{ maxWidth: '400px' }}>
                <div className="dialog-header-row">
                    <h3>📞 Call Log</h3>
                    <button className="close-btn" onClick={onClose} disabled={isSaving}>
                        <FaTimes />
                    </button>
                </div>

                <div className="dialog-body" style={{ padding: '20px' }}>
                    <p style={{ marginBottom: '16px', color: 'var(--color-text-secondary)' }}>
                        How did the call with <strong>{customer.name}</strong> go?
                    </p>

                    <div className="outcome-chips vertical">
                        <button
                            className={`chip ${status === 'PICKED' ? 'active success' : ''}`}
                            onClick={() => setStatus('PICKED')}
                            style={{ justifyContent: 'center', padding: '12px' }}
                        >
                            <FaPhone /> Picked / Answered
                        </button>
                        <button
                            className={`chip ${status === 'DECLINED' ? 'active danger' : ''}`}
                            onClick={() => setStatus('DECLINED')}
                            style={{ justifyContent: 'center', padding: '12px' }}
                        >
                            <FaBan /> Declined / Busy
                        </button>
                        <button
                            className={`chip ${status === 'REJECTED' ? 'active warning' : ''}`}
                            onClick={() => setStatus('REJECTED')}
                            style={{ justifyContent: 'center', padding: '12px' }}
                        >
                            <FaTimes /> Not Reachable / Invalid
                        </button>
                    </div>

                    <textarea
                        placeholder="Add a quick note about the call..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="note-input"
                        style={{ marginTop: '20px', minHeight: '80px' }}
                        disabled={isSaving}
                    />

                    <button
                        className="btn-primary full-width"
                        onClick={handleSave}
                        disabled={isSaving}
                        style={{ marginTop: '20px', width: '100%', justifyContent: 'center' }}
                    >
                        {isSaving ? 'Saving...' : 'Save Call Log'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CallDispositionDialog;
