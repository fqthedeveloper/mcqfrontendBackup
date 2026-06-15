import api from "./api";

export const getCyberTasks = async () => {
  return await api.get(
    "/cyber/student/tasks/"
  );
};

export const getCyberTaskDetail = async (
  id
) => {
  return await api.get(
    `/cyber/student/tasks/${id}/`
  );
};

export const startCyberLab = async (
  taskId
) => {
  return await api.post(
    `/cyber/student/start/${taskId}/`
  );
};

export const getCyberSession = async (
  sessionId
) => {
  return await api.get(
    `/cyber/student/session/${sessionId}/`
  );
};

export const submitCyberSession =
  async (sessionId) => {
    return await api.post(
      `/cyber/student/session/${sessionId}/submit/`
    );
  };

export const getCyberResults =
  async () => {
    return await api.get(
      "/cyber/student/results/"
    );
  };


export const getActiveCyberSession =
  async () => {

    const response =
      await api.get(
        "/cyber/student/cyber/active-session/"
      );

    return response;
  };