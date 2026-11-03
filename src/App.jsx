
import { useState } from 'react'
import './App.css'

function App() {
  const [role, setRole] = useState('student')
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setMessage(
      'Your login interface is working! Authentication will be connected with Firebase in a later step.'
    )
  }

  return (
    <div className="login-page">

      {/* Left branding section */}
      <section className="brand-section">

        <div className="brand-content">

          <div className="brand-logo">
            <span className="logo-icon">F</span>
            <span className="logo-name">
              FairQuill<span>AI</span>
            </span>
          </div>

          <div className="brand-message">
            <div className="eyebrow">
              <span className="eyebrow-dot"></span>
              SMARTER ACADEMIC ASSESSMENT
            </div>

            <h1>
              A fairer way
              <br />
              to <span>learn and assess.</span>
            </h1>

            <p>
              Empowering educators and students through
              smarter academic assessments and AI-assisted
              writing analysis.
            </p>

            <div className="feature-list">

              <div className="feature-item">
                <div className="feature-icon">✦</div>
                <div>
                  <strong>Intelligent analysis</strong>
                  <small>AI-assisted writing assessment</small>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">✓</div>
                <div>
                  <strong>Seamless assessment</strong>
                  <small>Quizzes, assignments and results</small>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">⌘</div>
                <div>
                  <strong>Academic transparency</strong>
                  <small>Supporting fair academic practices</small>
                </div>
              </div>

            </div>
          </div>

          <div className="brand-footer">
            © 2026 FairQuill AI. All rights reserved.
          </div>

        </div>

        <div className="decor-circle circle-one"></div>
        <div className="decor-circle circle-two"></div>

      </section>

      {/* Right login section */}
      <main className="form-section">

        <div className="login-container">

          <div className="mobile-logo">
            <span className="logo-icon">F</span>
            <span className="logo-name">
              FairQuill<span>AI</span>
            </span>
          </div>

          <div className="login-heading">
            <div className="welcome-label">WELCOME BACK</div>
            <h2>Sign in to your account</h2>
            <p>
              Enter your details to access your FairQuill
              workspace.
            </p>
          </div>

          {/* Role selection */}
          <div className="role-label">
            I am signing in as
          </div>

          <div className="role-selector">

            <button
              type="button"
              className={`role-option ${role === 'student' ? 'active' : ''}`}
              onClick={() => {
                setRole('student')
                setMessage('')
              }}
            >
              <span className="role-symbol">♙</span>
              <span className="role-text">
                <strong>Student</strong>
                <small>Access your assessments</small>
              </span>
              {role === 'student' && (
                <span className="role-check">✓</span>
              )}
            </button>

            <button
              type="button"
              className={`role-option ${role === 'lecturer' ? 'active' : ''}`}
              onClick={() => {
                setRole('lecturer')
                setMessage('')
              }}
            >
              <span className="role-symbol">♧</span>
              <span className="role-text">
                <strong>Lecturer</strong>
                <small>Manage your assessments</small>
              </span>
              {role === 'lecturer' && (
                <span className="role-check">✓</span>
              )}
            </button>

          </div>

          {/* Login form */}
          <form onSubmit={handleSubmit}>

            <div className="input-group">
              <label htmlFor="email">Email address</label>

              <div className="input-wrapper">
                <span className="input-icon">✉</span>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setMessage('')
                  }}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <div className="password-label">
                <label htmlFor="password">Password</label>
                <button
                  type="button"
                  className="text-link"
                  onClick={() =>
                    setMessage('Password recovery will be available after Firebase Authentication is connected.')
                  }
                >
                  Forgot password?
                </button>
              </div>

              <div className="input-wrapper">
                <span className="input-icon">▣</span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setMessage('')
                  }}
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button type="submit" className="sign-in-button">
              Sign In
              <span>→</span>
            </button>

          </form>

          {message && (
            <div className="feedback-message" role="status">
              {message}
            </div>
          )}

          <div className="register-section">
            Don't have an account?
            <button
              type="button"
              className="text-link register-link"
              onClick={() =>
                setMessage('Registration will be developed in the next milestone.')
              }
            >
              Create an account
            </button>
          </div>

          <div className="login-divider">
            <span></span>
            <small>FAIRQUILL AI PLATFORM</small>
            <span></span>
          </div>

          <p className="security-note">
            Your academic workspace, designed for fairness
            and transparency.
          </p>

        </div>

      </main>

    </div>
  )
}

export default App
