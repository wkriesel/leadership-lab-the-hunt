import React from 'react';
import { getSessionStats, generateTimelineEvents, aggregateTagCounts } from '../../utils/analyticsHelpers';

export default function OverviewTab({ session }) {
    const stats = getSessionStats(session);
    const tagCounts = aggregateTagCounts(session.responses || []);
    const events = generateTimelineEvents(session);

    const phaseNames = {
        1: '🏛️ Temple Gate (Like/Wish/Wonder)',
        2: '🟢 Green Line (Tagging)',
        3: '📚 Lost Library (Scenarios)',
        4: '💎 Treasury (Action Items)',
    };

    return (
        <div className="space-y-8 max-w-6xl">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold text-stone-100 mb-2">Session Analytics Overview</h2>
                <p className="text-stone-400">Session Code: <span className="font-mono text-amber-400 font-bold">{session.code}</span></p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Participant Groups"
                    value={stats.totalGroups}
                    icon="👥"
                    color="bg-blue-900"
                />
                <StatCard
                    label="Responses Submitted"
                    value={stats.totalResponses}
                    icon="💬"
                    color="bg-purple-900"
                />
                <StatCard
                    label="Votes Cast"
                    value={stats.totalVotes}
                    icon="🗳️"
                    color="bg-green-900"
                />
                <StatCard
                    label="Action Items"
                    value={stats.totalActionItems}
                    icon="✅"
                    color="bg-amber-900"
                />
            </div>

            {/* Tag Distribution Summary */}
            <div className="bg-stone-800 rounded-lg p-6 border border-stone-700">
                <h3 className="text-xl font-bold text-stone-100 mb-4">Response Tags Summary</h3>
                <div className="grid grid-cols-3 gap-4">
                    <TagSummary
                        label="Technical"
                        count={tagCounts.technical}
                        total={stats.totalResponses}
                        color="#FFD700"
                        description="Tools, automation, workflows"
                    />
                    <TagSummary
                        label="Relational"
                        count={tagCounts.relational}
                        total={stats.totalResponses}
                        color="#06402B"
                        description="Trust, culture, adoption"
                    />
                    <TagSummary
                        label="Both"
                        count={tagCounts.both}
                        total={stats.totalResponses}
                        color="#22c55e"
                        description="Hybrid technical + relational"
                    />
                </div>
            </div>

            {/* Current Phase */}
            <div className="bg-stone-800 rounded-lg p-6 border border-stone-700">
                <h3 className="text-xl font-bold text-stone-100 mb-3">Current Phase</h3>
                <p className="text-lg text-amber-400 font-semibold">{phaseNames[stats.currentPhase]}</p>
            </div>

            {/* Timeline */}
            <div className="bg-stone-800 rounded-lg p-6 border border-stone-700">
                <h3 className="text-xl font-bold text-stone-100 mb-4">Session Timeline</h3>
                {events.length > 0 ? (
                    <div className="space-y-3">
                        {events.map((event, idx) => (
                            <div key={idx} className="flex items-start gap-3 pb-3 border-b border-stone-700 last:border-b-0">
                                <div className="text-stone-400 text-sm min-w-24">{event.time.toLocaleTimeString()}</div>
                                <div className="flex-1">
                                    <p className="text-stone-100 font-medium">{event.label}</p>
                                    <p className="text-stone-500 text-sm">Phase {event.phase}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-stone-400 italic">No events yet</p>
                )}
            </div>
        </div>
    );
}

function StatCard({ label, value, icon, color }) {
    return (
        <div className={`${color} rounded-lg p-6 text-white border border-stone-600`}>
            <div className="text-3xl mb-2">{icon}</div>
            <div className="text-2xl font-bold mb-1">{value}</div>
            <div className="text-sm opacity-90">{label}</div>
        </div>
    );
}

function TagSummary({ label, count, total, color, description }) {
    const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;

    return (
        <div className="bg-stone-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
                <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: color }}
                ></div>
                <h4 className="font-bold text-stone-100">{label}</h4>
            </div>
            <p className="text-2xl font-bold text-stone-200 mb-1">{count}</p>
            <p className="text-sm text-stone-400 mb-2">{percentage}% of responses</p>
            <p className="text-xs text-stone-500">{description}</p>
        </div>
    );
}
