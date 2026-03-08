import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { getVoteCounts, getVotesByGroup } from '../../utils/analyticsHelpers';

// Scenario data - matches scenarios.js
const SCENARIOS = [
    { id: 0, title: 'Email Template System', correctAnswer: 'A' },
    { id: 1, title: 'Meeting Note Summarization', correctAnswer: 'B' },
    { id: 2, title: 'Customer Data Analysis', correctAnswer: 'C' },
    { id: 3, title: 'Code Review Assistant', correctAnswer: 'D' },
    { id: 4, title: 'Scheduling System', correctAnswer: 'B' },
    { id: 5, title: 'Report Generation', correctAnswer: 'A' },
];

export default function VotesTab({ session }) {
    const votes = session.votes || [];
    const votesByGroup = getVotesByGroup(votes);
    const voteCounts = getVoteCounts(votes);

    const total = Object.values(voteCounts).reduce((sum, val) => sum + val, 0);
    const activeScenario = SCENARIOS.find(s => s.id === session.activeScenario);
    const correctAnswer = activeScenario?.correctAnswer || null;

    // Prepare chart data
    const chartData = ['A', 'B', 'C', 'D', 'E'].map(answer => ({
        answer,
        votes: voteCounts[answer] || 0,
        percentage: total > 0 ? ((voteCounts[answer] || 0) / total * 100).toFixed(1) : 0,
    }));

    return (
        <div className="space-y-8 max-w-6xl">
            <h2 className="text-2xl font-bold text-stone-100">Voting Analysis</h2>

            {votes.length === 0 ? (
                <div className="bg-stone-800 rounded-lg p-12 border border-stone-700 text-center">
                    <p className="text-stone-400 text-lg">No votes submitted yet. Groups will vote when Phase 3 begins.</p>
                </div>
            ) : (
                <>
                    {/* Active Scenario Info */}
                    {activeScenario && (
                        <div className="bg-blue-900/50 rounded-lg p-6 border border-blue-700">
                            <h3 className="text-lg font-bold text-blue-100 mb-2">{activeScenario.title}</h3>
                            {correctAnswer && (
                                <p className="text-blue-200">
                                    Correct answer: <span className="font-bold text-amber-400">{correctAnswer}</span>
                                </p>
                            )}
                        </div>
                    )}

                    {/* Vote Distribution Chart */}
                    <div className="bg-stone-800 rounded-lg p-6 border border-stone-700">
                        <h3 className="text-xl font-bold text-stone-100 mb-4">Vote Distribution</h3>
                        <p className="text-stone-400 mb-4">
                            Total votes: <span className="font-bold text-amber-400">{total}</span>
                        </p>

                        {total > 0 ? (
                            <div className="bg-stone-900 rounded p-4">
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#404854" />
                                        <XAxis dataKey="answer" tick={{ fill: '#a8a29e' }} />
                                        <YAxis tick={{ fill: '#a8a29e' }} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#1c1917',
                                                border: '1px solid #292524',
                                                borderRadius: '8px',
                                            }}
                                            cursor={{ fill: 'rgba(255, 215, 0, 0.1)' }}
                                        />
                                        <Legend />
                                        <Bar dataKey="votes" fill="#FFD700" name="Votes" radius={[8, 8, 0, 0]}>
                                            {chartData.map((entry, index) => {
                                                const isCorrect = correctAnswer && entry.answer === correctAnswer;
                                                return (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={isCorrect ? '#22c55e' : '#FFD700'}
                                                    />
                                                );
                                            })}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : null}

                        {/* Vote Breakdown */}
                        <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-3">
                            {chartData.map(item => (
                                <div
                                    key={item.answer}
                                    className={`rounded p-3 text-center ${
                                        correctAnswer === item.answer
                                            ? 'bg-green-900/50 border border-green-600'
                                            : 'bg-stone-700'
                                    }`}
                                >
                                    <p className="text-2xl font-bold text-stone-100 mb-1">
                                        {item.answer}
                                        {correctAnswer === item.answer && ' ✓'}
                                    </p>
                                    <p className="text-sm text-stone-300">{item.votes} votes</p>
                                    <p className="text-xs text-stone-400">{item.percentage}%</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Group Votes Table */}
                    {Object.keys(votesByGroup).length > 0 && (
                        <div className="bg-stone-800 rounded-lg p-6 border border-stone-700">
                            <h3 className="text-xl font-bold text-stone-100 mb-4">Votes by Group</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="border-b border-stone-700">
                                        <tr>
                                            <th className="text-left py-2 px-3 text-stone-300 font-bold">Group</th>
                                            <th className="text-center py-2 px-3 text-stone-300 font-bold">Vote</th>
                                            <th className="text-center py-2 px-3 text-stone-300 font-bold">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(votesByGroup).map(([groupName, groupVotes], idx) => (
                                            <tr key={idx} className="border-b border-stone-700 hover:bg-stone-700/50">
                                                <td className="py-3 px-3 text-stone-200 font-medium">{groupName}</td>
                                                <td className="py-3 px-3 text-center">
                                                    <span className="inline-block bg-amber-600 text-white px-3 py-1 rounded font-bold">
                                                        {groupVotes[0]}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3 text-center">
                                                    {correctAnswer === groupVotes[0] ? (
                                                        <span className="text-green-400 font-bold">✓ Correct</span>
                                                    ) : (
                                                        <span className="text-red-400">✗ Incorrect</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
