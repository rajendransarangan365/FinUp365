import React, { useState, useEffect } from 'react';
import '../styles/PermissionRequest.css';
import { FaMicrophone, FaCamera, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const PermissionRequest = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [status, setStatus] = useState('pending'); // pending | success | denied | error | error-insecure

    useEffect(() => {
        checkPermissions();
    }, []);

    const checkPermissions = async () => {
        // Simple optimization: if we have a local flag, assuming we are good
        const hasAsked = localStorage.getItem('permissions_granted');

        if (hasAsked === 'true') {
            try {
                // If context is secure, this check works. If insecure, it might throw or return undefined.
                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                    stream.getTracks().forEach(track => track.stop());
                    return;
                }
            } catch (err) {
                console.log("Permissions lost or error, re-requesting");
                localStorage.removeItem('permissions_granted');
            }
        }

        setIsVisible(true);
    };

    const requestPermissions = async () => {
        // Check if browser supports mediaDevices (undefined in insecure contexts like HTTP)
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setStatus('error-insecure');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setStatus('success');

            stream.getTracks().forEach(track => track.stop());

            localStorage.setItem('permissions_granted', 'true');

            setTimeout(() => {
                setIsVisible(false);
            }, 1500);

        } catch (err) {
            console.error("Permission Error:", err);
            setStatus('denied');
        }
    };

    if (!isVisible) return null;

    return (
        <div className="permission-overlay">
            <div className="permission-card">
                {status === 'pending' && (
                    <>
                        <div className="permission-icons">
                            <div className="icon-circle"><FaCamera /></div>
                            <div className="icon-circle"><FaMicrophone /></div>
                        </div>
                        <h3>Permissions Required</h3>
                        <p>To capture business cards and record voice notes, FinUp365 needs access to your camera and microphone.</p>
                        <button className="btn-grant" onClick={requestPermissions}>
                            Grant Permissions
                        </button>
                    </>
                )}

                {status === 'success' && (
                    <div className="status-content success">
                        <FaCheckCircle size={50} color="#2ecc71" />
                        <h3>You're All Set!</h3>
                    </div>
                )}

                {status === 'denied' && (
                    <div className="status-content denied">
                        <FaTimesCircle size={50} color="#e74c3c" />
                        <h3>Access Denied</h3>
                        <p>We cannot access your camera or microphone. Please enable permissions in your browser settings and reload.</p>
                        <button className="btn-secondary" onClick={() => window.location.reload()}>
                            Reload Page
                        </button>
                    </div>
                )}

                {status === 'error-insecure' && (
                    <div className="status-content denied">
                        <FaTimesCircle size={50} color="#e67e22" />
                        <h3>Secure Connection Required</h3>
                        <p>Accessing camera/microphone requires a secure connection (HTTPS).<br />Please reload the page using <strong>HTTPS</strong> (e.g. https://192.168...)</p>
                        <button className="btn-secondary" onClick={() => window.location.reload()}>
                            Reload Page
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PermissionRequest;
