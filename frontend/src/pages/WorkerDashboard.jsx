import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'sonner';
import { LogOut, User, Briefcase, Bell, Star, MapPin, Calendar, IndianRupee, CheckCircle, XCircle, Clock } from 'lucide-react';

const WorkerDashboard = ({ user, onLogout }) => {
  const [profile, setProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileSetup, setProfileSetup] = useState(false);
  const [newProfile, setNewProfile] = useState({
    skills: '',
    experience_years: 0,
    location: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch profile
      try {
        const profileRes = await axios.get(`${API}/workers/profile`);
        setProfile(profileRes.data);
      } catch (error) {
        if (error.response?.status === 404) {
          setProfileSetup(true);
        }
      }

      // Fetch jobs
      const jobsRes = await axios.get(`${API}/workers/jobs`);
      setJobs(jobsRes.data);

      // Fetch notifications
      const notifRes = await axios.get(`${API}/notifications`);
      setNotifications(notifRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async (e) => {
    e.preventDefault();
    try {
      const profileData = {
        ...newProfile,
        skills: newProfile.skills.split(',').map(s => s.trim())
      };
      const response = await axios.post(`${API}/workers/profile`, profileData);
      setProfile(response.data);
      setProfileSetup(false);
      toast.success('Profile created successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create profile');
    }
  };

  const toggleAvailability = async () => {
    try {
      await axios.put(`${API}/workers/availability`, null, {
        params: { available: !profile.available }
      });
      setProfile({ ...profile, available: !profile.available });
      toast.success(`Availability updated to ${!profile.available ? 'Available' : 'Unavailable'}`);
    } catch (error) {
      toast.error('Failed to update availability');
    }
  };

  const handleJobAction = async (assignmentId, status) => {
    try {
      await axios.put(`${API}/assignments/${assignmentId}`, { status });
      toast.success(`Job ${status}!`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update job status');
    }
  };

  const submitRating = async (assignmentId, rating) => {
    try {
      await axios.post(`${API}/assignments/${assignmentId}/rate`, { rating, assignment_id: assignmentId });
      toast.success('Rating submitted!');
      fetchData();
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
          <h1 className="profile-setup-title">Complete Your Worker Profile</h1>
          <p className="profile-setup-subtitle">Tell us about your skills and experience</p>
          <form onSubmit={createProfile} className="profile-setup-form">
            <div className="form-group">
              <Label htmlFor="skills">Skills (comma-separated)</Label>
              <Input
                id="skills"
                data-testid="profile-skills-input"
                placeholder="e.g., Construction, Plumbing, Electrical"
                value={newProfile.skills}
                onChange={(e) => setNewProfile({ ...newProfile, skills: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <Label htmlFor="experience">Years of Experience</Label>
              <Input
                id="experience"
                data-testid="profile-experience-input"
                type="number"
                min="0"
                value={newProfile.experience_years}
                onChange={(e) => setNewProfile({ ...newProfile, experience_years: parseInt(e.target.value) })}
                required
              />
            </div>
            <div className="form-group">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                data-testid="profile-location-input"
                placeholder="Enter your city/area"
                value={newProfile.location}
                onChange={(e) => setNewProfile({ ...newProfile, location: e.target.value })}
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
            <h1 className="dashboard-title" data-testid="worker-dashboard-title">Worker Dashboard</h1>
            <p className="dashboard-subtitle">Welcome back, {user.name}!</p>
          </div>
          <div className="header-right">
            <Badge
              data-testid="availability-badge"
              className={`availability-badge ${profile?.available ? 'available' : 'unavailable'}`}
            >
              {profile?.available ? 'Available' : 'Unavailable'}
            </Badge>
            <Button
              data-testid="toggle-availability-btn"
              onClick={toggleAvailability}
              variant="outline"
              size="sm"
            >
              {profile?.available ? 'Mark Unavailable' : 'Mark Available'}
            </Button>
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
            <p className="stat-label">Rating</p>
            <p className="stat-value">{profile?.rating?.toFixed(1) || '0.0'}</p>
          </div>
        </Card>
        <Card className="stat-card" data-testid="stat-jobs-completed">
          <div className="stat-icon">
            <Briefcase />
          </div>
          <div className="stat-content">
            <p className="stat-label">Jobs Completed</p>
            <p className="stat-value">{profile?.total_jobs || 0}</p>
          </div>
        </Card>
        <Card className="stat-card" data-testid="stat-notifications">
          <div className="stat-icon">
            <Bell />
          </div>
          <div className="stat-content">
            <p className="stat-label">Unread Notifications</p>
            <p className="stat-value">{notifications.filter(n => !n.read).length}</p>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="jobs" className="dashboard-tabs">
        <TabsList data-testid="dashboard-tabs-list">
          <TabsTrigger value="jobs" data-testid="jobs-tab">My Jobs</TabsTrigger>
          <TabsTrigger value="profile" data-testid="profile-tab">Profile</TabsTrigger>
          <TabsTrigger value="notifications" data-testid="notifications-tab">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" data-testid="jobs-content">
          <div className="jobs-section">
            <h2 className="section-title">My Job Assignments</h2>
            {jobs.length === 0 ? (
              <Card className="empty-state">
                <Briefcase className="empty-icon" />
                <p>No job assignments yet. Stay available to receive job notifications!</p>
              </Card>
            ) : (
              <div className="jobs-list">
                {jobs.map(({ assignment, job }) => (
                  <Card key={assignment.id} className="job-card" data-testid={`job-card-${assignment.id}`}>
                    <div className="job-card-header">
                      <h3 className="job-title">{job.title}</h3>
                      <Badge className={`status-badge ${assignment.status}`}>
                        {assignment.status === 'pending' && <Clock className="icon-xs" />}
                        {assignment.status === 'accepted' && <CheckCircle className="icon-xs" />}
                        {assignment.status === 'rejected' && <XCircle className="icon-xs" />}
                        {assignment.status === 'completed' && <Star className="icon-xs" />}
                        {assignment.status}
                      </Badge>
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
                    </div>
                    <div className="job-actions">
                      {assignment.status === 'pending' && (
                        <>
                          <Button
                            data-testid={`accept-job-btn-${assignment.id}`}
                            onClick={() => handleJobAction(assignment.id, 'accepted')}
                            size="sm"
                          >
                            Accept Job
                          </Button>
                          <Button
                            data-testid={`reject-job-btn-${assignment.id}`}
                            onClick={() => handleJobAction(assignment.id, 'rejected')}
                            variant="outline"
                            size="sm"
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {assignment.status === 'accepted' && (
                        <Button
                          data-testid={`complete-job-btn-${assignment.id}`}
                          onClick={() => handleJobAction(assignment.id, 'completed')}
                          size="sm"
                        >
                          Mark Completed
                        </Button>
                      )}
                      {assignment.status === 'completed' && !assignment.employer_rating && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button data-testid={`rate-employer-btn-${assignment.id}`} variant="outline" size="sm">
                              Rate Employer
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Rate Your Experience</DialogTitle>
                              <DialogDescription>
                                How was your experience working on this job?
                              </DialogDescription>
                            </DialogHeader>
                            <div className="rating-dialog">
                              {[1, 2, 3, 4, 5].map((rating) => (
                                <Button
                                  key={rating}
                                  data-testid={`rating-${rating}-btn`}
                                  onClick={() => submitRating(assignment.id, rating)}
                                  variant="outline"
                                  className="rating-btn"
                                >
                                  {rating} <Star className="icon-sm" />
                                </Button>
                              ))}
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="profile" data-testid="profile-content">
          <Card className="profile-card">
            <div className="profile-header">
              <div className="profile-avatar">
                <User />
              </div>
              <div>
                <h2 className="profile-name">{user.name}</h2>
                <p className="profile-phone">{user.phone}</p>
                <Badge className="phone-type-badge">{user.phone_type}</Badge>
              </div>
            </div>
            <div className="profile-details">
              <div className="profile-detail">
                <Label>Skills</Label>
                <div className="skills-badges">
                  {profile?.skills?.map((skill, index) => (
                    <Badge key={index} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              </div>
              <div className="profile-detail">
                <Label>Experience</Label>
                <p>{profile?.experience_years} years</p>
              </div>
              <div className="profile-detail">
                <Label>Location</Label>
                <p>{profile?.location}</p>
              </div>
              <div className="profile-detail">
                <Label>Rating</Label>
                <div className="rating-display">
                  <Star className="icon-sm filled" />
                  <span>{profile?.rating?.toFixed(1) || '0.0'} ({profile?.total_jobs || 0} jobs)</span>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" data-testid="notifications-content">
          <div className="notifications-section">
            <h2 className="section-title">Notifications</h2>
            {notifications.length === 0 ? (
              <Card className="empty-state">
                <Bell className="empty-icon" />
                <p>No notifications yet</p>
              </Card>
            ) : (
              <div className="notifications-list">
                {notifications.map((notif) => (
                  <Card
                    key={notif.id}
                    className={`notification-card ${notif.read ? 'read' : 'unread'}`}
                    data-testid={`notification-${notif.id}`}
                  >
                    <div className="notification-icon">
                      <Bell />
                    </div>
                    <div className="notification-content">
                      <p className="notification-message">{notif.message}</p>
                      <p className="notification-time">{new Date(notif.created_at).toLocaleString()}</p>
                      <Badge variant="outline" className="notification-type">{notif.notification_type}</Badge>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WorkerDashboard;