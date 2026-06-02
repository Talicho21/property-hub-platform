import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('TENANT');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await register({ name, email, password, role });
      setSuccess(
        role === 'LANDLORD'
          ? 'Your landlord account was created and is waiting for admin approval.'
          : response?.message || 'Registration successful.'
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Create account</p>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Join the platform</h2>
          <p className="text-sm leading-6 text-slate-500">
            Create a tenant or landlord profile to start using the property workspace.
          </p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm" role="alert">
            {error}
          </div>
        ) : success ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-sm" role="status">
            {success}
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-700 shadow-sm">
            Your account will be created with the role selected below.
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Full Name</label>
              <input
                type="text"
                required
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                placeholder="Yonatan Bekele"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              <p className="mt-2 text-xs text-slate-500">This will be shown on your dashboard.</p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Email Address</label>
              <input
                type="email"
                required
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <p className="mt-2 text-xs text-slate-500">Use an email you can access right away.</p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
              <input
                type="password"
                required
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                placeholder="Create a secure password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <p className="mt-2 text-xs text-slate-500">Use at least 8 characters with strong variety.</p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Account Role</label>
              <select
                value={role}
                onChange={(event) => setRole(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              >
                <option value="TENANT">TENANT</option>
                <option value="LANDLORD">LANDLORD</option>
              </select>
              <p className="mt-2 text-xs text-slate-500">Landlord accounts require admin approval before login.</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
}