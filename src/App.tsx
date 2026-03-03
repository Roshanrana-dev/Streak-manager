/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Flame, Trash2, CheckCircle2, Trophy, Calendar, 
  Timer, Zap, X, Play, Pause, RotateCcw,
  Award, Target, Check, Clock, Settings2, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Skill {
  id: string;
  name: string;
  description: string;
  count: number;
  lastUpdated: string | null;
  createdAt: string;
  xp: number;
  level: number;
  totalMinutes: number;
  hasTimer: boolean;
  isCompleted: boolean;
  timerDurationMinutes: number;
}

const XP_PER_LEVEL = 2500;
const XP_PER_MINUTE = 10;
const XP_PER_CHECKIN = 500; // Equivalent to a 50min session
const DEFAULT_FOCUS_TIME = 25 * 60; 

exportexport default function App() {
  const [skills, setSkills] = useState<Skill[]>(() => {
    const saved = localStorage.getItem('skill-streaks-v3');
    if (saved) return JSON.parse(saved);
    
    // Migration from v2
    const v2 = localStorage.getItem('skill-streaks-v2');
    if (v2) {
      const oldSkills = JSON.parse(v2);
      return oldSkills.map((s: any) => ({
        ...s,
        hasTimer: true,
        isCompleted: false,
        timerDurationMinutes: 25
      }));
    }
    return [];
  });

  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillDescription, setNewSkillDescription] = useState('');
  const [useTimerForNew, setUseTimerForNew] = useState(true);
  const [newSkillDuration, setNewSkillDuration] = useState(25);
  const [activeTimerId, setActiveTimerId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_FOCUS_TIME);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [activeTimerDuration, setActiveTimerDuration] = useState(DEFAULT_FOCUS_TIME);

  const [skillToDelete, setSkillToDelete] = useState<string | null>(null);

  const [skillToComplete, setSkillToComplete] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [expandedProgressId, setExpandedProgressId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('skill-streaks-v3', JSON.stringify(skills));
  }, [skills]);

  useEffect(() => {
    if (isTimerRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, timeLeft]);

  const handleTimerComplete = () => {
    if (!activeTimerId) return;
    
    const minutesEarned = Math.floor(activeTimerDuration / 60);
    const xpEarned = minutesEarned * XP_PER_MINUTE;
    
    updateSkillProgress(activeTimerId, xpEarned, minutesEarned);

    setIsTimerRunning(false);
    setTimeLeft(activeTimerDuration);
    setActiveTimerId(null);
    alert("Focus session complete! XP and streak updated.");
  };

  const updateSkillProgress = (id: string, xpEarned: number, minutesEarned: number = 0) => {
    const today = new Date().toDateString();
    setSkills(prev => prev.map(skill => {
      if (skill.id === id) {
        const newXp = skill.xp + xpEarned;
        const newLevel = Math.floor(newXp / XP_PER_LEVEL) + 1;
        
        // Auto-mastery at Level 1000
        const isNowCompleted = newLevel >= 1000;
        
        return {
          ...skill,
          xp: newXp,
          level: newLevel,
          totalMinutes: skill.totalMinutes + minutesEarned,
          count: skill.lastUpdated !== today ? skill.count + 1 : skill.count,
          lastUpdated: today,
          isCompleted: skill.isCompleted || isNowCompleted
        };
      }
      return skill;
    }));
  };

  const addSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;

    const newSkill: Skill = {
      id: crypto.randomUUID(),
      name: newSkillName.trim(),
      description: newSkillDescription.trim(),
      count: 0,
      lastUpdated: null,
      createdAt: new Date().toISOString(),
      xp: 0,
      level: 1,
      totalMinutes: 0,
      hasTimer: useTimerForNew,
      isCompleted: false,
      timerDurationMinutes: newSkillDuration,
    };

    setSkills([newSkill, ...skills]);
    setNewSkillName('');
    setNewSkillDescription('');
  };

  const confirmDelete = (id: string) => {
    setSkillToDelete(id);
  };

  const deleteSkill = () => {
    if (!skillToDelete) return;
    setSkills(prev => prev.filter(skill => skill.id !== skillToDelete));
    if (activeTimerId === skillToDelete) {
      setIsTimerRunning(false);
      setActiveTimerId(null);
    }
    setSkillToDelete(null);
  };

  const completeSkill = () => {
    if (!skillToComplete) return;
    setSkills(prev => prev.map(skill => 
      skill.id === skillToComplete ? { ...skill, isCompleted: true } : skill
    ));
    setSkillToComplete(null);
  };

  const getMasteryRank = (level: number) => {
    if (level >= 1000) return { title: 'Divine Master', color: 'text-rose-600', bg: 'bg-rose-50', next: null };
    if (level >= 900) return { title: 'Celestial', color: 'text-violet-600', bg: 'bg-violet-50', next: 1000 };
    if (level >= 800) return { title: 'Ascended', color: 'text-violet-500', bg: 'bg-violet-50', next: 900 };
    if (level >= 700) return { title: 'Mythic', color: 'text-purple-600', bg: 'bg-purple-50', next: 800 };
    if (level >= 600) return { title: 'Legend', color: 'text-purple-500', bg: 'bg-purple-50', next: 700 };
    if (level >= 500) return { title: 'Oracle', color: 'text-indigo-600', bg: 'bg-indigo-50', next: 600 };
    if (level >= 400) return { title: 'Sage', color: 'text-indigo-500', bg: 'bg-indigo-50', next: 500 };
    if (level >= 300) return { title: 'Virtuoso', color: 'text-blue-600', bg: 'bg-blue-50', next: 400 };
    if (level >= 250) return { title: 'Paragon', color: 'text-blue-500', bg: 'bg-blue-50', next: 300 };
    if (level >= 200) return { title: 'Superior', color: 'text-cyan-600', bg: 'bg-cyan-50', next: 250 };
    if (level >= 150) return { title: 'Grandmaster', color: 'text-cyan-500', bg: 'bg-cyan-50', next: 200 };
    if (level >= 100) return { title: 'Master', color: 'text-emerald-600', bg: 'bg-emerald-50', next: 150 };
    if (level >= 90) return { title: 'Elite', color: 'text-emerald-500', bg: 'bg-emerald-50', next: 100 };
    if (level >= 80) return { title: 'Specialist', color: 'text-green-600', bg: 'bg-green-50', next: 90 };
    if (level >= 70) return { title: 'Expert', color: 'text-green-500', bg: 'bg-green-50', next: 80 };
    if (level >= 60) return { title: 'Advanced', color: 'text-lime-600', bg: 'bg-lime-50', next: 70 };
    if (level >= 50) return { title: 'Proficient', color: 'text-lime-500', bg: 'bg-lime-50', next: 60 };
    if (level >= 40) return { title: 'Skilled', color: 'text-amber-600', bg: 'bg-amber-50', next: 50 };
    if (level >= 30) return { title: 'Competent', color: 'text-amber-500', bg: 'bg-amber-50', next: 40 };
    if (level >= 20) return { title: 'Practitioner', color: 'text-orange-600', bg: 'bg-orange-50', next: 30 };
    if (level >= 10) return { title: 'Novice', color: 'text-orange-500', bg: 'bg-orange-50', next: 20 };
    if (level >= 5) return { title: 'Beginner', color: 'text-emerald-500', bg: 'bg-emerald-50', next: 10 };
    return { title: 'Apprentice', color: 'text-slate-500', bg: 'bg-slate-50', next: 5 };
  };

  const startFocusSession = (id: string) => {
    const skill = skills.find(s => s.id === id);
    if (!skill) return;
    
    const duration = skill.timerDurationMinutes * 60;
    setActiveTimerId(id);
    setActiveTimerDuration(duration);
    setTimeLeft(duration);
    setIsTimerRunning(true);
  };

  const updateTimerDuration = (id: string, minutes: number) => {
    setSkills(prev => prev.map(s => 
      s.id === id ? { ...s, timerDurationMinutes: Math.max(1, minutes) } : s
    ));
  };

  const updateSkillDescription = (id: string, description: string) => {
    setSkills(prev => prev.map(s => 
      s.id === id ? { ...s, description } : s
    ));
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (totalMinutes: number) => {
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  const today = new Date().toDateString();
  const activeSkills = skills.filter(s => !s.isCompleted);
  const completedSkills = skills.filter(s => s.isCompleted);

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-[#f8fafc] relative">
      {/* Info Button */}
      <div className="fixed top-6 right-6 z-50">
        <button
          onClick={() => setShowInfo(true)}
          className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all text-slate-400 hover:text-indigo-600"
          title="App Info"
        >
          <Info className="w-6 h-6" />
        </button>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <header className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center mb-4"
          >
            <img 
              src="https://storage.googleapis.com/file-auth-test-bucket/aistudio/skill-streak-icon.png" 
              alt="Skill Streak Logo" 
              className="w-24 h-24 drop-shadow-xl"
              referrerPolicy="no-referrer"
            />
          </motion.div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Mastery Lab</h1>
          <p className="text-slate-500 mt-2">Focus on your craft. Level up your life.</p>
        </header>

        {/* Active Timer Overlay */}
        <AnimatePresence>
          {activeTimerId && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-6 right-6 left-6 sm:left-auto sm:w-80 z-50"
            >
              <div className="bg-indigo-600 text-white p-6 rounded-3xl shadow-2xl shadow-indigo-200 border border-indigo-500">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest">Focusing on</p>
                    <h4 className="font-bold text-lg truncate">
                      {skills.find(s => s.id === activeTimerId)?.name}
                    </h4>
                  </div>
                  <button 
                    onClick={() => {
                      setIsTimerRunning(false);
                      setActiveTimerId(null);
                    }}
                    className="p-1 hover:bg-indigo-500 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="text-5xl font-mono font-bold text-center mb-6 tabular-nums">
                  {formatTime(timeLeft)}
                </div>

                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                    className="flex-1 py-3 bg-white text-indigo-600 rounded-2xl font-bold hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {isTimerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    {isTimerRunning ? 'Pause' : 'Resume'}
                  </button>
                  <button
                    onClick={() => setTimeLeft(activeTimerDuration)}
                    className="p-3 bg-indigo-500 text-white rounded-2xl hover:bg-indigo-400 transition-colors"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Skill Form */}
        <form onSubmit={addSkill} className="mb-12">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
            <div className="relative mb-4">
              <input
                type="text"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                placeholder="What skill are you mastering?"
                className="w-full pl-6 pr-16 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-lg font-bold"
              />
              <button
                type="submit"
                disabled={!newSkillName.trim()}
                className="absolute right-2 top-2 p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4">
              <textarea
                value={newSkillDescription}
                onChange={(e) => setNewSkillDescription(e.target.value)}
                placeholder="Add a description or notes for this skill..."
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm resize-none h-24"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-between px-2 gap-4">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setUseTimerForNew(true)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${useTimerForNew ? 'bg-indigo-100 text-indigo-600 shadow-sm' : 'text-slate-400 hover:bg-slate-50'}`}
                >
                  <Clock className="w-4 h-4" />
                  Timed
                </button>
                <button
                  type="button"
                  onClick={() => setUseTimerForNew(false)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${!useTimerForNew ? 'bg-indigo-100 text-indigo-600 shadow-sm' : 'text-slate-400 hover:bg-slate-50'}`}
                >
                  <Check className="w-4 h-4" />
                  Check-in
                </button>
              </div>
              
              {useTimerForNew && (
                <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                  <Timer className="w-4 h-4 text-indigo-500" />
                  <div className="flex items-center gap-1">
                    <input 
                      type="number" 
                      value={Math.floor(newSkillDuration / 60)}
                      onChange={(e) => {
                        const h = parseInt(e.target.value) || 0;
                        const m = newSkillDuration % 60;
                        setNewSkillDuration(h * 60 + m);
                      }}
                      className="w-8 bg-transparent font-bold text-indigo-600 focus:outline-none text-right"
                      min="0"
                    />
                    <span className="text-[10px] font-bold text-slate-400">H</span>
                    <input 
                      type="number" 
                      value={newSkillDuration % 60}
                      onChange={(e) => {
                        const m = parseInt(e.target.value) || 0;
                        const h = Math.floor(newSkillDuration / 60);
                        setNewSkillDuration(h * 60 + m);
                      }}
                      className="w-8 bg-transparent font-bold text-indigo-600 focus:outline-none text-right"
                      min="0"
                      max="59"
                    />
                    <span className="text-[10px] font-bold text-slate-400">M</span>
                  </div>
                </div>
              )}
              
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest hidden sm:block">Skill Mode</p>
            </div>
          </div>
        </form>

        {/* Active Skills List */}
        <div className="grid gap-6 mb-12">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] px-4">Active Skills</h2>
          <AnimatePresence mode="popLayout">
            {activeSkills.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16 bg-white rounded-[2.5rem] border border-dashed border-slate-300"
              >
                <div className="flex justify-center mb-4">
                  <Target className="w-12 h-12 text-slate-300" />
                </div>
                <p className="text-slate-400 font-medium text-lg">Your journey begins here.</p>
                <p className="text-slate-400 text-sm">Add a skill to start your first session.</p>
              </motion.div>
            ) : (
              activeSkills.map((skill) => {
                const isDoneToday = skill.lastUpdated === today;
                const progress = (skill.xp % XP_PER_LEVEL) / XP_PER_LEVEL * 100;
                const rank = getMasteryRank(skill.level);
                
                return (
                  <motion.div
                    key={skill.id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="group bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full uppercase tracking-wider">
                            Level {skill.level}
                          </span>
                          <h3 className="text-xl font-bold text-slate-800 truncate">
                            {skill.name}
                          </h3>
                        </div>

                        <textarea
                          value={skill.description}
                          onChange={(e) => updateSkillDescription(skill.id, e.target.value)}
                          placeholder="Add a description..."
                          className="w-full bg-transparent text-slate-500 text-sm mb-4 focus:outline-none resize-none h-12 hover:bg-slate-50 rounded-lg p-1 transition-colors"
                        />
                        
                        {/* Progress Bar */}
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                          <span>Level {skill.level}</span>
                          <span>Goal: Level 1000</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(skill.level / 1000) * 100}%` }}
                            className="h-full bg-indigo-500 rounded-full"
                          />
                        </div>

                        {/* Detailed Level Progress - Toggleable */}
                        <AnimatePresence>
                          {expandedProgressId === skill.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100 relative overflow-hidden">
                                <div className="absolute -right-2 -bottom-2 opacity-10 rotate-12">
                                  <Trophy className="w-16 h-16 text-indigo-600" />
                                </div>
                                <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                  <span>Next Level Progress</span>
                                  <span>{skill.xp % XP_PER_LEVEL} / {XP_PER_LEVEL} XP</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mb-3">
                                  <div 
                                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                    style={{ width: `${((skill.xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100}%` }}
                                  />
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="text-[10px] font-bold text-slate-500">
                                    {XP_PER_LEVEL - (skill.xp % XP_PER_LEVEL)} XP to Level {skill.level + 1}
                                  </div>
                                  {rank.next && (
                                    <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">
                                      Next Title: Level {rank.next}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
                          <div className="flex items-center text-orange-600">
                            <Flame className="w-4 h-4 mr-1 fill-orange-600" />
                            {skill.count} Streak
                          </div>
                          {skill.hasTimer && (
                            <div className="flex items-center gap-2 text-indigo-600">
                              <div className="flex items-center">
                                <Timer className="w-4 h-4 mr-1" />
                                {formatDuration(skill.totalMinutes)} Focused
                              </div>
                              <div className="flex items-center bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                                <span className="text-[10px] text-indigo-400 mr-1">GOAL:</span>
                                <div className="flex items-center gap-0.5">
                                  <input 
                                    type="number"
                                    value={Math.floor(skill.timerDurationMinutes / 60)}
                                    onChange={(e) => {
                                      const h = parseInt(e.target.value) || 0;
                                      const m = skill.timerDurationMinutes % 60;
                                      updateTimerDuration(skill.id, h * 60 + m);
                                    }}
                                    className="w-6 bg-transparent focus:outline-none font-bold text-indigo-600 text-right"
                                    min="0"
                                  />
                                  <span className="text-[10px] text-indigo-400">h</span>
                                  <input 
                                    type="number"
                                    value={skill.timerDurationMinutes % 60}
                                    onChange={(e) => {
                                      const m = parseInt(e.target.value) || 0;
                                      const h = Math.floor(skill.timerDurationMinutes / 60);
                                      updateTimerDuration(skill.id, h * 60 + m);
                                    }}
                                    className="w-6 bg-transparent focus:outline-none font-bold text-indigo-600 text-right"
                                    min="0"
                                    max="59"
                                  />
                                  <span className="text-[10px] text-indigo-400">m</span>
                                </div>
                              </div>
                            </div>
                          )}
                          <div className="flex items-center text-slate-400">
                            <Zap className="w-4 h-4 mr-1" />
                            {skill.xp} XP
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {skill.hasTimer ? (
                          <button
                            onClick={() => startFocusSession(skill.id)}
                            disabled={activeTimerId === skill.id || isDoneToday}
                            className={`
                              flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all
                              ${isDoneToday 
                                ? 'bg-green-50 text-green-600 cursor-default' 
                                : activeTimerId === skill.id
                                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100 hover:scale-105 active:scale-95'
                              }
                            `}
                          >
                            {isDoneToday ? <CheckCircle2 className="w-5 h-5" /> : <Play className="w-4 h-4 fill-current" />}
                            {isDoneToday ? 'Done' : 'Focus'}
                          </button>
                        ) : (
                          <button
                            onClick={() => updateSkillProgress(skill.id, XP_PER_CHECKIN)}
                            disabled={isDoneToday}
                            className={`
                              flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all
                              ${isDoneToday 
                                ? 'bg-green-50 text-green-600 cursor-default' 
                                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100 hover:scale-105 active:scale-95'
                              }
                            `}
                          >
                            {isDoneToday ? <CheckCircle2 className="w-5 h-5" /> : <Check className="w-5 h-5" />}
                            {isDoneToday ? 'Done' : 'Check'}
                          </button>
                        )}
                        
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedProgressId(expandedProgressId === skill.id ? null : skill.id);
                            }}
                            title="View Level Progress"
                            className={`p-2 rounded-xl transition-all ${expandedProgressId === skill.id ? 'bg-indigo-50 text-indigo-600' : 'text-slate-300 hover:text-indigo-500 hover:bg-indigo-50'}`}
                          >
                            <Trophy className="w-5 h-5" />
                          </button>
                          {skill.level >= 1000 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSkillToComplete(skill.id);
                              }}
                              title="Complete Skill"
                              className="p-2 text-amber-500 bg-amber-50 rounded-xl transition-all shadow-sm animate-pulse"
                            >
                              <Trophy className="w-5 h-5" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmDelete(skill.id);
                            }}
                            title="Delete Skill"
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>

        {/* Hall of Fame / Completed Skills */}
        {completedSkills.length > 0 && (
          <div className="grid gap-6 mb-12">
            <div className="flex items-center justify-between px-4">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Hall of Fame</h2>
              <div className="flex items-center gap-2 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                <Trophy className="w-3 h-3 text-amber-600" />
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                  {completedSkills.reduce((acc, s) => acc + s.xp, 0)} Mastery Points
                </span>
              </div>
            </div>
            <div className="grid gap-4">
              {completedSkills.map((skill) => {
                const rank = getMasteryRank(skill.level);
                return (
                  <motion.div 
                    key={skill.id} 
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 ${rank.bg} rounded-2xl flex items-center justify-center shadow-inner`}>
                        <Award className={`w-8 h-8 ${rank.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className="font-bold text-slate-800 text-lg">{skill.name}</h4>
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${rank.bg} ${rank.color}`}>
                            {rank.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                          <span className="flex items-center"><Zap className="w-3 h-3 mr-1" /> Level {skill.level}</span>
                          <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {formatDuration(skill.totalMinutes)}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmDelete(skill.id);
                      }}
                      className="p-3 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Global Stats Dashboard */}
        {skills.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-16 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-8">
              <Award className="w-6 h-6 text-indigo-600" />
              <h2 className="text-xl font-bold text-slate-800">Your Mastery Stats</h2>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-3xl font-black text-slate-900 mb-1">
                  {skills.length}
                </div>
                <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Total</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-indigo-600 mb-1">
                  {Math.max(0, ...skills.map(s => s.level))}
                </div>
                <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Top Level</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-orange-600 mb-1">
                  {skills.reduce((acc, s) => acc + s.count, 0)}
                </div>
                <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Streaks</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-indigo-600 mb-1">
                  {Math.floor(skills.reduce((acc, s) => acc + s.totalMinutes, 0) / 60)}h
                </div>
                <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Focus</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* App Info Modal */}
        <AnimatePresence>
          {showInfo && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white w-full max-w-lg p-8 rounded-[3rem] shadow-2xl border border-slate-100 overflow-y-auto max-h-[90vh]"
              >
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black text-slate-900">Mastery Guide</h2>
                  <button 
                    onClick={() => setShowInfo(false)}
                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    <Plus className="w-6 h-6 rotate-45 text-slate-400" />
                  </button>
                </div>

                <div className="space-y-8">
                  <section>
                    <h3 className="text-sm font-black text-indigo-600 uppercase tracking-widest mb-3">How it Works</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      Mastery Lab is designed for long-term skill acquisition. Track your daily practice, earn XP, and climb through 1000 levels of mastery.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-sm font-black text-indigo-600 uppercase tracking-widest mb-3">Leveling System</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { l: 1, t: 'Apprentice' },
                        { l: 5, t: 'Beginner' },
                        { l: 10, t: 'Novice' },
                        { l: 50, t: 'Proficient' },
                        { l: 100, t: 'Master' },
                        { l: 500, t: 'Oracle' },
                        { l: 900, t: 'Celestial' },
                        { l: 1000, t: 'Divine Master' },
                      ].map(rank => (
                        <div key={rank.l} className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-[10px] font-black text-slate-400 w-8">LVL {rank.l}</span>
                          <span className="text-xs font-bold text-slate-700">{rank.t}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-3 font-bold uppercase tracking-wider">
                      * Early titles unlock every 5-10 levels to kickstart your journey!
                    </p>
                  </section>

                  <section>
                    <h3 className="text-sm font-black text-indigo-600 uppercase tracking-widest mb-3">Hall of Fame</h3>
                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
                      <Trophy className="w-5 h-5 text-amber-600 mt-0.5" />
                      <p className="text-xs text-amber-800 leading-relaxed font-medium">
                        The Hall of Fame is the ultimate destination. You can only retire a skill once it reaches <span className="font-bold">Level 1000</span>. This ensures only true masters are immortalized.
                      </p>
                    </div>
                  </section>
                </div>

                <button
                  onClick={() => setShowInfo(false)}
                  className="w-full mt-10 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-colors"
                >
                  Got it, let's master!
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Completion Celebration Modal */}
        <AnimatePresence>
          {skillToComplete && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-indigo-900/40 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white w-full max-w-sm p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 text-center"
              >
                <div className="flex justify-center mb-6">
                  <motion.div 
                    animate={{ 
                      rotate: [0, -10, 10, -10, 10, 0],
                      scale: [1, 1.2, 1]
                    }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                    className="p-5 bg-amber-50 rounded-3xl"
                  >
                    <Trophy className="w-12 h-12 text-amber-500" />
                  </motion.div>
                </div>
                
                <h3 className="text-2xl font-black text-slate-900 mb-2">Divine Mastery Achieved!</h3>
                <p className="text-slate-500 mb-8">
                  You've reached the ultimate <span className="font-bold text-rose-600">Level 1000</span> in <span className="font-bold text-slate-800">"{skills.find(s => s.id === skillToComplete)?.name}"</span>. 
                  You are now a Divine Master. Enter the Hall of Fame to immortalize your journey.
                </p>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={completeSkill}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
                  >
                    Enter Hall of Fame
                  </button>
                  <button
                    onClick={() => setSkillToComplete(null)}
                    className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
                  >
                    Keep Practicing
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
