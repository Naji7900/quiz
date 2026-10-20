import React, { useState, useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  XCircle, 
  Timer, 
  Flame, 
  RotateCcw, 
  ArrowRight, 
  BookOpen, 
  Trophy, 
  Sparkles, 
  Zap, 
  Heart, 
  HeartCrack,
  Search,
  Check,
  Tag,
  DollarSign
} from 'lucide-react';
import { SparePartItem, CompatItem, ChangeItem } from '../data/initialData';
import { sound } from '../services/soundService';

interface QuizViewProps {
  parts: SparePartItem[];
  compatList: CompatItem[];
  changesList: ChangeItem[];
  onStreakUpdate: (streak: number) => void;
}

type QuizMode = 'mcq' | 'type' | 'truefalse' | 'match' | 'samePrice' | 'compat' | 'changes' | 'survival';
type CompatSubMode = 'mcq' | 'match' | 'truefalse' | 'type';
type SelMode = 'random' | 'range' | 'custom';
type FlowMode = 'quiz' | 'learn';
type PricePracticeTarget = 'all' | 'dirham' | 'costUsd' | 'salesPrice';

interface QuestionItem {
  id: string;
  title: string;
  subtitle?: string;
  correctVal: string;
  priceKind: 'D' | 'costUsd' | 'salesPrice';
  rawItem: SparePartItem | CompatItem | ChangeItem;
  breakdownStr: string;
}

export const QuizView: React.FC<QuizViewProps> = ({
  parts,
  compatList,
  changesList,
  onStreakUpdate
}) => {
  // Setup configuration state
  const [flow, setFlow] = useState<FlowMode>('quiz');
  const [mode, setMode] = useState<QuizMode>('mcq');
  const [compatSubMode, setCompatSubMode] = useState<CompatSubMode>('mcq');
  const [changeSubMode, setChangeSubMode] = useState<'mcq' | 'type' | 'truefalse' | 'match'>('mcq');
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [selMode, setSelMode] = useState<SelMode>('random');
  const [sortOrder, setSortOrder] = useState<'cheap' | 'expensive' | 'az'>('cheap');
  const [startRank, setStartRank] = useState<number>(1);
  const [questionCount, setQuestionCount] = useState<number>(20);
  const [pricePracticeTarget, setPricePracticeTarget] = useState<PricePracticeTarget>('all');
  const [timerDuration, setTimerDuration] = useState<number>(0);

  // Custom model picker state
  const [customSearch, setCustomSearch] = useState('');
  const [customPickedIds, setCustomPickedIds] = useState<Set<string>>(new Set());

  // Running Quiz State
  const [quizPhase, setQuizPhase] = useState<'setup' | 'learn' | 'running' | 'result'>('setup');
  const [currentQuestions, setCurrentQuestions] = useState<QuestionItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [lives, setLives] = useState(3);
  const [wrongAnswers, setWrongAnswers] = useState<{ title: string; correct: string; breakdown: string; userAns?: string }[]>([]);

  // Current Question Interactive State
  const [isAnswered, setIsAnswered] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [typeInputValue, setTypeInputValue] = useState('');
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; message: string; breakdown?: string } | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const autoAdvanceRef = useRef<NodeJS.Timeout | null>(null);

  // Matching Mode State
  const [matchSelectedLeft, setMatchSelectedLeft] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Set<string>>(new Set());
  const [matchFlashKey, setMatchFlashKey] = useState<string | null>(null);

  // Learn Mode Batches
  const [learnBatches, setLearnBatches] = useState<QuestionItem[][]>([]);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    parts.forEach(p => set.add(p.cat));
    return Array.from(set).sort();
  }, [parts]);

  const fmt = (num: number) => {
    const r = Math.round(num * 10) / 10;
    return r === 0 && num !== 0 ? num.toFixed(2) : r.toFixed(1);
  };

  const getTargetPrice = (item: SparePartItem, target: 'D' | 'costUsd' | 'salesPrice'): string => {
    if (target === 'D') return `${fmt(item.d)} D`;
    if (target === 'costUsd') return `$${fmt(item.usd)}`;
    return `$${fmt(item.salesPrice)}`;
  };

  const getBreakdown = (item: SparePartItem): string => {
    const yuanVal = item.yuan ?? Number(((item.d / 3.67) * 7.23).toFixed(1));
    return `Price D: ${fmt(item.d)} D · USD+: $${fmt(item.usd)} · Yuan: ¥${fmt(yuanVal)} · Sales $: $${fmt(item.salesPrice)}`;
  };

  const handleScoreIncrease = () => {
    const nextStreak = streak + 1;
    setStreak(nextStreak);
    onStreakUpdate(nextStreak);
    if (nextStreak > maxStreak) setMaxStreak(nextStreak);
    setScore(s => s + 1);

    if (nextStreak >= 3) {
      sound.playStreak(nextStreak);
    } else {
      sound.playCorrect();
    }
  };

  const handleMistake = (title: string, correct: string, breakdown: string, userAns?: string) => {
    setStreak(0);
    onStreakUpdate(0);
    sound.playWrong();
    setWrongAnswers(prev => [...prev, { title, correct, breakdown, userAns }]);

    if (mode === 'survival') {
      setLives(l => {
        const next = l - 1;
        if (next <= 0) {
          setTimeout(() => finishQuiz(), 800);
        }
        return next;
      });
    }
  };

  // Timer logic
  useEffect(() => {
    if (quizPhase === 'running' && timerDuration > 0 && !isAnswered) {
      setTimeLeft(timerDuration);
      if (timerRef.current) clearInterval(timerRef.current);

      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 4 && t > 1) {
            sound.playTick();
          }
          if (t <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            handleTimeOut();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quizPhase, currentIndex, isAnswered, timerDuration]);

  const handleTimeOut = () => {
    if (isAnswered) return;
    setIsAnswered(true);
    const q = currentQuestions[currentIndex];
    if (!q) return;

    handleMistake(q.title, q.correctVal, q.breakdownStr, 'Time expired');
    setFeedback({
      isCorrect: false,
      message: `Time is up! Correct answer: ${q.correctVal}`,
      breakdown: q.breakdownStr
    });

    scheduleNext(false);
  };

  const scheduleNext = (isCorrect: boolean) => {
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    autoAdvanceRef.current = setTimeout(() => {
      goNextQuestion();
    }, isCorrect ? 1400 : 3500);
  };

  const goNextQuestion = () => {
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    setIsAnswered(false);
    setSelectedOption(null);
    setTypeInputValue('');
    setFeedback(null);

    if (currentIndex + 1 >= currentQuestions.length) {
      finishQuiz();
    } else {
      setCurrentIndex(i => i + 1);
    }
  };

  const finishQuiz = () => {
    setQuizPhase('result');
    sound.playVictory();
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // fallback
    }
  };

  const buildPool = (): QuestionItem[] => {
    if (mode === 'compat') {
      return compatList.map(c => ({
        id: c.id,
        title: c.lcd,
        subtitle: 'Compatible Screen Model',
        correctVal: c.fits,
        priceKind: 'D',
        rawItem: c,
        breakdownStr: `Cross-compatible with: ${c.fits}`
      }));
    }

    if (mode === 'changes') {
      const partsMap = new Map(parts.map(p => [p.name, p]));
      return changesList
        .filter(c => /LCD/i.test(c.cat) || /LCD/i.test(c.name))
        .map(c => {
          const actual = partsMap.get(c.name);
          if (!actual) return null;
          const target: 'D' | 'costUsd' | 'salesPrice' = 
            pricePracticeTarget === 'all' 
              ? (['D', 'costUsd', 'salesPrice'][Math.floor(Math.random() * 3)] as any) 
              : pricePracticeTarget === 'dirham' ? 'D' : pricePracticeTarget === 'costUsd' ? 'costUsd' : 'salesPrice';

          return {
            id: `chg-${c.name}`,
            title: c.name,
            subtitle: c.type === 'new' ? 'NEW STOCK' : 'PRICE CHANGE',
            correctVal: getTargetPrice(actual, target),
            priceKind: target,
            rawItem: actual,
            breakdownStr: getBreakdown(actual)
          };
        })
        .filter(Boolean) as QuestionItem[];
    }

    let pool = selectedCats.length > 0 
      ? parts.filter(p => selectedCats.includes(p.cat)) 
      : [...parts];

    if (selMode === 'custom') {
      pool = parts.filter(p => customPickedIds.has(p.id));
    } else if (selMode === 'range') {
      if (sortOrder === 'cheap') {
        pool.sort((a, b) => a.d - b.d);
      } else if (sortOrder === 'expensive') {
        pool.sort((a, b) => b.d - a.d);
      } else {
        pool.sort((a, b) => a.name.localeCompare(b.name));
      }
      const startIdx = Math.max(0, startRank - 1);
      pool = pool.slice(startIdx, startIdx + questionCount);
    } else {
      pool = [...pool].sort(() => Math.random() - 0.5);
    }

    return pool.map(p => {
      let targetKind: 'D' | 'costUsd' | 'salesPrice' = 'D';
      if (pricePracticeTarget === 'all') {
        const kinds: ('D' | 'costUsd' | 'salesPrice')[] = ['D', 'costUsd', 'salesPrice'];
        targetKind = kinds[Math.floor(Math.random() * kinds.length)];
      } else if (pricePracticeTarget === 'dirham') {
        targetKind = 'D';
      } else if (pricePracticeTarget === 'costUsd') {
        targetKind = 'costUsd';
      } else if (pricePracticeTarget === 'salesPrice') {
        targetKind = 'salesPrice';
      }

      return {
        id: p.id,
        title: p.name,
        subtitle: p.cat,
        correctVal: getTargetPrice(p, targetKind),
        priceKind: targetKind,
        rawItem: p,
        breakdownStr: getBreakdown(p)
      };
    });
  };

  const handleStartQuiz = () => {
    const rawPool = buildPool();
    if (rawPool.length === 0) {
      alert("Please select at least one product category or model.");
      return;
    }

    const selectedPool = rawPool.slice(0, questionCount);
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
    setWrongAnswers([]);
    setLives(3);
    setIsAnswered(false);
    setSelectedOption(null);
    setFeedback(null);

    if (flow === 'learn') {
      const batches: QuestionItem[][] = [];
      for (let i = 0; i < selectedPool.length; i += 5) {
        batches.push(selectedPool.slice(i, i + 5));
      }
      setLearnBatches(batches);
      setCurrentBatchIndex(0);
      setCurrentQuestions(batches[0] || []);
      setQuizPhase('learn');
    } else {
      setCurrentQuestions(selectedPool);
      setQuizPhase('running');
    }

    sound.playTick();
  };

  const handleRetryMistakes = () => {
    if (wrongAnswers.length === 0) return;
    const retryPool: QuestionItem[] = wrongAnswers.map(w => {
      const found = parts.find(p => p.name === w.title);
      return {
        id: `retry-${w.title}`,
        title: w.title,
        correctVal: w.correct,
        priceKind: 'D',
        rawItem: found || parts[0],
        breakdownStr: w.breakdown
      };
    });

    setCurrentQuestions(retryPool);
    setWrongAnswers([]);
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
    setQuizPhase('running');
    sound.playTick();
  };

  const currentMcqOptions = useMemo(() => {
    if (quizPhase !== 'running') return [];
    const currentQ = currentQuestions[currentIndex];
    if (!currentQ) return [];

    const correct = currentQ.correctVal;
    const options = new Set<string>([correct]);

    if (mode === 'compat') {
      const allFits = compatList.map(c => c.fits);
      const shuffled = [...allFits].sort(() => Math.random() - 0.5);
      for (const fit of shuffled) {
        if (options.size >= 4) break;
        options.add(fit);
      }
    } else {
      const shuffledParts = [...parts].sort(() => Math.random() - 0.5);
      for (const p of shuffledParts) {
        if (options.size >= 4) break;
        const candidate = getTargetPrice(p, currentQ.priceKind);
        options.add(candidate);
      }
    }

    return Array.from(options).sort(() => Math.random() - 0.5);
  }, [quizPhase, currentIndex, currentQuestions, mode, parts, compatList]);

  const handleSelectOption = (opt: string) => {
    if (isAnswered) return;
    setIsAnswered(true);
    setSelectedOption(opt);
    if (timerRef.current) clearInterval(timerRef.current);

    const currentQ = currentQuestions[currentIndex];
    const isCorrect = opt === currentQ.correctVal;

    if (isCorrect) {
      handleScoreIncrease();
      setFeedback({
        isCorrect: true,
        message: `Correct! Price is ${currentQ.correctVal}`,
        breakdown: currentQ.breakdownStr
      });
    } else {
      handleMistake(currentQ.title, currentQ.correctVal, currentQ.breakdownStr, opt);
      setFeedback({
        isCorrect: false,
        message: `Incorrect! Correct price is: ${currentQ.correctVal}`,
        breakdown: currentQ.breakdownStr
      });
    }

    scheduleNext(isCorrect);
  };

  // Keyboard shortcut listener (1, 2, 3, 4 for MCQ options)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (quizPhase !== 'running' || isAnswered) return;
      if (mode === 'mcq' || (mode === 'compat' && compatSubMode === 'mcq') || mode === 'survival') {
        const keyNum = parseInt(e.key);
        if (keyNum >= 1 && keyNum <= currentMcqOptions.length) {
          const opt = currentMcqOptions[keyNum - 1];
          if (opt) handleSelectOption(opt);
        }
      }
      if (e.key === 'Enter' && isAnswered) {
        goNextQuestion();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [quizPhase, isAnswered, currentMcqOptions]);

  const handleTypeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAnswered || !typeInputValue.trim()) return;

    setIsAnswered(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const currentQ = currentQuestions[currentIndex];
    const cleanUser = typeInputValue.trim().toLowerCase().replace(/[^0-9.]/g, '');
    const cleanCorrect = currentQ.correctVal.toLowerCase().replace(/[^0-9.]/g, '');

    const userNum = parseFloat(cleanUser);
    const correctNum = parseFloat(cleanCorrect);
    const isCorrect = !isNaN(userNum) && !isNaN(correctNum) && Math.abs(userNum - correctNum) < 0.25;

    if (isCorrect) {
      handleScoreIncrease();
      setFeedback({
        isCorrect: true,
        message: `Correct! ${currentQ.correctVal}`,
        breakdown: currentQ.breakdownStr
      });
    } else {
      handleMistake(currentQ.title, currentQ.correctVal, currentQ.breakdownStr, typeInputValue);
      setFeedback({
        isCorrect: false,
        message: `Incorrect! Correct price is: ${currentQ.correctVal}`,
        breakdown: currentQ.breakdownStr
      });
    }

    scheduleNext(isCorrect);
  };

  const currentTfData = useMemo(() => {
    if (quizPhase !== 'running') return { shownVal: '', isActuallyTrue: true };
    const currentQ = currentQuestions[currentIndex];
    if (!currentQ) return { shownVal: '', isActuallyTrue: true };

    const shouldBeTrue = Math.random() > 0.5;
    if (shouldBeTrue) {
      return { shownVal: currentQ.correctVal, isActuallyTrue: true };
    } else {
      const other = parts.find(p => p.name !== currentQ.title);
      const fake = other ? getTargetPrice(other, currentQ.priceKind) : '$24.5';
      return { shownVal: fake, isActuallyTrue: false };
    }
  }, [quizPhase, currentIndex, currentQuestions, parts]);

  const handleTfAnswer = (userSaysTrue: boolean) => {
    if (isAnswered) return;
    setIsAnswered(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const currentQ = currentQuestions[currentIndex];
    const isCorrect = userSaysTrue === currentTfData.isActuallyTrue;

    if (isCorrect) {
      handleScoreIncrease();
      setFeedback({
        isCorrect: true,
        message: `Correct! Real price is: ${currentQ.correctVal}`,
        breakdown: currentQ.breakdownStr
      });
    } else {
      handleMistake(currentQ.title, currentQ.correctVal, currentQ.breakdownStr, userSaysTrue ? 'TRUE' : 'FALSE');
      setFeedback({
        isCorrect: false,
        message: `Incorrect! Real price is: ${currentQ.correctVal}`,
        breakdown: currentQ.breakdownStr
      });
    }

    scheduleNext(isCorrect);
  };

  const getQuestionLabel = (kind: 'D' | 'costUsd' | 'salesPrice') => {
    if (kind === 'D') return "What is the Price D (Dirham)?";
    if (kind === 'costUsd') return "What is the USD+ (Cost = D/3.67+Exp)?";
    return "What is the Sales $ (Retail Price)?";
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-150">

      {/* ================= PHASE 1: QUIZ SETUP (FULL PAGE WIDTH) ================= */}
      {quizPhase === 'setup' && (
        <div className="bg-[#0b111e] border border-slate-800 rounded-3xl p-5 sm:p-8 lg:p-10 shadow-2xl space-y-8 w-full">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-cyan-400" />
                <span>Price Memorization Practice</span>
              </h2>
              <p className="text-sm sm:text-base text-slate-300 font-normal mt-1">
                Train and test your memory on <strong>Price D</strong>, <strong>USD+</strong>, and <strong>Sales $</strong>.
              </p>
            </div>

            {maxStreak > 0 && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm font-bold shrink-0">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span>Best Streak: {maxStreak} In A Row</span>
              </div>
            )}
          </div>

          {/* STEP 1: SELECT WHAT TO PRACTICE - 500 Medium labels, 600 SemiBold options, 700 Bold figures */}
          <div className="space-y-3">
            <label className="block text-xs font-medium uppercase tracking-wider text-cyan-400">
              1. Choose Price to Practice:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[
                { id: 'dirham', title: 'Price D (Dirham)', desc: 'Supplier AED price (e.g. 115 D)', color: 'text-cyan-400' },
                { id: 'costUsd', title: 'USD+ (Cost in USD)', desc: 'Formula: Price D / 3.67 + Expense', color: 'text-emerald-400' },
                { id: 'salesPrice', title: 'Sales $ (Retail)', desc: 'Customer price = USD+ * 1.30', color: 'text-violet-400' },
                { id: 'all', title: 'All 3 (Mixed)', desc: 'Rotate between Price D, USD+, and Sales $', color: 'text-amber-300' }
              ].map(pt => (
                <button
                  key={pt.id}
                  type="button"
                  onClick={() => { sound.playTick(); setPricePracticeTarget(pt.id as PricePracticeTarget); }}
                  className={`p-4 sm:p-5 rounded-2xl border-2 text-left transition-all ${
                    pricePracticeTarget === pt.id
                      ? 'bg-cyan-500/15 border-cyan-400 shadow-xl shadow-cyan-950/50 ring-2 ring-cyan-500/30'
                      : 'bg-[#070c18] border-slate-700/80 hover:border-slate-500'
                  }`}
                >
                  <span className={`block font-semibold text-base sm:text-lg ${pt.color}`}>{pt.title}</span>
                  <span className="text-xs sm:text-sm text-slate-300 font-normal mt-1 block">{pt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* STEP 2: QUIZ FORMAT / MODE - 600 SemiBold buttons */}
          <div className="space-y-3">
            <label className="block text-xs font-medium uppercase tracking-wider text-cyan-400">
              2. Quiz Mode:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { id: 'mcq', label: 'Multiple Choice', desc: '4 Options (Keys 1-4)' },
                { id: 'type', label: 'Type Price', desc: 'Fast numerical input' },
                { id: 'truefalse', label: 'True / False', desc: 'Flashcard speed quiz' },
                { id: 'match', label: 'Match Pairs', desc: 'Connect part with price' },
                { id: 'compat', label: 'Compatibility', desc: 'Which LCD fits which phone' },
                { id: 'survival', label: 'Survival Mode', desc: '3 Lives · Beat high score' }
              ].map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => { sound.playTick(); setMode(m.id as QuizMode); }}
                  className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    mode === m.id
                      ? 'bg-gradient-to-br from-cyan-600/30 to-indigo-600/30 border-cyan-400 text-white shadow-lg'
                      : 'bg-[#070c18] border-slate-700/80 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <span className="font-semibold text-sm sm:text-base text-white block">{m.label}</span>
                  <span className="text-xs text-slate-400 font-normal mt-1 block">{m.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* STEP 3: CATEGORY SELECTION & SCOPE */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium uppercase tracking-wider text-cyan-400">
                3. Choose Parts Category:
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCats([])}
                  className="text-xs font-semibold text-cyan-400 hover:underline"
                >
                  All Categories ({parts.length})
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {availableCategories.map(cat => {
                const isSelected = selectedCats.includes(cat);
                const count = parts.filter(p => p.cat === cat).length;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      sound.playTick();
                      if (isSelected) {
                        setSelectedCats(selectedCats.filter(c => c !== cat));
                      } else {
                        setSelectedCats([...selectedCats, cat]);
                      }
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md'
                        : 'bg-[#070c18] border-slate-700/80 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 4: QUESTION COUNT & TIMER */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-300 mb-2">
                Questions
              </label>
              <div className="flex gap-2">
                {[10, 20, 50, 100].map(cnt => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setQuestionCount(cnt)}
                    className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
                      questionCount === cnt
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                        : 'bg-[#070c18] border-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    {cnt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-300 mb-2">
                Speed Timer
              </label>
              <div className="flex gap-2">
                {[
                  { sec: 0, label: 'Off' },
                  { sec: 15, label: '15s' },
                  { sec: 10, label: '10s' },
                  { sec: 5, label: '5s' }
                ].map(t => (
                  <button
                    key={t.sec}
                    type="button"
                    onClick={() => setTimerDuration(t.sec)}
                    className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
                      timerDuration === t.sec
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                        : 'bg-[#070c18] border-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleStartQuiz}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 active:scale-95 text-white font-semibold text-base sm:text-lg shadow-xl shadow-cyan-950/60 transition-all flex items-center justify-center gap-3 cursor-pointer"
              >
                <span>Start Practice Quiz</span>
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ================= PHASE 2: RUNNING QUIZ ================= */}
      {quizPhase === 'running' && currentQuestions[currentIndex] && (
        <div className="bg-[#0b111e] border-2 border-slate-700/80 rounded-3xl p-6 sm:p-10 lg:p-12 shadow-2xl space-y-8 w-full">
          
          {/* Top Status Row */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-800 gap-4">
            
            {/* Progress */}
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-xl sm:text-2xl text-cyan-400">
                {currentIndex + 1}
              </span>
              <span className="text-slate-500 font-mono text-base sm:text-lg">/</span>
              <span className="font-mono text-slate-400 font-medium text-base sm:text-lg">
                {currentQuestions.length}
              </span>
            </div>

            {/* Streak & Score */}
            <div className="flex items-center gap-3 sm:gap-5">
              {streak > 1 && (
                <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 font-mono font-bold text-sm animate-pulse">
                  <Flame className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{streak} STREAK</span>
                </div>
              )}

              {mode === 'survival' && (
                <div className="flex items-center gap-1">
                  {[...Array(3)].map((_, i) => (
                    <Heart
                      key={i}
                      className={`w-6 h-6 ${i < lives ? 'fill-rose-500 text-rose-500' : 'text-slate-700'}`}
                    />
                  ))}
                </div>
              )}

              <span className="font-mono text-sm sm:text-base font-bold text-emerald-400 bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-900/40">
                Score: {score}
              </span>

              <button
                type="button"
                onClick={() => setQuizPhase('setup')}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                title="Exit Quiz"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Question Banner - 700 Bold headings */}
          <div className="text-center space-y-3 py-4">
            <span className="inline-block px-4 py-1.5 rounded-xl bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 font-mono text-xs sm:text-sm font-semibold uppercase tracking-wider">
              {getQuestionLabel(currentQuestions[currentIndex].priceKind)}
            </span>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">
              {currentQuestions[currentIndex].title}
            </h1>
            {currentQuestions[currentIndex].subtitle && (
              <span className="text-xs sm:text-sm text-slate-400 font-normal block">
                {currentQuestions[currentIndex].subtitle}
              </span>
            )}
          </div>

          {/* MCQ Mode Options - 600 SemiBold buttons */}
          {(mode === 'mcq' || (mode === 'compat' && compatSubMode === 'mcq') || mode === 'survival' || mode === 'changes') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
              {currentMcqOptions.map((opt, idx) => {
                const isSelected = selectedOption === opt;
                const isCorrect = opt === currentQuestions[currentIndex].correctVal;

                let btnStyle = 'bg-[#070c18] border-2 border-slate-700 hover:border-cyan-400 hover:bg-slate-800/70 text-white';
                if (isAnswered) {
                  if (isCorrect) {
                    btnStyle = 'bg-emerald-600/30 border-2 border-emerald-400 text-emerald-200 shadow-lg shadow-emerald-950/50';
                  } else if (isSelected) {
                    btnStyle = 'bg-rose-600/30 border-2 border-rose-500 text-rose-200';
                  } else {
                    btnStyle = 'opacity-40 bg-[#070c18] border-slate-800 text-slate-500';
                  }
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isAnswered}
                    onClick={() => handleSelectOption(opt)}
                    className={`p-5 sm:p-6 rounded-2xl flex items-center justify-between font-mono text-xl sm:text-2xl font-semibold transition-all active:scale-95 cursor-pointer ${btnStyle}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 text-xs font-sans font-medium flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span>{opt}</span>
                    </div>

                    {isAnswered && isCorrect && <CheckCircle2 className="w-7 h-7 text-emerald-400 shrink-0" />}
                    {isAnswered && isSelected && !isCorrect && <XCircle className="w-7 h-7 text-rose-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Type Mode - 500 Medium inputs */}
          {mode === 'type' && (
            <form onSubmit={handleTypeSubmit} className="max-w-xl mx-auto space-y-4">
              <div className="relative">
                <input
                  type="text"
                  autoFocus
                  disabled={isAnswered}
                  value={typeInputValue}
                  onChange={(e) => setTypeInputValue(e.target.value)}
                  placeholder="Type number (e.g. 115 or 32.02)..."
                  className="w-full bg-[#070c18] border-2 border-slate-700 focus:border-cyan-400 rounded-2xl px-6 py-5 text-2xl sm:text-3xl text-center text-white font-mono font-medium outline-none placeholder-slate-600 shadow-inner"
                />
              </div>
              {!isAnswered && (
                <button
                  type="submit"
                  className="w-full py-4 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-lg transition-all shadow-lg"
                >
                  Submit Answer (Press Enter)
                </button>
              )}
            </form>
          )}

          {/* True / False Mode */}
          {mode === 'truefalse' && (
            <div className="max-w-2xl mx-auto space-y-6 text-center">
              <div className="p-6 rounded-2xl bg-[#070c18] border border-slate-700">
                <span className="text-slate-400 text-sm font-normal block mb-1">Does this product cost:</span>
                <span className="text-3xl sm:text-4xl font-mono font-bold text-cyan-300">
                  {currentTfData.shownVal}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  disabled={isAnswered}
                  onClick={() => handleTfAnswer(true)}
                  className="py-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xl shadow-lg transition-all"
                >
                  TRUE
                </button>
                <button
                  type="button"
                  disabled={isAnswered}
                  onClick={() => handleTfAnswer(false)}
                  className="py-5 rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-semibold text-xl shadow-lg transition-all"
                >
                  FALSE
                </button>
              </div>
            </div>
          )}

          {/* Feedback Bar */}
          {feedback && (
            <div className={`p-5 rounded-2xl border text-center space-y-2 max-w-3xl mx-auto animate-in zoom-in-95 duration-150 ${
              feedback.isCorrect 
                ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200' 
                : 'bg-rose-950/40 border-rose-500 text-rose-200'
            }`}>
              <div className="text-lg sm:text-xl font-bold">
                {feedback.message}
              </div>
              {feedback.breakdown && (
                <div className="text-xs sm:text-sm font-mono text-slate-300 pt-1 border-t border-slate-700/60 font-medium">
                  {feedback.breakdown}
                </div>
              )}
              <div className="text-xs text-slate-400 pt-1 font-normal">
                Advancing automatically... or press <strong>Enter</strong>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ================= PHASE 3: RESULTS SCREEN ================= */}
      {quizPhase === 'result' && (
        <div className="bg-[#0b111e] border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl max-w-4xl mx-auto space-y-7 text-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-300 mx-auto flex items-center justify-center shadow-2xl shadow-amber-500/40">
            <Trophy className="w-10 h-10 text-slate-950" />
          </div>

          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Quiz Completed!</h2>
            <p className="text-slate-400 text-sm sm:text-base font-normal mt-1">Here is your memorization breakdown:</p>
          </div>

          {/* Score Cards - 700 Bold figures */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-lg mx-auto font-mono">
            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 block font-sans font-normal">Score</span>
              <span className="text-2xl sm:text-3xl font-bold text-emerald-400">{score}</span>
            </div>
            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 block font-sans font-normal">Accuracy</span>
              <span className="text-2xl sm:text-3xl font-bold text-cyan-400">
                {currentQuestions.length > 0 ? Math.round((score / currentQuestions.length) * 100) : 0}%
              </span>
            </div>
            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 block font-sans font-normal">Best Streak</span>
              <span className="text-2xl sm:text-3xl font-bold text-amber-400">{maxStreak}</span>
            </div>
          </div>

          {/* Wrong Answers Review */}
          {wrongAnswers.length > 0 && (
            <div className="text-left bg-[#070c18] border border-slate-800 rounded-2xl p-5 space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-rose-400 block">
                Missed Items ({wrongAnswers.length}):
              </span>
              <div className="divide-y divide-slate-800/60 max-h-60 overflow-y-auto pr-2">
                {wrongAnswers.map((w, i) => (
                  <div key={i} className="py-2.5 flex items-start justify-between gap-3 text-xs sm:text-sm">
                    <div>
                      <span className="font-semibold text-white block">{w.title}</span>
                      <span className="text-slate-400 text-xs font-mono font-normal">{w.breakdown}</span>
                    </div>
                    <span className="font-mono text-emerald-400 font-bold shrink-0">
                      Correct: {w.correct}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons - 600 SemiBold */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {wrongAnswers.length > 0 && (
              <button
                type="button"
                onClick={handleRetryMistakes}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold text-sm transition-all shadow-lg"
              >
                Retry {wrongAnswers.length} Mistakes Only
              </button>
            )}

            <button
              type="button"
              onClick={handleStartQuiz}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm transition-all shadow-lg"
            >
              Play Again
            </button>

            <button
              type="button"
              onClick={() => setQuizPhase('setup')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-colors"
            >
              Back to Quiz Setup
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
