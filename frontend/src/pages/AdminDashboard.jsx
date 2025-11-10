import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'sonner';
import { LogOut, Users, Briefcase, TrendingUp, User, Phone, Star, Smartphone, PhoneOff } from 'lucide-react';

const AdminDashboard = ({ user, onLogout }) => {
  const [stats, setStats] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorker, setSelectedWorker] = useState('');
  const [selectedJob, setSelectedJob] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, workersRes, jobsRes] = await Promise.all([
        axios.get(`${API}/admin/dashboard`),
        axios.get(`${API}/admin/workers`),
        axios.get(`${API}/jobs`)
      ]);
      setStats(statsRes.data);
      setWorkers(workersRes.data);
      setJobs(jobsRes.data.filter(j => j.status === 'open'));
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const assignJobManually = async () => {
    if (!selectedWorker || !selectedJob) {
      toast.error('Please select both worker and job');
      return;
    }
    try {
      await axios.post(`${API}/admin/assign-job`, null, {
        params: { job_id: selectedJob, worker_id: selectedWorker }
      });
      toast.success('Job assigned successfully!');
      setSelectedWorker('');
      setSelectedJob('');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to assign job');
    }
  };

  if (loading) {
    return <div className="dashboard-loading">Loading...</div>;
  }

  return (
    <div className="dashboard admin-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="dashboard-title" data-testid="admin-dashboard-title">Admin Dashboard</h1>
            <p className="dashboard-subtitle">Labor Stand Management System</p>
          </div>
          <div className="header-right">
            <Button
              data-testid="logout-btn"
              onClick={onLogout}
              variant="ghost"
              size="sm"
            >
              <LogOut className="icon-sm" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="stats-grid-large">
        <Card className="stat-card large" data-testid="stat-total-workers">
          <div className="stat-icon">
            <Users />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Workers</p>
            <p className="stat-value">{stats?.total_workers || 0}</p>
          </div>
        </Card>
        <Card className="stat-card large" data-testid="stat-total-employers">
          <div className="stat-icon">
            <Briefcase />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Employers</p>
            <p className="stat-value">{stats?.total_employers || 0}</p>
          </div>
        </Card>
        <Card className="stat-card large" data-testid="stat-total-jobs">
          <div className="stat-icon">
            <TrendingUp />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Jobs</p>
            <p className="stat-value">{stats?.total_jobs || 0}</p>
          </div>
        </Card>
        <Card className="stat-card large" data-testid="stat-active-jobs">
          <div className="stat-icon">
            <Briefcase />
          </div>
          <div className="stat-content">
            <p className="stat-label">Active Jobs</p>
            <p className="stat-value">{stats?.active_jobs || 0}</p>
          </div>
        </Card>
      </div>

      {/* Workers by Phone Type */}
      <Card className="phone-type-card">
        <h3 className="card-title">Workers by Phone Type</h3>
        <div className="phone-type-stats">
          <div className="phone-type-stat" data-testid="stat-smartphone">
            <Smartphone className="phone-icon" />
            <div>
              <p className="phone-label">Smartphone</p>
              <p className="phone-value">{stats?.workers_by_type?.smartphone || 0}</p>
            </div>
          </div>
          <div className="phone-type-stat" data-testid="stat-feature-phone">
            <Phone className="phone-icon" />
            <div>
              <p className="phone-label">Feature Phone</p>
              <p className="phone-value">{stats?.workers_by_type?.feature || 0}</p>
            </div>
          </div>
          <div className="phone-type-stat" data-testid="stat-no-phone">
            <PhoneOff className="phone-icon" />
            <div>
              <p className="phone-label">No Phone</p>
              <p className="phone-value">{stats?.workers_by_type?.no_phone || 0}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Manual Assignment Section */}
      <Card className="assignment-card">
        <h3 className="card-title">Manual Job Assignment (For No-Phone Workers)</h3>
        <p className="card-description">Assign jobs to workers who don't have phones</p>
        <div className="assignment-form">
          <div className="form-group">
            <label>Select Worker</label>
            <Select value={selectedWorker} onValueChange={setSelectedWorker}>
              <SelectTrigger data-testid="select-worker">
                <SelectValue placeholder="Choose a worker" />
              </SelectTrigger>
              <SelectContent>
                {workers
                  .filter(w => w.user.phone_type === 'none' && w.profile?.available)
                  .map(({ user: worker, profile }) => (
                    <SelectItem key={worker.id} value={worker.id} data-testid={`worker-option-${worker.id}`}>
                      {worker.name} - {profile?.skills?.join(', ') || 'No skills'}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="form-group">
            <label>Select Job</label>
            <Select value={selectedJob} onValueChange={setSelectedJob}>
              <SelectTrigger data-testid="select-job">
                <SelectValue placeholder="Choose a job" />
              </SelectTrigger>
              <SelectContent>
                {jobs.map((job) => (
                  <SelectItem key={job.id} value={job.id} data-testid={`job-option-${job.id}`}>
                    {job.title} - {job.location} (₹{job.wage_per_day}/day)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            data-testid="assign-job-btn"
            onClick={assignJobManually}
            className="assign-btn"
          >
            Assign Job
          </Button>
        </div>
      </Card>

      {/* Workers List */}
      <div className="workers-section">
        <h2 className="section-title">All Registered Workers</h2>
        <div className="workers-grid">
          {workers.map(({ user: worker, profile }) => (
            <Card key={worker.id} className="worker-card" data-testid={`worker-card-${worker.id}`}>
              <div className="worker-header">
                <div className="worker-avatar">
                  <User />
                </div>
                <div className="worker-info">
                  <h4 className="worker-name">{worker.name}</h4>
                  <p className="worker-phone">
                    <Phone className="icon-xs" />
                    {worker.phone}
                  </p>
                  <Badge className={`phone-type-badge ${worker.phone_type}`}>
                    {worker.phone_type === 'smartphone' && <Smartphone className="icon-xs" />}
                    {worker.phone_type === 'feature' && <Phone className="icon-xs" />}
                    {worker.phone_type === 'none' && <PhoneOff className="icon-xs" />}
                    {worker.phone_type}
                  </Badge>
                </div>
              </div>
              {profile ? (
                <div className="worker-details">
                  <div className="worker-detail">
                    <span className="detail-label">Skills:</span>
                    <div className="skills-list">
                      {profile.skills?.map((skill, idx) => (
                        <Badge key={idx} variant="secondary" className="skill-badge">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="worker-detail">
                    <span className="detail-label">Experience:</span>
                    <span>{profile.experience_years} years</span>
                  </div>
                  <div className="worker-detail">
                    <span className="detail-label">Location:</span>
                    <span>{profile.location}</span>
                  </div>
                  <div className="worker-detail">
                    <span className="detail-label">Rating:</span>
                    <div className="rating">
                      <Star className="icon-xs filled" />
                      <span>{profile.rating?.toFixed(1) || '0.0'} ({profile.total_jobs} jobs)</span>
                    </div>
                  </div>
                  <div className="worker-detail">
                    <span className="detail-label">Status:</span>
                    <Badge className={profile.available ? 'available' : 'unavailable'}>
                      {profile.available ? 'Available' : 'Unavailable'}
                    </Badge>
                  </div>
                </div>
              ) : (
                <p className="no-profile">Profile not completed</p>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;