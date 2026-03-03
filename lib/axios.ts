import axios, { AxiosError, AxiosResponse } from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "",
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
});

// ── Response interceptor ────────────────────────────────────────────
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response) {
      const { status } = error.response;

      if (status === 401) {
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }

      if (status === 403) {
        console.error("Forbidden: you don't have access to this resource.");
      }

      if (status >= 500) {
        console.error("Server error — please try again later.");
      }
    } else if (error.request) {
      console.error("Network error — check your connection.");
    }

    return Promise.reject(error);
  }
);

export default api;
