/**
 * Analytics data processing utilities
 * Transforms session state into aggregated analytics data
 */

export const aggregateTagCounts = (responses) => {
    if (!responses || responses.length === 0) {
        return { technical: 0, relational: 0, both: 0, untagged: 0 };
    }

    const counts = { technical: 0, relational: 0, both: 0, untagged: 0 };

    responses.forEach(response => {
        if (!response.tags || response.tags.length === 0) {
            counts.untagged++;
        } else if (response.tags.includes('both')) {
            counts.both++;
        } else if (response.tags.includes('technical')) {
            counts.technical++;
        } else if (response.tags.includes('relational')) {
            counts.relational++;
        }
    });

    return counts;
};

export const groupResponsesByPrompt = (responses) => {
    if (!responses) return { like: [], wish: [], wonder: [] };

    return {
        like: responses.filter(r => r.promptId === 'like'),
        wish: responses.filter(r => r.promptId === 'wish'),
        wonder: responses.filter(r => r.promptId === 'wonder'),
    };
};

export const groupResponsesByGroup = (responses) => {
    if (!responses) return {};

    const grouped = {};
    responses.forEach(response => {
        if (!grouped[response.groupName]) {
            grouped[response.groupName] = [];
        }
        grouped[response.groupName].push(response);
    });

    return grouped;
};

export const countResponsesPerGroupByPrompt = (responses, prompt) => {
    const byGroup = {};

    responses
        .filter(r => r.promptId === prompt)
        .forEach(r => {
            byGroup[r.groupName] = (byGroup[r.groupName] || 0) + 1;
        });

    return Object.entries(byGroup).map(([name, count]) => ({
        name,
        value: count,
    }));
};

export const getVoteCounts = (votes) => {
    if (!votes || votes.length === 0) {
        return { A: 0, B: 0, C: 0, D: 0, E: 0 };
    }

    const counts = { A: 0, B: 0, C: 0, D: 0, E: 0 };

    votes.forEach(vote => {
        if (vote.answer && counts.hasOwnProperty(vote.answer)) {
            counts[vote.answer]++;
        }
    });

    return counts;
};

export const getVotesByGroup = (votes) => {
    if (!votes) return {};

    const grouped = {};
    votes.forEach(vote => {
        if (!grouped[vote.groupName]) {
            grouped[vote.groupName] = [];
        }
        grouped[vote.groupName].push(vote.answer);
    });

    return grouped;
};

export const formatTagDistribution = (tagCounts) => {
    const total = Object.values(tagCounts).reduce((sum, val) => sum + val, 0);
    if (total === 0) return [];

    return [
        {
            name: 'Technical',
            value: tagCounts.technical,
            percentage: ((tagCounts.technical / total) * 100).toFixed(1),
            color: '#FFD700',
        },
        {
            name: 'Relational',
            value: tagCounts.relational,
            percentage: ((tagCounts.relational / total) * 100).toFixed(1),
            color: '#06402B',
        },
        {
            name: 'Both',
            value: tagCounts.both,
            percentage: ((tagCounts.both / total) * 100).toFixed(1),
            color: '#22c55e',
        },
    ].filter(item => item.value > 0);
};

export const getResponsesWithTags = (responses, prompt) => {
    return responses
        .filter(r => r.promptId === prompt)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
};

export const getTagColor = (tags) => {
    if (!tags || tags.length === 0) return 'gray';
    if (tags.includes('both')) return '#22c55e';
    if (tags.includes('technical')) return '#FFD700';
    if (tags.includes('relational')) return '#06402B';
    return 'gray';
};

export const getTagLabel = (tags) => {
    if (!tags || tags.length === 0) return 'Untagged';
    if (tags.includes('both')) return 'Both';
    if (tags.includes('technical')) return 'Technical';
    if (tags.includes('relational')) return 'Relational';
    return 'Untagged';
};

export const getActionItemsByTag = (nextSteps, tag = null) => {
    if (!nextSteps) return [];

    if (!tag || tag === 'all') {
        return nextSteps.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    return nextSteps
        .filter(item => item.tags && item.tags.includes(tag))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
};

export const generateTimelineEvents = (session) => {
    const events = [];

    if (session.created_at) {
        events.push({
            time: new Date(session.created_at),
            label: 'Session Created',
            phase: 1,
        });
    }

    if (session.responses && session.responses.length > 0) {
        const responsesByPhase = {
            1: session.responses.filter(r => r.promptId !== undefined).length,
        };

        if (responsesByPhase[1] > 0) {
            events.push({
                time: new Date(session.responses[0].created_at),
                label: `${responsesByPhase[1]} responses submitted`,
                phase: 1,
            });
        }
    }

    if (session.votes && session.votes.length > 0) {
        events.push({
            time: new Date(session.votes[0].created_at),
            label: `${session.votes.length} votes submitted`,
            phase: 3,
        });
    }

    if (session.nextSteps && session.nextSteps.length > 0) {
        events.push({
            time: new Date(session.nextSteps[0].created_at),
            label: `${session.nextSteps.length} action items committed`,
            phase: 4,
        });
    }

    return events.sort((a, b) => a.time - b.time);
};

export const getSessionStats = (session) => {
    return {
        totalGroups: session.groups?.length || 0,
        totalResponses: session.responses?.length || 0,
        totalVotes: session.votes?.length || 0,
        totalActionItems: session.nextSteps?.length || 0,
        currentPhase: session.phase || 1,
    };
};
