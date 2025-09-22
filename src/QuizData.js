import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./style/QuizData.css";
import { FiChevronLeft } from "react-icons/fi";
import { UserContext } from "./userContext";

const QuizData = () => {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);

  const [quizDetails, setQuizDetails] = useState({});
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const { id } = useParams();

  useEffect(() => {
    const fetchQuizDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:8082/quizzes/${id}`);
        setQuizDetails(response.data);
        console.log(response.data);
      } catch (error) {
        console.error("Error fetching quiz details:", error);
        toast.error("Failed to load quiz data");
      }
    };

    fetchQuizDetails();
  }, [id]);

  const handleOptionClick = (questionId, selectedOption) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: selectedOption
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestion < quizDetails.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      handleSubmitQuiz();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    let correctCount = 0;
    
    quizDetails.questions.forEach(question => {
      const selectedAnswer = selectedAnswers[question.id];
      if (selectedAnswer === question.correctOption) {
        correctCount++;
      }
    });

    setScore(correctCount);
    setQuizCompleted(true);
    setShowResults(true);
    
    const percentage = Math.round((correctCount / quizDetails.questions.length) * 100);
    
    // Submit quiz result to backend
    try {
      const quizResult = {
        userId: user.data.user.id,
        username: user.data.user.username,
        quizId: quizDetails.id,
        quizTitle: quizDetails.title,
        score: correctCount,
        totalQuestions: quizDetails.questions.length,
        percentage: percentage,
        timeTakenSeconds: null // You can add timer functionality later
      };
      
      await axios.post('http://localhost:8082/quiz-results', quizResult);
      console.log('Quiz result saved successfully');
    } catch (error) {
      console.error('Error saving quiz result:', error);
      // Don't block the user experience if saving fails
    }
    
    toast.success(`Quiz completed! Your score: ${correctCount}/${quizDetails.questions.length} (${percentage}%)`);
  };

  const isOptionSelected = (questionId, option) => {
    return selectedAnswers[questionId] === option;
  };

  const canProceed = () => {
    const currentQuestionData = quizDetails.questions?.[currentQuestion];
    return currentQuestionData && selectedAnswers[currentQuestionData.id];
  };

  if (showResults) {
    return (
      <div className="quiz-details">
        <div className="header">
          <button onClick={() => navigate("/home")} className="back-button">
            <FiChevronLeft />
          </button>
          <h1 className="quiz-title">Quiz Results</h1>
        </div>
        <div className="results-container">
          <div className="score-display">
            <h2>Your Final Score</h2>
            <div className="score-circle">
              <span className="score-text">{score}/{quizDetails.questions?.length}</span>
              <span className="percentage">{Math.round((score / quizDetails.questions?.length) * 100)}%</span>
            </div>
          </div>
          <div className="results-summary">
            <h3>Question Review</h3>
            {quizDetails.questions?.map((question, index) => {
              const selectedAnswer = selectedAnswers[question.id];
              const isCorrect = selectedAnswer === question.correctOption;
              return (
                <div key={question.id} className={`review-item ${isCorrect ? 'correct' : 'incorrect'}`}>
                  <p className="review-question">Q{index + 1}: {question.text}</p>
                  <p className="review-selected">Your answer: <span className={isCorrect ? 'correct-answer' : 'wrong-answer'}>{selectedAnswer || 'Not answered'}</span></p>
                  {!isCorrect && (
                    <p className="review-correct">Correct answer: <span className="correct-answer">{question.correctOption}</span></p>
                  )}
                </div>
              );
            })}
          </div>
          <button onClick={() => navigate("/home")} className="finish-button">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="quiz-details">
        <div className="header">
          <button onClick={() => navigate("/home")} className="back-button">
            <FiChevronLeft />
          </button>
          <h1 className="quiz-title">{quizDetails.title || 'Quiz Details'}</h1>
        </div>
        
        {quizDetails.questions && quizDetails.questions.length > 0 && (
          <div className="quiz-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{width: `${((currentQuestion + 1) / quizDetails.questions.length) * 100}%`}}
              ></div>
              <span className="progress-text">
                Question {currentQuestion + 1} of {quizDetails.questions.length}
              </span>
            </div>

            <div className="question-container">
              <h2 className="question-text">
                {quizDetails.questions[currentQuestion]?.text}
              </h2>
              
              <ul className="options-list">
                {quizDetails.questions[currentQuestion]?.options?.map((option, index) => (
                  <li
                    key={index}
                    className={`option ${isOptionSelected(quizDetails.questions[currentQuestion].id, option) ? 'selected' : ''}`}
                    onClick={() => handleOptionClick(quizDetails.questions[currentQuestion].id, option)}
                  >
                    <span className="option-label">{String.fromCharCode(97 + index)}</span>
                    <span className="option-text">{option}</span>
                  </li>
                ))}
              </ul>

              <div className="navigation-buttons">
                <button 
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestion === 0}
                  className="nav-button prev-button"
                >
                  Previous
                </button>
                
                <button 
                  onClick={handleNextQuestion}
                  disabled={!canProceed()}
                  className="nav-button next-button"
                >
                  {currentQuestion === quizDetails.questions.length - 1 ? 'Submit Quiz' : 'Next'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default QuizData;
