import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, UserPlus, GraduationCap, Users } from 'lucide-react';
import { apiFetch } from '../api';

const saveSession = (data) => {
    localStorage.setItem('user', data.user_id);
    localStorage.setItem('user_id', data.user_id);
    localStorage.setItem('user_type', data.user_type);
    localStorage.setItem('first_name', data.first_name || '');
    localStorage.setItem('last_name', data.last_name || '');
    if (data.token) localStorage.setItem('token', data.token);
};

// --- Input Field Component ---
const InputField = ({ Icon, type, name, value, onChange, placeholder, required = true }) => (
    <div className="relative">
        <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-400 w-5 h-5" />
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition duration-150 shadow-sm text-gray-700 placeholder-gray-400 font-medium"
        />
    </div>
);

const LoginSignup = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        user_type: 'child'
    });

    const [isLogin, setIsLogin] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const validateEmail = (email) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.toLowerCase());

    const handleChange = (e) => {
        const { name, value } = e.target;
        let formattedValue = value;

        // ✅ STRICT NAME VALIDATION (LETTERS + SPACE ONLY)
        if (name === "first_name" || name === "last_name") {
            formattedValue = value
                .replace(/[^a-zA-Z\s]/g, "") // ❌ remove numbers & symbols
                .toLowerCase()
                .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize
        }

        setFormData({ ...formData, [name]: formattedValue });
    };


    // ✅ FIXED: ROLE-BASED REDIRECTION
    const handleRedirection = (userType) => {
        if (userType === 'admin') {
            navigate('/admin-dashboard');
        } else if (userType === 'teacher') {
            navigate('/teacher-dashboard');
        } else {
            navigate('/child-dashboard');
        }
    };

    // --- SIGN UP ---
    const handleSignUp = async () => {
        setLoading(true);
        const { first_name, last_name, email, password, user_type } = formData;

        if (!first_name || !last_name || !email || !password) {
            setError('Please fill in all required fields.');
            setLoading(false);
            return;
        }

        if (!validateEmail(email)) {
            setError('Please enter a valid email address.');
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            setLoading(false);
            return;
        }

        try {
            setError('');
            setSuccessMessage('');

            const payload = {
                first_name,
                last_name,
                username: email,
                password,
                user_type
            };

            const response = await apiFetch('/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                // ✅ REQUIRED FOR ROUTE PROTECTION
                saveSession(data);

                setSuccessMessage(data.message || 'Account created successfully! Redirecting...');
                setTimeout(() => handleRedirection(data.user_type), 1000);
            } else {
                setError(data.message || 'An error occurred during sign up.');
            }
        } catch (err) {
            setError('Failed to connect to the backend server.');
        } finally {
            setLoading(false);
        }
    };

    // --- LOGIN ---
    const handleLogin = async () => {
        setLoading(true);
        const { email, password } = formData;

        if (!email || !password) {
            setError('Please fill in all fields.');
            setLoading(false);
            return;
        }

        try {
            setError('');
            setSuccessMessage('');

            const payload = {
                username: email,
                password
            };

            const response = await apiFetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                // ✅ REQUIRED FOR ADMIN ROUTE GUARD
                saveSession(data);

                setSuccessMessage(data.message || 'Login successful! Redirecting...');
                setTimeout(() => handleRedirection(data.user_type), 800);
            } else {
                setError(data.message || 'Invalid email or password.');
            }
        } catch (err) {
            setError('Failed to connect to the backend server.');
        } finally {
            setLoading(false);
        }
    };

    const formTitle = isLogin ? 'Log In to Smart Tutor' : 'Create Your Account';
    const formSubtitle = isLogin
        ? 'Welcome back! Let the learning begin.'
        : 'Sign up to start your personalized learning journey.';
    const actionText = isLogin ? 'Log In' : 'Sign Up';

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white p-8 rounded-3xl shadow-2xl border-t-8 border-indigo-500">

                <div className="flex flex-col items-center mb-8">
                    <GraduationCap className="w-12 h-12 text-indigo-600 mb-2" />
                    <h2 className="text-3xl font-extrabold text-gray-900">{formTitle}</h2>
                    <p className="text-sm text-gray-500 mt-1">{formSubtitle}</p>
                </div>

                {error && <div className="bg-red-100 text-red-700 px-4 py-3 rounded-xl mb-4">{error}</div>}
                {successMessage && <div className="bg-green-100 text-green-700 px-4 py-3 rounded-xl mb-4">{successMessage}</div>}

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        isLogin ? handleLogin() : handleSignUp();
                    }}
                    className="space-y-6"
                >
                    {!isLogin && (
                        <>
                            <div className="flex gap-4">
                                <InputField Icon={User} type="text" name="first_name" value={formData.first_name} onChange={handleChange} placeholder="First Name" />
                                <InputField Icon={User} type="text" name="last_name" value={formData.last_name} onChange={handleChange} placeholder="Last Name" />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                    <Users className="w-4 h-4 mr-2 text-indigo-500" /> I am a:
                                </label>
                                <div className="flex space-x-4">
                                    <button type="button" onClick={() => setFormData(p => ({ ...p, user_type: 'child' }))} className={`flex-1 py-3 rounded-xl font-bold ${formData.user_type === 'child' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'}`}>Student</button>
                                    <button type="button" onClick={() => setFormData(p => ({ ...p, user_type: 'teacher' }))} className={`flex-1 py-3 rounded-xl font-bold ${formData.user_type === 'teacher' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'}`}>Teacher</button>
                                </div>
                            </div>
                        </>
                    )}

                    <InputField Icon={Mail} type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email Address" />
                    <InputField Icon={Lock} type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Password" />

                    <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold">
                        {loading ? 'Please wait...' : actionText}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm">
                    {isLogin ? "New here?" : "Already have an account?"}{' '}
                    <span
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError('');
                            setSuccessMessage('');
                        }}
                        className="text-indigo-600 font-semibold cursor-pointer"
                    >
                        {isLogin ? 'Create Account' : 'Log In'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default LoginSignup;
