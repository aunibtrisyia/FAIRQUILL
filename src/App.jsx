
import { useEffect, useState } from 'react'
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
  collection,
  addDoc,
  getDocs,
  query,
  where,
  Timestamp,
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

  // ASSIGNMENT MANAGEMENT
  const [assignments, setAssignments] = useState([])
  const [assignmentLoading, setAssignmentLoading] = useState(false)
  const [assignmentSaving, setAssignmentSaving] = useState(false)
  const [assignmentMessage, setAssignmentMessage] = useState('')
  const [showAssignmentForm, setShowAssignmentForm] = useState(false)
  const [assignmentTitle, setAssignmentTitle] = useState('')
  const [assignmentDescription, setAssignmentDescription] = useState('')
  const [assignmentDueDate, setAssignmentDueDate] = useState('')

  // STUDENT SUBMISSIONS
  const [selectedAssignment, setSelectedAssignment] = useState(null)
  const [submissionText, setSubmissionText] = useState('')
  const [submissionSaving, setSubmissionSaving] = useState(false)
  const [submissionMessage, setSubmissionMessage] = useState('')
  const [submissions, setSubmissions] = useState([])
  const [submissionsLoading, setSubmissionsLoading] = useState(false)

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
        await signOut(auth)
        setMessage(
          'Your account profile could not be found. Please contact the system administrator.'
        )
        return
      }

      const profile = profileSnapshot.data()

      // An account requesting lecturer access must wait for approval
      if (role === 'lecturer' && profile.role !== 'lecturer') {
        await signOut(auth)

        if (profile.requestedRole === 'lecturer') {
          setMessage(
            'Your lecturer access is still pending verification.'
          )
        } else {
          setMessage(
            'This account is not registered for lecturer access.'
          )
        }
        return
      }

      // The selected login role must match the approved Firestore role
      if (profile.role !== role) {
        await signOut(auth)
        setMessage(
          `This account has ${profile.role} access. Please select the correct login role.`
        )
        return
      }

      // Only approved student and lecturer roles can access a dashboard
      if (!['student', 'lecturer'].includes(profile.role)) {
        await signOut(auth)
        setMessage('Your account does not have dashboard access.')
        return
      }

      setCurrentUser({
        uid: userCredential.user.uid,
        name: profile.name || userCredential.user.displayName || 'User',
        email: profile.email || userCredential.user.email,
        role: profile.role,
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

  // LOAD ASSIGNMENTS FROM FIRESTORE WHEN THE ASSIGNMENTS PAGE OPENS
  useEffect(() => {
    if (page !== 'dashboard' || activeTab !== 'assignments' || !currentUser) {
      return
    }

    let isCancelled = false

    const fetchAssignments = async () => {
      setAssignmentLoading(true)
      setAssignmentMessage('')

      try {
        const assignmentsCollection = collection(db, 'assignments')
        const assignmentsQuery = currentUser.role === 'lecturer'
          ? query(
              assignmentsCollection,
              where('createdBy', '==', currentUser.uid)
            )
          : query(
              assignmentsCollection,
              where('status', '==', 'published')
            )

        const snapshot = await getDocs(assignmentsQuery)
        const fetchedAssignments = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }))

        // Students can query only their own submissions.
        if (currentUser.role === 'student') {
          const ownSubmissionsQuery = query(
            collection(db, 'submissions'),
            where('studentId', '==', currentUser.uid)
          )
          const ownSubmissionsSnapshot = await getDocs(ownSubmissionsQuery)
          const ownSubmissions = ownSubmissionsSnapshot.docs.map((item) => ({
            id: item.id,
            ...item.data(),
          }))
          if (!isCancelled) setSubmissions(ownSubmissions)
        }

        fetchedAssignments.sort((a, b) => {
          const dateA = a.createdAt?.toMillis?.() || 0
          const dateB = b.createdAt?.toMillis?.() || 0
          return dateB - dateA
        })

        if (!isCancelled) {
          setAssignments(fetchedAssignments)
        }
      } catch (error) {
        console.error('Load assignments error:', error)
        if (!isCancelled) {
          setAssignmentMessage(
            'Unable to load assignments. Please refresh the page and try again.'
          )
        }
      } finally {
        if (!isCancelled) {
          setAssignmentLoading(false)
        }
      }
    }

    fetchAssignments()

    return () => {
      isCancelled = true
    }
  }, [page, activeTab, currentUser?.uid, currentUser?.role])

  // LOAD SUBMISSIONS FOR ASSIGNMENTS OWNED BY THE SIGNED-IN LECTURER
  useEffect(() => {
    if (
      page !== 'dashboard' ||
      activeTab !== 'submissions' ||
      !currentUser ||
      currentUser.role !== 'lecturer'
    ) {
      return
    }

    let isCancelled = false

    const fetchLecturerSubmissions = async () => {
      setSubmissionsLoading(true)
      setSubmissionMessage('')

      try {
        const ownAssignmentsQuery = query(
          collection(db, 'assignments'),
          where('createdBy', '==', currentUser.uid)
        )
        const ownAssignmentsSnapshot = await getDocs(ownAssignmentsQuery)
        const ownAssignments = ownAssignmentsSnapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }))

        const submissionGroups = await Promise.all(
          ownAssignments.map(async (assignment) => {
            const assignmentSubmissionsQuery = query(
              collection(db, 'submissions'),
              where('assignmentId', '==', assignment.id)
            )
            const result = await getDocs(assignmentSubmissionsQuery)
            return result.docs.map((item) => ({
              id: item.id,
              ...item.data(),
            }))
          })
        )

        const fetchedSubmissions = submissionGroups.flat()
        fetchedSubmissions.sort((a, b) => {
          const dateA = a.submittedAt?.toMillis?.() || 0
          const dateB = b.submittedAt?.toMillis?.() || 0
          return dateB - dateA
        })

        if (!isCancelled) setSubmissions(fetchedSubmissions)
      } catch (error) {
        console.error('Load lecturer submissions error:', error)
        if (!isCancelled) {
          setSubmissionMessage(
            'Unable to load submissions. Please check your Firestore rules and try again.'
          )
        }
      } finally {
        if (!isCancelled) setSubmissionsLoading(false)
      }
    }

    fetchLecturerSubmissions()

    return () => {
      isCancelled = true
    }
  }, [page, activeTab, currentUser?.uid, currentUser?.role])

  // CREATE AN ASSIGNMENT AND SAVE IT TO FIRESTORE
  const handleCreateAssignment = async (event, status) => {
    if (event) event.preventDefault()

    if (currentUser?.role !== 'lecturer') {
      setAssignmentMessage('Only approved lecturers can create assignments.')
      return
    }

    if (!assignmentTitle.trim()) {
      setAssignmentMessage('Please enter an assignment title.')
      return
    }

    if (!assignmentDescription.trim()) {
      setAssignmentMessage('Please enter the assignment instructions.')
      return
    }

    if (!assignmentDueDate) {
      setAssignmentMessage('Please select an assignment due date and time.')
      return
    }

    const dueDate = new Date(assignmentDueDate)
    if (Number.isNaN(dueDate.getTime())) {
      setAssignmentMessage('Please enter a valid due date and time.')
      return
    }

    setAssignmentSaving(true)
    setAssignmentMessage('')

    try {
      const dueDateTimestamp = Timestamp.fromDate(dueDate)
      const assignmentData = {
        title: assignmentTitle.trim(),
        description: assignmentDescription.trim(),
        dueDate: dueDateTimestamp,
        createdBy: currentUser.uid,
        createdByName: currentUser.name,
        status,
        createdAt: serverTimestamp(),
      }

      const newAssignment = await addDoc(
        collection(db, 'assignments'),
        assignmentData
      )

      setAssignments((previous) => [
        {
          id: newAssignment.id,
          ...assignmentData,
          createdAt: new Date(),
        },
        ...previous,
      ])

      setAssignmentMessage(
        status === 'published'
          ? 'Your assignment has been published successfully.'
          : 'Your assignment has been saved as a draft.'
      )
      setAssignmentTitle('')
      setAssignmentDescription('')
      setAssignmentDueDate('')
      setShowAssignmentForm(false)
    } catch (error) {
      console.error('Create assignment error:', error)
      setAssignmentMessage(
        'Unable to save the assignment. Please check your connection and Firestore permissions.'
      )
    } finally {
      setAssignmentSaving(false)
    }
  }

  // OPEN THE STUDENT SUBMISSION FORM
  const openSubmissionForm = (assignment) => {
    setSelectedAssignment(assignment)
    setSubmissionText('')
    setSubmissionMessage('')
  }

  // SAVE A STUDENT'S ANSWER TO FIRESTORE
  const handleSubmitAssignment = async (event) => {
    event.preventDefault()

    if (!currentUser || currentUser.role !== 'student' || !selectedAssignment) {
      setSubmissionMessage('Please sign in with a student account to submit an answer.')
      return
    }

    const answer = submissionText.trim()
    if (!answer) {
      setSubmissionMessage('Please write your answer before submitting.')
      return
    }

    if (answer.length > 20000) {
      setSubmissionMessage('Your answer must be 20,000 characters or fewer.')
      return
    }

    const dueDate = selectedAssignment.dueDate?.toDate
      ? selectedAssignment.dueDate.toDate()
      : new Date(selectedAssignment.dueDate)

    if (selectedAssignment.status !== 'published' || dueDate <= new Date()) {
      setSubmissionMessage('This assignment is no longer accepting submissions.')
      return
    }

    setSubmissionSaving(true)
    setSubmissionMessage('')

    try {
      // A fixed document ID prevents a second submission for the same assignment.
      const submissionId = `${selectedAssignment.id}_${currentUser.uid}`
      const submissionRef = doc(db, 'submissions', submissionId)

      await setDoc(submissionRef, {
        assignmentId: selectedAssignment.id,
        assignmentTitle: selectedAssignment.title,
        studentId: currentUser.uid,
        studentName: currentUser.name,
        studentEmail: currentUser.email,
        text: answer,
        submittedAt: serverTimestamp(),
        status: 'submitted',
      })

      setSubmissions((previous) => [
        ...previous.filter((item) => item.assignmentId !== selectedAssignment.id),
        {
          id: submissionId,
          assignmentId: selectedAssignment.id,
          assignmentTitle: selectedAssignment.title,
          studentId: currentUser.uid,
          studentName: currentUser.name,
          studentEmail: currentUser.email,
          text: answer,
          submittedAt: new Date(),
          status: 'submitted',
        },
      ])
      setSubmissionText('')
      setSelectedAssignment(null)
      setSubmissionMessage('Your assignment has been submitted successfully.')
    } catch (error) {
      console.error('Submit assignment error:', error)
      if (error.code === 'permission-denied') {
        setSubmissionMessage(
          'Submission was not allowed. Check that the assignment is published, the due date has not passed, and your Firestore rules are published.'
        )
      } else {
        setSubmissionMessage('Unable to submit your answer. Please try again.')
      }
    } finally {
      setSubmissionSaving(false)
    }
  }

  // FORMAT FIRESTORE DATES FOR DISPLAY
  const formatAssignmentDate = (value) => {
    if (!value) return 'Date unavailable'
    const date = typeof value.toDate === 'function' ? value.toDate() : new Date(value)
    if (Number.isNaN(date.getTime())) return 'Date unavailable'
    return date.toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  // REUSABLE ASSIGNMENT LIST
  const renderAssignmentList = (emptyTitle, emptyText, showStatus = false) => {
    if (assignmentLoading) {
      return <div className="assignment-loading">Loading assignments...</div>
    }

    if (assignments.length === 0) {
      return (
        <div className="large-empty-state">
          <div className="empty-icon">▤</div>
          <h3>{emptyTitle}</h3>
          <p>{emptyText}</p>
        </div>
      )
    }

    return (
      <div className="assignment-list">
        {assignments.map((assignment) => (
          <article className="assignment-card" key={assignment.id}>
            <div className="assignment-card-heading">
              <div>
                <h3>{assignment.title}</h3>
                <p>Due {formatAssignmentDate(assignment.dueDate)}</p>
              </div>
              {showStatus && (
                <span className={`assignment-status ${assignment.status}`}>
                  {assignment.status === 'published' ? 'Published' : 'Draft'}
                </span>
              )}
            </div>
            <p className="assignment-description">{assignment.description}</p>
            {currentUser?.role === 'student' && assignment.createdByName && (
              <small className="assignment-author">
                Created by {assignment.createdByName}
              </small>
            )}
            {currentUser?.role === 'student' && (() => {
              const alreadySubmitted = submissions.some(
                (item) => item.assignmentId === assignment.id
              )
              const dueDate = assignment.dueDate?.toDate
                ? assignment.dueDate.toDate()
                : new Date(assignment.dueDate)
              const isClosed = dueDate <= new Date()

              return (
                <div className="submission-card-actions">
                  {alreadySubmitted ? (
                    <span className="submission-complete-label">✓ Submitted</span>
                  ) : isClosed ? (
                    <span className="submission-closed-label">Submission closed</span>
                  ) : (
                    <button
                      type="button"
                      className="assignment-primary-button"
                      onClick={() => openSubmissionForm(assignment)}
                    >
                      Submit Answer
                    </button>
                  )}
                </div>
              )
            })()}
          </article>
        ))}
      </div>
    )
  }

  // STUDENT DASHBOARD CONTENT
  const renderDashboardContent = () => {
    if (activeTab === 'overview') {
      return (
        <>
          <div className="dashboard-welcome">
            <div>
              <span className="dashboard-eyebrow">{currentUser?.role === 'lecturer' ? 'LECTURER WORKSPACE' : 'STUDENT WORKSPACE'}</span>
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
          <p>View assignments published by your lecturers.</p>
          {assignmentMessage && (
            <div className="assignment-feedback" role="status">{assignmentMessage}</div>
          )}
          {submissionMessage && !selectedAssignment && (
            <div className="assignment-feedback" role="status">{submissionMessage}</div>
          )}
          {renderAssignmentList(
            'No assignments available',
            'Published assignments from your lecturers will appear here.'
          )}

          {selectedAssignment && currentUser?.role === 'student' && (
            <form className="student-submission-form" onSubmit={handleSubmitAssignment}>
              <div className="assignment-form-heading">
                <span className="dashboard-eyebrow">YOUR RESPONSE</span>
                <h2>{selectedAssignment.title}</h2>
                <p>{selectedAssignment.description}</p>
                <small>Due {formatAssignmentDate(selectedAssignment.dueDate)}</small>
              </div>

              <div className="assignment-field">
                <label htmlFor="student-assignment-answer">Your answer</label>
                <textarea
                  id="student-assignment-answer"
                  value={submissionText}
                  onChange={(event) => setSubmissionText(event.target.value)}
                  placeholder="Type your assignment answer here..."
                  rows={9}
                  maxLength={20000}
                  required
                />
                <small className="submission-character-count">
                  {submissionText.length.toLocaleString()} / 20,000 characters
                </small>
              </div>

              {submissionMessage && (
                <div className="assignment-feedback" role="status">{submissionMessage}</div>
              )}

              <div className="assignment-form-actions">
                <button
                  type="button"
                  className="assignment-secondary-button"
                  onClick={() => {
                    setSelectedAssignment(null)
                    setSubmissionText('')
                    setSubmissionMessage('')
                  }}
                  disabled={submissionSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="assignment-primary-button"
                  disabled={submissionSaving}
                >
                  {submissionSaving ? 'Submitting...' : 'Submit Assignment'}
                </button>
              </div>
              <p className="assignment-form-note">
                Please review your answer before submitting. A submission cannot be edited or deleted afterward.
              </p>
            </form>
          )}
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


  // LECTURER DASHBOARD CONTENT
  const renderLecturerDashboardContent = () => {
    if (activeTab === 'overview') {
      return (
        <>
          <div className="dashboard-welcome lecturer-welcome">
            <div>
              <span className="dashboard-eyebrow">LECTURER WORKSPACE</span>
              <h1>Welcome back, {currentUser?.name?.split(' ')[0]}!</h1>
              <p>
                Manage your assessments, prepare quizzes and review student
                performance from one workspace.
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
                <small>Created assignments</small>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon blue">✓</div>
              <div>
                <span>Quizzes</span>
                <strong>0</strong>
                <small>Created quizzes</small>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green">♙</div>
              <div>
                <span>Student Submissions</span>
                <strong>0</strong>
                <small>Submissions received</small>
              </div>
            </div>
          </div>

          <section className="dashboard-panel lecturer-overview-panel">
            <div className="panel-heading">
              <div>
                <h3>Lecturer workspace</h3>
                <p>Choose an area to manage your academic activities.</p>
              </div>
              <span className="panel-heading-icon">✦</span>
            </div>
            <div className="lecturer-action-grid">
              <button className="lecturer-action-card" onClick={() => setActiveTab('assignments')}>
                <span className="lecturer-action-icon purple">▤</span>
                <strong>Manage Assignments</strong>
                <small>View and organise assignments</small>
                <span className="lecturer-action-arrow">→</span>
              </button>
              <button className="lecturer-action-card" onClick={() => setActiveTab('quizzes')}>
                <span className="lecturer-action-icon blue">✓</span>
                <strong>Manage Quizzes</strong>
                <small>Prepare and review quizzes</small>
                <span className="lecturer-action-arrow">→</span>
              </button>
              <button className="lecturer-action-card" onClick={() => setActiveTab('students')}>
                <span className="lecturer-action-icon green">♙</span>
                <strong>View Students</strong>
                <small>See student accounts</small>
                <span className="lecturer-action-arrow">→</span>
              </button>
              <button className="lecturer-action-card" onClick={() => setActiveTab('results')}>
                <span className="lecturer-action-icon gold">▥</span>
                <strong>Review Results</strong>
                <small>Check assessment performance</small>
                <span className="lecturer-action-arrow">→</span>
              </button>
            </div>
          </section>

          <div className="dashboard-note">
            <span>✦</span>
            <p>
              <strong>FairQuill reminder:</strong> AI-assisted writing analysis
              provides an indicative result, not definitive proof of AI authorship.
              Review submissions fairly before making academic decisions.
            </p>
          </div>
        </>
      )
    }

    if (activeTab === 'assignments') {
      return (
        <section className="dashboard-page-panel">
          <div className="assignment-page-heading">
            <div>
              <span className="dashboard-eyebrow">ASSESSMENT MANAGEMENT</span>
              <h1>Assignments</h1>
              <p>Create, publish and manage assignments for your students.</p>
            </div>
            <button
              type="button"
              className="assignment-primary-button"
              onClick={() => {
                setShowAssignmentForm((value) => !value)
                setAssignmentMessage('')
              }}
            >
              {showAssignmentForm ? 'Close Form' : '+ Create Assignment'}
            </button>
          </div>

          {assignmentMessage && (
            <div className="assignment-feedback" role="status">{assignmentMessage}</div>
          )}

          {showAssignmentForm && (
            <form
              className="assignment-form"
              onSubmit={(event) => handleCreateAssignment(event, 'published')}
            >
              <div className="assignment-form-heading">
                <h2>Create a new assignment</h2>
                <p>Enter the details that students will see.</p>
              </div>

              <div className="assignment-field">
                <label htmlFor="assignment-title">Assignment title</label>
                <input
                  id="assignment-title"
                  type="text"
                  placeholder="e.g. Academic Writing Task 1"
                  value={assignmentTitle}
                  onChange={(event) => setAssignmentTitle(event.target.value)}
                  maxLength={120}
                  required
                />
              </div>

              <div className="assignment-field">
                <label htmlFor="assignment-description">Instructions / description</label>
                <textarea
                  id="assignment-description"
                  placeholder="Explain what students need to complete..."
                  value={assignmentDescription}
                  onChange={(event) => setAssignmentDescription(event.target.value)}
                  rows={5}
                  maxLength={5000}
                  required
                />
              </div>

              <div className="assignment-field">
                <label htmlFor="assignment-due-date">Due date and time</label>
                <input
                  id="assignment-due-date"
                  type="datetime-local"
                  value={assignmentDueDate}
                  onChange={(event) => setAssignmentDueDate(event.target.value)}
                  required
                />
              </div>

              <div className="assignment-form-actions">
                <button
                  type="button"
                  className="assignment-secondary-button"
                  onClick={() => handleCreateAssignment(null, 'draft')}
                  disabled={assignmentSaving}
                >
                  Save as Draft
                </button>
                <button
                  type="submit"
                  className="assignment-primary-button"
                  disabled={assignmentSaving}
                >
                  {assignmentSaving ? 'Saving...' : 'Publish Assignment'}
                </button>
              </div>
              <p className="assignment-form-note">
                Drafts are visible only to you. Published assignments are visible to signed-in students.
              </p>
            </form>
          )}

          {renderAssignmentList(
            'No assignments created yet',
            'Use Create Assignment to prepare your first assignment.',
            true
          )}
        </section>
      )
    }

    if (activeTab === 'submissions') {
      return (
        <section className="dashboard-page-panel">
          <span className="dashboard-eyebrow">STUDENT WORK</span>
          <h1>Assignment Submissions</h1>
          <p>Review answers submitted for assignments you created.</p>

          {submissionMessage && (
            <div className="assignment-feedback" role="status">{submissionMessage}</div>
          )}

          {submissionsLoading ? (
            <div className="assignment-loading">Loading student submissions...</div>
          ) : submissions.length === 0 ? (
            <div className="large-empty-state">
              <div className="empty-icon">▤</div>
              <h3>No submissions received yet</h3>
              <p>Student answers will appear here after they submit published assignments.</p>
            </div>
          ) : (
            <div className="submission-list">
              {submissions.map((submission) => (
                <article className="submission-review-card" key={submission.id}>
                  <div className="submission-review-heading">
                    <div>
                      <h3>{submission.assignmentTitle}</h3>
                      <p>{submission.studentName} · {submission.studentEmail}</p>
                    </div>
                    <span className="submission-complete-label">Submitted</span>
                  </div>
                  <small className="submission-date">
                    Submitted {formatAssignmentDate(submission.submittedAt)}
                  </small>
                  <div className="submission-answer">
                    {submission.text}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )
    }

    const lecturerPages = {
      assignments: {
        eyebrow: 'ASSESSMENT MANAGEMENT',
        title: 'Assignments',
        description: 'View and manage assignments for your students.',
        icon: '▤',
        emptyTitle: 'No assignments created yet',
        emptyText: 'Your assignments will appear here after you create them.'
      },
      quizzes: {
        eyebrow: 'ASSESSMENT CENTRE',
        title: 'Quizzes',
        description: 'Prepare quizzes and review the assessments you have created.',
        icon: '✓',
        emptyTitle: 'No quizzes created yet',
        emptyText: 'Your quizzes will appear here after you create them.'
      },
      students: {
        eyebrow: 'STUDENT DIRECTORY',
        title: 'Students',
        description: 'View student accounts registered on FairQuill AI.',
        icon: '♙',
        emptyTitle: 'No student records to display',
        emptyText: 'Student information will appear here when student accounts are available.'
      },
      results: {
        eyebrow: 'PERFORMANCE OVERVIEW',
        title: 'Results',
        description: 'Review marks and student assessment results.',
        icon: '▥',
        emptyTitle: 'No results available yet',
        emptyText: 'Assessment results will appear here after students complete activities.'
      }
    }

    if (lecturerPages[activeTab]) {
      const item = lecturerPages[activeTab]
      return (
        <section className="dashboard-page-panel">
          <span className="dashboard-eyebrow">{item.eyebrow}</span>
          <h1>{item.title}</h1>
          <p>{item.description}</p>
          <div className="large-empty-state">
            <div className="empty-icon">{item.icon}</div>
            <h3>{item.emptyTitle}</h3>
            <p>{item.emptyText}</p>
          </div>
        </section>
      )
    }

    if (activeTab === 'profile') {
      return (
        <section className="dashboard-page-panel">
          <span className="dashboard-eyebrow">ACCOUNT SETTINGS</span>
          <h1>My Profile</h1>
          <p>View your FairQuill lecturer account information.</p>
          <div className="profile-card">
            <div className="profile-avatar">
              {currentUser?.name?.charAt(0)?.toUpperCase() || 'L'}
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
                <strong>Lecturer</strong>
              </div>
            </div>
          </div>
        </section>
      )
    }

    return null
  }

  const navigationItems = currentUser?.role === 'lecturer'
    ? [
        { id: 'overview', icon: '⌂', label: 'Overview' },
        { id: 'assignments', icon: '▤', label: 'Assignments' },
        { id: 'submissions', icon: '▣', label: 'Submissions' },
        { id: 'quizzes', icon: '✓', label: 'Quizzes' },
        { id: 'students', icon: '♙', label: 'Students' },
        { id: 'results', icon: '▥', label: 'Results' },
        { id: 'profile', icon: '⚙', label: 'My Profile' },
      ]
    : [
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
              <strong>{currentUser.role === 'lecturer' ? 'Teaching with fairness' : 'Learning with fairness'}</strong>
              <small>{currentUser.role === 'lecturer' ? 'Manage assessments and support fair evaluation.' : 'Your academic workspace, all in one place.'}</small>
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
                <small>{currentUser.role === 'lecturer' ? 'Lecturer' : 'Student'}</small>
              </span>
            </button>
          </header>

          <div className="dashboard-content">
            {currentUser.role === 'lecturer'
              ? renderLecturerDashboardContent()
              : renderDashboardContent()}
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
