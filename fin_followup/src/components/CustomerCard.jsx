import React from 'react';
import { FaPhoneAlt, FaMapMarkerAlt, FaExclamationCircle } from 'react-icons/fa';
import '../styles/CustomerCard.css';

const CustomerCard = ({ customer, onCall, variant = 'normal' }) => {

    // Variant styles
    const isUrgent = variant === 'urgent';
    const isCompleted = variant === 'completed';
    const isNew = variant === 'new';

    const getRandomColor = (name) => {
        const colors = ['#FDA7DF', '#D980FA', '#12CBC4', '#5758BB', '#FFC312', '#C4E538'];
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    };

    return (
        <div className={`crm-card ${isUrgent ? 'urgent-border' : ''} ${isNew ? 'new-border' : ''} ${isCompleted ? 'completed-dim' : ''}`} onClick={() => onCall(customer)}>
            <div className="crm-card-content">
                <div className="crm-avatar">
                    {customer.profilePicUrl ? (
                        <img src={customer.profilePicUrl} alt="avatar" />
                    ) : (
                        <div className="avatar-placeholder" style={{ background: getRandomColor(customer.customerName || customer.name) }}>
                            {(customer.customerName || customer.name || '?').charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>

                <div className="crm-info">
                    <h3 className="crm-name">{customer.name}</h3>
                    {customer.customerName && <p className="crm-detail" style={{ fontWeight: 500, color: '#333' }}>👤 {customer.customerName}</p>}
                    <p className="crm-detail">{customer.phone}</p>
                    <div className="crm-tags">
                        <span className="crm-tag">{customer.loanType}</span>
                        {customer.followUpDate && <span className="crm-date-tag">📅 {customer.followUpDate}</span>}
                    </div>
                </div>

                <div className="crm-status-icon">
                    {customer.status === 'NEW' && <span className="status-emoji" title="New">🌟</span>}
                    {customer.status === 'CONVERTED' && <span className="status-emoji" title="Closed">🎉</span>}
                    {customer.status === 'NOT_INTERESTED' && <span className="status-emoji" title="Not Interested">❌</span>}
                    {isUrgent && <div className="indicator-dot"></div>}
                </div>
            </div>
        </div>
    );
};

export default CustomerCard;
