import React from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { formatTagDistribution, aggregateTagCounts } from '../../utils/analyticsHelpers';

export default function TagAnalysisTab({ session }) {
    const responseTags = aggregateTagCounts(session.responses || []);
    const actionTags = aggregateTagCounts(session.nextSteps || []);

    const responseData = formatTagDistribution(responseTags);
    const actionData = formatTagDistribution(actionTags);

    const totalResponses = session.responses?.length || 0;
    const totalActions = session.nextSteps?.length || 0;

    // Generate insights
    const getInsight = (data, type) => {
        if (data.length === 0) return 'No data to analyze yet.';

        const dominant = data[0];
        const percentage = dominant.percentage;

        if (type === 'responses') {
            if (dominant.name === 'Technical') {
                return `Groups are primarily focused on ${percentage}% on technical concerns like tools, automation, and workflows.`;
            } else if (dominant.name === 'Relational') {
                return `Groups are primarily focused on ${percentage}% on relational barriers like team readiness and adoption.`;
            } else {
                return `Groups are primarily focused on ${percentage}% on hybrid concerns combining both technical and relational aspects.`;
            }
        } else {
            if (dominant.name === 'Technical') {
                return `${percentage}% of action items focus on technical implementation and tooling.`;
            } else if (dominant.name === 'Relational') {
                return `${percentage}% of action items focus on relational and cultural change.`;
            } else {
                return `${percentage}% of action items combine both technical and relational strategies.`;
            }
        }
    };

    const COLORS = {
        'Technical': '#FFD700',
        'Relational': '#06402B',
        'Both': '#22c55e',
    };

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-stone-900 p-2 rounded border border-stone-700">
                    <p className="text-stone-100 font-bold">{data.name}</p>
                    <p className="text-stone-300">{data.value} items ({data.percentage}%)</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-8 max-w-6xl">
            {/* Responses Tag Analysis */}
            <div className="bg-stone-800 rounded-lg p-6 border border-stone-700">
                <h3 className="text-2xl font-bold text-stone-100 mb-4">
                    📝 Response Tags ({totalResponses} responses)
                </h3>

                {totalResponses > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="flex justify-center items-center">
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={responseData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percentage }) => `${name} ${percentage}%`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {responseData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="flex flex-col justify-center">
                            <div className="space-y-4">
                                {responseData.map(tag => (
                                    <div key={tag.name} className="bg-stone-700 rounded p-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div
                                                className="w-4 h-4 rounded-full"
                                                style={{ backgroundColor: tag.color }}
                                            ></div>
                                            <span className="font-bold text-stone-100">{tag.name}</span>
                                        </div>
                                        <p className="text-2xl font-bold text-stone-200">
                                            {tag.value} <span className="text-sm text-stone-400">({tag.percentage}%)</span>
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <p className="text-stone-400 italic text-center py-8">No responses yet</p>
                )}

                <div className="mt-6 p-4 bg-stone-900 rounded border border-stone-600">
                    <p className="text-stone-300">
                        <span className="font-bold text-amber-400">💡 Insight: </span>
                        {getInsight(responseData, 'responses')}
                    </p>
                </div>
            </div>

            {/* Action Items Tag Analysis */}
            <div className="bg-stone-800 rounded-lg p-6 border border-stone-700">
                <h3 className="text-2xl font-bold text-stone-100 mb-4">
                    ✅ Action Item Tags ({totalActions} items)
                </h3>

                {totalActions > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="flex justify-center items-center">
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={actionData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percentage }) => `${name} ${percentage}%`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {actionData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="flex flex-col justify-center">
                            <div className="space-y-4">
                                {actionData.map(tag => (
                                    <div key={tag.name} className="bg-stone-700 rounded p-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div
                                                className="w-4 h-4 rounded-full"
                                                style={{ backgroundColor: tag.color }}
                                            ></div>
                                            <span className="font-bold text-stone-100">{tag.name}</span>
                                        </div>
                                        <p className="text-2xl font-bold text-stone-200">
                                            {tag.value} <span className="text-sm text-stone-400">({tag.percentage}%)</span>
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <p className="text-stone-400 italic text-center py-8">No action items yet</p>
                )}

                <div className="mt-6 p-4 bg-stone-900 rounded border border-stone-600">
                    <p className="text-stone-300">
                        <span className="font-bold text-amber-400">💡 Insight: </span>
                        {getInsight(actionData, 'actions')}
                    </p>
                </div>
            </div>
        </div>
    );
}
