import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

function PublicOnlyRoute({ children }) {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function AuthScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const isRegister = location.pathname === '/register';

  const handleToggleAuthMode = () => {
    navigate(isRegister ? '/login' : '/register');
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.08),_transparent_26%),linear-gradient(180deg,_#f8fafc_0%,_#eef4ff_100%)]">
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.55),transparent_35%,transparent_65%,rgba(255,255,255,0.45))]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="hidden h-full flex-col justify-between rounded-[2rem] border border-white/60 bg-slate-950 p-10 text-white shadow-2xl shadow-blue-950/10 backdrop-blur xl:flex">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-200">
                Property Platform
              </div>
              <h1 className="mt-8 max-w-lg text-5xl font-extrabold leading-tight tracking-tight text-white">
                Premium property workflows, designed with clarity.
              </h1>
              <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
                A clean dashboard experience for landlords and tenants with a focused login, a polished register flow, and a calm operational workspace.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ['Secure access', 'JWT-backed sign in flow'],
                ['Fast actions', 'Streamlined property management'],
                ['Role aware', 'Landlord and tenant views'],
              ].map(([title, copy]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-sm font-semibold text-white">{title}</div>
                  <div className="mt-1 text-sm leading-6 text-slate-300">{copy}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex flex-col items-center justify-center">
            <div className="w-full max-w-xl rounded-[2rem] border border-white/70 bg-white/85 p-4 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-6 lg:p-8">
              <div className="mb-6 flex items-center justify-between rounded-[1.5rem] border border-slate-200/70 bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Authentication</p>
                  <h2 className="mt-1 text-lg font-bold text-slate-900">
                    {isRegister ? 'Create your account' : 'Welcome back'}
                  </h2>
                </div>
                <div className="hidden rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 sm:block">
                  Secure workspace
                </div>
              </div>

              {isRegister ? <Register /> : <Login />}

              <div className="mt-6 border-t border-slate-200/80 pt-5 text-center">
                <button
                  onClick={handleToggleAuthMode}
                  className="inline-flex items-center justify-center rounded-full border border-blue-200 bg-blue-50 px-5 py-2.5 text-sm font-semibold text-blue-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-100 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register here"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={user ? '/dashboard' : '/login'} replace />}
      />

      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <AuthScreen />
          </PublicOnlyRoute>
        }
      />

      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <AuthScreen />
          </PublicOnlyRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['TENANT', 'LANDLORD', 'ADMIN']}>
            <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.12),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef4ff_100%)]">
              <Dashboard />
            </div>
          </ProtectedRoute>
        }
      />

      <Route
        path="*"
        element={<Navigate to={user ? '/dashboard' : '/login'} replace />}
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}