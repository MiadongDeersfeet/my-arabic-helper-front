import axios from "axios";

// 백엔드 API 기본 URL을 환경변수로 분리
const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8081/api"
});

// 저장된 JWT를 자동으로 Authorization 헤더에 부착
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 단어 API
export const wordApi = {
  getAll: () => client.get("/words"),
  create: (payload) => client.post("/words", payload),
  update: (id, payload) => client.put(`/words/${id}`, payload),
  remove: (id) => client.delete(`/words/${id}`)
};

// 문장 API
export const sentenceApi = {
  getAll: () => client.get("/sentences"),
  create: (payload) => client.post("/sentences", payload),
  update: (id, payload) => client.put(`/sentences/${id}`, payload),
  remove: (id) => client.delete(`/sentences/${id}`)
};

// 학습/기록 API
export const studyApi = {
  randomWords: (size = 10) => client.get(`/study/words/random?size=${size}`),
  randomSentences: (size = 10) => client.get(`/study/sentences/random?size=${size}`),
  getRecords: () => client.get("/study/records"),
  createRecord: (payload) => client.post("/study/records", payload)
};

// 인증 API
export const authApi = {
  signUp: (payload) => client.post("/auth/signup", payload),
  login: (payload) => client.post("/auth/login", payload)
};
