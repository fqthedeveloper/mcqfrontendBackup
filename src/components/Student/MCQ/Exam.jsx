// src/components/Exam/Exam.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { authGet, authPost } from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";

const Exam = () => {
  const { id } = useParams(); // this is session.id, not exam.id
  const { user } = useAuth();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);

  // Fetch session (not exam directly)
  const fetchSession = useCallback(async () => {
    try {
      const response = await authGet(`/api/sessions/${id}/`);
      setSession(response);
      setExam(response.exam);
      setQuestions(response.exam.questions || []);
      setTimeLeft(response.exam.duration * 60); // convert minutes → seconds
    } catch (err) {
      console.error("Error fetching session:", err);
      Swal.fire("Error", "Could not load exam session", "error");
      navigate("/student/exams");
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [timeLeft]);

  const handleAnswer = (questionId, answer) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSaveAnswer = async (questionId) => {
    try {
      await authPost("/api/answers/", {
        session: session.id,
        question: questionId,
        selected_option: answers[questionId],
      });
      Swal.fire("Saved!", "Your answer has been saved.", "success");
    } catch (err) {
      console.error("Error saving answer:", err);
      Swal.fire("Error", "Could not save answer", "error");
    }
  };

  const handleSubmit = async () => {
    try {
      await authPost(`/api/sessions/${session.id}/submit/`);
      Swal.fire("Submitted!", "Your exam has been submitted.", "success");
      navigate("/student/exams");
    } catch (err) {
      console.error("Error submitting exam:", err);
      Swal.fire("Error", "Could not submit exam", "error");
    }
  };

  if (!exam) return <div>Loading exam...</div>;

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">{exam.title}</h1>
      <p className="mb-4">Time Left: {Math.floor(timeLeft / 60)}:{timeLeft % 60}</p>

      {currentQuestion ? (
        <div className="mb-6">
          <h2 className="text-lg font-semibold">
            Q{currentQuestionIndex + 1}: {currentQuestion.text}
          </h2>
          <div className="mt-3 space-y-2">
            {["A", "B", "C", "D"].map((opt) => (
              <label key={opt} className="block">
                <input
                  type="radio"
                  name={`question-${currentQuestion.id}`}
                  value={opt}
                  checked={answers[currentQuestion.id] === opt}
                  onChange={() => handleAnswer(currentQuestion.id, opt)}
                />{" "}
                {currentQuestion[`option_${opt.toLowerCase()}`]}
              </label>
            ))}
          </div>
          <button
            onClick={() => handleSaveAnswer(currentQuestion.id)}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Save Answer
          </button>
        </div>
      ) : (
        <p>No questions available</p>
      )}

      <div className="flex justify-between mt-4">
        <button
          onClick={() =>
            setCurrentQuestionIndex((i) => Math.max(0, i - 1))
          }
          disabled={currentQuestionIndex === 0}
          className="px-4 py-2 bg-gray-400 text-white rounded disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={() =>
            setCurrentQuestionIndex((i) =>
              Math.min(questions.length - 1, i + 1)
            )
          }
          disabled={currentQuestionIndex === questions.length - 1}
          className="px-4 py-2 bg-gray-400 text-white rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>

      <div className="mt-6">
        <button
          onClick={handleSubmit}
          className="px-6 py-3 bg-green-600 text-white rounded"
        >
          Submit Exam
        </button>
      </div>
    </div>
  );
};

export default Exam;
