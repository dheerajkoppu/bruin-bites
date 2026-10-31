import { useEffect, useState } from "react";
import { getCurrentUser } from "../api/auth.js";
import { AuthContext } from "./useAuth.js";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    getCurrentUser(controller.signal)
      .then((currentUser) => {
        if (!controller.signal.aborted) {
          setUser((existingUser) => existingUser ?? currentUser);
        }
      })
      .catch(() => {
        // A missing API or expired session should not prevent browsing or signup.
      });
    return () => controller.abort();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

