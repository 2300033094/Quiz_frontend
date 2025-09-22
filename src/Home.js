import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { UserContext } from "./userContext";
import { Link } from "react-router-dom";
import "./style/Home.css";
import "react-toastify/dist/ReactToastify.css";
import { FiPlus, FiBarChart, FiUser, FiLogOut, FiBookOpen, FiUsers, FiTrendingUp } from "react-icons/fi";

const Home = () => {
  const { user, setUser } = useContext(UserContext);
  const [quizes, setQuizes] = useState([]);
  const [recentStats, setRecentStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch quizzes
      const quizzesResponse = await axios.get("http://localhost:8082/quizzes");
      setQuizes(quizzesResponse.data);

      // If user is teacher, fetch additional statistics
      if (user && user.data.user.is_teacher) {
        const [statsResponse, recentResponse] = await Promise.all([
          axios.get("http://localhost:8082/quiz-statistics"),
          axios.get("http://localhost:8082/quiz-results/recent")
        ]);
        
        // Calculate quick stats
        const stats = {
          totalQuizzes: quizzesResponse.data.length,
          totalAttempts: recentResponse.data.length,
          averageScore: recentResponse.data.length > 0 
            ? Math.round(recentResponse.data.reduce((sum, result) => sum + result.percentage, 0) / recentResponse.data.length)
            : 0
        };
        
        setRecentStats(stats);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  const isTeacher = user && user.data.user.is_teacher;

  return (
    <div className="home-container">
      {/* Header */}
      <div className="home-header">
        <div className="welcome-section">
          <h1 className="welcome-title">
            Welcome back, {user?.data?.user?.username || 'User'}! 
            {isTeacher && <span className="teacher-badge">Teacher</span>}
          </h1>
          <p className="welcome-subtitle">
            {isTeacher 
              ? "Manage your quizzes and track student performance" 
              : "Take quizzes and test your knowledge"}
          </p>
        </div>
        
        <div className="user-actions">
          <div className="user-info">
            <FiUser className="user-icon" />
            <span>{user?.data?.user?.username}</span>
          </div>
          <button className="logout-button" onClick={handleLogout}>
            <FiLogOut /> Logout
          </button>
        </div>
      </div>

      {/* Teacher Dashboard */}
      {isTeacher && (
        <div className="teacher-dashboard">
          <div className="dashboard-header">
            <h2>Teacher Dashboard</h2>
          </div>
          
          {/* Quick Stats */}
          {recentStats && (
            <div className="quick-stats">
              <div className="stat-card">
                <div className="stat-icon">
                  <FiBookOpen />
                </div>
                <div className="stat-info">
                  <h3>Total Quizzes</h3>
                  <p className="stat-number">{recentStats.totalQuizzes}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <FiUsers />
                </div>
                <div className="stat-info">
                  <h3>Recent Attempts</h3>
                  <p className="stat-number">{recentStats.totalAttempts}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <FiTrendingUp />
                </div>
                <div className="stat-info">
                  <h3>Average Score</h3>
                  <p className="stat-number">{recentStats.averageScore}%</p>
                </div>
              </div>
            </div>
          )}

          {/* Teacher Actions */}
          <div className="teacher-actions">
            <Link to="/addQuiz" className="action-card create-quiz">
              <div className="action-icon">
                <FiPlus />
              </div>
              <div className="action-content">
                <h3>Create New Quiz</h3>
                <p>Design engaging quizzes for your students</p>
              </div>
            </Link>
            
            <Link to="/student-scores" className="action-card view-scores">
              <div className="action-icon">
                <FiBarChart />
              </div>
              <div className="action-content">
                <h3>View Student Scores</h3>
                <p>Track performance and analyze results</p>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* Quiz List */}
      <div className="quiz-section">
        <div className="section-header">
          <h2>{isTeacher ? "Your Quizzes" : "Available Quizzes"}</h2>
          <span className="quiz-count">{quizes.length} quiz{quizes.length !== 1 ? 'es' : ''} available</span>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading quizzes...</p>
          </div>
        ) : quizes.length > 0 ? (
          <div className="quiz-grid">
            {quizes.map((quiz, index) => (
              <Link to={`/quiz/${quiz.id}`} key={index} className="quiz-card">
                <div className="quiz-card-header">
                  <h3 className="quiz-title">{quiz.title}</h3>
                  <div className="quiz-meta">
                    <span className="question-count">
                      {quiz.questions?.length || 0} question{quiz.questions?.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <div className="quiz-card-body">
                  <p className="quiz-description">
                    Test your knowledge with this {quiz.questions?.length || 0}-question quiz.
                  </p>
                </div>
                <div className="quiz-card-footer">
                  <span className="quiz-author">By: {quiz.username}</span>
                  <div className="quiz-difficulty">
                    <span className="difficulty-badge">
                      {quiz.questions?.length >= 10 ? 'Advanced' : 
                       quiz.questions?.length >= 5 ? 'Intermediate' : 'Beginner'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <FiBookOpen className="empty-icon" />
            <h3>No Quizzes Available</h3>
            <p>
              {isTeacher 
                ? "Create your first quiz to get started!" 
                : "Check back later for new quizzes."}
            </p>
            {isTeacher && (
              <Link to="/addQuiz" className="create-first-quiz-btn">
                <FiPlus /> Create Your First Quiz
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Student Actions (for non-teachers) */}
      {!isTeacher && (
        <div className="student-actions">
          <div className="action-banner">
            <h3>Ready to test your knowledge?</h3>
            <p>Choose a quiz above and start learning!</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
