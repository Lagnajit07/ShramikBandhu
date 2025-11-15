import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { Users } from 'lucide-react';

const AuthPage = ({ onLogin }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [loginData, setLoginData] = useState({
    phone: '',
    password: ''
  });

  const [registerData, setRegisterData] = useState({
    name: '',
    phone: '',
    password: '',
    role: 'worker',
    phone_type: 'smartphone'
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/login`, loginData);
      toast.success('Login successful!');
      onLogin(response.data.user, response.data.token);
      navigate(`/${response.data.user.role}-dashboard`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/register`, registerData);
      toast.success('Registration successful!');
      onLogin(response.data.user, response.data.token);
      navigate(`/${response.data.user.role}-dashboard`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">
            <Users className="auth-logo-icon" />
            <span>ShramikBandhu</span>
          </div>
          <h1 className="auth-title" data-testid="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to your account or create a new one</p>
        </div>

        <Tabs defaultValue="login" className="auth-tabs">
          <TabsList className="auth-tabs-list">
            <TabsTrigger value="login" data-testid="login-tab">Login</TabsTrigger>
            <TabsTrigger value="register" data-testid="register-tab">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login" data-testid="login-form">
            <form onSubmit={handleLogin} className="auth-form">
              <div className="form-group">
                <Label htmlFor="login-phone">Phone Number</Label>
                <Input
                  id="login-phone"
                  data-testid="login-phone-input"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={loginData.phone}
                  onChange={(e) => setLoginData({ ...loginData, phone: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  data-testid="login-password-input"
                  type="password"
                  placeholder="Enter your password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                />
              </div>
              <Button
                type="submit"
                data-testid="login-submit-btn"
                className="auth-submit-btn"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register" data-testid="register-form">
            <form onSubmit={handleRegister} className="auth-form">
              <div className="form-group">
                <Label htmlFor="register-name">Full Name</Label>
                <Input
                  id="register-name"
                  data-testid="register-name-input"
                  type="text"
                  placeholder="Enter your full name"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <Label htmlFor="register-phone">Phone Number</Label>
                <Input
                  id="register-phone"
                  data-testid="register-phone-input"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={registerData.phone}
                  onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <Label htmlFor="register-password">Password</Label>
                <Input
                  id="register-password"
                  data-testid="register-password-input"
                  type="password"
                  placeholder="Create a password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <Label htmlFor="register-role">I am a</Label>
                <Select
                  value={registerData.role}
                  onValueChange={(value) => setRegisterData({ ...registerData, role: value })}
                >
                  <SelectTrigger id="register-role" data-testid="register-role-select">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="worker" data-testid="role-worker">Worker</SelectItem>
                    <SelectItem value="employer" data-testid="role-employer">Employer</SelectItem>
                    <SelectItem value="admin" data-testid="role-admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {registerData.role === 'worker' && (
                <div className="form-group">
                  <Label htmlFor="register-phone-type">Phone Type</Label>
                  <Select
                    value={registerData.phone_type}
                    onValueChange={(value) => setRegisterData({ ...registerData, phone_type: value })}
                  >
                    <SelectTrigger id="register-phone-type" data-testid="register-phone-type-select">
                      <SelectValue placeholder="Select phone type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="smartphone" data-testid="phone-smartphone">Smartphone</SelectItem>
                      <SelectItem value="feature" data-testid="phone-feature">Feature Phone</SelectItem>
                      <SelectItem value="none" data-testid="phone-none">No Phone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button
                type="submit"
                data-testid="register-submit-btn"
                className="auth-submit-btn"
                disabled={loading}
              >
                {loading ? 'Registering...' : 'Register'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AuthPage;