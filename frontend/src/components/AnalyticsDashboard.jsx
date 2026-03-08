import React, { useState } from 'react';
import OverviewTab from './analytics/OverviewTab';
import TagAnalysisTab from './analytics/TagAnalysisTab';
import ResponsesTab from './analytics/ResponsesTab';
import VotesTab from './analytics/VotesTab';
import ActionItemsTab from './analytics/ActionItemsTab';

export default function AnalyticsDashboard({ session }) {
    const [activeTab, setActiveTab] = useState('overview');

    const tabs = [
        { id: 'overview', label: '📊 Overview', component: OverviewTab },
        { id: 'tags', label: '🏷️ Tag Analysis', component: TagAnalysisTab },
        { id: 'responses', label: '💬 Responses', component: ResponsesTab },
        { id: 'votes', label: '🗳️ Votes', component: VotesTab },
        { id: 'actions', label: '✅ Action Items', component: ActionItemsTab },
    ];

    const ActiveComponent = tabs.find(t => t.id === activeTab)?.component || OverviewTab;

    return (
        <div className="w-full h-full flex flex-col bg-stone-900 text-stone-100">
            {/* Tab Navigation */}
            <div className="flex gap-2 p-4 border-b border-stone-700 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                            activeTab === tab.id
                                ? 'bg-amber-600 text-white'
                                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-auto p-6">
                <ActiveComponent session={session} />
            </div>
        </div>
    );
}
