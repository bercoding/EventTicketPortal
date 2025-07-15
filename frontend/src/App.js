import React, { useEffect } from 'react';
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
import MainLayout from './components/layout/MainLayout';
import ProfilePage from './pages/ProfilePage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import BecomeOwnerPage from './pages/BecomeOwnerPage';
import MyTicketsPage from './pages/MyTicketsPage';
import EventDetailPage from './pages/EventDetailPage';
import BookingPage from './pages/BookingPage';
import Forum from './pages/Forum';
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
import EventManagement from './components/admin/EventManagement';
import ComplaintManagement from './components/admin/ComplaintManagement';
import AdminEventManagement from './components/admin/AdminEventManagement';
import PostManagement from './components/admin/PostManagement';
import ViolationReports from './components/admin/ViolationReports';
import RevenueReport from './components/admin/RevenueReport';
import OwnerRequests from './components/admin/OwnerRequests';
import POSConfirmationAdmin from './pages/admin/POSConfirmation';
import TicketManagement from './components/admin/TicketManagement';
import OwnerLayout from './components/owner/OwnerLayout';
import OwnerDashboard from './components/owner/OwnerDashboard';
import OwnerEvents from './components/owner/OwnerEvents';
import OwnerRevenue from './components/owner/OwnerRevenue';
import OwnerCustomers from './components/owner/OwnerCustomers';
import OwnerFeedback from './components/owner/OwnerFeedback';
import OwnerRules from './components/owner/OwnerRules';
import SimpleTicketBooking from './pages/SimpleTicketBooking';
import { FriendPage } from './pages/friend';

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

// Layout Wrapper - removed since it's not being used correctly
// This was causing "Component is not a function" errors

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
                        <BannedUserGuard>
                            <Routes>
                                <Route path="/login" element={<Login />} />
                                <Route path="/register" element={<Register />} />
                                <Route path="/forgot-password" element={<ForgotPassword />} />
                                <Route path="/verify-otp" element={<VerifyOtp />} />
                                <Route path="/reset-password" element={<ResetPassword />} />
                                <Route path="/payment/callback" element={<PaymentCallback />} />
                                <Route path="/payment/success" element={<PaymentSuccess />} />
                                <Route path="/payment/failure" element={<PaymentFailure />} />
                                <Route path="/payment/pos-confirmation" element={<POSConfirmation />} />

                                {/* Main Routes with Layout */}
                                <Route path="/" element={<PrivateRoute><MainLayout><TicketboxHome /></MainLayout></PrivateRoute>} />
                                <Route path="/home" element={<PrivateRoute><MainLayout><TicketboxHome /></MainLayout></PrivateRoute>} />
                                <Route path="/old-home" element={<PrivateRoute><MainLayout><Home /></MainLayout></PrivateRoute>} />
                                <Route path="/events" element={<PrivateRoute><MainLayout><AllEvents /></MainLayout></PrivateRoute>} />
                                <Route path="/chat" element={<PrivateRoute><MainLayout><ChatPage /></MainLayout></PrivateRoute>} />
                                <Route path="/friends" element={<PrivateRoute><MainLayout><FriendPage /></MainLayout></PrivateRoute>} />
                                <Route path="/forum" element={<PrivateRoute><MainLayout><Forum /></MainLayout></PrivateRoute>} />
                                <Route path="/event-templates" element={<PrivateRoute><MainLayout><EventTemplateSelection /></MainLayout></PrivateRoute>} />
                                <Route path="/create-event" element={<PrivateRoute><MainLayout><CreateEvent /></MainLayout></PrivateRoute>} />
                                <Route path="/create-event-with-seating" element={<PrivateRoute><MainLayout><CreateEventWithSeating /></MainLayout></PrivateRoute>} />
                                <Route path="/events/:id" element={<PrivateRoute><MainLayout><EventDetailPage /></MainLayout></PrivateRoute>} />
                                <Route path="/events/:id/select-seats" element={<PrivateRoute><MainLayout><SelectSeatPage /></MainLayout></PrivateRoute>} />
                                <Route path="/booking/:id" element={<PrivateRoute><MainLayout><BookingPage /></MainLayout></PrivateRoute>} />
                                <Route path="/simple-booking/:id" element={<PrivateRoute><MainLayout><SimpleTicketBooking /></MainLayout></PrivateRoute>} />
                                <Route path="/checkout" element={<PrivateRoute><MainLayout><PaymentCheckout /></MainLayout></PrivateRoute>} />
                                <Route path="/my-tickets" element={<PrivateRoute><MainLayout><MyTicketsPage /></MainLayout></PrivateRoute>} />
                                <Route path="/my-events" element={<PrivateRoute><MainLayout><MyEvents /></MainLayout></PrivateRoute>} />
                                <Route path="/events/:id/manage" element={<PrivateRoute><MainLayout><ManageEvent /></MainLayout></PrivateRoute>} />
                                <Route path="/manage-event/:eventId" element={<PrivateRoute><MainLayout><ManageEvent /></MainLayout></PrivateRoute>} />
                                <Route path="/review" element={<PrivateRoute><MainLayout><Review /></MainLayout></PrivateRoute>} />
                                <Route path="/user-profile" element={<PrivateRoute><MainLayout><ProfilePage /></MainLayout></PrivateRoute>} />
                                <Route path="/profile" element={<PrivateRoute><MainLayout><ProfilePage /></MainLayout></PrivateRoute>} />
                                <Route path="/profile/change-password" element={<PrivateRoute><MainLayout><ChangePasswordPage /></MainLayout></PrivateRoute>} />
                                <Route path="/become-owner" element={<PrivateRoute><MainLayout><BecomeOwnerPage /></MainLayout></PrivateRoute>} />

                                {/* Owner Routes */}
                                <Route path="/owner" element={<PrivateRoute><OwnerLayout /></PrivateRoute>}>
                                    <Route index element={<OwnerDashboard />} />
                                </Route>

                                <Route path="/admin" element={<PrivateRoute roles={['admin']}><AdminLayout /></PrivateRoute>}>
                                    <Route index element={<AdminDashboard />} />
                                    <Route path="users" element={<UserManagement />} />
                                    <Route path="events" element={<EventManagement />} />
                                    <Route path="featured-events" element={<AdminEventManagement />} />
                                    <Route path="complaints" element={<ComplaintManagement />} />
                                    <Route path="posts" element={<PostManagement />} />
                                    <Route path="violations" element={<ViolationReports />} />
                                    <Route path="revenue" element={<RevenueReport />} />
                                    <Route path="owner-requests" element={<OwnerRequests />} />
                                    <Route path="pos-confirmation" element={<POSConfirmationAdmin />} />
                                    <Route path="ticket-management" element={<TicketManagement />} />
                                </Route>

                            </Routes>
                            <NavigationMonitor />
                        </BannedUserGuard>
                    </Router>
                </SocketProvider>
            </AuthProvider>
        </GoogleOAuthProvider>
    );
};

export default App;