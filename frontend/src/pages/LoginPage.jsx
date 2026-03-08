import React, { useState } from 'react';
import { useSocket } from '../SocketContext';
import { Compass, LogIn, UserPlus, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPage() {
    const { login, register } = useSocket();
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isRegister) {
                await register(email, password);
            } else {
                await login(email, password);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 relative overflow-hidden bg-[#06402B]">
            <div className="map-line absolute inset-0 opacity-5 pointer-events-none"></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#134E4A] p-8 rounded-2xl shadow-[8px_8px_0px_#000] max-w-md w-full text-[#F4E8D1] z-10 border-4 border-[#FFD700]"
            >
                <div className="flex items-center justify-center mb-6">
                    <Compass className="w-16 h-16 text-[#FFD700] drop-shadow-md" />
                </div>

                <h1 className="text-2xl text-center pixel-font mb-2 text-[#FFD700]">
                    Expedition Control
                </h1>
                <p className="text-center mb-8 font-medium opacity-80">
                    {isRegister ? 'Create your facilitator account' : 'Sign in to manage workshops'}
                </p>

                {error && (
                    <div className="bg-red-900/40 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 shrink-0" />
                        <span className="text-sm font-medium">{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs uppercase font-bold mb-2 text-[#FFD700] opacity-80">Email</label>
                        <input
                            type="email"
                            placeholder="facilitator@ocde.us"
                            className="w-full px-4 py-3 bg-[#F4E8D1] text-[#06402B] rounded shadow-inner font-semibold text-lg outline-none focus:ring-4 focus:ring-[#FFD700]"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs uppercase font-bold mb-2 text-[#FFD700] opacity-80">Password</label>
                        <input
                            type="password"
                            placeholder="Enter password"
                            className="w-full px-4 py-3 bg-[#F4E8D1] text-[#06402B] rounded shadow-inner font-semibold text-lg outline-none focus:ring-4 focus:ring-[#FFD700]"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#FFD700] text-[#06402B] font-bold py-4 rounded-lg shadow-[0_4px_0_#B8860B] active:shadow-none active:translate-y-1 transition-all pixel-font text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? (
                            'Loading...'
                        ) : isRegister ? (
                            <><UserPlus className="w-5 h-5" /> CREATE ACCOUNT</>
                        ) : (
                            <><LogIn className="w-5 h-5" /> SIGN IN</>
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => { setIsRegister(!isRegister); setError(''); }}
                        className="text-sm font-medium text-[#FFD700]/70 hover:text-[#FFD700] transition-colors underline underline-offset-4"
                    >
                        {isRegister ? 'Already have an account? Sign in' : 'Need an account? Register'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
