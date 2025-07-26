import React, { useEffect } from 'react';
import { Toaster } from 'react-hot-toast'; // Import Toaster
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import VerifyOtp from './components/VerifyOtp';
import ResetPassword from './components/ResetPassword';
import UserManagement from './components/admin/UserManagement';
import Home from './pages/Home';
import TicketboxHome from './pages/TicketboxHome';
import AllEvents from './pages/AllEvents';
import ChatPage from './pages/ChatPage';
import Review from './pages/Review';
import PrivateRoute from './components/routing/PrivateRoute';
import BannedUserGuard from './components/routing/BannedUserGuard';
import BannedUser from './components/BannedUser';
import MainLayout from './components/layout/MainLayout';
import ProfilePage from './pages/ProfilePage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import BecomeOwnerPage from './pages/BecomeOwnerPage';
import MyTicketsPage from './pages/MyTicketsPage';
import EventDetailPage from './pages/EventDetailPage';
import BookingPage from './pages/BookingPage';
import Forum from './pages/Forum';
import PostDetail from './components/forum/PostDetail'; // Import trang chi tiết mới
import EventTemplateSelection from './pages/event/EventTemplateSelection';
import CreateEvent from './pages/event/CreateEvent';
import CreateEventWithSeating from './pages/event/CreateEventWithSeating';
import ManageEvent from './pages/event/ManageEvent';
import MyEvents from './pages/MyEvents';
import PaymentCallback from './pages/PaymentCallback';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFailure from './pages/PaymentFailure';
import SelectSeatPage from './pages/SelectSeatPage';
import PaymentCheckout from './components/PaymentCheckout';
import POSConfirmation from './pages/POSConfirmation';

import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminEventManagement from './components/admin/AdminEventManagement';
import ComplaintManagement from './components/admin/ComplaintManagement';
import RefundManagement from './components/admin/RefundManagement';
import PostManagement from './components/admin/PostManagement';
import ViolationReports from './components/admin/ViolationReports';
import RevenueReport from './components/admin/RevenueReport';
import OwnerRequests from './components/admin/OwnerRequests';
import RefundManagement from './components/admin/RefundManagement';
import POSConfirmationAdmin from './pages/admin/POSConfirmation';
import TicketManagement from './components/admin/TicketManagement';
import OwnerLayout from './components/owner/OwnerLayout';
import OwnerDashboard from './components/owner/OwnerDashboard';
import OwnerEvents from './components/owner/OwnerEvents';
import OwnerRevenue from './components/owner/OwnerRevenue';
import OwnerCustomers from './components/owner/OwnerCustomers';
import OwnerFeedback from './components/owner/OwnerFeedback';
import OwnerRules from './components/owner/OwnerRules';
import OwnerStatistics from './components/owner/OwnerStatistics';
import SimpleTicketBooking from './pages/SimpleTicketBooking';
import { FriendPage } from './pages/friend';
import { useAuth } from './context/AuthContext';
import ChatBox from './components/ChatBox';

// Global Navigation Monitor Component
const NavigationMonitor = () => {
    const location = useLocation();

    React.useEffect(() => {
        console.log('🧭 Navigation changed:', location.pathname + location.search);

        // Check for null/undefined in URL
        if (location.pathname.includes('/null') || location.pathname.includes('/undefined') ||
            location.search.includes('null') || location.search.includes('undefined')) {
            console.error('🚨 NAVIGATION: Invalid URL detected!');
            console.error('Pathname:', location.pathname);
            console.error('Search:', location.search);
            console.error('Full location:', location);
            console.trace('Navigation stack trace:');
        }
    }, [location]);

    return null; // This component doesn't render anything
};

// Component to handle banned users
const BannedUserHandler = ({ children }) => {
    const { user } = useAuth();
    const location = useLocation();
    
    // Nếu người dùng đã đăng nhập và bị ban, chuyển hướng đến trang banned
    if (user && user.status === 'banned') {
        console.log('🚫 Banned user detected, redirecting to banned page');
        return (
            <Navigate 
                to="/banned" 
                state={{ 
                    from: location,
                    banReason: user.banReason || 'Vi phạm điều khoản sử dụng'
                }}
                replace
            />
        );
    }
    
    return children;
};

const App = () => {
    const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || 'YOUR_DEFAULT_GOOGLE_CLIENT_ID';

    useEffect(() => {
        // Cleanup any old wallet-related localStorage items
        localStorage.removeItem('walletData');
        localStorage.removeItem('walletTransactions');
    }, []);

    return (
        <GoogleOAuthProvider clientId={googleClientId}>
            <AuthProvider>
                <SocketProvider>
                    <Router>
                        <Toaster position="top-right" reverseOrder={false} />
                        <ToastContainer
                            position="top-right"
                            autoClose={5000}
                            hideProgressBar={false}
                            newestOnTop={false}
                            closeOnClick
                            rtl={false}
                            pauseOnFocusLoss
                            draggable
                            pauseOnHover
                            theme="colored"
                        />
                        <Routes>
                            {/* Public routes */}
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/forgot-password" element={<ForgotPassword />} />
                            <Route path="/verify-otp" element={<VerifyOtp />} />
                            <Route path="/reset-password" element={<ResetPassword />} />
                            <Route path="/payment/callback" element={<PaymentCallback />} />
                            <Route path="/payment/success" element={<PaymentSuccess />} />
                            <Route path="/payment/failure" element={<PaymentFailure />} />
                            <Route path="/payment/pos-confirmation" element={<POSConfirmation />} />
                            <Route path="/banned" element={<BannedUser />} />

                            {/* Protected routes - check both authentication and ban status */}
                            <Route path="/*" element={
                                <PrivateRoute>
                                    <BannedUserHandler>
                                        <Routes>
                                            {/* Main Routes with Layout */}
                                            <Route path="/" element={<MainLayout><TicketboxHome /></MainLayout>} />
                                            <Route path="/home" element={<MainLayout><TicketboxHome /></MainLayout>} />
                                            <Route path="/old-home" element={<MainLayout><Home /></MainLayout>} />
                                            <Route path="/events" element={<MainLayout><AllEvents /></MainLayout>} />
                                            <Route path="/chat" element={<MainLayout><ChatPage /></MainLayout>} />
                                            <Route path="/friends" element={<MainLayout><FriendPage /></MainLayout>} />
                                            <Route path="/forum" element={<MainLayout><Forum /></MainLayout>} />
                                            <Route path="/forum/post/:id" element={<MainLayout><PostDetail /></MainLayout>} /> {/* Thêm route mới */}
                                            <Route path="/event-templates" element={<MainLayout><EventTemplateSelection /></MainLayout>} />
                                            <Route path="/create-event" element={<MainLayout><CreateEvent /></MainLayout>} />
                                            <Route path="/create-event-with-seating" element={<MainLayout><CreateEventWithSeating /></MainLayout>} />
                                            <Route path="/events/:id" element={<MainLayout><EventDetailPage /></MainLayout>} />
                                            <Route path="/events/:id/select-seats" element={<MainLayout><SelectSeatPage /></MainLayout>} />
                                            <Route path="/booking/:id" element={<MainLayout><BookingPage /></MainLayout>} />
                                            <Route path="/simple-booking/:id" element={<MainLayout><SimpleTicketBooking /></MainLayout>} />
                                            <Route path="/checkout" element={<MainLayout><PaymentCheckout /></MainLayout>} />
                                            <Route path="/my-tickets" element={<MainLayout><MyTicketsPage /></MainLayout>} />
                                            <Route path="/my-events" element={<MainLayout><MyEvents /></MainLayout>} />
                                            <Route path="/events/:id/manage" element={<MainLayout><ManageEvent /></MainLayout>} />
                                            <Route path="/manage-event/:eventId" element={<MainLayout><ManageEvent /></MainLayout>} />
                                            <Route path="/review" element={<MainLayout><Review /></MainLayout>} />
                                            <Route path="/user-profile" element={<MainLayout><ProfilePage /></MainLayout>} />
                                            <Route path="/profile" element={<MainLayout><ProfilePage /></MainLayout>} />
                                            <Route path="/profile/change-password" element={<MainLayout><ChangePasswordPage /></MainLayout>} />
                                            <Route path="/become-owner" element={<MainLayout><BecomeOwnerPage /></MainLayout>} />

                                            {/* Owner Routes */}
                                            <Route path="/owner" element={<PrivateRoute roles={['owner', 'event_owner']}><OwnerLayout /></PrivateRoute>}>
                                                <Route index element={<OwnerDashboard />} />
                                            </Route>
                                            
                                            {/* Owner Statistics - Independent Route */}
                                            <Route path="/owner/statistics" element={<PrivateRoute roles={['owner', 'event_owner']}><OwnerStatistics /></PrivateRoute>} />

                                            {/* Admin Routes */}
                                            <Route path="/admin" element={<PrivateRoute roles={['admin']}><AdminLayout /></PrivateRoute>}>
                                                <Route index element={<AdminDashboard />} />
                                                <Route path="users" element={<UserManagement />} />
                                                <Route path="events" element={<AdminEventManagement />} />
                                                <Route path="featured-events" element={<AdminEventManagement />} />
                                                <Route path="complaints" element={<ComplaintManagement />} />
                                                <Route path="refunds" element={<RefundManagement />} />
                                                <Route path="posts" element={<PostManagement />} />
                                                <Route path="revenue" element={<RevenueReport />} />
                                                <Route path="owner-requests" element={<OwnerRequests />} />
                                                <Route path="pos-confirmation" element={<POSConfirmationAdmin />} />
                                                <Route path="ticket-management" element={<TicketManagement />} />
                                            </Route>
                                        </Routes>
                                    </BannedUserHandler>
                                </PrivateRoute>
                            } />
                        </Routes>
                        <NavigationMonitor />
                        <ChatBox />
                    </Router>
                </SocketProvider>
            </AuthProvider>
        </GoogleOAuthProvider>
    );
};

export default App;