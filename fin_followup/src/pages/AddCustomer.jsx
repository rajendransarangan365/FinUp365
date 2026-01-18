import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCamera, FaMicrophone, FaSave } from 'react-icons/fa';
import api from '../services/api';
import '../styles/AddCustomer.css';

const AddCustomer = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [loanType, setLoanType] = useState('');
    const [note, setNote] = useState('');

    const [photo, setPhoto] = useState(null); // File object
    const [previewUrl, setPreviewUrl] = useState(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = React.useRef(null);

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setPhoto(e.target.files[0]);
            setPreviewUrl(URL.createObjectURL(e.target.files[0]));
        }
    };

    const [recording, setRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const mediaRecorderRef = React.useRef(null);
    const chunksRef = React.useRef([]);

    const toggleRecording = async () => {
        if (recording) {
            // Stop Recording
            mediaRecorderRef.current.stop();
            setRecording(false);
        } else {
            // Start Recording
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
                alert("Could not access microphone. Please allow permissions.");
            }
        }
    };

    // Updated handleSubmit to include Audio Upload
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
            formData.append('phone', phone);
            formData.append('loanType', loanType);

            if (photo) {
                formData.append('photo', photo);
            }
            if (audioBlob) {
                formData.append('audio', audioBlob, 'voice_note.webm');
            }
            if (note) {
                console.log("Note (local only for now):", note);
            }

            await api.post('/customers', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
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
            {/* Header */}
            <header className="add-lead-header">
                <button className="icon-btn-back" onClick={() => navigate(-1)}>
                    <FaArrowLeft />
                </button>
                <h1>Add New Lead</h1>
            </header>

            <form onSubmit={handleSubmit} className="add-lead-form">

                {/* 1. Hero Photo Capture */}
                <div className="photo-hero-section" onClick={() => fileInputRef.current.click()}>
                    {previewUrl ? (
                        <div className="preview-container">
                            <img src={previewUrl} alt="Preview" className="hero-preview" />
                            <div className="edit-overlay"><FaCamera /> Change Photo</div>
                        </div>
                    ) : (
                        <div className="hero-placeholder">
                            <div className="camera-circle">
                                <FaCamera />
                            </div>
                            <h3>Scan Business Card</h3>
                            <p>Tap to take a photo of the shop or visiting card</p>
                        </div>
                    )}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                        accept="image/*"
                        capture="environment"
                    />
                </div>

                {/* 2. Details Card */}
                <div className="form-card">
                    <div className="input-group">
                        <label>Lead Name</label>
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

                {/* Spacer for sticky button */}
                <div style={{ height: '80px' }}></div>

                {/* Sticky Action Footer */}
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
