import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/authContext";

export default function Dashboard() {
  const { user } = useAuth();

  useEffect(() => {
    document.title = `${
      user?.user_type === "admin" ? "Admin" : "Student"
    } Dashboard`;
  }, [user]);

  if (!user) return <p>Loading...</p>;

  return (
    <div className="dashboard">
      <h1>{user.role === "admin" ? "Admin" : "Student"} Dashboard</h1>


      <div className="dashboard-cards">
        {user.role === "admin" ? (
          <>
            <Link to="/admin/add-student" className="card">
              <div className="card-icon">
                <i className="fa-solid fa-user-plus"></i>
              </div>
              <h3>Add Students</h3>
              <p>Add new students to the system.</p>
            </Link>

            <Link to="/admin/upload" className="card">
              <div className="card-icon">
                <i className="fas fa-file-upload"></i>
              </div>
              <h3>Upload Questions</h3>
              <p>Upload questions in bulk.</p>
            </Link>

            <Link to="/admin/add-exam" className="card">
              <div className="card-icon">
                <i className="fa-solid fa-file-circle-plus"></i>
              </div>
              <h3>Add Exam</h3>
              <p>Schedule exams for students.</p>
            </Link>

            <Link to="/admin/exam-list" className="card">
              <div className="card-icon">
                <i className="fa-solid fa-pencil"></i>
              </div>
              <h3>Exam List</h3>
              <p>Manage existing exams.</p>
            </Link>

            <Link to="/admin/student-list" className="card">
              <div className="card-icon">
                <i className="fa-solid fa-user-pen"></i>
              </div>
              <h3>Student List</h3>
              <p>View and edit student details.</p>
            </Link>

            <Link to="/admin/results-list" className="card">
              <div className="card-icon">
                <i className="fa-solid fa-user-pen"></i>
              </div>
              <h3>All Student Result List</h3>
              <p>See all Student Exam Result</p>
            </Link>
          </>
        ) : (
          <>
            <Link to="/student/exam-list" className="card">
              <div className="card-icon">
                <i className="fa-solid fa-book"></i>
              </div>
              <h3>Available Exams</h3>
              <p>Take available exams assigned to you.</p>
            </Link>

            <Link to="/student/results/" className="card">
              <div className="card-icon">
                <i className="fa-solid fa-chart-bar"></i>
              </div>
              <h3>My Results</h3>
              <p>View your past exam results.</p>
            </Link>
          </>
        )}
      </div>

      <style>{`
        .admin-dashboard {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
          min-height: calc(100vh - 60px);
        }

        h1 {
          text-align: center;
          margin: 30px 0 40px;
          color: #2c3e50;
          font-size: 2.5rem;
        }

        .dashboard-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 30px;
          padding: 20px;
        }

        .card {
          background: white;
          border-radius: 15px;
          padding: 30px 25px;
          text-align: center;
          text-decoration: none;
          color: #34495e;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          border: 2px solid transparent;
        }

        .card:hover {
          transform: translateY(-10px);
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.12);
          border-color: #3498db;
        }

        .card-icon {
          width: 80px;
          height: 80px;
          background: #f8f9fa;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 25px;
          transition: all 0.3s ease;
        }

        .card:hover .card-icon {
          background: #3498db;
          transform: scale(1.1);
        }

        .card-icon i {
          font-size: 36px;
          color: #3498db;
          transition: all 0.3s ease;
        }

        .card:hover .card-icon i {
          color: white;
        }

        .card h3 {
          font-size: 1.8rem;
          margin-bottom: 15px;
          color: #2c3e50;
        }

        .card p {
          font-size: 1.1rem;
          color: #7f8c8d;
          margin: 0;
          line-height: 1.6;
        }

        @media (max-width: 1024px) {
          .dashboard-cards {
            gap: 25px;
          }
          .card {
            padding: 25px 20px;
          }
        }

        @media (max-width: 768px) {
          h1 {
            font-size: 2.2rem;
            margin: 20px 0 30px;
          }
          .dashboard-cards {
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
            padding: 10px;
          }
          .card-icon {
            width: 70px;
            height: 70px;
          }
          .card h3 {
            font-size: 1.6rem;
          }
        }

        @media (max-width: 480px) {
          .admin-dashboard {
            padding: 15px;
          }
          h1 {
            font-size: 2rem;
            margin: 15px 0 25px;
          }
          .dashboard-cards {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          .card {
            padding: 30px 20px;
          }
        }

        @media (max-width: 360px) {
          .card-icon {
            width: 60px;
            height: 60px;
          }
          .card-icon i {
            font-size: 30px;
          }
          .card h3 {
            font-size: 1.4rem;
          }
          .card p {
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  );
}
