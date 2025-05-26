// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import UserManagement from './components/admin/UserManagement';
import Home from './pages/Home';

import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './components/admin/AdminDashboard';
import EventManagement from './components/admin/EventManagement';
import ComplaintManagement from './components/admin/ComplaintManagement';
import PostManagement from './components/admin/PostManagement';
import ViolationReports from './components/admin/ViolationReports';
import RevenueReport from './components/admin/RevenueReport';
import OwnerRequests from './components/admin/OwnerRequests';
import Review from './pages/Review';
import PrivateRoute from './components/routing/PrivateRoute';
import BannedUserGuard from './components/routing/BannedUserGuard';

const App = () => {
    return (
        <AuthProvider>
            <Router>
                <BannedUserGuard>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
                        <Route path="/events/:eventId/review" element={<PrivateRoute><Review /></PrivateRoute>} />
                        
                        {/* Admin Routes */}
                        <Route path="/admin" element={<PrivateRoute><AdminLayout /></PrivateRoute>}>
                            <Route index element={<AdminDashboard />} />
                            <Route path="users" element={<UserManagement />} />
                            <Route path="events" element={<EventManagement />} />
                            <Route path="complaints" element={<ComplaintManagement />} />
                            <Route path="posts" element={<PostManagement />} />
                            <Route path="violations" element={<ViolationReports />} />
                            <Route path="revenue" element={<RevenueReport />} />
                            <Route path="owner-requests" element={<OwnerRequests />} />
                        </Route>
                    </Routes>
                </BannedUserGuard>
                <Routes>
                    <Route path="/events/:eventId/review" element={<PrivateRoute><Review /></PrivateRoute>} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
                </Routes>
            </Router>
        </AuthProvider>
    );
};

export default App;