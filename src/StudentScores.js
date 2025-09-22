import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { UserContext } from "./userContext";
import { toast } from "react-toastify";
import "./style/StudentScores.css";
import { FiChevronLeft, FiUsers, FiTrendingUp, FiAward, FiCalendar } from "react-icons/fi";

const StudentScores = () => {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const [allResults, setAllResults] = useState([]);
  const [quizStatistics, setQuizStatistics] = useState([]);
  const [recentResults, setRecentResults] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [quizResults, setQuizResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Check if user is a teacher
    if (!user || !user.data.user.is_teacher) {
      toast.error("Access denied. Teacher privileges required.");
      navigate("/home");
      return;
    }

    fetchDashboardData();
  }, [user, navigate]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch all results, statistics, and recent results
      const [resultsResponse, statisticsResponse, recentResponse] = await Promise.all([
        axios.get("http://localhost:8082/quiz-results"),
        axios.get("http://localhost:8082/quiz-statistics"),
        axios.get("http://localhost:8082/quiz-results/recent")
      ]);

      setAllResults(resultsResponse.data);
      setQuizStatistics(statisticsResponse.data);
      setRecentResults(recentResponse.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizResults = async (quizId) => {
    try {
      const response = await axios.get(`http://localhost:8082/quiz-results/quiz/${quizId}`);
      setQuizResults(response.data);
      setSelectedQuiz(quizId);
      setActiveTab('quiz-details');
    } catch (error) {
      console.error("Error fetching quiz results:", error);
      toast.error("Failed to load quiz results");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getGradeColor = (percentage) => {
    if (percentage >= 90) return '#28a745';
    if (percentage >= 80) return '#ffc107';
    if (percentage >= 70) return '#fd7e14';
    if (percentage >= 60) return '#dc3545';
    return '#6c757d';
  };

  const getPerformanceLevel = (percentage) => {
    if (percentage >= 90) return 'Excellent';
    if (percentage >= 80) return 'Good';
    if (percentage >= 70) return 'Fair';
    if (percentage >= 60) return 'Pass';
    return 'Needs Improvement';
  };

  if (loading) {
    return (
      <div className="student-scores-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="student-scores-container">
      <div className="header">
        <button onClick={() => navigate("/home")} className="back-button">
          <FiChevronLeft />
        </button>
        <h1 className="page-title">Student Scores Dashboard</h1>
      </div>

      <div className="dashboard-tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <FiTrendingUp /> Overview
        </button>
        <button 
          className={`tab-button ${activeTab === 'recent' ? 'active' : ''}`}
          onClick={() => setActiveTab('recent')}
        >
          <FiCalendar /> Recent Activity
        </button>
        <button 
          className={`tab-button ${activeTab === 'all-results' ? 'active' : ''}`}
          onClick={() => setActiveTab('all-results')}
        >
          <FiUsers /> All Results
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="overview-tab">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <FiUsers />
              </div>
              <div className="stat-info">
                <h3>Total Attempts</h3>
                <p className="stat-number">{allResults.length}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <FiAward />
              </div>
              <div className="stat-info">
                <h3>Active Quizzes</h3>
                <p className="stat-number">{quizStatistics.length}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <FiTrendingUp />
              </div>
              <div className="stat-info">
                <h3>Average Score</h3>
                <p className="stat-number">
                  {allResults.length > 0 
                    ? Math.round(allResults.reduce((sum, result) => sum + result.percentage, 0) / allResults.length)
                    : 0}%
                </p>
              </div>
            </div>
          </div>

          <div className="quiz-statistics">
            <h2>Quiz Performance Overview</h2>
            <div className="quiz-stats-grid">
              {quizStatistics.map((stat, index) => (
                <div key={index} className="quiz-stat-card" onClick={() => fetchQuizResults(stat.quizId)}>
                  <h3>{stat.quizTitle}</h3>
                  <div className="quiz-stat-details">
                    <div className="stat-row">
                      <span>Total Attempts:</span>
                      <strong>{stat.totalAttempts}</strong>
                    </div>
                    <div className="stat-row">
                      <span>Average Score:</span>
                      <strong>{Math.round(stat.averageScore)}%</strong>
                    </div>
                    <div className="stat-row">
                      <span>Highest Score:</span>
                      <strong>{stat.highestScore}</strong>
                    </div>
                    <div className="stat-row">
                      <span>Lowest Score:</span>
                      <strong>{stat.lowestScore}</strong>
                    </div>
                  </div>
                  <div className="view-details-hint">Click to view detailed results</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'recent' && (
        <div className="recent-tab">
          <h2>Recent Quiz Attempts (Last 30 Days)</h2>
          <div className="results-table">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Quiz</th>
                  <th>Score</th>
                  <th>Percentage</th>
                  <th>Performance</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentResults.map((result) => (
                  <tr key={result.id}>
                    <td className="student-name">{result.username}</td>
                    <td className="quiz-title">{result.quizTitle}</td>
                    <td className="score">{result.score}/{result.totalQuestions}</td>
                    <td className="percentage">
                      <span 
                        className="percentage-badge"
                        style={{ backgroundColor: getGradeColor(result.percentage) }}
                      >
                        {Math.round(result.percentage)}%
                      </span>
                    </td>
                    <td className="performance">
                      <span className={`performance-level ${getPerformanceLevel(result.percentage).toLowerCase().replace(/\s+/g, '-')}`}>
                        {getPerformanceLevel(result.percentage)}
                      </span>
                    </td>
                    <td className="date">{formatDate(result.completedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'all-results' && (
        <div className="all-results-tab">
          <h2>All Quiz Results</h2>
          <div className="results-table">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Quiz</th>
                  <th>Score</th>
                  <th>Percentage</th>
                  <th>Performance</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {allResults.map((result) => (
                  <tr key={result.id}>
                    <td className="student-name">{result.username}</td>
                    <td className="quiz-title">{result.quizTitle}</td>
                    <td className="score">{result.score}/{result.totalQuestions}</td>
                    <td className="percentage">
                      <span 
                        className="percentage-badge"
                        style={{ backgroundColor: getGradeColor(result.percentage) }}
                      >
                        {Math.round(result.percentage)}%
                      </span>
                    </td>
                    <td className="performance">
                      <span className={`performance-level ${getPerformanceLevel(result.percentage).toLowerCase().replace(/\s+/g, '-')}`}>
                        {getPerformanceLevel(result.percentage)}
                      </span>
                    </td>
                    <td className="date">{formatDate(result.completedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'quiz-details' && selectedQuiz && (
        <div className="quiz-details-tab">
          <div className="quiz-details-header">
            <button onClick={() => setActiveTab('overview')} className="back-to-overview">
              ← Back to Overview
            </button>
            <h2>Detailed Results for Quiz #{selectedQuiz}</h2>
          </div>
          <div className="results-table">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Student</th>
                  <th>Score</th>
                  <th>Percentage</th>
                  <th>Performance</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {quizResults.map((result, index) => (
                  <tr key={result.id} className={index < 3 ? `rank-${index + 1}` : ''}>
                    <td className="rank">
                      {index + 1}
                      {index === 0 && <span className="medal gold">🥇</span>}
                      {index === 1 && <span className="medal silver">🥈</span>}
                      {index === 2 && <span className="medal bronze">🥉</span>}
                    </td>
                    <td className="student-name">{result.username}</td>
                    <td className="score">{result.score}/{result.totalQuestions}</td>
                    <td className="percentage">
                      <span 
                        className="percentage-badge"
                        style={{ backgroundColor: getGradeColor(result.percentage) }}
                      >
                        {Math.round(result.percentage)}%
                      </span>
                    </td>
                    <td className="performance">
                      <span className={`performance-level ${getPerformanceLevel(result.percentage).toLowerCase().replace(/\s+/g, '-')}`}>
                        {getPerformanceLevel(result.percentage)}
                      </span>
                    </td>
                    <td className="date">{formatDate(result.completedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentScores;