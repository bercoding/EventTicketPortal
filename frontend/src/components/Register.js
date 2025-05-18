// frontend/src/components/Register.js
import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const { register } = useContext(AuthContext);
    const navigate = useNavigate();

    const { username, email, password, confirmPassword } = formData;

    const onChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            setError('Mật khẩu không khớp');
            return;
        }

        const result = await register({
            username,
            email,
            password
        });

        if (result.success) {
            setSuccess('Đăng ký thành công!');
            // Chuyển đến trang chính sau khi đăng ký thành công
            setTimeout(() => {
                navigate('/');
            }, 1500);
        } else {
            setError(result.error || 'Đăng ký thất bại');
        }
    };

    return (
        <div className="register-container">
            <h2>Đăng ký</h2>
            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}
            <form onSubmit={onSubmit}>
                <div className="form-group">
                    <label>Tên đăng nhập</label>
                    <input 
                        type="text" 
                        placeholder="Nhập tên đăng nhập"
                        name="username"
                        value={username}
                        onChange={onChange}
                        required
                    />
                </div>
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
                        minLength="6"
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Xác nhận mật khẩu</label>
                    <input 
                        type="password" 
                        placeholder="Xác nhận mật khẩu"
                        name="confirmPassword"
                        value={confirmPassword}
                        onChange={onChange}
                        minLength="6"
                        required
                    />
                </div>
                <button type="submit" className="btn btn-primary">Đăng ký</button>
            </form>
            <p>
                Đã có tài khoản? <a href="/login">Đăng nhập ngay</a>
            </p>
        </div>
    );
};

export default Register;