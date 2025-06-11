import React, { useState, useEffect } from "react";
import { authGet, authPost, authPostFormData } from "../../services/api";
import { useAuth } from "../../context/authContext";
import {
  FaFileExcel,
  FaDownload,
  FaCloudUploadAlt,
  FaPlus,
  FaCheckCircle,
  FaTimes,
  FaInfoCircle
} from "react-icons/fa";
import Swal from "sweetalert2";
import "../CSS/Questionupload.css";

const QuestionUpload = () => {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [showSingleForm, setShowSingleForm] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [isMulti, setIsMulti] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  
  const [singleQuestion, setSingleQuestion] = useState({
    subject_id: "",
    text: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_answer: "A",
    correct_answers: [],
    marks: 1,
    explanation: "",
  });

  const { token } = useAuth();

  useEffect(() => {
    document.title = "Upload Questions";
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    setIsLoading(true);
    try {
      const response = await authGet("/api/subjects/");
      setSubjects(Array.isArray(response) ? response : []);
    } catch (error) {
      showError("Failed to load subjects", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSingleQuestion(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  const handleMultiToggle = () => {
    setIsMulti(!isMulti);
    setSingleQuestion(prev => ({
      ...prev,
      correct_answer: "A",
      correct_answers: [],
    }));
  };

  const handleMultiCorrectAnswerChange = (e) => {
    const { value, checked } = e.target;
    setSingleQuestion(prev => {
      const updatedAnswers = checked
        ? [...prev.correct_answers, value]
        : prev.correct_answers.filter(ans => ans !== value);
      return { ...prev, correct_answers: updatedAnswers };
    });
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/questions/download_format/`,
        {
          method: "GET",
          headers: { Authorization: `Token ${token}` },
        }
      );
      
      if (!response.ok) throw new Error("Failed to download format");
      
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.setAttribute("download", "question_format.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();

      showSuccess("Format downloaded successfully!");
    } catch (err) {
      showError("Failed to download format", err);
    }
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      return showWarning("Please select an Excel file to upload");
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      await authPostFormData("/api/questions/bulk_upload/", formData);
      showSuccess("Questions uploaded successfully!");
      setFile(null);
      setFileName("");
    } catch (error) {
      showError("Upload failed", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSingleSubmit = async (e) => {
    e.preventDefault();

    if (isMulti && singleQuestion.correct_answers.length === 0) {
      return showWarning("Please select at least one correct answer");
    }

    setIsAdding(true);
    const payload = {
      subject: parseInt(singleQuestion.subject_id),  // ✅ FIXED
      text: singleQuestion.text,
      options: {
        A: singleQuestion.option_a,
        B: singleQuestion.option_b,
        C: singleQuestion.option_c,
        D: singleQuestion.option_d,
      },
      correct_answers: isMulti
        ? singleQuestion.correct_answers
        : singleQuestion.correct_answer,
      marks: singleQuestion.marks,
      is_multi: isMulti,
      explanation: singleQuestion.explanation,
    };

    try {
      await authPost("/api/questions/", payload);
      showSuccess("Question added successfully!");
      
      // Reset form
      setSingleQuestion({
        subject_id: "",
        text: "",
        option_a: "",
        option_b: "",
        option_c: "",
        option_d: "",
        correct_answer: "A",
        correct_answers: [],
        marks: 1,
        explanation: "",
      });
      setIsMulti(false);
    } catch (error) {
      showError("Failed to add question", error);
    } finally {
      setIsAdding(false);
    }
  };

  const showSuccess = (message) => {
    Swal.fire({
      icon: "success",
      title: "Success!",
      text: message,
      timer: 3000,
      showConfirmButton: false,
    });
  };

  const showError = (title, error) => {
    console.error(title, error);
    Swal.fire({
      icon: "error",
      title: title,
      text: error.message || "An error occurred",
      timer: 3000,
      showConfirmButton: false,
    });
  };

  const showWarning = (message) => {
    Swal.fire({
      icon: "warning",
      title: "Attention",
      text: message,
      timer: 3000,
      showConfirmButton: false,
    });
  };

  const removeFile = () => {
    setFile(null);
    setFileName("");
  };

  return (
    <div className="question-upload-container">
      <div className="header">
        <h1>
          <FaFileExcel /> Question Management
        </h1>
        <div className="mode-toggle">
          <button
            className={`toggle-btn ${!showSingleForm ? "active" : ""}`}
            onClick={() => setShowSingleForm(false)}
            disabled={isLoading}
          >
            <FaCloudUploadAlt /> Bulk Upload
          </button>
          <button
            className={`toggle-btn ${showSingleForm ? "active" : ""}`}
            onClick={() => setShowSingleForm(true)}
            disabled={isLoading}
          >
            <FaPlus /> Add Single
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loader">
          <div className="spinner"></div>
          <p>Loading subjects...</p>
        </div>
      ) : !showSingleForm ? (
        <div className="bulk-upload">
          <form onSubmit={handleBulkUpload}>
            <div className="file-upload-container">
              <label htmlFor="bulkFile" className="file-upload-label">
                <FaCloudUploadAlt className="upload-icon" />
                <span>Choose Excel File</span>
                <input
                  id="bulkFile"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  required
                  disabled={isUploading}
                />
              </label>
              
              {fileName && (
                <div className="file-preview">
                  <span>{fileName}</span>
                  <button 
                    type="button" 
                    className="remove-file"
                    onClick={removeFile}
                    disabled={isUploading}
                  >
                    <FaTimes />
                  </button>
                </div>
              )}
              
              <div className="file-info">
                <FaInfoCircle className="info-icon" />
                <p>Supported formats: .xlsx, .xls. Max size: 5MB</p>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="download-btn"
                onClick={handleDownload}
                disabled={isUploading}
              >
                <FaDownload /> Download Format
              </button>
              <button
                type="submit"
                className="upload-btn"
                disabled={!file || isUploading}
              >
                {isUploading ? (
                  <>
                    <div className="upload-spinner"></div> Uploading...
                  </>
                ) : (
                  <>
                    <FaCloudUploadAlt /> Upload Questions
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="single-form">
          <form onSubmit={handleSingleSubmit}>
            <div className="form-section">
              <h3>Question Details</h3>
              <div className="form-group">
                <label htmlFor="subject">Subject</label>
                <select
                  id="subject"
                  name="subject_id"
                  value={singleQuestion.subject_id}
                  onChange={handleInputChange}
                  required
                  disabled={isAdding}
                >
                  <option value="">Select a subject</option>
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="questionText">Question Text</label>
                <textarea
                  id="questionText"
                  name="text"
                  value={singleQuestion.text}
                  onChange={handleInputChange}
                  placeholder="Enter your question here..."
                  required
                  disabled={isAdding}
                  rows={4}
                />
              </div>
            </div>

            <div className="form-section">
              <h3>Options</h3>
              <div className="options-grid">
                {['A', 'B', 'C', 'D'].map(option => (
                  <div className="form-group" key={option}>
                    <label htmlFor={`option_${option}`}>Option {option}</label>
                    <input
                      id={`option_${option}`}
                      type="text"
                      name={`option_${option.toLowerCase()}`}
                      value={singleQuestion[`option_${option.toLowerCase()}`]}
                      onChange={handleInputChange}
                      placeholder={`Enter option ${option}`}
                      required
                      disabled={isAdding}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="form-section">
              <h3>Answer Configuration</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="marks">Marks</label>
                  <input
                    id="marks"
                    type="number"
                    name="marks"
                    value={singleQuestion.marks}
                    onChange={handleInputChange}
                    min="1"
                    max="10"
                    required
                    disabled={isAdding}
                  />
                </div>
                
                <div className="form-group checkbox-group">
                  <label htmlFor="isMulti">
                    <input
                      id="isMulti"
                      type="checkbox"
                      checked={isMulti}
                      onChange={handleMultiToggle}
                      disabled={isAdding}
                    />
                    Multiple Correct Answers
                  </label>
                </div>
              </div>

              {!isMulti ? (
                <div className="form-group">
                  <label htmlFor="correctAnswer">Correct Answer</label>
                  <select
                    id="correctAnswer"
                    name="correct_answer"
                    value={singleQuestion.correct_answer}
                    onChange={handleInputChange}
                    required
                    disabled={isAdding}
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>
              ) : (
                <div className="form-group">
                  <label>Correct Answers</label>
                  <div className="multi-checkboxes">
                    {['A', 'B', 'C', 'D'].map(option => (
                      <label key={option} htmlFor={`correct-${option}`}>
                        <input
                          id={`correct-${option}`}
                          type="checkbox"
                          value={option}
                          checked={singleQuestion.correct_answers.includes(option)}
                          onChange={handleMultiCorrectAnswerChange}
                          disabled={isAdding}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="form-section">
              <h3>Additional Information</h3>
              <div className="form-group">
                <label htmlFor="explanation">Explanation</label>
                <textarea
                  id="explanation"
                  name="explanation"
                  value={singleQuestion.explanation}
                  onChange={handleInputChange}
                  placeholder="Add explanation for the correct answer..."
                  disabled={isAdding}
                  rows={3}
                />
              </div>
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={isAdding}
            >
              {isAdding ? (
                <>
                  <div className="add-spinner"></div> Adding...
                </>
              ) : (
                <>
                  <FaCheckCircle /> Add Question
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default QuestionUpload;