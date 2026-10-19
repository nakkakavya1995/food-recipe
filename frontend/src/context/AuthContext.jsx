
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  getCurrentUser,
  loginUser,
  loginAdmin,
  loginWithGoogle,
  logoutUser,
  registerUser,
} from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      setLoading(false);
      return;
    }

    getCurrentUser()
      .then((data) => {
        setUser(data.user || data);
      })
      .catch(() => {
        logoutUser();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (credentials) => {
    const data = await loginUser(credentials);
    let currentUser = data.user || data;

    if (localStorage.getItem('token')) {
      try {
        const profile = await getCurrentUser();
        currentUser = profile.user || profile;
      } catch {
        // Keep the user information returned by login.
      }
    }

    setUser(currentUser);
    return currentUser;
  };

  const loginAsAdmin = async (credentials) => {
    const data = await loginAdmin(credentials);
    let currentUser = data.user || data;

    if (localStorage.getItem('token')) {
      try {
        const profile = await getCurrentUser();
        currentUser = profile.user || profile;
      } catch {
        // Keep the user information returned by login.
      }
    }

    setUser(currentUser);
    return currentUser;
  };

  const loginGoogle = async (googleData) => {
    const data = await loginWithGoogle(googleData);
    let currentUser = data.user || data;
    setUser(currentUser);
    return currentUser;
  };

  const register = async (userData) => {
    return registerUser(userData);
  };

  const logout = () => {
    logoutUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, loginAdmin: loginAsAdmin, loginGoogle, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
