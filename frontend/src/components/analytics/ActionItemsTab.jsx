import React, { useState } from 'react';
import { getActionItemsByTag, getTagColor, getTagLabel } from '../../utils/analyticsHelpers';

export default function ActionItemsTab({ session }) {
    const [activeTag, setActiveTag] = useState('all');
    const nextSteps = session.nextSteps || [];
    const filteredItems = getActionItemsByTag(nextSteps, activeTag);

    const tagCounts = {
        all: nextSteps.length,
        technical: nextSteps.filter(item => item.tags?.includes('technical')).length,
        relational: nextSteps.filter(item => item.tags?.includes('relational')).length,
        both: nextSteps.filter(item => item.tags?.includes('both')).length,
    };

    const tags = [
        { id: 'all', label: 'All Items', count: tagCounts.all, color: '#a8a29e' },
        { id: 'technical', label: 'Technical', count: tagCounts.technical, color: '#FFD700' },
        { id: 'relational', label: 'Relational', count: tagCounts.relational, color: '#06402B' },
        { id: 'both', label: 'Both', count: tagCounts.both, color: '#22c55e' },
    ];

    return (
        <div className="space-y-8 max-w-4xl">
            <h2 className="text-2xl font-bold text-stone-100">Committed Action Items</h2>

            {nextSteps.length === 0 ? (
                <div className="bg-stone-800 rounded-lg p-12 border border-stone-700 text-center">
                    <p className="text-stone-400 text-lg">No action items committed yet. Groups will commit when Phase 4 begins.</p>
                </div>
            ) : (
                <>
                    {/* Filter Buttons */}
                    <div className="flex flex-wrap gap-3">
                        {tags.map(tag => (
                            <button
                                key={tag.id}
                                onClick={() => setActiveTag(tag.id)}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                                    activeTag === tag.id
                                        ? 'bg-amber-600 text-white'
                                        : 'bg-stone-700 text-stone-300 hover:bg-stone-600'
                                }`}
                            >
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: tag.color }}
                                ></div>
                                {tag.label}
                                <span className="ml-1 text-sm font-bold">({tag.count})</span>
                            </button>
                        ))}
                    </div>

                    {/* Action Items List */}
                    <div className="space-y-4">
                        {filteredItems.length > 0 ? (
                            filteredItems.map((item, idx) => (
                                <div
                                    key={item.id || idx}
                                    className="bg-stone-800 rounded-lg p-4 border-l-4"
                                    style={{ borderLeftColor: getTagColor(item.tags) }}
                                >
                                    <div className="flex gap-3">
                                        {/* Tag Indicator */}
                                        <div className="flex-shrink-0 pt-1">
                                            <div
                                                className="w-4 h-4 rounded-full"
                                                style={{ backgroundColor: getTagColor(item.tags) }}
                                            ></div>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1">
                                            <p className="text-stone-100 leading-relaxed">{item.text}</p>
                                            <div className="mt-3 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs bg-stone-700 text-stone-300 px-2 py-1 rounded">
                                                        {item.groupName}
                                                    </span>
                                                    <span
                                                        className="text-xs px-2 py-1 rounded font-medium text-white"
                                                        style={{ backgroundColor: getTagColor(item.tags) }}
                                                    >
                                                        {getTagLabel(item.tags)}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-stone-500">
                                                    {new Date(item.created_at).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-stone-800 rounded-lg p-8 text-center border border-stone-700">
                                <p className="text-stone-400">No action items in this category yet</p>
                            </div>
                        )}
                    </div>

                    {/* Export Summary */}
                    <div className="bg-gradient-to-r from-stone-800 to-stone-700 rounded-lg p-6 border border-stone-600">
                        <h3 className="text-lg font-bold text-stone-100 mb-3">📋 Export Ready</h3>
                        <p className="text-stone-300 mb-4">
                            This session has generated <span className="font-bold text-amber-400">{nextSteps.length}</span> committed action items
                            that can be used for leadership reporting and follow-up.
                        </p>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <div className="bg-stone-900 rounded p-3">
                                <p className="text-stone-500">Technical Focus</p>
                                <p className="text-2xl font-bold text-amber-400">{tagCounts.technical}</p>
                            </div>
                            <div className="bg-stone-900 rounded p-3">
                                <p className="text-stone-500">Relational Focus</p>
                                <p className="text-2xl font-bold" style={{ color: '#06402B' }}>
                                    {tagCounts.relational}
                                </p>
                            </div>
                            <div className="bg-stone-900 rounded p-3">
                                <p className="text-stone-500">Hybrid Approach</p>
                                <p className="text-2xl font-bold text-green-400">{tagCounts.both}</p>
                            </div>
                        </div>
                        <p className="text-stone-400 text-sm mt-4 italic">
                            Use the Export Session feature to download all session data for detailed reports and tracking.
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}
