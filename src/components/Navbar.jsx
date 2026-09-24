import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart3, Menu, X, Shield, LogOut } from 'lucide-react';
import Logo from './Logo';

const clearSession = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_type');
    localStorage.removeItem('first_name');
    localStorage.removeItem('last_name');
    localStorage.removeItem('token');
};

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();
    const isLoggedIn = Boolean(localStorage.getItem('user'));
    const userType = localStorage.getItem('user_type');

    const closeMenu = () => setIsMenuOpen(false);

    const handleLogout = () => {
        clearSession();
        closeMenu();
        navigate('/login');
    };

    const desktopLink = "text-white hover:text-gray-200 font-medium";
    const pill = "text-white px-4 py-2 rounded-full font-medium shadow-sm flex items-center gap-1";

    return (
        <nav className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-4 shadow-md sticky top-0 z-50">
            <div className="container mx-auto flex justify-between items-center">
                <Link
                    to="/"
                    className="text-white text-2xl font-bold flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                    <Logo className="h-10 w-10" />
                    <span className="hidden sm:block">Smart Tutor</span>
                    <span className="sm:hidden">Tutor</span>
                </Link>

                <div className="hidden md:flex space-x-4 items-center">
                    <Link to="/" className={desktopLink}>Home</Link>
                    {!isLoggedIn && (
                        <Link to="/login" className={desktopLink}>Login/Signup</Link>
                    )}
                    {userType === 'child' && (
                        <Link to="/child-dashboard" className={`${pill} bg-blue-600 hover:bg-green-600`}>
                            Student Dashboard
                        </Link>
                    )}
                    {(userType === 'teacher' || userType === 'admin') && (
                        <Link to="/teacher-dashboard" className={`${pill} bg-orange-500 hover:bg-orange-600`}>
                            <BarChart3 className="w-4 h-4" />
                            Teacher Dashboard
                        </Link>
                    )}
                    {userType === 'admin' && (
                        <Link to="/admin-dashboard" className={`${pill} bg-black hover:bg-gray-800`}>
                            <Shield className="w-4 h-4" />
                            Admin
                        </Link>
                    )}
                    {isLoggedIn && (
                        <button type="button" onClick={handleLogout} className={`${pill} bg-white/20 hover:bg-white/30`}>
                            <LogOut className="w-4 h-4" />
                            Log out
                        </button>
                    )}
                </div>

                <button className="md:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                    {isMenuOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
                </button>
            </div>

            {isMenuOpen && (
                <div className="md:hidden mt-4 bg-white rounded-xl shadow-xl p-4 flex flex-col space-y-4">
                    <Link to="/" onClick={closeMenu} className="text-gray-800 text-lg font-medium border-b pb-2">
                        Home
                    </Link>
                    {!isLoggedIn && (
                        <Link to="/login" onClick={closeMenu} className="text-gray-800 text-lg font-medium border-b pb-2">
                            Login/Signup
                        </Link>
                    )}
                    {userType === 'child' && (
                        <Link to="/child-dashboard" onClick={closeMenu} className="text-center bg-blue-500 text-white py-2 rounded-lg font-bold">
                            Student Dashboard
                        </Link>
                    )}
                    {(userType === 'teacher' || userType === 'admin') && (
                        <Link to="/teacher-dashboard" onClick={closeMenu} className="flex justify-center items-center gap-2 bg-orange-500 text-white py-2 rounded-lg font-bold">
                            <BarChart3 className="w-5 h-5" />
                            Teacher Dashboard
                        </Link>
                    )}
                    {userType === 'admin' && (
                        <Link to="/admin-dashboard" onClick={closeMenu} className="flex justify-center items-center gap-2 bg-black text-white py-2 rounded-lg font-bold">
                            <Shield className="w-5 h-5" />
                            Admin Dashboard
                        </Link>
                    )}
                    {isLoggedIn && (
                        <button type="button" onClick={handleLogout} className="flex justify-center items-center gap-2 bg-gray-200 text-gray-800 py-2 rounded-lg font-bold">
                            <LogOut className="w-5 h-5" />
                            Log out
                        </button>
                    )}
                </div>
            )}
        </nav>
    );
};

export default Navbar;
