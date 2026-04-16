import axios from "axios";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

// 프로덕션에서는 API URL 누락 배포를 즉시 감지
if (import.meta.env.PROD && !apiBaseUrl) {
  throw new Error("Missing VITE_API_BASE_URL for production build");
}

// 백엔드 API 기본 URL을 환경변수로 분리
const client = axios.create({
  baseURL: apiBaseUrl || "http://localhost:8081/api"
});

const backendOrigin = (apiBaseUrl || "http://localhost:8081/api").replace(/\/api\/?$/, "");

// 저장된 JWT를 자동으로 Authorization 헤더에 부착
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const unwrapResponse = (response) => response.data?.data ?? null;

export const resolveMediaUrl = (url) => {
  if (!url) {
    return "";
  }
  if (/^https?:\/\//i.test(url)) {
    return url;
  }
  if (url.startsWith("/")) {
    return `${backendOrigin}${url}`;
  }
  return `${backendOrigin}/${url}`;
};

export const categoryApi = {
  getAll: async () => {
    const response = await client.get("/categories");
    return unwrapResponse(response) || [];
  }
};

export const sentenceCardApi = {
  getByCategory: async (categoryId) => {
    const response = await client.get(`/categories/${categoryId}/sentence-cards`);
    return unwrapResponse(response) || [];
  },
  getOne: async (cardId) => {
    const response = await client.get(`/sentence-cards/${cardId}`);
    return unwrapResponse(response);
  },
  create: async (payload) => {
    const response = await client.post("/sentence-cards", payload);
    return unwrapResponse(response);
  },
  update: async (cardId, payload) => {
    const response = await client.put(`/sentence-cards/${cardId}`, payload);
    return unwrapResponse(response);
  },
  deactivate: async (cardId) => {
    const response = await client.patch(`/sentence-cards/${cardId}/deactivate`);
    return unwrapResponse(response);
  }
};

export const audioApi = {
  upload: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await client.post("/audio/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return unwrapResponse(response);
  }
};

// 인증 API
export const authApi = {
  signUp: (payload) => client.post("/auth/signup", payload),
  login: (payload) => client.post("/auth/login", payload)
};
