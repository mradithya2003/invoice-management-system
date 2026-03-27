import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, loginUser, registerUser, logoutUser } from '../api/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then((data) => setUser(data.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const data = await loginUser(email, password);
    setUser(data.user);
    return data;
  };

  const register = async (name, email, password) => {
    const data = await registerUser(name, email, password);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
