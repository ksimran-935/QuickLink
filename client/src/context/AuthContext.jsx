import { createContext, useContext, useState } from "react";

// AuthContext provides user state + login/logout helpers to the whole app.
// We avoid prop-drilling by using React Context instead of passing user down
// through every component.
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Initialise from localStorage so the user stays logged in on page refresh.
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const login = (token, userData) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook — components import useAuth() instead of useContext(AuthContext)
export const useAuth = () => useContext(AuthContext);
