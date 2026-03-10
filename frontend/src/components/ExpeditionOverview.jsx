import React, { useState, useEffect, useMemo } from 'react';
import { useSocket } from '../SocketContext';
import { ArrowLeft, FlaskConical, Calendar, BarChart2, MessageSquare, Vote, Lightbulb, Users, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const TAG_COLORS = { Technical: '#FFD700', Relational: '#06402B', Both: '#22c55e' };

export default function ExpeditionOverview({ onBack }) {
    const { listSessions, aggregateSessions } = useSocket();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState([]);
    const [realOnly, setRealOnly] = useState(true);
    const [aggregateData, setAggregateData] = useState(null);
    const [aggregating, setAggregating] = useState(false);

    useEffect(() => {
        loadAllSessions();
    }, []);

    const loadAllSessions = async () => {
        try {
            setLoading(true);
            const data = await listSessions(true);
            setSessions(data);
            // Auto-select all real sessions
            const realIds = data.filter(s => !s.isTest).map(s => s.id);
            setSelectedIds(realIds);
        } catch (err) {
            console.error('Failed to load sessions:', err);
        } finally {
            setLoading(false);
        }
    };

    const visibleSessions = realOnly ? sessions.filter(s => !s.isTest) : sessions;

    const toggleSession = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const selectAll = () => setSelectedIds(visibleSessions.map(s => s.id));
    const selectNone = () => setSelectedIds([]);

    const handleAnalyze = async () => {
        if (selectedIds.length === 0) return;
        setAggregating(true);
        try {
            const data = await aggregateSessions(selectedIds);
            setAggregateData(data);
        } catch (err) {
            console.error('Aggregation failed:', err);
        } finally {
            setAggregating(false);
        }
    };

    const handleExport = () => {
        if (!aggregateData) return;
        const blob = new Blob([JSON.stringify(aggregateData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Expedition-Overview-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-[#06402B] p-6 lg:p-10 relative">
            <div className="map-line absolute inset-0 opacity-5 pointer-events-none"></div>

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <button onClick={onBack} className="text-[#FFD700]/70 hover:text-[#FFD700] text-sm font-bold flex items-center gap-1 mb-3 transition-colors">
                            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                        </button>
                        <h1 className="text-3xl pixel-font text-[#FFD700] drop-shadow-md">Expedition Overview</h1>
                        <p className="text-[#F4E8D1]/70 mt-1 font-medium">Cross-workshop trends and insights</p>
                    </div>
                    {aggregateData && (
                        <button
                            onClick={handleExport}
                            className="bg-[#FFD700] text-[#06402B] font-bold px-5 py-3 rounded-lg shadow-[0_4px_0_#B8860B] active:shadow-none active:translate-y-1 transition-all flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" /> Export
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Session Selector Panel */}
                    <div className="lg:col-span-4 bg-[#134E4A] rounded-2xl p-5 shadow-xl border-2 border-[#06402B] max-h-[calc(100vh-200px)] flex flex-col">
                        <h2 className="text-lg pixel-font text-[#FFD700] mb-4">Select Expeditions</h2>

                        <div className="flex items-center justify-between mb-4">
                            <label className="flex items-center gap-2 cursor-pointer text-[#F4E8D1]/70 hover:text-[#F4E8D1] transition-colors">
                                <input
                                    type="checkbox"
                                    checked={realOnly}
                                    onChange={(e) => setRealOnly(e.target.checked)}
                                    className="w-4 h-4 rounded accent-amber-400"
                                />
                                <span className="text-xs font-bold">Real sessions only</span>
                            </label>
                            <div className="flex gap-2">
                                <button onClick={selectAll} className="text-[10px] font-bold text-[#FFD700]/70 hover:text-[#FFD700] transition-colors">All</button>
                                <span className="text-[#F4E8D1]/30">|</span>
                                <button onClick={selectNone} className="text-[10px] font-bold text-[#FFD700]/70 hover:text-[#FFD700] transition-colors">None</button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-4">
                            {loading ? (
                                <div className="text-center py-8 text-[#F4E8D1]/50">Loading...</div>
                            ) : visibleSessions.length === 0 ? (
                                <div className="text-center py-8 text-[#F4E8D1]/50">No sessions found</div>
                            ) : (
                                visibleSessions.map(s => (
                                    <label
                                        key={s.id}
                                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                                            selectedIds.includes(s.id) ? 'bg-[#06402B] border border-[#FFD700]/30' : 'bg-[#06402B]/30 hover:bg-[#06402B]/60'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(s.id)}
                                            onChange={() => toggleSession(s.id)}
                                            className="w-4 h-4 rounded accent-amber-400 shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-bold text-[#F4E8D1] truncate flex items-center gap-1.5">
                                                {s.title}
                                                {s.isTest && <FlaskConical className="w-3 h-3 text-amber-400 shrink-0" />}
                                            </div>
                                            <div className="text-[10px] text-[#F4E8D1]/40 mt-0.5">
                                                {formatDate(s.created_at)} · Phase {s.phase}
                                            </div>
                                        </div>
                                    </label>
                                ))
                            )}
                        </div>

                        <button
                            onClick={handleAnalyze}
                            disabled={selectedIds.length === 0 || aggregating}
                            className="w-full bg-[#FFD700] text-[#06402B] font-bold py-3 rounded-lg shadow-[0_4px_0_#B8860B] active:shadow-none active:translate-y-1 transition-all pixel-font text-xs disabled:opacity-50"
                        >
                            {aggregating ? 'Analyzing...' : `ANALYZE ${selectedIds.length} SESSION${selectedIds.length !== 1 ? 'S' : ''}`}
                        </button>
                    </div>

                    {/* Analytics Panel */}
                    <div className="lg:col-span-8">
                        {!aggregateData ? (
                            <div className="bg-[#134E4A] rounded-2xl p-12 shadow-xl border-2 border-[#06402B] text-center">
                                <BarChart2 className="w-16 h-16 text-[#FFD700]/30 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-[#F4E8D1]/50 mb-2">Select sessions and click Analyze</h3>
                                <p className="text-[#F4E8D1]/30">View aggregated trends across multiple workshops</p>
                            </div>
                        ) : (
                            <AggregatedResults data={aggregateData} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function AggregatedResults({ data }) {
    const tagCounts = useMemo(() => {
        const counts = { Technical: 0, Relational: 0, Both: 0 };
        data.responses.forEach(r => {
            if (r.tags.includes('both')) counts.Both++;
            else if (r.tags.includes('technical')) counts.Technical++;
            else if (r.tags.includes('relational')) counts.Relational++;
        });
        return Object.entries(counts)
            .filter(([, v]) => v > 0)
            .map(([name, value]) => ({ name, value, color: TAG_COLORS[name] }));
    }, [data.responses]);

    const responsesByPrompt = useMemo(() => {
        const counts = { like: 0, wish: 0, wonder: 0 };
        data.responses.forEach(r => {
            if (counts.hasOwnProperty(r.promptId)) counts[r.promptId]++;
        });
        return [
            { name: 'Like', value: counts.like },
            { name: 'Wish', value: counts.wish },
            { name: 'Wonder', value: counts.wonder },
        ];
    }, [data.responses]);

    const actionsByTag = useMemo(() => {
        const counts = { Technical: 0, Relational: 0, Both: 0 };
        data.nextSteps.forEach(n => {
            if (n.tags.includes('both')) counts.Both++;
            else if (n.tags.includes('technical')) counts.Technical++;
            else if (n.tags.includes('relational')) counts.Relational++;
        });
        return Object.entries(counts)
            .filter(([, v]) => v > 0)
            .map(([name, value]) => ({ name, value, fill: TAG_COLORS[name] }));
    }, [data.nextSteps]);

    const sessionComparison = useMemo(() => {
        return data.sessions.map(s => ({
            name: s.title.length > 20 ? s.title.slice(0, 20) + '...' : s.title,
            Responses: s.responses,
            Votes: s.votes,
            Actions: s.nextSteps,
            Groups: s.groups,
        }));
    }, [data.sessions]);

    return (
        <div className="space-y-6">
            {/* Top Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={Users} label="Total Groups" value={data.groups.length} />
                <StatCard icon={MessageSquare} label="Total Responses" value={data.responses.length} />
                <StatCard icon={Vote} label="Total Votes" value={data.votes.length} />
                <StatCard icon={Lightbulb} label="Action Items" value={data.nextSteps.length} />
            </div>

            {/* Session Breakdown Table */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#134E4A] rounded-2xl p-5 shadow-xl border-2 border-[#06402B]"
            >
                <h3 className="text-sm pixel-font text-[#FFD700] mb-4">Session Breakdown</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-[#F4E8D1]/50 text-left text-xs uppercase">
                                <th className="pb-2 pr-4">Session</th>
                                <th className="pb-2 pr-4 text-center">Groups</th>
                                <th className="pb-2 pr-4 text-center">Responses</th>
                                <th className="pb-2 pr-4 text-center">Votes</th>
                                <th className="pb-2 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-[#F4E8D1]">
                            {data.sessions.map(s => (
                                <tr key={s.id} className="border-t border-[#06402B]/50">
                                    <td className="py-2.5 pr-4 font-medium flex items-center gap-2">
                                        {s.title}
                                        {s.isTest && <FlaskConical className="w-3 h-3 text-amber-400" />}
                                    </td>
                                    <td className="py-2.5 pr-4 text-center">{s.groups}</td>
                                    <td className="py-2.5 pr-4 text-center">{s.responses}</td>
                                    <td className="py-2.5 pr-4 text-center">{s.votes}</td>
                                    <td className="py-2.5 text-center">{s.nextSteps}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tag Distribution Pie */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-[#134E4A] rounded-2xl p-5 shadow-xl border-2 border-[#06402B]"
                >
                    <h3 className="text-sm pixel-font text-[#FFD700] mb-4">Tag Distribution</h3>
                    {tagCounts.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie data={tagCounts} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                    {tagCounts.map((entry, i) => (
                                        <Cell key={i} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[220px] flex items-center justify-center text-[#F4E8D1]/30">No tagged responses</div>
                    )}
                </motion.div>

                {/* Responses by Prompt */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-[#134E4A] rounded-2xl p-5 shadow-xl border-2 border-[#06402B]"
                >
                    <h3 className="text-sm pixel-font text-[#FFD700] mb-4">Responses by Type</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={responsesByPrompt}>
                            <XAxis dataKey="name" tick={{ fill: '#F4E8D1', fontSize: 12 }} />
                            <YAxis tick={{ fill: '#F4E8D1', fontSize: 12 }} />
                            <Tooltip />
                            <Bar dataKey="value" fill="#FFD700" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>
            </div>

            {/* Session Comparison Bar Chart */}
            {sessionComparison.length > 1 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-[#134E4A] rounded-2xl p-5 shadow-xl border-2 border-[#06402B]"
                >
                    <h3 className="text-sm pixel-font text-[#FFD700] mb-4">Session Comparison</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={sessionComparison}>
                            <XAxis dataKey="name" tick={{ fill: '#F4E8D1', fontSize: 10 }} angle={-15} textAnchor="end" height={60} />
                            <YAxis tick={{ fill: '#F4E8D1', fontSize: 12 }} />
                            <Tooltip />
                            <Legend wrapperStyle={{ color: '#F4E8D1' }} />
                            <Bar dataKey="Responses" fill="#FFD700" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Votes" fill="#22c55e" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Actions" fill="#06402B" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>
            )}

            {/* Action Items by Tag */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-[#134E4A] rounded-2xl p-5 shadow-xl border-2 border-[#06402B]"
            >
                <h3 className="text-sm pixel-font text-[#FFD700] mb-4">Action Items by Focus ({data.nextSteps.length} total)</h3>
                {actionsByTag.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={actionsByTag} layout="vertical">
                            <XAxis type="number" tick={{ fill: '#F4E8D1', fontSize: 12 }} />
                            <YAxis type="category" dataKey="name" tick={{ fill: '#F4E8D1', fontSize: 12 }} width={90} />
                            <Tooltip />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                {actionsByTag.map((entry, i) => (
                                    <Cell key={i} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-[200px] flex items-center justify-center text-[#F4E8D1]/30">No action items yet</div>
                )}
            </motion.div>

            {/* Top Action Items List */}
            {data.nextSteps.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-[#134E4A] rounded-2xl p-5 shadow-xl border-2 border-[#06402B]"
                >
                    <h3 className="text-sm pixel-font text-[#FFD700] mb-4">All Action Items</h3>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                        {data.nextSteps.map(item => (
                            <div key={item.id} className="bg-[#06402B]/50 p-3 rounded-lg flex gap-3">
                                <div className={`w-1.5 rounded-full shrink-0 ${
                                    item.tags.includes('technical') ? 'bg-[#FFD700]' :
                                    item.tags.includes('relational') ? 'bg-[#06402B]' : 'bg-green-500'
                                }`} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-[#F4E8D1] text-sm font-medium">"{item.text}"</p>
                                    <div className="flex items-center gap-3 mt-1 text-[10px] text-[#F4E8D1]/40">
                                        <span>{item.groupName}</span>
                                        <span>{item.sessionTitle}</span>
                                        <span className="uppercase font-bold">{item.tags.join(', ')}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
}

function StatCard({ icon: Icon, label, value }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#134E4A] rounded-xl p-4 shadow-lg border border-[#06402B] text-center"
        >
            <Icon className="w-5 h-5 text-[#FFD700] mx-auto mb-2" />
            <div className="text-2xl font-bold text-[#F4E8D1] pixel-font">{value}</div>
            <div className="text-[10px] text-[#F4E8D1]/50 font-bold uppercase mt-1">{label}</div>
        </motion.div>
    );
}
