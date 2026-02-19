import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check session on mount
  useEffect(() => {
    fetch("/api/auth/whoami/")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setUser({ 
            username: data.username, 
            role: data.role || "GUEST", // Default to GUEST
            is_staff: data.is_staff 
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setLoading(false);
      });
  }, []);

  // Helper to get cookie by name
  function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
  }

  const login = async (username, password) => {
    const res = await fetch("/api/auth/login/", {
      method: "POST",
      headers: { 
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken") 
      },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (data.username) {
      setUser({ 
        username: data.username, 
        role: data.role || "GUEST",
        is_staff: data.is_staff 
      });
      return { success: true, role: data.role || "GUEST" };
    }
    return { success: false, error: data.error };
  };

  const logout = async () => {
    await fetch("/api/auth/logout/", { 
        method: "POST",
        headers: { 
            "X-CSRFToken": getCookie("csrftoken") 
        }
    });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
