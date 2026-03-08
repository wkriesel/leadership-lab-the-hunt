import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { groupResponsesByPrompt, countResponsesPerGroupByPrompt, getTagColor, getTagLabel, groupResponsesByGroup } from '../../utils/analyticsHelpers';

export default function ResponsesTab({ session }) {
    const [expandedGroup, setExpandedGroup] = useState(null);
    const responses = session.responses || [];
    const groupedByPrompt = groupResponsesByPrompt(responses);

    const prompts = [
        { id: 'like', label: '👍 Like', description: 'What they appreciated' },
        { id: 'wish', label: '💭 Wish', description: 'What they hoped for' },
        { id: 'wonder', label: '❓ Wonder', description: 'What they were curious about' },
    ];

    return (
        <div className="space-y-8 max-w-6xl">
            <h2 className="text-2xl font-bold text-stone-100">Responses by Prompt</h2>

            {prompts.map(prompt => {
                const promptResponses = groupedByPrompt[prompt.id] || [];
                const chartData = countResponsesPerGroupByPrompt(responses, prompt.id);
                const total = promptResponses.length;

                return (
                    <div key={prompt.id} className="bg-stone-800 rounded-lg p-6 border border-stone-700">
                        <div className="mb-4">
                            <h3 className="text-xl font-bold text-stone-100">{prompt.label}</h3>
                            <p className="text-stone-400 text-sm">{prompt.description}</p>
                            <p className="text-stone-400 mt-1">
                                <span className="font-bold text-amber-400">{total}</span> responses from{' '}
                                <span className="font-bold text-amber-400">{chartData.length}</span> groups
                            </p>
                        </div>

                        {total > 0 ? (
                            <>
                                {/* Chart */}
                                <div className="mb-6 bg-stone-900 rounded p-4">
                                    <ResponsiveContainer width="100%" height={250}>
                                        <BarChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#404854" />
                                            <XAxis dataKey="name" tick={{ fill: '#a8a29e' }} />
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
                                            <Bar dataKey="value" fill="#FFD700" name="Responses" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Responses by Group */}
                                <div className="space-y-3">
                                    {chartData.map(group => {
                                        const groupResponses = promptResponses.filter(r => r.groupName === group.name);
                                        const isExpanded = expandedGroup === `${prompt.id}-${group.name}`;

                                        return (
                                            <div key={`${prompt.id}-${group.name}`} className="bg-stone-700 rounded">
                                                <button
                                                    onClick={() =>
                                                        setExpandedGroup(
                                                            isExpanded ? null : `${prompt.id}-${group.name}`
                                                        )
                                                    }
                                                    className="w-full px-4 py-3 flex justify-between items-center hover:bg-stone-600 transition-colors"
                                                >
                                                    <span className="font-bold text-stone-100">
                                                        {group.name}
                                                        <span className="ml-3 text-amber-400">({group.value})</span>
                                                    </span>
                                                    <span className="text-stone-400">{isExpanded ? '▼' : '▶'}</span>
                                                </button>

                                                {isExpanded && (
                                                    <div className="px-4 py-3 border-t border-stone-600 space-y-2">
                                                        {groupResponses.map(resp => (
                                                            <div
                                                                key={resp.id}
                                                                className="bg-stone-800 p-3 rounded flex gap-3 items-start"
                                                            >
                                                                <div
                                                                    className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                                                                    style={{ backgroundColor: getTagColor(resp.tags) }}
                                                                ></div>
                                                                <div className="flex-1">
                                                                    <p className="text-stone-200">{resp.text}</p>
                                                                    <p className="text-xs text-stone-500 mt-1">
                                                                        Tag: <span className="font-mono">{getTagLabel(resp.tags)}</span>
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        ) : (
                            <p className="text-stone-400 italic text-center py-8">No responses yet</p>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
