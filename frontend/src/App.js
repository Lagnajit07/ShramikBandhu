import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";

import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import WorkerDashboard from "./pages/WorkerDashboard";
import EmployerDashboard from "./pages/EmployerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import Navbar from "./components/Navbar";
import { Toaster } from "./components/ui/sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Axios Setup
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }

    setLoading(false);
  }, []);

  const handleLogin = (userData, token) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", token);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  return (
    <div className="App">
      <Toaster position="top-right" richColors />
      <BrowserRouter>
        {/* 🟢 Navbar added globally */}
        <Navbar />

        <Routes>
          <Route path="/" element={<LandingPage user={user} />} />

          <Route
            path="/auth"
            element={
              user ? (
                <Navigate to={`/${user.role}-dashboard`} />
              ) : (
                <AuthPage onLogin={handleLogin} />
              )
            }
          />

          <Route
            path="/worker-dashboard"
            element={
              user && user.role === "worker" ? (
                <WorkerDashboard user={user} onLogout={handleLogout} />
              ) : (
                <Navigate to="/auth" />
              )
            }
          />

          <Route
            path="/employer-dashboard"
            element={
              user && user.role === "employer" ? (
                <EmployerDashboard user={user} onLogout={handleLogout} />
              ) : (
                <Navigate to="/auth" />
              )
            }
          />

          <Route
            path="/admin-dashboard"
            element={
              user && user.role === "admin" ? (
                <AdminDashboard user={user} onLogout={handleLogout} />
              ) : (
                <Navigate to="/auth" />
              )
            }
          />

          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />

        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
