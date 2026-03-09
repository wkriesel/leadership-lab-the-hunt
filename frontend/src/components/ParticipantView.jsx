import React, { useState, useEffect, useMemo } from 'react';
import { useSocket } from '../SocketContext';
import { Compass, CheckCircle2, ChevronRight, Send, AlertTriangle, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SCENARIOS } from '../scenarios';
import { useSoundEffects } from '../hooks/useSoundEffects';

export default function ParticipantView() {
    const { socket, session, participantJoinSession } = useSocket();
    const { playJoin, playResponse, playVine, playDamage, playTreasure } = useSoundEffects();
    const [sessionCode, setSessionCode] = useState('');
    const [groupName, setGroupName] = useState('');
    const [joined, setJoined] = useState(false);
    const [joinError, setJoinError] = useState('');

    const [responses, setResponses] = useState({
        like: '',
        wish: '',
        wonder: ''
    });
    const [submittedPrompts, setSubmittedPrompts] = useState({
        like: false,
        wish: false,
        wonder: false
    });

    useEffect(() => {
        // Rehydrate from local storage if available
        const savedCode = localStorage.getItem('explorerSessionCode');
        const savedName = localStorage.getItem('explorerGroupName');
        if (savedCode && savedName) {
            setSessionCode(savedCode);
            setGroupName(savedName);
            setJoined(true);
            participantJoinSession(savedCode, savedName);
        }
    }, []);

    useEffect(() => {
        socket.on('error', (data) => {
            setJoinError(data.message);
            setJoined(false);
        });
        return () => socket.off('error');
    }, [socket]);

    const handleJoin = (e) => {
        e.preventDefault();
        setJoinError('');
        if (sessionCode.trim() && groupName.trim()) {
            localStorage.setItem('explorerSessionCode', sessionCode.trim().toUpperCase());
            localStorage.setItem('explorerGroupName', groupName.trim());
            participantJoinSession(sessionCode.trim().toUpperCase(), groupName.trim());
            setJoined(true);
            playJoin();
        }
    };

    const handlePromptSubmit = (promptId) => {
        if (responses[promptId].trim()) {
            socket.emit('submitResponse', {
                promptId,
                text: responses[promptId]
            });
            setSubmittedPrompts(prev => ({ ...prev, [promptId]: true }));
            playResponse();
        }
    };

    // Tagging
    const handleTag = (id, tag) => {
        socket.emit('tagResponse', { id, tags: [tag] });
        playResponse();
    };

    // Phase 3 Scenario Response
    const [openEndedResponse, setOpenEndedResponse] = useState('');

    const handleVote = (answer) => {
        socket.emit('submitVote', { answer });
        playResponse();
    };

    const handleOpenEndedSubmit = () => {
        if (openEndedResponse.trim()) {
            socket.emit('submitVote', { answer: openEndedResponse.trim() });
            playResponse();
        }
    };

    // Phase 4
    const [nextStep, setNextStep] = useState('');
    const [nextStepTag, setNextStepTag] = useState('technical');
    const [submittedSteps, setSubmittedSteps] = useState(0);

    const handleSubmitStep = () => {
        if (nextStep.trim()) {
            socket.emit('submitNextStep', { text: nextStep, tags: [nextStepTag] });
            setNextStep('');
            setSubmittedSteps(prev => prev + 1);
            playTreasure();
        }
    };

    // Resolve scenario from ID
    const activeScenario = useMemo(() => {
        if (!session.activeScenario) return null;
        return SCENARIOS.find(s => s.id === session.activeScenario) || null;
    }, [session.activeScenario]);

    if (!joined) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6 relative overflow-hidden bg-[#F4E8D1]">
                <div className="map-line absolute inset-0 opacity-20 pointer-events-none"></div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#134E4A] p-8 rounded-2xl shadow-[8px_8px_0px_#06402B] max-w-md w-full text-[#F4E8D1] z-10"
                >
                    <div className="flex items-center justify-center mb-6">
                        <Compass className="w-16 h-16 text-[#FFD700] drop-shadow-md" />
                    </div>
                    <h1 className="text-3xl text-center pixel-font mb-4 text-[#FFD700]">Enter the Temple</h1>
                    <p className="text-center mb-8 font-medium">Enter the session code from your facilitator, then your group name.</p>

                    {joinError && (
                        <div className="bg-red-900/40 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 shrink-0" />
                            <span className="text-sm font-medium">{joinError}</span>
                        </div>
                    )}

                    <form onSubmit={handleJoin} className="space-y-4">
                        <div>
                            <label className="block text-xs uppercase font-bold mb-2 text-[#FFD700] opacity-80">Session Code</label>
                            <input
                                type="text"
                                placeholder="e.g. G29TNO"
                                className="w-full px-4 py-3 bg-[#F4E8D1] text-[#06402B] rounded shadow-inner font-semibold text-xl outline-none focus:ring-4 focus:ring-[#FFD700] text-center tracking-[0.3em] uppercase"
                                value={sessionCode}
                                onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                                maxLength={6}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs uppercase font-bold mb-2 text-[#FFD700] opacity-80">Group Name</label>
                            <input
                                type="text"
                                placeholder="e.g. The Pathfinders"
                                className="w-full px-4 py-3 bg-[#F4E8D1] text-[#06402B] rounded shadow-inner font-semibold text-lg outline-none focus:ring-4 focus:ring-[#FFD700]"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                required
                            />
                        </div>
                        <button className="w-full bg-[#FFD700] text-[#06402B] font-bold py-4 rounded-lg shadow-[0_4px_0_#B8860B] active:shadow-none active:translate-y-1 transition-all pixel-font text-sm">
                            START EXPEDITION
                        </button>
                    </form>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col pt-[70px] bg-[#F4E8D1] relative">
            <div className="map-line absolute inset-0 opacity-10 pointer-events-none z-0"></div>

            {/* Top Bar Map Progress */}
            <div className="fixed top-0 left-0 w-full bg-[#06402B] text-white p-4 shadow-md z-50 overflow-x-auto flex items-center justify-between border-b-4 border-[#FFD700]">
                <div className="flex space-x-2 items-center pixel-font text-xs min-w-max">
                    <PhaseIndicator active={session.phase === 1} label="Temple Gate" />
                    <ChevronRight className="w-4 h-4 text-[#FFD700]" />
                    <PhaseIndicator active={session.phase === 2} label="Jungle Bridge" />
                    <ChevronRight className="w-4 h-4 text-[#FFD700]" />
                    <PhaseIndicator active={session.phase === 3} label="Lost Library" />
                    <ChevronRight className="w-4 h-4 text-[#FFD700]" />
                    <PhaseIndicator active={session.phase === 4} label="Treasury" />
                </div>
                <div className="text-[#FFD700] ml-4 pixel-font text-[10px] hidden sm:block">
                    {groupName}
                </div>
            </div>

            <div className="flex-1 w-full max-w-4xl mx-auto p-4 z-10 pb-20">
                <AnimatePresence mode="wait">
                    {session.phase === 1 && (
                        <motion.div key="phase1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <div className="text-center mb-8">
                                <h2 className="text-3xl pixel-font text-[#06402B] mb-2 drop-shadow-sm">The Temple Gate</h2>
                                <p className="text-lg font-semibold text-[#134E4A]">Reflect and reach consensus in your group.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <PromptBox
                                    id="like" title="THE LOOT (I LIKE...)"
                                    desc="What do you appreciate about AI personalization?"
                                    value={responses.like}
                                    onChange={(v) => setResponses({ ...responses, like: v })}
                                    onSubmit={() => handlePromptSubmit('like')}
                                    submitted={submittedPrompts.like}
                                />
                                <PromptBox
                                    id="wish" title="THE MAP (I WISH...)"
                                    desc="What do you wish AI personalization could do better?"
                                    value={responses.wish}
                                    onChange={(v) => setResponses({ ...responses, wish: v })}
                                    onSubmit={() => handlePromptSubmit('wish')}
                                    submitted={submittedPrompts.wish}
                                />
                                <PromptBox
                                    id="wonder" title="THE MYSTERY (I WONDER...)"
                                    desc="What curiosities do you still have?"
                                    value={responses.wonder}
                                    onChange={(v) => setResponses({ ...responses, wonder: v })}
                                    onSubmit={() => handlePromptSubmit('wonder')}
                                    submitted={submittedPrompts.wonder}
                                />
                            </div>
                        </motion.div>
                    )}

                    {session.phase === 2 && (
                        <motion.div key="phase2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <div className="text-center mb-8">
                                <h2 className="text-3xl pixel-font text-[#06402B] mb-2 drop-shadow-sm">The Green Line</h2>
                                <p className="text-lg font-semibold text-[#134E4A]">Tag your group's responses as Technical, Relational, or Both.</p>
                            </div>
                            <div className="space-y-4">
                                {session.responses.filter(r => r.groupName === groupName).map(r => (
                                    <div key={r.id} className="bg-white p-5 rounded-xl shadow-md border-l-4 border-[#06402B]">
                                        <div className="text-xs uppercase font-bold text-gray-500 mb-2">{r.promptId.replace('_', ' ')}</div>
                                        <div className="text-[#06402B] font-medium text-lg mb-4">"{r.text}"</div>
                                        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                                            <TagButton active={r.tags?.includes('technical')} onClick={() => handleTag(r.id, 'technical')} label="Technical" />
                                            <TagButton active={r.tags?.includes('both')} onClick={() => handleTag(r.id, 'both')} label="Both" />
                                            <TagButton active={r.tags?.includes('relational')} onClick={() => handleTag(r.id, 'relational')} label="Relational" />
                                        </div>
                                    </div>
                                ))}
                                {session.responses.filter(r => r.groupName === groupName).length === 0 && (
                                    <div className="text-center p-8 bg-white/50 rounded-xl font-medium">You didn't submit any answers in Phase 1 to tag. Wait for the host.</div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {session.phase === 3 && (
                        <motion.div key="phase3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            <div className="text-center mb-6">
                                <h2 className="text-3xl pixel-font text-[#06402B] mb-2">The Lost Library</h2>
                                <p className="text-lg font-semibold text-[#134E4A]">Consult the HR Guidance Document.</p>
                            </div>

                            {!activeScenario ? (
                                <div className="bg-white/50 border-2 border-dashed border-[#134E4A] p-12 rounded-2xl flex flex-col items-center text-center">
                                    <BookOpen className="w-12 h-12 text-[#134E4A] opacity-50 mb-4" />
                                    <h3 className="text-xl font-bold text-[#134E4A] mb-2">Awaiting the Scroll</h3>
                                    <p className="text-gray-600 font-medium">Please wait for the Facilitator to reveal the next scenario.</p>
                                </div>
                            ) : (
                                <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-[#134E4A]">
                                    <div className="flex items-center space-x-3 mb-4 text-[#134E4A]">
                                        <BookOpen className="w-6 h-6" />
                                        <h3 className="text-xl font-bold pixel-font">{activeScenario.title.split('—')[0].trim()}</h3>
                                    </div>
                                    <h4 className="font-bold text-gray-800 mb-2">{activeScenario.title.split('—')[1]?.trim()}</h4>
                                    <p className="text-lg text-gray-700 leading-relaxed bg-gray-50 p-4 border border-gray-200 rounded">
                                        {activeScenario.text}
                                    </p>

                                    <div className="mt-8">
                                        <h4 className="font-bold mb-4 bg-[#FFD700] text-[#06402B] px-3 py-1 inline-block rounded uppercase text-sm">
                                            {session.responseFormat === 'multiple_choice' ? 'Select the most accurate take:' : 'Your Assessment:'}
                                        </h4>

                                        {session.responseFormat === 'multiple_choice' ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {activeScenario.options && activeScenario.options.map((opt, index) => {
                                                    const colors = ['bg-[#06402B]', 'bg-[#134E4A]', 'bg-gray-600', 'bg-gray-700'];
                                                    return (
                                                        <VoteButton
                                                            key={opt.id}
                                                            answer={opt.id}
                                                            label={opt.label}
                                                            session={session}
                                                            groupName={groupName}
                                                            onVote={handleVote}
                                                            color={colors[index % colors.length]}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="mt-2">
                                                <div className="flex flex-col gap-4">
                                                    <textarea
                                                        className="w-full p-4 bg-gray-50 border-2 border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent min-h-[120px] font-medium"
                                                        placeholder="Discuss with your group and type your rationale here..."
                                                        value={openEndedResponse}
                                                        onChange={(e) => setOpenEndedResponse(e.target.value)}
                                                    />
                                                    <button
                                                        onClick={handleOpenEndedSubmit}
                                                        className="w-full bg-[#134E4A] text-white font-bold py-4 rounded-lg shadow-md hover:-translate-y-1 hover:shadow-lg active:translate-y-0 active:shadow-md transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <Send className="w-5 h-5" /> SUBMIT ANALYSIS
                                                    </button>
                                                    {session.votes.find(v => v.groupName === groupName) && (
                                                        <div className="text-center font-bold text-green-600 mt-2 flex items-center justify-center gap-2">
                                                            <CheckCircle2 className="w-5 h-5" /> Analysis Submitted
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {session.phase === 4 && (
                        <motion.div key="phase4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <div className="text-center mb-8">
                                <h2 className="text-3xl pixel-font text-[#06402B] mb-2">Treasure Chamber</h2>
                                <p className="text-lg font-semibold text-[#134E4A]">Charting the Map: Identify your next steps.</p>
                            </div>
                            <div className="bg-[#134E4A] p-6 rounded-xl shadow-[8px_8px_0px_#06402B] text-[#F4E8D1]">
                                <h3 className="font-bold text-xl mb-2">What support or learning would help you move forward?</h3>
                                <p className="text-sm opacity-80 mb-6">Submit as many as you like. No consensus required.</p>

                                <textarea
                                    className="w-full h-32 p-4 bg-white/10 text-white rounded outline-none focus:ring-2 focus:ring-[#FFD700] mb-4 placeholder-white/30"
                                    placeholder="e.g. Training on specific tools..."
                                    value={nextStep}
                                    onChange={(e) => setNextStep(e.target.value)}
                                />

                                <div className="mb-6">
                                    <h4 className="text-sm uppercase font-bold text-[#FFD700] mb-3">Tag your need</h4>
                                    <div className="flex gap-3">
                                        <button className={`px-4 py-2 rounded font-bold text-sm ${nextStepTag === 'technical' ? 'bg-[#FFD700] text-[#06402B]' : 'bg-black/20 hover:bg-black/30'}`} onClick={() => setNextStepTag('technical')}>Technical</button>
                                        <button className={`px-4 py-2 rounded font-bold text-sm ${nextStepTag === 'both' ? 'bg-[#FFD700] text-[#06402B]' : 'bg-black/20 hover:bg-black/30'}`} onClick={() => setNextStepTag('both')}>Both</button>
                                        <button className={`px-4 py-2 rounded font-bold text-sm ${nextStepTag === 'relational' ? 'bg-[#FFD700] text-[#06402B]' : 'bg-black/20 hover:bg-black/30'}`} onClick={() => setNextStepTag('relational')}>Relational</button>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSubmitStep}
                                    className="w-full bg-[#FFD700] text-[#06402B] font-bold py-3 rounded shadow-[0_4px_0_#B8860B] hover:-translate-y-1 hover:shadow-[0_6px_0_#B8860B] active:translate-y-1 active:shadow-none transition-all flex justify-center items-center gap-2"
                                >
                                    <Send className="w-5 h-5" /> SUBMIT DISCOVERY
                                </button>
                                {submittedSteps > 0 && (
                                    <div className="mt-4 text-center font-bold text-green-300">
                                        <CheckCircle2 className="w-5 h-5 inline mr-1" /> {submittedSteps} Discoveries recorded
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

function PhaseIndicator({ active, label }) {
    return (
        <div className={`px-3 py-1.5 rounded ${active ? 'bg-[#FFD700] text-[#06402B] scale-105' : 'bg-black/20 opacity-70'} transition-all`}>
            {label}
        </div>
    );
}

function PromptBox({ title, desc, value, onChange, onSubmit, submitted }) {
    return (
        <div className={`flex flex-col bg-white rounded-xl shadow-lg border-2 transition-all ${submitted ? 'border-green-500 opacity-80' : 'border-[#134E4A] hover:shadow-xl'}`}>
            <div className="bg-[#134E4A] text-white p-4 rounded-t-lg">
                <h3 className="font-bold pixel-font text-xs tracking-wider mb-1 text-[#FFD700]">{title}</h3>
                <p className="text-sm opacity-90">{desc}</p>
            </div>
            <div className="p-4 flex-1 flex flex-col">
                {submitted ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                        <CheckCircle2 className="w-12 h-12 text-green-500 mb-2" />
                        <p className="font-bold text-[#06402B]">Artifact Secured</p>
                        <p className="text-base text-gray-600 italic mt-2">"{value}"</p>
                    </div>
                ) : (
                    <>
                        <textarea
                            className="flex-1 w-full p-3 bg-gray-50 border border-gray-200 rounded outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent resize-none min-h-[120px]"
                            placeholder="Your group's answer..."
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                        />
                        <button
                            onClick={onSubmit}
                            className="mt-4 w-full bg-[#134E4A] text-white font-bold py-3 rounded hover:bg-[#06402B] transition-colors flex justify-center items-center gap-2"
                        >
                            <Send className="w-4 h-4" /> SUBMIT
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

function TagButton({ active, label, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 rounded-full font-bold text-sm transition-all shadow-sm ${active
                ? 'bg-[#134E4A] text-white ring-2 ring-offset-2 ring-[#134E4A]'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
        >
            {label}
        </button>
    );
}

function VoteButton({ answer, label, session, groupName, onVote, color }) {
    const vote = session.votes.find(v => v.groupName === groupName);
    const isSelected = vote?.answer === answer;

    return (
        <button
            onClick={() => onVote(answer)}
            className={`py-4 px-6 rounded-xl font-medium text-white text-left transition-all shadow-md transform hover:scale-[1.02] active:scale-100 flex items-start gap-4 border-2 border-transparent
        ${isSelected ? `${color} ring-4 ring-offset-2 ring-[${color}] scale-[1.02] shadow-xl border-white/50` : `${color} opacity-90 hover:opacity-100`}
      `}
        >
            <div className="mt-1 shrink-0">
                {isSelected ? <CheckCircle2 className="w-6 h-6" /> : <div className="w-6 h-6 rounded-full border-2 border-white/50" />}
            </div>
            <span className="leading-snug">{label}</span>
        </button>
    );
}
