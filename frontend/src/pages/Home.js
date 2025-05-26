import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Home = () => {
    const { user, logout } = useContext(AuthContext);

    return (
        <>
        <div className="container">
            <h1>Trang chủ - Nền tảng đặt vé sự kiện</h1>
            {user && (
                <div className="welcome-box">
                    <h2>Chào mừng, {user.username}!</h2>
                    <p>Email: {user.email}</p>
                    <button className="btn btn-danger" onClick={logout}>
                        Đăng xuất
                    </button>
                </div>
            )}
            
            <div className="events-container">
                <h3>Sự kiện sắp diễn ra</h3>
                <p>Chưa có sự kiện nào. Vui lòng quay lại sau.</p>
            </div>
        </div>
        </>
    );
};

export default Home; 