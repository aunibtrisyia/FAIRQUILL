
import { useState } from 'react'
import './App.css'

function App() {
  const [page, setPage] = useState('login')
  const [role, setRole] = useState('student')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')

  const changePage = (newPage) => {
    setPage(newPage)
    setMessage('')
    setPassword('')
    setConfirmPassword('')
  }

  const handleLogin = (e) => {
    e.preventDefault()

    setMessage(
      'Your login form is working! Firebase Authentication will be connected in the next milestone.'
    )
  }

  const handleRegister = (e) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      setMessage('Passwords do not match. Please try again.')
      return
    }

    if (password.length < 6) {
      setMessage('Password must contain at least 6 characters.')
      return
    }

    if (role === 'lecturer') {
      setMessage(
        'Your lecturer registration form is ready. Lecturer verification will be implemented with Firebase.'
      )
      return
    }

    setMessage(
      'Your registration form is working! Firebase account creation will be connected in the next milestone.'
    )
  }

  const selectRole = (selectedRole) => {
    setRole(selectedRole)
    setMessage('')
  }

  return (
    <div className="login-page">

      {/* LEFT BRANDING SECTION */}

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

      {/* RIGHT FORM SECTION */}

      <main className="form-section">

        <div className="login-container">

          {/* MOBILE LOGO */}

          <div className="mobile-logo">
            <span className="logo-icon">F</span>
            <span className="logo-name">
              FairQuill<span>AI</span>
            </span>
          </div>

          {/* PAGE HEADING */}

          <div className="login-heading">

            <div className="welcome-label">
              {page === 'login' ? 'WELCOME BACK' : 'GET STARTED'}
            </div>

            <h2>
              {page === 'login'
                ? 'Sign in to your account'
                : 'Create your account'}
            </h2>

            <p>
              {page === 'login'
                ? 'Enter your details to access your FairQuill workspace.'
                : 'Join FairQuill AI and access your academic workspace.'}
            </p>

          </div>

          {/* ROLE SELECTION */}

          <div className="role-label">
            {page === 'login'
              ? 'I am signing in as'
              : 'I want to register as'}
          </div>

          <div className="role-selector">

            <button
              type="button"
              className={`role-option ${role === 'student' ? 'active' : ''}`}
              onClick={() => selectRole('student')}
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
              onClick={() => selectRole('lecturer')}
            >
              <span className="role-symbol">♧</span>

              <span className="role-text">
                <strong>Lecturer</strong>
                <small>Manage assessments</small>
              </span>

              {role === 'lecturer' && (
                <span className="role-check">✓</span>
              )}
            </button>

          </div>

          {/* LOGIN FORM */}

          {page === 'login' && (

            <form onSubmit={handleLogin}>

              <div className="input-group">
                <label htmlFor="login-email">Email address</label>

                <div className="input-wrapper">
                  <span className="input-icon">✉</span>

                  <input
                    id="login-email"
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
                  <label htmlFor="login-password">Password</label>

                  <button
                    type="button"
                    className="text-link"
                    onClick={() =>
                      setMessage(
                        'Password recovery will be available after Firebase is connected.'
                      )
                    }
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="input-wrapper">
                  <span className="input-icon">▣</span>

                  <input
                    id="login-password"
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
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <button type="submit" className="sign-in-button">
                Sign In <span>→</span>
              </button>

            </form>

          )}

          {/* REGISTRATION FORM */}

          {page === 'register' && (

            <form onSubmit={handleRegister}>

              <div className="input-group">
                <label htmlFor="full-name">Full name</label>

                <div className="input-wrapper">
                  <span className="input-icon">♙</span>

                  <input
                    id="full-name"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      setMessage('')
                    }}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="register-email">Email address</label>

                <div className="input-wrapper">
                  <span className="input-icon">✉</span>

                  <input
                    id="register-email"
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
                <label htmlFor="register-password">Password</label>

                <div className="input-wrapper">
                  <span className="input-icon">▣</span>

                  <input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setMessage('')
                    }}
                    minLength={6}
                    required
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="confirm-password">
                  Confirm password
                </label>

                <div className="input-wrapper">
                  <span className="input-icon">▣</span>

                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      setMessage('')
                    }}
                    minLength={6}
                    required
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                  >
                    {showConfirmPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {role === 'lecturer' && (
                <div className="lecturer-notice">
                  <strong>Lecturer account verification</strong>
                  <p>
                    Lecturer accounts will require verification
                    before accessing lecturer features.
                  </p>
                </div>
              )}

              <button type="submit" className="sign-in-button">
                Create Account <span>→</span>
              </button>

            </form>

          )}

          {/* FEEDBACK MESSAGE */}

          {message && (
            <div className="feedback-message" role="status">
              {message}
            </div>
          )}

          {/* SWITCH BETWEEN LOGIN AND REGISTER */}

          <div className="register-section">

            {page === 'login' ? (
              <>
                Don't have an account?

                <button
                  type="button"
                  className="text-link register-link"
                  onClick={() => changePage('register')}
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?

                <button
                  type="button"
                  className="text-link register-link"
                  onClick={() => changePage('login')}
                >
                  Sign in
                </button>
              </>
            )}

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
