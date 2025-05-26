// frontend/src/components/Login.js
import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import BannedUser from './BannedUser';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [showBannedPage, setShowBannedPage] = useState(false);
    const [banReason, setBanReason] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const { email, password } = formData;

    const onChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        
        const result = await login({
            email,
            password
        });

        if (result.success) {
            // Check user role and redirect accordingly
            if (result.user && result.user.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/');
            }
        } else if (result.banned) {
            // User is banned, show banned page
            setShowBannedPage(true);
            setBanReason(result.banReason);
        } else {
            setError(result.error || 'Đăng nhập thất bại');
        }
    };

    // If user is banned, show banned page
    if (showBannedPage) {
        return <BannedUser banReason={banReason} />;
    }

    return (
        <div className="login-container">
            <h2>Đăng nhập</h2>
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={onSubmit}>
                <div className="form-group">
                    <label>Email</label>
                    <input 
                        type="email" 
                        placeholder="Nhập email"
                        name="email"
                        value={email}
                        onChange={onChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Mật khẩu</label>
                    <input 
                        type="password" 
                        placeholder="Nhập mật khẩu"
                        name="password"
                        value={password}
                        onChange={onChange}
                        required
                    />
                </div>
                <button type="submit" className="btn btn-primary">Đăng nhập</button>
            </form>
            <p>
                Chưa có tài khoản? <a href="/register">Đăng ký ngay</a>
            </p>
            <p>
                <a href="/forgot-password">Quên mật khẩu?</a>
            </p>
        </div>
    );
};

export default Login;