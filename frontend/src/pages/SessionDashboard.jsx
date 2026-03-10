import React, { useState, useEffect } from 'react';
import { useSocket } from '../SocketContext';
import { Plus, Play, LogOut, Calendar, Users, ChevronRight, FlaskConical, BarChart2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SessionDashboard({ onShowOverview }) {
    const { user, logout, createSession, listSessions, facilitatorJoinSession } = useSocket();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [creating, setCreating] = useState(false);
    const [isTest, setIsTest] = useState(false);
    const [showTestSessions, setShowTestSessions] = useState(false);

    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = async () => {
        try {
            setLoading(true);
            const data = await listSessions(true); // always fetch all, filter client-side
            setSessions(data);
        } catch (err) {
            console.error('Failed to load sessions:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredSessions = showTestSessions ? sessions : sessions.filter(s => !s.isTest);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newTitle.trim()) return;
        setCreating(true);

        try {
            const session = await createSession(newTitle.trim(), isTest);
            facilitatorJoinSession(session.id, session.code);
        } catch (err) {
            console.error('Failed to create session:', err);
        } finally {
            setCreating(false);
            setIsTest(false);
        }
    };

    const handleJoin = (session) => {
        facilitatorJoinSession(session.id, session.code);
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: 'numeric', minute: '2-digit'
        });
    };

    return (
        <div className="min-h-screen bg-[#06402B] p-6 lg:p-10 relative">
            <div className="map-line absolute inset-0 opacity-5 pointer-events-none"></div>

            <div className="max-w-4xl mx-auto relative z-10">
                {/* Header */}
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl pixel-font text-[#FFD700] drop-shadow-md">Expedition HQ</h1>
                        <p className="text-[#F4E8D1]/70 mt-2 font-medium">{user?.email}</p>
                    </div>
                    <button
                        onClick={logout}
                        className="bg-red-800/50 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-700 transition-colors flex items-center gap-2"
                    >
                        <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                </div>

                {/* Create Session */}
                {showCreate ? (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[#134E4A] p-6 rounded-2xl shadow-xl mb-8 border-2 border-[#FFD700]"
                    >
                        <h2 className="text-xl pixel-font text-[#FFD700] mb-4">New Expedition</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="flex gap-4">
                                <input
                                    type="text"
                                    placeholder="e.g. AI Policy Workshop - March 2026"
                                    className="flex-1 px-4 py-3 bg-[#F4E8D1] text-[#06402B] rounded font-semibold outline-none focus:ring-4 focus:ring-[#FFD700]"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    required
                                    autoFocus
                                />
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="bg-[#FFD700] text-[#06402B] font-bold px-6 py-3 rounded-lg shadow-[0_4px_0_#B8860B] active:shadow-none active:translate-y-1 transition-all pixel-font text-xs disabled:opacity-50"
                                >
                                    {creating ? '...' : 'CREATE'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCreate(false)}
                                    className="bg-black/20 text-white font-bold px-4 py-3 rounded-lg hover:bg-black/30 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                            <label className="flex items-center gap-3 cursor-pointer text-[#F4E8D1]/80 hover:text-[#F4E8D1] transition-colors">
                                <input
                                    type="checkbox"
                                    checked={isTest}
                                    onChange={(e) => setIsTest(e.target.checked)}
                                    className="w-5 h-5 rounded border-2 border-[#FFD700]/50 bg-transparent accent-[#FFD700]"
                                />
                                <FlaskConical className="w-4 h-4 text-amber-400" />
                                <span className="text-sm font-bold">Mark as test session</span>
                                <span className="text-xs opacity-60">(excluded from analytics by default)</span>
                            </label>
                        </form>
                    </motion.div>
                ) : (
                    <button
                        onClick={() => setShowCreate(true)}
                        className="w-full bg-[#FFD700] text-[#06402B] font-bold py-5 rounded-2xl shadow-[0_4px_0_#B8860B] hover:-translate-y-1 hover:shadow-[0_6px_0_#B8860B] active:translate-y-1 active:shadow-none transition-all pixel-font text-sm flex items-center justify-center gap-3 mb-8"
                    >
                        <Plus className="w-6 h-6" /> START NEW EXPEDITION
                    </button>
                )}

                {/* Expedition Overview Button */}
                {sessions.length > 0 && (
                    <button
                        onClick={onShowOverview}
                        className="w-full bg-[#134E4A] hover:bg-[#134E4A]/80 text-[#F4E8D1] font-bold py-4 rounded-2xl shadow-lg border-2 border-[#FFD700]/30 hover:border-[#FFD700] transition-all flex items-center justify-center gap-3 mb-8"
                    >
                        <BarChart2 className="w-5 h-5 text-[#FFD700]" />
                        <span className="pixel-font text-xs">EXPEDITION OVERVIEW</span>
                        <span className="text-xs opacity-60">Cross-workshop trends</span>
                    </button>
                )}

                {/* Sessions List */}
                <div className="bg-[#134E4A] rounded-2xl p-6 shadow-xl border-2 border-[#06402B]">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl pixel-font text-[#FFD700]">Past Expeditions</h2>
                        <label className="flex items-center gap-2 cursor-pointer text-[#F4E8D1]/60 hover:text-[#F4E8D1] transition-colors">
                            <input
                                type="checkbox"
                                checked={showTestSessions}
                                onChange={(e) => setShowTestSessions(e.target.checked)}
                                className="w-4 h-4 rounded accent-amber-400"
                            />
                            <FlaskConical className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold">Show test sessions</span>
                        </label>
                    </div>

                    {loading ? (
                        <div className="text-center py-12 text-[#F4E8D1]/50 font-medium">Loading...</div>
                    ) : filteredSessions.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-[#F4E8D1]/50 font-medium text-lg">No expeditions yet.</p>
                            <p className="text-[#F4E8D1]/30 mt-2">Create your first one above!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredSessions.map((s, i) => (
                                <motion.button
                                    key={s.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    onClick={() => handleJoin(s)}
                                    className="w-full bg-[#06402B] hover:bg-[#06402B]/80 p-5 rounded-xl shadow-md flex items-center justify-between group transition-all hover:translate-x-1 text-left"
                                >
                                    <div className="flex-1">
                                        <h3 className="font-bold text-[#F4E8D1] text-lg flex items-center gap-2">
                                            {s.title}
                                            {s.isTest && (
                                                <span className="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1">
                                                    <FlaskConical className="w-3 h-3" /> TEST
                                                </span>
                                            )}
                                        </h3>
                                        <div className="flex items-center gap-4 mt-2 text-sm text-[#F4E8D1]/50">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {formatDate(s.created_at)}
                                            </span>
                                            <span className="bg-[#FFD700]/20 text-[#FFD700] px-2 py-0.5 rounded font-bold text-xs">
                                                {s.code}
                                            </span>
                                            <span className="bg-white/10 px-2 py-0.5 rounded text-xs font-bold">
                                                Phase {s.phase}
                                            </span>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-6 h-6 text-[#FFD700] opacity-0 group-hover:opacity-100 transition-opacity" />
                                </motion.button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
