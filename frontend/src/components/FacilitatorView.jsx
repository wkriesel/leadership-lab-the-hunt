import React, { useState, useEffect } from 'react';
import { useSocket } from '../SocketContext';
import { Play, Square, Download, ChevronRight, BarChart2, RefreshCw, Layers, Send, ArrowLeft, QrCode, Copy, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { SCENARIOS } from '../scenarios';
import AnalyticsDashboard from './AnalyticsDashboard';

export default function FacilitatorView() {
    const { socket, session, activeSessionId, activeSessionCode, setActiveSessionId, setActiveSessionCode, exportSession, getSessionQR } = useSocket();
    const [timeLeft, setTimeLeft] = useState(15 * 60);
    const [timerRunning, setTimerRunning] = useState(false);
    const [qrData, setQrData] = useState(null);
    const [showQR, setShowQR] = useState(false);
    const [codeCopied, setCodeCopied] = useState(false);
    const [view, setView] = useState('phases');

    // Load QR code on mount
    useEffect(() => {
        if (activeSessionId) {
            getSessionQR(activeSessionId).then(setQrData).catch(console.error);
        }
    }, [activeSessionId]);

    useEffect(() => {
        let interval = null;
        if (timerRunning && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
        } else if (!timerRunning && timeLeft !== 0) {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [timerRunning, timeLeft]);

    // Resolve activeScenario from ID
    const activeScenario = session.activeScenario
        ? SCENARIOS.find(s => s.id === session.activeScenario) || null
        : null;

    const handlePhaseChange = (newPhase) => {
        socket.emit('setPhase', { sessionId: activeSessionId, phase: newPhase });

        if (newPhase === 1) setTimeLeft(15 * 60);
        if (newPhase === 2) setTimeLeft(5 * 60);
        if (newPhase === 3) setTimeLeft(10 * 60);
        if (newPhase === 4) setTimeLeft(10 * 60);

        setTimerRunning(false);
    };

    const handleReset = () => {
        if (confirm("Reset the entire session? All data will be lost.")) {
            socket.emit('resetSession', { sessionId: activeSessionId });
            setTimeLeft(15 * 60);
            setTimerRunning(false);
        }
    };

    const handleExport = () => {
        exportSession(activeSessionId);
    };

    const handleBack = () => {
        setActiveSessionId(null);
        setActiveSessionCode(null);
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(activeSessionCode || '');
        setCodeCopied(true);
        setTimeout(() => setCodeCopied(false), 2000);
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen bg-[#06402B] text-[#F4E8D1] p-6 lg:p-10 font-inter">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Sidebar Controls */}
                <div className="lg:col-span-3 bg-[#134E4A] rounded-2xl p-6 shadow-xl border-4 border-[#06402B] flex flex-col h-[calc(100vh-80px)] overflow-y-auto">

                    {/* Back + Title */}
                    <div className="mb-4">
                        <button onClick={handleBack} className="text-[#FFD700]/70 hover:text-[#FFD700] text-sm font-bold flex items-center gap-1 mb-3 transition-colors">
                            <ArrowLeft className="w-4 h-4" /> Dashboard
                        </button>
                        <h1 className="text-2xl pixel-font text-[#FFD700] mb-2 drop-shadow-md">Expedition Control</h1>
                        <p className="text-sm opacity-80 mb-2">{session.groups?.length || 0} Groups Active</p>
                    </div>

                    {/* Session Code Display */}
                    <div className="bg-[#06402B] p-4 rounded-xl shadow-inner border border-[#134E4A] mb-4">
                        <div className="text-xs uppercase font-bold text-[#FFD700] mb-2 text-center">Session Code</div>
                        <div className="flex items-center justify-center gap-2">
                            <div className="text-3xl font-bold pixel-font text-white tracking-[0.3em]">
                                {activeSessionCode}
                            </div>
                            <button onClick={handleCopyCode} className="p-2 rounded hover:bg-white/10 transition-colors" title="Copy code">
                                {codeCopied ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5 text-white/50" />}
                            </button>
                        </div>
                        <button
                            onClick={() => setShowQR(!showQR)}
                            className="mt-3 w-full text-center text-xs font-bold text-[#FFD700]/70 hover:text-[#FFD700] transition-colors flex items-center justify-center gap-1"
                        >
                            <QrCode className="w-4 h-4" /> {showQR ? 'Hide QR Code' : 'Show QR Code'}
                        </button>
                        {showQR && qrData && (
                            <div className="mt-3 flex justify-center">
                                <img src={qrData.qr} alt="Session QR Code" className="w-40 h-40 rounded-lg bg-white p-2" />
                            </div>
                        )}
                    </div>

                    {/* Timer */}
                    <div className="bg-[#06402B] p-4 rounded-xl shadow-inner border border-[#134E4A] flex flex-col items-center justify-center mb-6">
                        <div className="text-5xl font-bold pixel-font text-white tracking-widest bg-black/30 p-4 rounded-xl mb-3 shadow-inner">
                            {formatTime(timeLeft)}
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setTimerRunning(!timerRunning)} className={`p-3 rounded-full shadow-md hover:scale-105 active:scale-95 transition-all ${timerRunning ? 'bg-red-500 text-white' : 'bg-green-500 text-black'}`}>
                                {timerRunning ? <Square className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3 mb-auto">
                        <PhaseButton active={session.phase === 1 && view === 'phases'} label="Phase 1: Entry" onClick={() => { setView('phases'); handlePhaseChange(1); }} />
                        <PhaseButton active={session.phase === 2 && view === 'phases'} label="Phase 2: The Green Line" onClick={() => { setView('phases'); handlePhaseChange(2); }} />
                        <PhaseButton active={session.phase === 3 && view === 'phases'} label="Phase 3: The Policy" onClick={() => { setView('phases'); handlePhaseChange(3); }} />
                        <PhaseButton active={session.phase === 4 && view === 'phases'} label="Phase 4: What's Next" onClick={() => { setView('phases'); handlePhaseChange(4); }} />

                        <button
                            onClick={() => setView('analytics')}
                            className={`w-full text-left px-4 py-3 rounded-lg font-bold flex justify-between items-center transition-all ${view === 'analytics'
                                ? 'bg-[#22c55e] text-white shadow-[0_4px_0_#16a34a] transform scale-105 z-10'
                                : 'bg-[#06402B]/50 text-white hover:bg-[#06402B] hover:pl-6'
                                }`}
                        >
                            <span className="pixel-font text-xs tracking-wider">📊 ANALYTICS</span>
                            {view === 'analytics' && <ChevronRight className="w-5 h-5" />}
                        </button>
                    </div>

                    <div className="mt-8 space-y-3 pt-6 border-t border-[#06402B]/50">
                        <button onClick={handleExport} className="w-full bg-[#FFD700] text-[#06402B] py-3 rounded-lg font-bold shadow-[0_4px_0_#B8860B] hover:-translate-y-1 hover:shadow-[0_6px_0_#B8860B] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2">
                            <Download className="w-5 h-5" /> EXPORT REPORT
                        </button>
                        <button onClick={handleReset} className="w-full bg-red-800 text-white py-3 rounded-lg font-bold shadow-md hover:bg-red-700 transition-colors flex items-center justify-center gap-2">
                            <RefreshCw className="w-5 h-5" /> RESET EXPEDITION
                        </button>
                    </div>
                </div>

                {/* Dashboard Main View */}
                <div className={`lg:col-span-9 rounded-2xl p-8 shadow-xl border-4 h-[calc(100vh-80px)] overflow-y-auto mix-blend-normal relative ${
                    view === 'analytics'
                        ? 'bg-stone-900 text-stone-100 border-stone-700'
                        : 'bg-[#F4E8D1] text-[#06402B] border-[#06402B]'
                }`}>
                    <div className={`map-line absolute inset-0 ${view === 'analytics' ? '' : 'opacity-10'} pointer-events-none rounded-xl`}></div>

                    <div className="relative z-10">
                        {view === 'phases' ? (
                            <>
                                {session.phase === 1 && <Phase1Dashboard session={session} />}
                                {session.phase === 2 && <Phase2Dashboard session={session} />}
                                {session.phase === 3 && <Phase3Dashboard session={session} socket={socket} activeSessionId={activeSessionId} activeScenario={activeScenario} />}
                                {session.phase === 4 && <Phase4Dashboard session={session} />}
                            </>
                        ) : (
                            <AnalyticsDashboard session={session} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function PhaseButton({ active, label, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`w-full text-left px-4 py-3 rounded-lg font-bold flex justify-between items-center transition-all ${active
                ? 'bg-[#FFD700] text-[#06402B] shadow-[0_4px_0_#B8860B] transform scale-105 z-10'
                : 'bg-[#06402B]/50 text-white hover:bg-[#06402B] hover:pl-6'
                }`}
        >
            <span className="pixel-font text-xs tracking-wider">{label}</span>
            {active && <ChevronRight className="w-5 h-5" />}
        </button>
    );
}

// Phase Dashboards

function Phase1Dashboard({ session }) {
    return (
        <div>
            <h2 className="text-3xl pixel-font text-[#134E4A] mb-8 uppercase drop-shadow-sm border-b-4 border-[#134E4A] inline-block pb-2">The Artifact Wall</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Column title="THE LOOT (I LIKE)" responses={session.responses.filter(r => r.promptId === 'like')} />
                <Column title="THE MAP (I WISH)" responses={session.responses.filter(r => r.promptId === 'wish')} />
                <Column title="THE MYSTERY (I WONDER)" responses={session.responses.filter(r => r.promptId === 'wonder')} />
            </div>
        </div>
    );
}

function Column({ title, responses }) {
    return (
        <div className="bg-white/50 p-4 rounded-xl border-dashed border-2 border-[#134E4A]">
            <h3 className="font-bold pixel-font text-sm mb-4 text-[#06402B] pb-2 border-b border-[#06402B]/20">{title}</h3>
            <div className="space-y-3 h-[60vh] overflow-y-auto pr-2">
                {responses.map(r => (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} key={r.id} className="bg-white p-4 rounded shadow border-l-4 border-[#FFD700]">
                        <p className="font-medium text-lg leading-snug">"{r.text}"</p>
                        <p className="text-xs text-gray-500 mt-2 text-right opacity-70">— {r.groupName}</p>
                    </motion.div>
                ))}
                {responses.length === 0 && <p className="text-sm text-[#06402B]/50 italic">Waiting for discoveries...</p>}
            </div>
        </div>
    );
}

function Phase2Dashboard({ session }) {
    const technicalCount = session.responses.filter(r => r.tags?.includes('technical')).length;
    const relationalCount = session.responses.filter(r => r.tags?.includes('relational')).length;
    const bothCount = session.responses.filter(r => r.tags?.includes('both')).length;
    const totalTagged = session.responses.filter(r => r.tags?.length > 0).length;
    const required = session.responses.length;

    return (
        <div>
            <div className="flex justify-between items-end mb-8 border-b-4 border-[#134E4A] pb-2">
                <h2 className="text-3xl pixel-font text-[#134E4A] uppercase drop-shadow-sm inline-block">The Green Line Map</h2>
                <div className="font-bold bg-white px-4 py-2 rounded-lg shadow-sm">
                    Progress: {totalTagged} / {required} Artifacts Validated
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-12">

                {/* The Visual Line */}
                <div className="relative h-[500px] flex flex-col justify-between items-center bg-white p-8 rounded-2xl shadow-xl border-2 border-[#134E4A]/20">
                    <div className="flex-1 w-full flex flex-col justify-center items-center text-[#134E4A]">
                        <Layers className="w-12 h-12 mb-4 opacity-50" />
                        <h3 className="text-2xl font-bold pixel-font mb-2">TECHNICAL MOVES</h3>
                        <p className="text-gray-500 mb-8 font-medium">Tools, prompts, automation, workflows</p>
                        <div className="text-6xl font-bold text-[#FFD700] filter drop-shadow-md">{technicalCount}</div>
                    </div>

                    <div className="w-full h-4 bg-green-500 rounded-full shadow-inner my-4 relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white text-green-500 font-bold px-4 py-1 rounded-full shadow border-2 border-green-500">
                            BOTH ({bothCount})
                        </div>
                    </div>

                    <div className="flex-1 w-full flex flex-col justify-center items-center text-[#134E4A]">
                        <div className="text-6xl font-bold text-[#06402B] filter drop-shadow-md mt-8">{relationalCount}</div>
                        <p className="text-gray-500 mt-8 font-medium">Trust, leadership, team culture, adoption</p>
                        <h3 className="text-2xl font-bold pixel-font mt-2">RELATIONAL MOVES</h3>
                    </div>
                </div>

                {/* The List Overview */}
                <div className="bg-white/50 p-6 rounded-xl border-dashed border-2 border-[#134E4A] h-[500px] overflow-y-auto">
                    <h3 className="font-bold pixel-font text-xl mb-6 text-[#06402B]">Recent Classifications</h3>
                    <div className="space-y-4">
                        {session.responses.filter(r => r.tags?.length > 0).slice().reverse().map(r => (
                            <div key={r.id} className="bg-white p-4 rounded shadow flex justify-between items-start gap-4 border-l-4" style={{ borderColor: r.tags.includes('technical') ? '#FFD700' : r.tags.includes('relational') ? '#06402B' : '#22c55e' }}>
                                <div>
                                    <div className="text-xs text-gray-400 font-bold uppercase mb-1">{r.groupName}</div>
                                    <div className="font-medium text-gray-800 break-words line-clamp-2">"{r.text}"</div>
                                </div>
                                <div className="px-3 py-1 bg-gray-100 rounded text-xs font-bold shrink-0 uppercase">
                                    {r.tags.join(', ')}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function Phase3Dashboard({ session, socket, activeSessionId, activeScenario }) {
    const [selectedScenarioId, setSelectedScenarioId] = useState(1);
    const [selectedFormat, setSelectedFormat] = useState('multiple_choice');

    const handlePushScenario = () => {
        const scenario = SCENARIOS.find(s => s.id === selectedScenarioId);
        if (scenario) {
            socket.emit('setScenario', {
                sessionId: activeSessionId,
                scenario: scenario,
                format: selectedFormat
            });
        }
    };

    const isMultipleChoice = session.responseFormat === 'multiple_choice';

    return (
        <div>
            <div className="flex justify-between items-end mb-8 border-b-4 border-[#134E4A] pb-2">
                <h2 className="text-3xl pixel-font text-[#134E4A] uppercase drop-shadow-sm inline-block">Lost Library Scenarios</h2>
                <div className="font-bold bg-white px-4 py-2 rounded-lg shadow-sm">
                    {session.votes?.length || 0} Groups Responded
                </div>
            </div>

            {/* Scenario Selection Controls */}
            <div className="bg-[#134E4A] p-6 rounded-2xl shadow-xl mb-8 border-2 border-[#06402B] text-[#F4E8D1]">
                <h3 className="text-xl font-bold mb-4 pixel-font text-[#FFD700]">Assign Scenario</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                    <div>
                        <label className="block text-sm font-bold uppercase mb-2 opacity-80">Select Scenario</label>
                        <select
                            value={selectedScenarioId}
                            onChange={(e) => setSelectedScenarioId(Number(e.target.value))}
                            className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white focus:ring-2 focus:ring-[#FFD700] outline-none font-bold"
                        >
                            {SCENARIOS.map(s => (
                                <option key={s.id} value={s.id} className="text-[#06402B]">{s.title}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold uppercase mb-2 opacity-80">Response Format</label>
                        <div className="flex bg-white/10 rounded-lg p-1">
                            <button
                                onClick={() => setSelectedFormat('multiple_choice')}
                                className={`flex-1 py-2 px-4 rounded-md font-bold text-sm transition-all ${selectedFormat === 'multiple_choice' ? 'bg-[#FFD700] text-[#06402B] shadow-sm' : 'text-white/70 hover:text-white'}`}
                            >
                                Multiple Choice
                            </button>
                            <button
                                onClick={() => setSelectedFormat('open_ended')}
                                className={`flex-1 py-2 px-4 rounded-md font-bold text-sm transition-all ${selectedFormat === 'open_ended' ? 'bg-[#FFD700] text-[#06402B] shadow-sm' : 'text-white/70 hover:text-white'}`}
                            >
                                Open-Ended
                            </button>
                        </div>
                    </div>
                </div>
                <button
                    onClick={handlePushScenario}
                    className="mt-6 w-full bg-[#FFD700] text-[#06402B] font-bold py-4 rounded-lg shadow-[0_4px_0_#B8860B] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-2 hover:-translate-y-1 hover:shadow-[0_6px_0_#B8860B]"
                >
                    <Send className="w-5 h-5" /> PUSH SCENARIO TO EXPLORERS
                </button>
            </div>

            {/* Results Display */}
            {activeScenario ? (
                <div className="bg-white p-8 rounded-2xl shadow-xl mt-8 border-t-8 border-[#06402B]">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-2xl font-bold">{activeScenario.title}</h3>
                        <span className="bg-gray-100 text-xs font-bold px-3 py-1 rounded-full text-gray-500 uppercase">
                            {isMultipleChoice ? 'Multiple Choice' : 'Open-Ended'}
                        </span>
                    </div>

                    <p className="text-xl text-gray-700 bg-gray-50 p-6 border rounded-xl mb-12 italic border-l-4 border-l-[#134E4A]">
                        "{activeScenario.text}"
                    </p>

                    {isMultipleChoice ? (
                        <div>
                            <div className="flex flex-col md:flex-row gap-6 mt-8 h-64 items-end justify-around">
                                {activeScenario.options && activeScenario.options.map((opt, index) => {
                                    const count = session.votes.filter(v => v.answer === opt.id).length;
                                    const total = session.votes.length || 1;
                                    const colors = ['bg-[#06402B]', 'bg-[#134E4A]', 'bg-gray-600', 'bg-gray-400'];
                                    return (
                                        <VoteBar
                                            key={opt.id}
                                            label={`Option ${opt.id}`}
                                            count={count}
                                            total={total}
                                            color={opt.id === activeScenario.correctAnswer ? 'bg-green-600' : colors[index % colors.length]}
                                            text="white"
                                        />
                                    );
                                })}
                            </div>

                            <div className="mt-12 bg-gray-50 p-6 rounded-xl border border-gray-200">
                                <h4 className="font-bold mb-4 uppercase text-sm text-gray-500">Choice Legend</h4>
                                <ul className="space-y-3">
                                    {activeScenario.options && activeScenario.options.map(opt => (
                                        <li key={opt.id} className={`p-3 rounded-lg border flex gap-3 ${opt.id === activeScenario.correctAnswer ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                                            <span className="font-bold text-gray-700">{opt.id}.</span>
                                            <span className="text-gray-800">{opt.label.replace(/^[A-Z]\.\s/, '')}</span>
                                            {opt.id === activeScenario.correctAnswer && <span className="ml-auto text-green-600 font-bold uppercase text-xs">Correct Policy</span>}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <h4 className="font-bold mb-4 uppercase text-sm text-gray-500 border-b pb-2">Group Responses</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {session.votes.length === 0 ? (
                                    <p className="text-gray-400 italic">Waiting for submissions...</p>
                                ) : (
                                    session.votes.map((v, i) => (
                                        <div key={i} className="bg-white border-l-4 border-[#134E4A] shadow-sm p-4 rounded-lg">
                                            <div className="text-xs text-gray-400 uppercase font-bold mb-2">{v.groupName}</div>
                                            <p className="text-gray-800 font-medium">"{v.answer}"</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    <div className="mt-12 p-6 bg-green-50 rounded-xl border-l-8 border-green-500 relative overflow-hidden">
                        <h4 className="font-bold text-green-900 text-xl mb-2 pixel-font">{activeScenario.revealTitle || 'HR POLICY REVEAL'}</h4>
                        <p className="text-lg text-green-800">
                            {activeScenario.revealText}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="bg-white/50 border-2 border-dashed border-[#134E4A]/30 p-12 rounded-2xl flex flex-col items-center justify-center text-center">
                    <div className="bg-[#134E4A] text-white p-4 rounded-full mb-4 opacity-50"><Layers className="w-8 h-8" /></div>
                    <h3 className="text-xl font-bold text-[#134E4A] mb-2">No Scenario Active</h3>
                    <p className="text-gray-500 max-w-md">Assign a scenario from the controls above to broadcast it to all explorer groups.</p>
                </div>
            )}
        </div>
    );
}

function VoteBar({ label, count, total, color, text }) {
    const height = total > 0 ? (count / total) * 100 : 0;
    return (
        <div className="flex-1 flex flex-col justify-end items-center h-full relative group">
            <div className="text-2xl font-bold mb-2 text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8">{count}</div>
            <div className={`w-full max-w-[120px] ${color} rounded-t-lg shadow-lg relative min-h-[40px] flex items-center justify-center text-${text} font-bold text-xl transition-all duration-1000 ease-in-out hover:brightness-110`} style={{ height: `${height}%` }}>
                {count > 0 && <span>{count}</span>}
            </div>
            <div className="mt-4 font-bold text-center text-gray-600 uppercase text-sm h-12 flex items-center justify-center max-w-[150px]">{label}</div>
        </div>
    );
}

function Phase4Dashboard({ session }) {
    const technicalCounts = session.nextSteps.filter(s => s.tags?.includes('technical')).length;
    const relationalCounts = session.nextSteps.filter(s => s.tags?.includes('relational')).length;
    const bothCounts = session.nextSteps.filter(s => s.tags?.includes('both')).length;

    return (
        <div>
            <div className="flex justify-between items-end mb-8 border-b-4 border-[#134E4A] pb-2">
                <h2 className="text-3xl pixel-font text-[#134E4A] uppercase drop-shadow-sm inline-block">The Treasury Complete</h2>
                <div className="font-bold bg-white px-4 py-2 rounded-lg shadow-sm">
                    {session.nextSteps.length} Discoveries
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
                <div className="col-span-1 bg-white p-6 rounded-2xl shadow-lg border-2 border-[#134E4A]/20">
                    <h3 className="font-bold pixel-font text-lg mb-6 text-center text-[#134E4A]">Next Step Focus</h3>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-gray-50 rounded shadow-sm border-l-4 border-[#FFD700]">
                            <span className="font-bold uppercase text-gray-600">Technical Needs</span>
                            <span className="text-2xl font-bold">{technicalCounts}</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-gray-50 rounded shadow-sm border-l-4 border-green-500">
                            <span className="font-bold uppercase text-gray-600">Both / Hybrid</span>
                            <span className="text-2xl font-bold">{bothCounts}</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-gray-50 rounded shadow-sm border-l-4 border-[#06402B]">
                            <span className="font-bold uppercase text-gray-600">Relational Needs</span>
                            <span className="text-2xl font-bold">{relationalCounts}</span>
                        </div>
                    </div>
                </div>

                <div className="col-span-2 bg-white/50 p-6 rounded-2xl border-dashed border-2 border-[#134E4A] h-[600px] flex flex-col">
                    <h3 className="font-bold pixel-font text-lg mb-6 text-center text-[#134E4A]">Action Plan Wall</h3>
                    <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                        {session.nextSteps.slice().reverse().map(step => (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={step.id} className="bg-white p-5 rounded-xl shadow-md flex gap-4">
                                <div className={`w-2 rounded-full flex-shrink-0 ${step.tags.includes('technical') ? 'bg-[#FFD700]' : step.tags.includes('relational') ? 'bg-[#06402B]' : 'bg-green-500'
                                    }`}></div>
                                <div>
                                    <p className="text-xl font-medium text-gray-800 leading-snug">"{step.text}"</p>
                                    <div className="flex items-center gap-3 mt-3">
                                        <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500 uppercase font-bold">{step.groupName}</span>
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{step.tags.join(', ')}</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
