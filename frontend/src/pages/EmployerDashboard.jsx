import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'sonner';
import { LogOut, Briefcase, User, Star, MapPin, Calendar, IndianRupee, Users, Phone, CheckCircle } from 'lucide-react';

const EmployerDashboard = ({ user, onLogout }) => {
  const [profile, setProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileSetup, setProfileSetup] = useState(false);
  const [showJobDialog, setShowJobDialog] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [assignments, setAssignments] = useState([]);

  const [newProfile, setNewProfile] = useState({
    company_name: '',
    company_address: ''
  });

  const [newJob, setNewJob] = useState({
    title: '',
    description: '',
    skill_required: '',
    workers_needed: 1,
    wage_per_day: 0,
    location: '',
    date: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch profile
      try {
        const profileRes = await axios.get(`${API}/employers/profile`);
        setProfile(profileRes.data);
      } catch (error) {
        if (error.response?.status === 404) {
          setProfileSetup(true);
        }
      }

      // Fetch jobs
      const jobsRes = await axios.get(`${API}/jobs`);
      setJobs(jobsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API}/employers/profile`, newProfile);
      setProfile(response.data);
      setProfileSetup(false);
      toast.success('Profile created successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create profile');
    }
  };

  const createJob = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/jobs`, newJob);
      toast.success('Job posted successfully! Workers are being notified.');
      setShowJobDialog(false);
      setNewJob({
        title: '',
        description: '',
        skill_required: '',
        workers_needed: 1,
        wage_per_day: 0,
        location: '',
        date: ''
      });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create job');
    }
  };

  const viewJobAssignments = async (job) => {
    try {
      const response = await axios.get(`${API}/jobs/${job.id}/assignments`);
      setAssignments(response.data);
      setSelectedJob(job);
    } catch (error) {
      toast.error('Failed to fetch assignments');
    }
  };

  const rateWorker = async (assignmentId, rating) => {
    try {
      await axios.post(`${API}/assignments/${assignmentId}/rate`, { rating, assignment_id: assignmentId });
      toast.success('Rating submitted!');
      if (selectedJob) {
        viewJobAssignments(selectedJob);
      }
    } catch (error) {
      toast.error('Failed to submit rating');
    }
  };

  if (loading) {
    return <div className="dashboard-loading">Loading...</div>;
  }

  if (profileSetup) {
    return (
      <div className="profile-setup-page">
        <div className="profile-setup-container">
          <h1 className="profile-setup-title">Complete Your Employer Profile</h1>
          <p className="profile-setup-subtitle">Tell us about your company</p>
          <form onSubmit={createProfile} className="profile-setup-form">
            <div className="form-group">
              <Label htmlFor="company-name">Company Name</Label>
              <Input
                id="company-name"
                data-testid="profile-company-name-input"
                placeholder="Enter company name"
                value={newProfile.company_name}
                onChange={(e) => setNewProfile({ ...newProfile, company_name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <Label htmlFor="company-address">Company Address</Label>
              <Textarea
                id="company-address"
                data-testid="profile-company-address-input"
                placeholder="Enter complete address"
                value={newProfile.company_address}
                onChange={(e) => setNewProfile({ ...newProfile, company_address: e.target.value })}
                required
              />
            </div>
            <Button type="submit" data-testid="profile-submit-btn" className="profile-submit-btn">
              Create Profile
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="dashboard-title" data-testid="employer-dashboard-title">Employer Dashboard</h1>
            <p className="dashboard-subtitle">Welcome back, {profile?.company_name}!</p>
          </div>
          <div className="header-right">
            <Dialog open={showJobDialog} onOpenChange={setShowJobDialog}>
              <DialogTrigger asChild>
                <Button data-testid="post-job-btn">
                  <Briefcase className="icon-sm" />
                  Post New Job
                </Button>
              </DialogTrigger>
              <DialogContent className="job-dialog">
                <DialogHeader>
                  <DialogTitle>Post a New Job</DialogTitle>
                  <DialogDescription>
                    Fill in the details and workers will be automatically notified
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={createJob} className="job-form">
                  <div className="form-group">
                    <Label htmlFor="job-title">Job Title</Label>
                    <Input
                      id="job-title"
                      data-testid="job-title-input"
                      placeholder="e.g., Construction Worker"
                      value={newJob.title}
                      onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <Label htmlFor="job-description">Description</Label>
                    <Textarea
                      id="job-description"
                      data-testid="job-description-input"
                      placeholder="Describe the work..."
                      value={newJob.description}
                      onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <Label htmlFor="job-skill">Skill Required</Label>
                    <Input
                      id="job-skill"
                      data-testid="job-skill-input"
                      placeholder="e.g., Construction"
                      value={newJob.skill_required}
                      onChange={(e) => setNewJob({ ...newJob, skill_required: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <Label htmlFor="job-workers">Workers Needed</Label>
                      <Input
                        id="job-workers"
                        data-testid="job-workers-input"
                        type="number"
                        min="1"
                        value={newJob.workers_needed}
                        onChange={(e) => setNewJob({ ...newJob, workers_needed: parseInt(e.target.value) })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <Label htmlFor="job-wage">Wage per Day (₹)</Label>
                      <Input
                        id="job-wage"
                        data-testid="job-wage-input"
                        type="number"
                        min="0"
                        value={newJob.wage_per_day}
                        onChange={(e) => setNewJob({ ...newJob, wage_per_day: parseFloat(e.target.value) })}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <Label htmlFor="job-location">Location</Label>
                    <Input
                      id="job-location"
                      data-testid="job-location-input"
                      placeholder="Job site location"
                      value={newJob.location}
                      onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <Label htmlFor="job-date">Job Date</Label>
                    <Input
                      id="job-date"
                      data-testid="job-date-input"
                      type="date"
                      value={newJob.date}
                      onChange={(e) => setNewJob({ ...newJob, date: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" data-testid="submit-job-btn" className="submit-job-btn">
                    Post Job
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
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

      {/* Stats Cards */}
      <div className="stats-grid">
        <Card className="stat-card" data-testid="stat-rating">
          <div className="stat-icon">
            <Star />
          </div>
          <div className="stat-content">
            <p className="stat-label">Company Rating</p>
            <p className="stat-value">{profile?.rating?.toFixed(1) || '0.0'}</p>
          </div>
        </Card>
        <Card className="stat-card" data-testid="stat-total-jobs">
          <div className="stat-icon">
            <Briefcase />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Jobs Posted</p>
            <p className="stat-value">{profile?.total_jobs_posted || 0}</p>
          </div>
        </Card>
        <Card className="stat-card" data-testid="stat-active-jobs">
          <div className="stat-icon">
            <CheckCircle />
          </div>
          <div className="stat-content">
            <p className="stat-label">Active Jobs</p>
            <p className="stat-value">{jobs.filter(j => j.status === 'open').length}</p>
          </div>
        </Card>
      </div>

      {/* Jobs List */}
      <div className="jobs-section">
        <h2 className="section-title">My Posted Jobs</h2>
        {jobs.length === 0 ? (
          <Card className="empty-state">
            <Briefcase className="empty-icon" />
            <p>No jobs posted yet. Click "Post New Job" to get started!</p>
          </Card>
        ) : (
          <div className="jobs-list">
            {jobs.map((job) => (
              <Card key={job.id} className="job-card" data-testid={`job-card-${job.id}`}>
                <div className="job-card-header">
                  <h3 className="job-title">{job.title}</h3>
                  <Badge className={`status-badge ${job.status}`}>{job.status}</Badge>
                </div>
                <p className="job-description">{job.description}</p>
                <div className="job-details">
                  <div className="job-detail">
                    <MapPin className="icon-sm" />
                    <span>{job.location}</span>
                  </div>
                  <div className="job-detail">
                    <Calendar className="icon-sm" />
                    <span>{job.date}</span>
                  </div>
                  <div className="job-detail">
                    <IndianRupee className="icon-sm" />
                    <span>{job.wage_per_day}/day</span>
                  </div>
                  <div className="job-detail">
                    <Users className="icon-sm" />
                    <span>{job.workers_assigned}/{job.workers_needed} workers</span>
                  </div>
                </div>
                <div className="job-actions">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        data-testid={`view-workers-btn-${job.id}`}
                        onClick={() => viewJobAssignments(job)}
                        variant="outline"
                        size="sm"
                      >
                        View Assigned Workers
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="assignments-dialog">
                      <DialogHeader>
                        <DialogTitle>Assigned Workers - {selectedJob?.title}</DialogTitle>
                        <DialogDescription>
                          Workers assigned to this job
                        </DialogDescription>
                      </DialogHeader>
                      {assignments.length === 0 ? (
                        <p className="text-center text-muted">No workers assigned yet</p>
                      ) : (
                        <div className="assignments-list">
                          {assignments.map(({ assignment, worker, profile: workerProfile }) => (
                            <Card key={assignment.id} className="assignment-card">
                              <div className="worker-info">
                                <div className="worker-avatar">
                                  <User />
                                </div>
                                <div>
                                  <p className="worker-name">{worker.name}</p>
                                  <p className="worker-phone">
                                    <Phone className="icon-xs" />
                                    {worker.phone}
                                  </p>
                                  <div className="worker-rating">
                                    <Star className="icon-xs filled" />
                                    <span>{workerProfile.rating?.toFixed(1) || '0.0'}</span>
                                  </div>
                                  <Badge className={`assignment-status ${assignment.status}`}>
                                    {assignment.status}
                                  </Badge>
                                </div>
                              </div>
                              {assignment.status === 'completed' && !assignment.worker_rating && (
                                <div className="rating-section">
                                  <p className="rating-label">Rate this worker:</p>
                                  <div className="rating-buttons">
                                    {[1, 2, 3, 4, 5].map((rating) => (
                                      <Button
                                        key={rating}
                                        data-testid={`rate-worker-${rating}-btn`}
                                        onClick={() => rateWorker(assignment.id, rating)}
                                        variant="outline"
                                        size="sm"
                                        className="rating-btn"
                                      >
                                        {rating} <Star className="icon-xs" />
                                      </Button>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {assignment.worker_rating && (
                                <p className="rated-text">You rated: {assignment.worker_rating} ⭐</p>
                              )}
                            </Card>
                          ))}
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployerDashboard;