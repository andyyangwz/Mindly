import { api } from "./api";

export const authService = {
  login: (login, password) =>
    api.post("/auth/login", { login, password }),

  signup: (firstName, lastName, username, email, password) =>
    api.post("/auth/signup", { first_name: firstName, last_name: lastName, username, email, password }),

  googleLogin: (credential) =>
    api.post("/auth/google", { credential }),

  getMe: () =>
    api.get("/auth/me"),
};
