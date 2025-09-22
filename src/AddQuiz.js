import React, { useState, useContext } from "react";
import { UserContext } from "./userContext";
import axios from "axios";
import "./style/AddQuiz.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import { FiChevronLeft, FiPlus, FiTrash2, FiCheck, FiAlertCircle } from "react-icons/fi";

const AddQuiz = () => {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  
  const [quiz, setQuiz] = useState({
    title: "",
    username: user.data.user.username,
    questions: [
      {
        text: "",
        options: ["", "", "", ""],
        correctOption: "",
      },
    ],
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation functions
  const validateQuiz = () => {
    const newErrors = {};

    // Validate quiz title
    if (!quiz.title.trim()) {
      newErrors.title = "Quiz title is required";
    } else if (quiz.title.trim().length < 3) {
      newErrors.title = "Quiz title must be at least 3 characters long";
    }

    // Validate questions
    quiz.questions.forEach((question, qIndex) => {
      const questionErrors = {};

      // Validate question text
      if (!question.text.trim()) {
        questionErrors.text = "Question text is required";
      } else if (question.text.trim().length < 5) {
        questionErrors.text = "Question must be at least 5 characters long";
      }

      // Validate options
      const filledOptions = question.options.filter(option => option.trim());
      if (filledOptions.length < 2) {
        questionErrors.options = "At least 2 options are required";
      }

      // Check for duplicate options
      const uniqueOptions = new Set(filledOptions);
      if (uniqueOptions.size !== filledOptions.length) {
        questionErrors.options = "Options must be unique";
      }

      // Validate correct option
      if (!question.correctOption.trim()) {
        questionErrors.correctOption = "Correct option is required";
      } else if (!filledOptions.includes(question.correctOption.trim())) {
        questionErrors.correctOption = "Correct option must match one of the provided options";
      }

      if (Object.keys(questionErrors).length > 0) {
        newErrors[`question_${qIndex}`] = questionErrors;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addQuestion = () => {
    setQuiz({
      ...quiz,
      questions: [
        ...quiz.questions,
        { text: "", options: ["", "", "", ""], correctOption: "" },
      ],
    });
  };

  const removeQuestion = (qIndex) => {
    if (quiz.questions.length > 1) {
      const newQuestions = quiz.questions.filter((_, index) => index !== qIndex);
      setQuiz({ ...quiz, questions: newQuestions });
      
      // Clear errors for this question
      const newErrors = { ...errors };
      delete newErrors[`question_${qIndex}`];
      setErrors(newErrors);
    } else {
      toast.warning("At least one question is required");
    }
  };

  const addOption = (qIndex) => {
    if (quiz.questions[qIndex].options.length < 6) {
      const newQuestions = [...quiz.questions];
      newQuestions[qIndex].options.push("");
      setQuiz({ ...quiz, questions: newQuestions });
    } else {
      toast.warning("Maximum 6 options allowed per question");
    }
  };

  const removeOption = (qIndex, oIndex) => {
    if (quiz.questions[qIndex].options.length > 2) {
      const newQuestions = [...quiz.questions];
      newQuestions[qIndex].options.splice(oIndex, 1);
      setQuiz({ ...quiz, questions: newQuestions });
    } else {
      toast.warning("At least 2 options are required");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!validateQuiz()) {
      toast.error("Please fix all errors before submitting");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Clean up empty options before submitting
      const cleanedQuiz = {
        ...quiz,
        questions: quiz.questions.map(question => ({
          ...question,
          options: question.options.filter(option => option.trim())
        }))
      };

      const response = await axios.post("http://localhost:8082/quizzes", cleanedQuiz);
      console.log(response.data);
      toast.success("Quiz created successfully!");
      navigate("/home");
    } catch (error) {
      console.error(error);
      toast.error("Failed to create quiz. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateQuestionText = (qIndex, value) => {
    const newQuestions = [...quiz.questions];
    newQuestions[qIndex].text = value;
    setQuiz({ ...quiz, questions: newQuestions });
    
    // Clear error for this field
    if (errors[`question_${qIndex}`]?.text) {
      const newErrors = { ...errors };
      delete newErrors[`question_${qIndex}`].text;
      if (Object.keys(newErrors[`question_${qIndex}`]).length === 0) {
        delete newErrors[`question_${qIndex}`];
      }
      setErrors(newErrors);
    }
  };

  const updateOption = (qIndex, oIndex, value) => {
    const newQuestions = [...quiz.questions];
    newQuestions[qIndex].options[oIndex] = value;
    setQuiz({ ...quiz, questions: newQuestions });
  };

  const updateCorrectOption = (qIndex, value) => {
    const newQuestions = [...quiz.questions];
    newQuestions[qIndex].correctOption = value;
    setQuiz({ ...quiz, questions: newQuestions });
    
    // Clear error for this field
    if (errors[`question_${qIndex}`]?.correctOption) {
      const newErrors = { ...errors };
      delete newErrors[`question_${qIndex}`].correctOption;
      if (Object.keys(newErrors[`question_${qIndex}`]).length === 0) {
        delete newErrors[`question_${qIndex}`];
      }
      setErrors(newErrors);
    }
  };

  return (
    <>
      <div className="add-quiz-container">
        <div className="header">
          <button onClick={() => navigate("/home")} className="back-button">
            <FiChevronLeft />
          </button>
          <h1 className="page-title">Create New Quiz</h1>
        </div>

        <form onSubmit={handleSubmit} className="quiz-form">
          <div className="form-section">
            <div className="form-group">
              <label className="form-label">
                Quiz Title <span className="required">*</span>
              </label>
              <input
                type="text"
                value={quiz.title}
                onChange={(e) => {
                  setQuiz({ ...quiz, title: e.target.value });
                  if (errors.title) {
                    const newErrors = { ...errors };
                    delete newErrors.title;
                    setErrors(newErrors);
                  }
                }}
                className={`form-input ${errors.title ? 'error' : ''}`}
                placeholder="Enter an engaging quiz title..."
              />
              {errors.title && (
                <div className="error-message">
                  <FiAlertCircle /> {errors.title}
                </div>
              )}
            </div>
          </div>

          <div className="questions-section">
            <div className="section-header">
              <h2>Questions</h2>
              <button
                type="button"
                onClick={addQuestion}
                className="add-question-btn"
              >
                <FiPlus /> Add Question
              </button>
            </div>

            {quiz.questions.map((question, qIndex) => (
              <div key={qIndex} className="question-card">
                <div className="question-header">
                  <h3>Question {qIndex + 1}</h3>
                  {quiz.questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(qIndex)}
                      className="remove-question-btn"
                    >
                      <FiTrash2 />
                    </button>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Question Text <span className="required">*</span>
                  </label>
                  <textarea
                    value={question.text}
                    onChange={(e) => updateQuestionText(qIndex, e.target.value)}
                    className={`form-textarea ${errors[`question_${qIndex}`]?.text ? 'error' : ''}`}
                    placeholder="Enter your question here..."
                    rows="3"
                  />
                  {errors[`question_${qIndex}`]?.text && (
                    <div className="error-message">
                      <FiAlertCircle /> {errors[`question_${qIndex}`].text}
                    </div>
                  )}
                </div>

                <div className="options-section">
                  <div className="options-header">
                    <label className="form-label">
                      Answer Options <span className="required">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => addOption(qIndex)}
                      className="add-option-btn"
                    >
                      <FiPlus /> Add Option
                    </button>
                  </div>

                  <div className="options-grid">
                    {question.options.map((option, oIndex) => (
                      <div key={oIndex} className="option-group">
                        <div className="option-input-wrapper">
                          <span className="option-label">
                            {String.fromCharCode(65 + oIndex)}
                          </span>
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                            className="option-input"
                            placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                          />
                          {question.options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeOption(qIndex, oIndex)}
                              className="remove-option-btn"
                            >
                              <FiTrash2 />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {errors[`question_${qIndex}`]?.options && (
                    <div className="error-message">
                      <FiAlertCircle /> {errors[`question_${qIndex}`].options}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Correct Answer <span className="required">*</span>
                  </label>
                  <select
                    value={question.correctOption}
                    onChange={(e) => updateCorrectOption(qIndex, e.target.value)}
                    className={`form-select ${errors[`question_${qIndex}`]?.correctOption ? 'error' : ''}`}
                  >
                    <option value="">Select the correct answer</option>
                    {question.options
                      .filter(option => option.trim())
                      .map((option, oIndex) => (
                        <option key={oIndex} value={option}>
                          {String.fromCharCode(65 + oIndex)}: {option}
                        </option>
                      ))}
                  </select>
                  {errors[`question_${qIndex}`]?.correctOption && (
                    <div className="error-message">
                      <FiAlertCircle /> {errors[`question_${qIndex}`].correctOption}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate("/home")}
              className="cancel-btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="submit-btn"
            >
              {isSubmitting ? (
                <>
                  <div className="spinner-small"></div>
                  Creating Quiz...
                </>
              ) : (
                <>
                  <FiCheck /> Create Quiz
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      <ToastContainer />
    </>
  );
};

export default AddQuiz;
