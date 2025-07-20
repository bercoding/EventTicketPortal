import React from 'react';
import { Link } from 'react-router-dom';
import { FaStar, FaChartLine, FaFireAlt } from 'react-icons/fa';
import VideoBackground from './VideoBackground';
import './HeroSection.css';

const HeroSection = ({ user }) => {
    // Danh sách video cho background
    const videoSources = [
        'https://player.vimeo.com/external/434045526.sd.mp4?s=c27eecc69a27dbc4ff2b87d38afc35f1a9e7c02d&profile_id=164&oauth2_token_id=57447761',
        'https://assets.mixkit.co/videos/preview/mixkit-crowd-at-a-concert-waving-their-hands-in-the-air-4640-large.mp4',
        'https://assets.mixkit.co/videos/preview/mixkit-people-waving-their-hands-at-a-concert-4641-large.mp4',
        'https://assets.mixkit.co/videos/preview/mixkit-audience-watching-a-concert-4642-large.mp4'
    ];

    return (
        <VideoBackground 
            videoSources={videoSources}
            overlayOpacity={0.6}
            filter="brightness(0.7) contrast(1.1)"
            showControls={true}
        >
            {/* Hero Content */}
            <div className="hero-section h-full flex items-center justify-center text-center text-white px-4">
                <div className="max-w-4xl mx-auto">
                    {/* Logo và Brand */}
                    <div className="mb-8">
                        <div className="flex justify-center items-center mb-6">
                            <FaFireAlt className="hero-fire-icon text-orange-400 text-5xl mr-4" />
                            <h1 className="hero-title text-6xl md:text-8xl font-bold">
                                EventHub
                            </h1>
                            <FaStar className="hero-star-icon text-yellow-400 text-5xl ml-4" />
                        </div>
                    </div>

                    {/* Tagline */}
                    <div className="mb-8">
                        <p className="hero-tagline text-2xl md:text-3xl font-light text-pastel-100 mb-4">
                            🎉 Khám phá những sự kiện tuyệt vời nhất 🎉
                        </p>
                        <p className="hero-description text-lg md:text-xl text-pastel-200 max-w-3xl mx-auto leading-relaxed">
                            Tìm kiếm, đặt vé và tham gia các sự kiện hấp dẫn từ âm nhạc, thể thao đến hội nghị chuyên nghiệp
                        </p>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link
                            to="/events"
                            className="hero-button group bg-white text-pastel-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-pastel-50 transition-all duration-300 shadow-2xl hover:shadow-pastel-500/25 transform hover:scale-105 flex items-center"
                        >
                            <FaChartLine className="hero-button-icon mr-2" />
                            🎯 Khám phá sự kiện
                        </Link>
                        {!user && (
                            <Link
                                to="/register"
                                className="hero-button group bg-gradient-to-r from-pastel-500 to-pastel-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-pastel-600 hover:to-pastel-700 transition-all duration-300 shadow-2xl hover:shadow-pastel-500/25 transform hover:scale-105 flex items-center"
                            >
                                <FaStar className="hero-button-icon mr-2" />
                                🚀 Đăng ký ngay
                            </Link>
                        )}
                    </div>

                    {/* Scroll Indicator */}
                    <div className="scroll-indicator absolute bottom-8 left-1/2 transform -translate-x-1/2">
                        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
                            <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-pulse"></div>
                        </div>
                    </div>
                </div>
            </div>
        </VideoBackground>
    );
};

export default HeroSection; 