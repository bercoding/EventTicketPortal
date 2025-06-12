import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Login from "./components/Login";
import Register from "./components/Register";
import ForgotPassword from "./components/ForgotPassword";
import VerifyOtp from "./components/VerifyOtp";
import ResetPassword from "./components/ResetPassword";
import UserManagement from "./components/admin/UserManagement";
import Home from "./pages/Home";
import Forum from "./pages/Forum"; // Import Forum page
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./components/admin/AdminDashboard";
import EventManagement from "./components/admin/EventManagement";
import ComplaintManagement from "./components/admin/ComplaintManagement";
import PostManagement from "./components/admin/PostManagement";
import ViolationReports from "./components/admin/ViolationReports";
import RevenueReport from "./components/admin/RevenueReport";
import OwnerRequests from "./components/admin/OwnerRequests";
import Review from "./pages/Review";
import OwnerLayout from './components/owner/OwnerLayout'; // Import OwnerLayout
import Dashboard from './pages/owners/Dashboard';
import Revenue from './pages/owners/Revenue';
import EventList from './pages/owners/EventList';
import PrivateRoute from './components/routing/PrivateRoute';
import BannedUserGuard from './components/routing/BannedUserGuard';
import EventApproval from './pages/owners/Event_Approval';
import EventOwnershipRules from './pages/owners/Rule_owners';
const App = () => {
  const googleClientId =
    process.env.REACT_APP_GOOGLE_CLIENT_ID || "YOUR_DEFAULT_GOOGLE_CLIENT_ID";

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
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
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/verify-otp" element={<VerifyOtp />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Protected Routes */}
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <Home />
                  </PrivateRoute>
                }
              />
              <Route
                path="/forum"
                element={
                  <PrivateRoute>
                    <Forum />
                  </PrivateRoute>
                }
              />
              <Route
                path="/events/:eventId/review"
                element={
                  <PrivateRoute>
                    <Review />
                  </PrivateRoute>
                }
              />
                 {/* Owner Routes */}
              <Route path="/owner" element={<PrivateRoute><OwnerLayout /></PrivateRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="revenue" element={<Revenue />} />
                <Route path="events" element={<EventList />} />
                  <Route path="events-approval" element={<EventApproval />} />
                <Route path="event-ownership-rules" element={<EventOwnershipRules />} />
              </Route>
              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <PrivateRoute>
                    <AdminLayout />
                  </PrivateRoute>
                }
              >
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
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
