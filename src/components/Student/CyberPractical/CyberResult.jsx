import React from "react";
import { useLocation } from "react-router-dom";

const CyberResult = () => {

  const location = useLocation();

  const result = location.state;

  if (!result) {
    return <div>No Result Found</div>;
  }

  return (
    <div className="container mt-5">

      <div className="card shadow">

        <div className="card-body text-center">

          <h2>Cyber Practical Result</h2>

          <hr />

          <h1>{result.percentage}%</h1>

          <h4>
            Score: {result.score}
          </h4>

          <h3
            className={
              result.passed
                ? "text-success"
                : "text-danger"
            }
          >
            {result.passed ? "PASSED" : "FAILED"}
          </h3>

        </div>

      </div>

    </div>
  );
};

export default CyberResult;