import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCamera, FaMicrophone, FaSave } from 'react-icons/fa';
import api from '../services/api';
import '../styles/AddCustomer.css';

const AddCustomer = () => {
    const navigate = useNavigate();
    const [name, setName] = useState(''); // Business Name
    const [customerName, setCustomerName] = useState(''); // New: Person Name
    const [phone, setPhone] = useState('');
    const [loanType, setLoanType] = useState('');
    const [note, setNote] = useState('');

    const [photo, setPhoto] = useState(null); // Business Card
    const [previewUrl, setPreviewUrl] = useState(null);

    const [profilePic, setProfilePic] = useState(null); // New: Avatar
    const [profilePreview, setProfilePreview] = useState(null);

    const [uploading, setUploading] = useState(false);

    // Refs
    const businessInputRef = React.useRef(null);
    const profileInputRef = React.useRef(null);

    const handleBusinessPhotoChange = (e) => {
        if (e.target.files[0]) {
            setPhoto(e.target.files[0]);
            setPreviewUrl(URL.createObjectURL(e.target.files[0]));
        }
    };

    const handleProfilePicChange = (e) => {
        if (e.target.files[0]) {
            setProfilePic(e.target.files[0]);
            setProfilePreview(URL.createObjectURL(e.target.files[0]));
        }
    };

    // ... Audio Recorder Logic (Kept Same) ...
    const [recording, setRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const mediaRecorderRef = React.useRef(null);
    const chunksRef = React.useRef([]);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (!storedUser || !storedUser._id) {
            alert("Please login again");
            return;
        }

        setUploading(true);

        try {
            const formData = new FormData();
            formData.append('userId', storedUser._id);
            formData.append('name', name);
            formData.append('customerName', customerName); // New Field
            formData.append('phone', phone);
            formData.append('loanType', loanType);

            if (photo) formData.append('photo', photo);
            if (profilePic) formData.append('profilePic', profilePic); // New File
            if (audioBlob) formData.append('audio', audioBlob, 'voice_note.webm');

            await api.post('/customers', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            alert("Customer Saved Successfully!");
            navigate('/');
        } catch (error) {
            console.error("Error saving customer:", error);
            alert("Error saving: " + (error.response?.data?.error || error.message));
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="add-lead-screen">
            <header className="add-lead-header">
                <button className="icon-btn-back" onClick={() => navigate(-1)}>
                    <FaArrowLeft />
                </button>
                <h1>Add New Lead</h1>
            </header>

            <form onSubmit={handleSubmit} className="add-lead-form">

                {/* 1. Hero Business Card Capture */}
                <div className="photo-hero-section" onClick={() => businessInputRef.current.click()}>
                    {previewUrl ? (
                        <div className="preview-container">
                            <img src={previewUrl} alt="Preview" className="hero-preview" />
                            <div className="edit-overlay"><FaCamera /> Change Card</div>
                        </div>
                    ) : (
                        <div className="hero-placeholder">
                            <div className="camera-circle">
                                <FaCamera />
                            </div>
                            <h3>Scan Business Card</h3>
                            <p>Tap to capture shop or card</p>
                        </div>
                    )}
                    <input type="file" ref={businessInputRef} onChange={handleBusinessPhotoChange} style={{ display: 'none' }} accept="image/*" capture="environment" />
                </div>

                {/* 2. Profile & Details */}
                <div className="form-card" style={{ marginTop: '-20px', position: 'relative', zIndex: 10 }}>

                    {/* Profile Avatar Upload */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', marginTop: '-50px' }}>
                        <div
                            style={{
                                width: '100px', height: '100px', borderRadius: '50%',
                                background: 'white', border: '4px solid white',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                                overflow: 'hidden', position: 'relative',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer'
                            }}
                            onClick={() => profileInputRef.current.click()}
                        >
                            {profilePreview ? (
                                <img src={profilePreview} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#4318FF' }}>
                                    {customerName ? customerName.charAt(0).toUpperCase() : <FaCamera size={24} color="#ccc" />}
                                </div>
                            )}
                            <div style={{
                                position: 'absolute', bottom: 0, width: '100%', background: 'rgba(0,0,0,0.5)',
                                color: 'white', fontSize: '10px', textAlign: 'center', padding: '2px'
                            }}>
                                Photo
                            </div>
                        </div>
                        <input type="file" ref={profileInputRef} onChange={handleProfilePicChange} style={{ display: 'none' }} accept="image/*" />
                    </div>

                    <div className="input-group">
                        <label>Business / Lead Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Rajan Traders"
                            className="clean-input"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label>Customer Name</label>
                        <input
                            type="text"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="e.g. Rajan"
                            className="clean-input"
                        />
                    </div>

                    <div className="input-group">
                        <label>Phone Number</label>
                        <div className="phone-row">
                            <span className="country-code">+91</span>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="98765 00000"
                                className="clean-input"
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Category</label>
                        <div className="chip-row">
                            {['Business', 'Personal', 'Home', 'Vehicle'].map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    className={`filter-chip ${loanType === type ? 'active' : ''}`}
                                    onClick={() => setLoanType(type)}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 3. Audio / Notes */}
                <div className="form-card voice-card">
                    <div className="voice-header">
                        <label>Voice Note</label>
                        {audioBlob && <span className="audio-badge">Saved</span>}
                    </div>

                    <button type="button" className={`record-btn ${recording ? 'recording' : ''}`} onClick={toggleRecording}>
                        <FaMicrophone />
                        {recording ? 'Stop Recording' : (audioBlob ? 'Re-record Note' : 'Tap to Record Note')}
                    </button>
                </div>

                <div style={{ height: '80px' }}></div>

                <div className="sticky-footer">
                    <button type="submit" className="save-lead-btn" disabled={uploading}>
                        <FaSave /> {uploading ? 'Creating Lead...' : 'Save Lead'}
                    </button>
                </div>

            </form>
        </div>
    );
};

export default AddCustomer;
