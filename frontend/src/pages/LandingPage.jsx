import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Users, Briefcase, Shield, TrendingUp, Phone, Smartphone, UserCheck } from 'lucide-react';

const LandingPage = ({ user }) => {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <nav className="navbar">
          <div className="nav-content">
            <div className="logo">
              <Users className="logo-icon" />
              <span>LaborSync</span>
            </div>
            <div className="nav-buttons">
              {user ? (
                <Button
                  data-testid="dashboard-btn"
                  onClick={() => navigate(`/${user.role}-dashboard`)}
                  className="nav-btn"
                >
                  Go to Dashboard
                </Button>
              ) : (
                <Button
                  data-testid="get-started-btn"
                  onClick={() => navigate('/auth')}
                  className="nav-btn"
                >
                  Get Started
                </Button>
              )}
            </div>
          </div>
        </nav>

        <div className="hero-content">
          <h1 className="hero-title" data-testid="hero-title">
            Connecting Every Worker,
            <br />
            <span className="gradient-text">Regardless of Technology</span>
          </h1>
          <p className="hero-subtitle" data-testid="hero-subtitle">
            India's first inclusive labor hiring system that works for smartphone,
            feature phone, and no-phone users
          </p>
          <div className="hero-buttons">
            <Button
              data-testid="hero-join-worker-btn"
              onClick={() => navigate('/auth')}
              size="lg"
              className="hero-btn primary"
            >
              Join as Worker
            </Button>
            <Button
              data-testid="hero-post-job-btn"
              onClick={() => navigate('/auth')}
              size="lg"
              variant="outline"
              className="hero-btn secondary"
            >
              Post a Job
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="section-title">Why LaborSync?</h2>
        <div className="features-grid">
          <div className="feature-card" data-testid="feature-inclusive">
            <div className="feature-icon">
              <Phone />
            </div>
            <h3>Truly Inclusive</h3>
            <p>Works for smartphone, feature phone, and no-phone users through SMS, IVR, and admin kiosk</p>
          </div>

          <div className="feature-card" data-testid="feature-smart-matching">
            <div className="feature-icon">
              <TrendingUp />
            </div>
            <h3>Smart Matching</h3>
            <p>AI-powered algorithm ensures fair job distribution based on skills, ratings, and rotation</p>
          </div>

          <div className="feature-card" data-testid="feature-instant-notification">
            <div className="feature-icon">
              <Smartphone />
            </div>
            <h3>Instant Notifications</h3>
            <p>Real-time job alerts via app, SMS, or IVR calls based on worker's phone type</p>
          </div>

          <div className="feature-card" data-testid="feature-transparent">
            <div className="feature-icon">
              <Shield />
            </div>
            <h3>Transparent & Secure</h3>
            <p>Track job history, ratings, and payments. Build trust through verified feedback</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works-section">
        <h2 className="section-title">How It Works</h2>
        <div className="steps-container">
          <div className="step-card" data-testid="step-employers">
            <div className="step-number">1</div>
            <Briefcase className="step-icon" />
            <h3>Employers Post Jobs</h3>
            <p>Create job listings with skill requirements, location, and wage details</p>
          </div>

          <div className="step-card" data-testid="step-matching">
            <div className="step-number">2</div>
            <TrendingUp className="step-icon" />
            <h3>Smart Matching</h3>
            <p>Our algorithm matches available workers based on skills and ensures fair rotation</p>
          </div>

          <div className="step-card" data-testid="step-notifications">
            <div className="step-number">3</div>
            <Phone className="step-icon" />
            <h3>Multi-Channel Notifications</h3>
            <p>Workers receive notifications via app, SMS, IVR, or admin kiosk</p>
          </div>

          <div className="step-card" data-testid="step-work">
            <div className="step-number">4</div>
            <UserCheck className="step-icon" />
            <h3>Work & Get Rated</h3>
            <p>Complete jobs, earn ratings, and build your reputation in the system</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <h2 className="cta-title">Ready to Get Started?</h2>
        <p className="cta-subtitle">Join thousands of workers and employers already using LaborSync</p>
        <Button
          data-testid="cta-join-btn"
          onClick={() => navigate('/auth')}
          size="lg"
          className="cta-button"
        >
          Join Now
        </Button>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>&copy; 2024 LaborSync. Empowering India's workforce.</p>
      </footer>
    </div>
  );
};

export default LandingPage;