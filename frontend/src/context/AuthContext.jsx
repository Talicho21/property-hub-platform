import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function AuthProvider({ children }) {
	const [token, setToken] = useState(() => localStorage.getItem('token'));
	const [user, setUser] = useState(() => {
		const storedUser = localStorage.getItem('user');
		if (!storedUser) return null;
		try {
			const parsed = JSON.parse(storedUser);
			if (parsed && parsed.role) parsed.role = String(parsed.role).toUpperCase();
			return parsed;
		} catch (e) {
			return null;
		}
	});

	useEffect(() => {
		if (token) {
			localStorage.setItem('token', token);
		} else {
			localStorage.removeItem('token');
		}
	}, [token]);

	useEffect(() => {
		if (user) {
			localStorage.setItem('user', JSON.stringify(user));
		} else {
			localStorage.removeItem('user');
		}
	}, [user]);

	const normalizeUser = (u) => {
		if (!u) return u;
		return {
			...u,
			role: u.role ? String(u.role).toUpperCase() : u.role,
		};
	};

	const login = async (email, password) => {
		const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
			email,
			password,
		});

		setToken(response.data.token);
		setUser(normalizeUser(response.data.user));
		return response.data.user;
	};

	const register = async ({ name, email, password, role }) => {
		const response = await axios.post(`${API_BASE_URL}/api/auth/register`, {
			name,
			email,
			password,
			role,
		});

		if (response.data.token) {
			setToken(response.data.token);
			setUser(normalizeUser(response.data.user));
		}
		return response.data.user;
	};

	const logout = () => {
		setToken(null);
		setUser(null);
	};

	// Create a pre-configured Axios instance for API calls (includes /api prefix)
	const api = useMemo(() => {
		const instance = axios.create({ baseURL: `${API_BASE_URL}/api` });

		// Attach token (when present) to every request
		instance.interceptors.request.use(
			(config) => {
				if (token) {
					config.headers = config.headers || {};
					config.headers.Authorization = `Bearer ${token}`;
				}
				return config;
			},
			(error) => Promise.reject(error)
		);

		return instance;
	}, [token]);

	const value = useMemo(
		() => ({
			token,
			user,
			login,
			register,
			logout,
			api,
			API: api,
		}),
		[token, user, api]
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const context = useContext(AuthContext);

	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider');
	}

	return context;
}

export default AuthContext;
