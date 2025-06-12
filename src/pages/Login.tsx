import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from '../api/api'; 
import { useAuth } from '../context/auth-context';

import "../App.css";

const Login: React.FC = () => {
  const [username, setUserName] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { setCredentials } = useAuth(); 
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "FIS Login";

    const favicon = document.querySelector("link[rel='icon']");
    if (favicon) {
      favicon.setAttribute("href", "/icon.png");
    }
  
    // Clear any existing credentials on mount
    localStorage.removeItem("token");
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("password");
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      const response = await loginUser(username, password);
      
      if (response?.token) {
        setCredentials(username, password);
        
        setTimeout(() => {
          console.log("adminflag in login just before navigation:", localStorage.getItem("adminflag"));
          navigate("/dashboard", { replace: true });
        }, 100);
      } else {
        throw new Error("Invalid login response");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <img src="/logo.png" alt="Yeti Airlines" className="logo" />
        <h2>Login to your account</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <span className="icon">👤</span>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUserName(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="input-group">
            <span className="icon">🔒</span>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit" 
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? "LOGGING IN..." : "LOGIN ➝"}
          </button>
        </form>
      </div>

      <footer className="footer">
        <p>© 2025 Sishir Shrestha. All Rights Reserved.</p>
      </footer>
    </div>
  );
};

export default Login;