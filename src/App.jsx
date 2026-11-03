
import { useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth'

import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore'

import { auth, db } from './firebase'
import './App.css'

function App() {
  const [page, setPage] = useState('login')
  const [role, setRole] = useState('student')
  const [activeTab, setActiveTab] = useState('overview')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)

  const changePage = (newPage) => {
    setPage(newPage)
    setMessage('')
    setPassword('')
    setConfirmPassword('')
  }

  const selectRole = (selectedRole) => {
    setRole(selectedRole)
    setMessage('')
  }

  const getFirebaseError = (error) => {
    switch (error.code) {
      case 'auth/email-already-in-use':
        return 'This email is already registered. Please sign in instead.'
      case 'auth/invalid-email':
        return 'Please enter a valid email address.'
      case 'auth/weak-password':
        return 'Please use a password with at least 6 characters.'
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Incorrect email or password. Please try again.'
      case 'auth/too-many-requests':
        return 'Too many attempts. Please wait and try again.'
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection.'
      default:
        return 'Something went wrong. Please try again.'
    }
  }

  // SIGN IN
  const handleLogin = async (e) => {
    e.preventDefault()
    setMessage('')
    setLoading(true)

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      )

      // Get the user's actual role from Firestore
      const profileRef = doc(db, 'users', userCredential.user.uid)
      const profileSnapshot = await getDoc(profileRef)

      if (!profileSnapshot.exists()) {
        setMessage(
          'Your account profile could not be found. Please contact the system administrator.'
        )
        return
      }

      const profile = profileSnapshot.data()

      // Do not trust the role selected on the login form
      if (profile.role !== 'student') {
        setMessage(
          'This account does not currently have student dashboard access.'
        )
        return
      }

      if (role === 'lecturer') {
        if (profile.requestedRole === 'lecturer') {
          setMessage(
            'Your lecturer access is still pending verification. Please sign in as a student only if your account has student access.'
          )
        } else {
          setMessage(
            'This account is not registered for lecturer access.'
          )
        }
        return
      }

      setCurrentUser({
        uid: userCredential.user.uid,
        name: profile.name || userCredential.user.displayName || 'Student',
        email: profile.email || userCredential.user.email,
      })

      setActiveTab('overview')
      setPage('dashboard')
      setPassword('')

    } catch (error) {
      console.error('Login error:', error)
      setMessage(getFirebaseError(error))
    } finally {
      setLoading(false)
    }
  }

  // REGISTER
  const handleRegister = async (e) => {
    e.preventDefault()
    setMessage('')

    if (password !== confirmPassword) {
      setMessage('Passwords do not match. Please try again.')
      return
    }

    if (password.length < 6) {
      setMessage('Password must contain at least 6 characters.')
      return
    }

    if (!name.trim()) {
      setMessage('Please enter your full name.')
      return
    }

    setLoading(true)

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      )

      await updateProfile(userCredential.user, {
        displayName: name.trim(),
      })

      await setDoc(
        doc(db, 'users', userCredential.user.uid),
        {
          name: name.trim(),
          email: userCredential.user.email,
          role: 'student',
          requestedRole: role === 'lecturer' ? 'lecturer' : 'student',
          createdAt: serverTimestamp(),
        }
      )

      if (role === 'lecturer') {
        setMessage(
          'Your account has been created. Your lecturer access request is pending verification.'
        )
      } else {
        setMessage(
          'Your student account has been created successfully! You can now sign in.'
        )
      }

      setName('')
      setEmail('')
      setPassword('')
      setConfirmPassword('')
      setPage('login')

    } catch (error) {
      console.error('Registration error:', error)
      setMessage(getFirebaseError(error))
    } finally {
      setLoading(false)
    }
  }

  // FORGOT PASSWORD
  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setMessage('Please enter your email address first.')
      return
    }

    setMessage('')
    setLoading(true)

    try {
      await sendPasswordResetEmail(auth, email.trim())
      setMessage(
        'If an account exists for this email, Firebase will send a password-reset link. Please check your inbox.'
      )
    } catch (error) {
      console.error('Password reset error:', error)
      setMessage(getFirebaseError(error))
    } finally {
      setLoading(false)
    }
  }

  // SIGN OUT
  const handleLogout = async () => {
    setLoading(true)

    try {
      await signOut(auth)
      setCurrentUser(null)
      setPage('login')
      setActiveTab('overview')
      setRole('student')
      setEmail('')
      setPassword('')
      setMessage('You have signed out successfully.')
    } catch (error) {
      console.error('Logout error:', error)
      setMessage('Unable to sign out. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // STUDENT DASHBOARD CONTENT
  const renderDashboardContent = () => {
    if (activeTab === 'overview') {
      return (
        <>
          <div className="dashboard-welcome">
            <div>
              <span className="dashboard-eyebrow">STUDENT WORKSPACE</span>
              <h1>Welcome back, {currentUser?.name?.split(' ')[0]}!</h1>
              <p>
                Here's an overview of your academic activities on FairQuill AI.
              </p>
            </div>

            <div className="welcome-decoration">✦</div>
          </div>

          <div className="dashboard-stats">
            <div className="stat-card">
              <div className="stat-icon purple">▤</div>
              <div>
                <span>Assignments</span>
                <strong>0</strong>
                <small>No assignments available yet</small>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon blue">✓</div>
              <div>
                <span>Available Quizzes</span>
                <strong>0</strong>
                <small>No quizzes available yet</small>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon green">◷</div>
              <div>
                <span>Completed Tasks</span>
                <strong>0</strong>
                <small>Your completed activities</small>
              </div>
            </div>
          </div>

          <div className="dashboard-lower-grid">
            <section className="dashboard-panel activity-panel">
              <div className="panel-heading">
                <div>
                  <h3>Recent Activity</h3>
                  <p>Your latest academic activities</p>
                </div>
                <span className="panel-heading-icon">◷</span>
              </div>

              <div className="empty-state">
                <div className="empty-icon">▤</div>
                <strong>No activity yet</strong>
                <p>
                  Your assignment and quiz activities will appear here.
                </p>
              </div>
            </section>

            <section className="dashboard-panel quick-panel">
              <div className="panel-heading">
                <div>
                  <h3>Quick Access</h3>
                  <p>Explore your workspace</p>
                </div>
              </div>

              <button
                className="quick-link"
                onClick={() => setActiveTab('assignments')}
              >
                <span className="quick-link-icon">▤</span>
                <span>
                  <strong>My Assignments</strong>
                  <small>View your assignments</small>
                </span>
                <span className="quick-arrow">→</span>
              </button>

              <button
                className="quick-link"
                onClick={() => setActiveTab('quizzes')}
              >
                <span className="quick-link-icon">✓</span>
                <span>
                  <strong>My Quizzes</strong>
                  <small>View available quizzes</small>
                </span>
                <span className="quick-arrow">→</span>
              </button>

              <button
                className="quick-link"
                onClick={() => setActiveTab('results')}
              >
                <span className="quick-link-icon">▥</span>
                <span>
                  <strong>My Results</strong>
                  <small>Check your assessment results</small>
                </span>
                <span className="quick-arrow">→</span>
              </button>
            </section>
          </div>

          <div className="dashboard-note">
            <span>✦</span>
            <p>
              <strong>FairQuill reminder:</strong> AI-assisted writing
              analysis provides an indicative result, not definitive proof
              of AI authorship.
            </p>
          </div>
        </>
      )
    }

    if (activeTab === 'assignments') {
      return (
        <section className="dashboard-page-panel">
          <span className="dashboard-eyebrow">ACADEMIC WORKSPACE</span>
          <h1>My Assignments</h1>
          <p>View and manage your academic assignments here.</p>
          <div className="large-empty-state">
            <div className="empty-icon">▤</div>
            <h3>No assignments available</h3>
            <p>
              Assignments published by your lecturers will appear here.
            </p>
          </div>
        </section>
      )
    }

    if (activeTab === 'quizzes') {
      return (
        <section className="dashboard-page-panel">
          <span className="dashboard-eyebrow">ASSESSMENT CENTRE</span>
          <h1>My Quizzes</h1>
          <p>Access quizzes assigned to you by your lecturers.</p>
          <div className="large-empty-state">
            <div className="empty-icon">✓</div>
            <h3>No quizzes available</h3>
            <p>
              New quizzes will appear here when your lecturers publish them.
            </p>
          </div>
        </section>
      )
    }

    if (activeTab === 'results') {
      return (
        <section className="dashboard-page-panel">
          <span className="dashboard-eyebrow">YOUR PERFORMANCE</span>
          <h1>My Results</h1>
          <p>Review your quiz marks and assessment feedback.</p>
          <div className="large-empty-state">
            <div className="empty-icon">▥</div>
            <h3>No results available</h3>
            <p>
              Your assessment results will appear here after submissions
              have been marked.
            </p>
          </div>
        </section>
      )
    }

    if (activeTab === 'profile') {
      return (
        <section className="dashboard-page-panel">
          <span className="dashboard-eyebrow">ACCOUNT SETTINGS</span>
          <h1>My Profile</h1>
          <p>View your FairQuill account information.</p>

          <div className="profile-card">
            <div className="profile-avatar">
              {currentUser?.name?.charAt(0)?.toUpperCase() || 'S'}
            </div>

            <div className="profile-details">
              <div className="profile-field">
                <small>Full name</small>
                <strong>{currentUser?.name}</strong>
              </div>

              <div className="profile-field">
                <small>Email address</small>
                <strong>{currentUser?.email}</strong>
              </div>

              <div className="profile-field">
                <small>Account role</small>
                <strong>Student</strong>
              </div>
            </div>
          </div>
        </section>
      )
    }

    return null
  }

  const navigationItems = [
    { id: 'overview', icon: '⌂', label: 'Overview' },
    { id: 'assignments', icon: '▤', label: 'My Assignments' },
    { id: 'quizzes', icon: '✓', label: 'My Quizzes' },
    { id: 'results', icon: '▥', label: 'My Results' },
    { id: 'profile', icon: '♙', label: 'My Profile' },
  ]

  // STUDENT DASHBOARD
  if (page === 'dashboard' && currentUser) {
    const activeItem = navigationItems.find(
      (item) => item.id === activeTab
    )

    return (
      <div className="dashboard-layout">
        <aside className="dashboard-sidebar">
          <div className="dashboard-brand">
            <span className="logo-icon">F</span>
            <span className="logo-name">
              FairQuill<span>AI</span>
            </span>
          </div>

          <div className="sidebar-section-label">WORKSPACE</div>

          <nav className="dashboard-navigation">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                className={`nav-item ${
                  activeTab === item.id ? 'nav-item-active' : ''
                }`}
                onClick={() => setActiveTab(item.id)}
              >
                <span className="nav-item-icon">{item.icon}</span>
                {item.label}
                {activeTab === item.id && (
                  <span className="nav-active-indicator"></span>
                )}
              </button>
            ))}
          </nav>

          <div className="sidebar-bottom">
            <div className="sidebar-help">
              <span>✦</span>
              <strong>Learning with fairness</strong>
              <small>Your academic workspace, all in one place.</small>
            </div>

            <button
              className="sidebar-logout"
              onClick={handleLogout}
              disabled={loading}
            >
              <span>↪</span>
              {loading ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>
        </aside>

        <main className="dashboard-main">
          <header className="dashboard-topbar">
            <div>
              <span className="topbar-platform">FAIRQUILL AI</span>
              <span className="topbar-separator">/</span>
              <span className="topbar-current">
                {activeItem?.label || 'Overview'}
              </span>
            </div>

            <button
              className="topbar-profile"
              onClick={() => setActiveTab('profile')}
            >
              <span className="topbar-avatar">
                {currentUser.name.charAt(0).toUpperCase()}
              </span>
              <span>
                <strong>{currentUser.name}</strong>
                <small>Student</small>
              </span>
            </button>
          </header>

          <div className="dashboard-content">
            {renderDashboardContent()}
          </div>

          <footer className="dashboard-footer">
            © 2026 FairQuill AI. Designed for fairness and transparency.
          </footer>
        </main>
      </div>
    )
  }

  // LOGIN AND REGISTRATION
  return (
    <div className="login-page">
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
              Empowering educators and students through smarter academic
              assessments and AI-assisted writing analysis.
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

      <main className="form-section">
        <div className="login-container">
          <div className="mobile-logo">
            <span className="logo-icon">F</span>
            <span className="logo-name">
              FairQuill<span>AI</span>
            </span>
          </div>

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

          <div className="role-label">
            {page === 'login'
              ? 'I am signing in as'
              : 'I want to register as'}
          </div>

          <div className="role-selector">
            <button
              type="button"
              className={`role-option ${
                role === 'student' ? 'active' : ''
              }`}
              onClick={() => selectRole('student')}
              disabled={loading}
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
              className={`role-option ${
                role === 'lecturer' ? 'active' : ''
              }`}
              onClick={() => selectRole('lecturer')}
              disabled={loading}
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
                    onClick={handleForgotPassword}
                    disabled={loading}
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

              <button
                type="submit"
                className="sign-in-button"
                disabled={loading}
              >
                {loading ? 'Please wait...' : 'Sign In'}
                {!loading && <span>→</span>}
              </button>
            </form>
          )}

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
                <label htmlFor="confirm-password">Confirm password</label>
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
                    Lecturer accounts require verification before
                    accessing lecturer features. Selecting this option
                    does not grant lecturer permissions.
                  </p>
                </div>
              )}

              <button
                type="submit"
                className="sign-in-button"
                disabled={loading}
              >
                {loading ? 'Creating account...' : 'Create Account'}
                {!loading && <span>→</span>}
              </button>
            </form>
          )}

          {message && (
            <div className="feedback-message" role="status">
              {message}
            </div>
          )}

          <div className="register-section">
            {page === 'login' ? (
              <>
                Don't have an account?
                <button
                  type="button"
                  className="text-link register-link"
                  onClick={() => changePage('register')}
                  disabled={loading}
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
                  disabled={loading}
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
            Your academic workspace, designed for fairness and transparency.
          </p>
        </div>
      </main>
    </div>
  )
}

export default App
