export const baseURL = 'http://localhost:8000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('utd_auth');
  return token ? { Authorization: `Token ${token}` } : {};
};

export const get = async (endpoint) => {
  try {
    const response = await fetch(`${baseURL}${endpoint}`);
    if (!response.ok) {
      let errMsg = 'Unknown error occurred';
      try { 
        const errorData = await response.json();
        errMsg = errorData.detail || JSON.stringify(errorData);
      } catch {}
      throw new Error(errMsg);
    }
    return response.json();
  } catch (error) {
    throw error;
  }
};

export const post = async (endpoint, data) => {
  try {
    const response = await fetch(`${baseURL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      let errMsg = 'Unknown error occurred';
      try { errMsg = await response.json(); } catch {}
      throw errMsg;
    }
    return response.json();
  } catch (error) {
    throw error;
  }
};

export const authGet = async (endpoint) => {
  try {
    const response = await fetch(`${baseURL}${endpoint}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      let errMsg = 'Unknown error occurred';
      try { 
        const errorData = await response.json();
        errMsg = errorData.detail || JSON.stringify(errorData);
      } catch {}
      throw new Error(errMsg);
    }
    return response.json();
  } catch (error) {
    throw error;
  }
};

export const authPut = async (endpoint, data) => {
  try {
    const response = await fetch(`${baseURL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      let errMsg = 'Unknown error occurred';
      try { errMsg = await response.json(); } catch {}
      throw errMsg;
    }
    return response.json();
  } catch (error) {
    throw error;
  }
};

export const authPost = async (url, data) => {
  const token = localStorage.getItem('utd_auth');
  if (!token) throw new Error("No auth token found.");

  const response = await fetch(`${baseURL}${url}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Token ${token}`,
    },
    body: JSON.stringify(data),
  });

  const responseData = await response.json();

  if (!response.ok) {
    const errorMsg =
      responseData.non_field_errors?.[0] ||
      responseData.detail ||
      JSON.stringify(responseData);
    throw new Error(errorMsg);
  }

  return responseData;
};

export const getExam = async (examId) => {
  return authGet(`/api/exams/${examId}/`);
};

export const createExamSession = async (data) => {
  return authPost('/api/exam-sessions/', data);
};

export const submitAnswers = async (payload) => {
  return authPost('/api/submit-answers/', payload);
};

export const checkExamSubmission = async (examId, userId) => {
  return authGet(`/api/exams/${examId}/submitted/${userId}/`);
};

export const getResult = async (resultId) => {
  return get(`/api/results/${resultId}/`);
};