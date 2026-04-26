import { createContext, useContext, useState, useEffect } from "react";
import { authApi } from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [token, setToken] = useState(localStorage.getItem("token"));
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(!!localStorage.getItem("token"));

    useEffect(() => {
        if (!token) {
            setUser(null);
            setLoading(false);
            return;
        }
        authApi.me()
            .then((res) => setUser(res.data))
            .catch(() => {
                localStorage.removeItem("token");
                setToken(null);
            })
            .finally(() => setLoading(false));
    }, [token]);

    const login = (newToken) => {
        localStorage.setItem("token", newToken);
        setToken(newToken);
    };

    const logout = () => {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ token, user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
