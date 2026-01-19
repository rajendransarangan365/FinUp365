import React, { useState, useRef, useEffect } from 'react';
import { FaPlay, FaPause } from 'react-icons/fa';
import '../styles/AudioPlayer.css';

const AudioPlayer = ({ src, title = "Voice Note" }) => {
    const audioRef = useRef(null);
    const progressBarRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const setAudioData = () => {
            setDuration(audio.duration);
        };

        const updateTime = () => {
            setCurrentTime(audio.currentTime);
        };

        const onEnd = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };

        audio.addEventListener('loadedmetadata', setAudioData);
        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('ended', onEnd);

        // Ensure duration is available
        if (audio.readyState >= 1) {
            setDuration(audio.duration);
        }

        return () => {
            if (audio) {
                audio.removeEventListener('loadedmetadata', setAudioData);
                audio.removeEventListener('timeupdate', updateTime);
                audio.removeEventListener('ended', onEnd);
            }
        };
    }, []);

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimelineClick = (e) => {
        const audio = audioRef.current;
        const timeline = progressBarRef.current;
        if (!audio || !timeline) return;

        const rect = timeline.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const timelineWidth = rect.width;

        const timeToSeek = (offsetX / timelineWidth) * audio.duration;
        if (isFinite(timeToSeek)) {
            audio.currentTime = timeToSeek;
            setCurrentTime(timeToSeek);
        }
    };

    const formatTime = (time) => {
        if (!time && time !== 0) return '0:00';
        const seconds = parseInt(time);
        const minutes = parseInt(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
    };

    const progressPercent = duration ? (currentTime / duration) * 100 : 0;

    return (
        <div className="voice-assistant-item">
            <audio ref={audioRef} src={src} />

            <div className="voice-assistant-item-button">
                <button
                    className="play-button"
                    onClick={togglePlay}
                    aria-label={isPlaying ? "Pause" : "Play"}
                >
                    {isPlaying ? <FaPause size={14} /> : <FaPlay size={14} style={{ marginLeft: '2px' }} />}
                </button>
            </div>

            <div className="voice-assistant-item-text">
                <h5 className="heading-51 text-heading">{title}</h5>
                <div className="audio-controls">
                    <div
                        className="audio-controls-bar"
                        ref={progressBarRef}
                        onClick={handleTimelineClick}
                    >
                        <div
                            className="audio-controls-bar-current"
                            style={{ width: `${progressPercent}%` }}
                        ></div>
                    </div>

                    <div className="audio-controls-time">
                        {formatTime(currentTime)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AudioPlayer;
