import React, { useState, useRef, useEffect } from 'react';
import { FaPlay, FaPause, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';

const VideoBackground = ({ 
    children, 
    videoSources = [], 
    overlayOpacity = 0.6,
    filter = 'brightness(0.7) contrast(1.1)',
    showControls = true 
}) => {
    const [isVideoMuted, setIsVideoMuted] = useState(true);
    const [isVideoPlaying, setIsVideoPlaying] = useState(true);
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
    const videoRef = useRef(null);

    // Danh sách video mặc định nếu không có videoSources
    const defaultVideos = [
        'https://player.vimeo.com/external/434045526.sd.mp4?s=c27eecc69a27dbc4ff2b87d38afc35f1a9e7c02d&profile_id=164&oauth2_token_id=57447761',
        'https://assets.mixkit.co/videos/preview/mixkit-crowd-at-a-concert-waving-their-hands-in-the-air-4640-large.mp4',
        'https://assets.mixkit.co/videos/preview/mixkit-people-waving-their-hands-at-a-concert-4641-large.mp4',
        'https://assets.mixkit.co/videos/preview/mixkit-audience-watching-a-concert-4642-large.mp4'
    ];

    const videos = videoSources.length > 0 ? videoSources : defaultVideos;

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        // Xử lý khi video kết thúc
        const handleVideoEnd = () => {
            if (videos.length > 1) {
                setCurrentVideoIndex((prev) => (prev + 1) % videos.length);
            }
        };

        // Xử lý khi video có thể phát
        const handleCanPlay = () => {
            if (isVideoPlaying) {
                video.play().catch(console.error);
            }
        };

        video.addEventListener('ended', handleVideoEnd);
        video.addEventListener('canplay', handleCanPlay);

        return () => {
            video.removeEventListener('ended', handleVideoEnd);
            video.removeEventListener('canplay', handleCanPlay);
        };
    }, [isVideoPlaying, videos.length, currentVideoIndex]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        if (isVideoPlaying) {
            video.play().catch(console.error);
        } else {
            video.pause();
        }
    }, [isVideoPlaying, currentVideoIndex]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        video.muted = isVideoMuted;
    }, [isVideoMuted]);

    const toggleVideoMute = () => {
        setIsVideoMuted(!isVideoMuted);
    };

    const toggleVideoPlay = () => {
        setIsVideoPlaying(!isVideoPlaying);
    };

    const handleVideoError = () => {
        // Nếu video hiện tại lỗi, chuyển sang video tiếp theo
        if (videos.length > 1) {
            setCurrentVideoIndex((prev) => (prev + 1) % videos.length);
        }
    };

    return (
        <div className="relative h-screen overflow-hidden">
            {/* Video Background */}
            <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay
                loop={videos.length === 1}
                muted={isVideoMuted}
                playsInline
                style={{ filter }}
                onError={handleVideoError}
            >
                {videos.map((src, index) => (
                    <source 
                        key={index} 
                        src={src} 
                        type="video/mp4" 
                    />
                ))}
                Your browser does not support the video tag.
            </video>

            {/* Overlay với gradient */}
            <div 
                className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/60"
                style={{ opacity: overlayOpacity }}
            ></div>

            {/* Video Controls */}
            {showControls && (
                <div className="absolute top-6 right-6 z-20 flex items-center space-x-4">
                    <button
                        onClick={toggleVideoPlay}
                        className="bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition-all duration-300 group"
                        title={isVideoPlaying ? 'Tạm dừng' : 'Phát'}
                    >
                        {isVideoPlaying ? (
                            <FaPause size={20} className="group-hover:scale-110 transition-transform" />
                        ) : (
                            <FaPlay size={20} className="group-hover:scale-110 transition-transform" />
                        )}
                    </button>
                    <button
                        onClick={toggleVideoMute}
                        className="bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition-all duration-300 group"
                        title={isVideoMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
                    >
                        {isVideoMuted ? (
                            <FaVolumeMute size={20} className="group-hover:scale-110 transition-transform" />
                        ) : (
                            <FaVolumeUp size={20} className="group-hover:scale-110 transition-transform" />
                        )}
                    </button>
                    
                    {/* Video indicator nếu có nhiều video */}
                    {videos.length > 1 && (
                        <div className="bg-white/20 backdrop-blur-sm text-white px-3 py-2 rounded-full text-sm font-medium">
                            {currentVideoIndex + 1}/{videos.length}
                        </div>
                    )}
                </div>
            )}

            {/* Content */}
            <div className="relative z-10 h-full">
                {children}
            </div>
        </div>
    );
};

export default VideoBackground; 