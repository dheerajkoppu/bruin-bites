import { useCallback, useEffect, useRef, useState } from "react";
import { getCurrentUser, login, logout } from "../api/auth.js";
import { AuthContext } from "./useAuth.js";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionError, setSessionError] = useState("");
  const requestVersion = useRef(0);

  const checkSession = useCallback((signal) => {
    const version = ++requestVersion.current;
    return getCurrentUser(signal)
      .then((currentUser) => {
        if (version === requestVersion.current && !signal?.aborted) setUser(currentUser);
      })
      .catch((error) => {
        if (version === requestVersion.current && !signal?.aborted) setSessionError(error.message);
      })
      .finally(() => {
        if (version === requestVersion.current && !signal?.aborted) setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    checkSession(controller.signal);
    return () => controller.abort();
  }, [checkSession]);

  function restoreSession() {
    setIsLoading(true);
    setSessionError("");
    return checkSession();
  }

  function setAuthenticatedUser(currentUser) {
    ++requestVersion.current;
    setUser(currentUser);
    setSessionError("");
    setIsLoading(false);
  }

  async function signIn(credentials) {
    setAuthenticatedUser(await login(credentials));
  }

  async function signOut() {
    await logout();
    setAuthenticatedUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, setUser: setAuthenticatedUser, isLoading, sessionError, restoreSession, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
