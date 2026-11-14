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
  DollarSign,
  Plus,
  X,
  TrendingDown,
  TrendingUp,
  Smartphone,
  PackagePlus,
  Layers,
  Calendar,
  Percent,
  BarChart3,
  History,
  Building2,
  Plane,
  Ship
} from 'lucide-react';
import { SparePartItem, CompatItem, ChangeItem, PriceChangeRecord } from '../data/initialData';
import { extractPhoneModel } from '../utils/productUtils';
import { sound } from '../services/soundService';

export interface QuizViewProps {
  parts: SparePartItem[];
  compatList: CompatItem[];
  changesList: ChangeItem[];
  priceChanges?: PriceChangeRecord[];
  onAddPriceChange?: (record: Omit<PriceChangeRecord, 'id'>) => void;
  onDeletePriceChange?: (id: string) => void;
  onAddPart?: (part: Omit<SparePartItem, 'id'>) => void;
  onUpdatePart?: (id: string, updatedFields: Partial<SparePartItem>) => void;
  initialQuizMode?: QuizMode;
  onStreakUpdate: (streak: number) => void;
}

export type QuizMode = 'mcq' | 'type' | 'truefalse' | 'any' | 'match' | 'samePrice' | 'compat' | 'changes' | 'survival' | 'pricetracker' | 'series';
export type CompatSubMode = 'mcq' | 'match' | 'truefalse' | 'type';
export type SelMode = 'random' | 'range' | 'custom';
export type FlowMode = 'quiz' | 'learn';
export type PricePracticeTarget = 'all' | 'dirham' | 'costUsd' | 'salesPrice';

export interface QuestionItem {
  id: string;
  title: string;
  subtitle?: string;
  correctVal: string;
  priceKind: 'D' | 'costUsd' | 'salesPrice' | 'yuan' | 'allThree';
  rawItem: SparePartItem | CompatItem | ChangeItem | PriceChangeRecord;
  breakdownStr: string;
  assignedMode?: 'mcq' | 'type' | 'truefalse';
  allThreeAnswers?: {
    d: number;
    usd: number;
    salesPrice: number;
  };
  seriesModel?: string;
  seriesPartName?: string;
  seriesPartIndex?: number;
  seriesTotalParts?: number;
  priceTargetLabel?: string;
  priceStep?: string;
  priceTrackerType?: 'new' | 'increase' | 'decrease';
  oldD?: number;
  newD?: number;
  oldUsd?: number;
  newUsd?: number;
  deltaD?: number;
  percentage?: number;
  date?: string;
  companyName?: string;
  shippingMethod?: 'air' | 'sea' | string;
  origin?: 'Dubai' | 'China' | string;
}

export { extractPhoneModel } from '../utils/productUtils';

// True Fisher-Yates array shuffle for non-deterministic randomization across entire catalog
export function shuffleArray<T>(items: T[]): T[] {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export const QuizView: React.FC<QuizViewProps> = ({
  parts,
  compatList,
  changesList,
  priceChanges = [],
  onAddPriceChange,
  onDeletePriceChange,
  onAddPart,
  onUpdatePart,
  initialQuizMode,
  onStreakUpdate
}) => {
  // Setup configuration state
  const [flow, setFlow] = useState<FlowMode>('quiz');
  const [mode, setMode] = useState<QuizMode>(initialQuizMode || 'mcq');
  const [specialChallenge, setSpecialChallenge] = useState<'catalog' | 'series' | 'compat' | 'pricetracker'>('catalog');
  const [isSurvivalMode, setIsSurvivalMode] = useState<boolean>(false);
  const [compatSubMode, setCompatSubMode] = useState<CompatSubMode>('mcq');
  const [changeSubMode, setChangeSubMode] = useState<'mcq' | 'type' | 'truefalse' | 'match'>('mcq');
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [selMode, setSelMode] = useState<SelMode>('random');
  const [sortOrder, setSortOrder] = useState<'cheap' | 'expensive' | 'az'>('cheap');
  const [startRank, setStartRank] = useState<number>(1);
  const [questionCount, setQuestionCount] = useState<number>(20);
  const [isCustomCount, setIsCustomCount] = useState<boolean>(false);
  const [customCountInput, setCustomCountInput] = useState<string>('20');
  const [pricePracticeTarget, setPricePracticeTarget] = useState<PricePracticeTarget>('dirham');
  const [timerDuration, setTimerDuration] = useState<number>(0);

  // Category green box preview state
  const [previewCategory, setPreviewCategory] = useState<string>('SAMSUNG / LCD');
  const [previewSearch, setPreviewSearch] = useState<string>('');

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
  const [wrongAnswers, setWrongAnswers] = useState<{ 
    title: string; 
    correct: string; 
    breakdown: string; 
    userAns?: string;
    companyName?: string;
    shippingMethod?: string;
    origin?: string;
  }[]>([]);

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

  // Interactive State for "Price D / USD + / Sale" (Feature 2A)
  const [allThreeD, setAllThreeD] = useState('');
  const [allThreeUsd, setAllThreeUsd] = useState('');
  const [allThreeSales, setAllThreeSales] = useState('');
  const [allThreeResult, setAllThreeResult] = useState<{ dOk: boolean; usdOk: boolean; salesOk: boolean } | null>(null);

  // Series Products Configuration State (Feature 2B)
  const [selectedSeriesModel, setSelectedSeriesModel] = useState<string>('__all__');
  const [seriesSearchTerm, setSeriesSearchTerm] = useState('');

  // Price Tracker Quiz Mode State (Feature 1 & 2C)
  const [priceTrackerQuizFilter, setPriceTrackerQuizFilter] = useState<'all' | 'new' | 'increase' | 'decrease'>('all');
  const [showPriceTrackerHistory, setShowPriceTrackerHistory] = useState(false);

  // Phone Models grouping for Series Products Quiz Mode
  const phoneModelsMap = useMemo(() => {
    const map: Record<string, SparePartItem[]> = {};
    parts.forEach(p => {
      const model = extractPhoneModel(p.name, p.cat);
      if (!map[model]) map[model] = [];
      map[model].push(p);
    });

    // Sort parts logically within each series: LCDs (JH, ZY, GX...) first, Batteries, Flex, Glass, Speaker, Sensor...
    Object.keys(map).forEach(m => {
      map[m].sort((a, b) => {
        const getRank = (item: SparePartItem) => {
          const u = `${item.name} ${item.cat}`.toUpperCase();
          if (u.includes('LCD') || u.includes('OLED') || /\b(JH|ZY|GX|DD|WF)\b/.test(u)) return 1;
          if (u.includes('BATTERY')) return 2;
          if (u.includes('FLEX') || u.includes('CHARGER') || u.includes('USB')) return 3;
          if (u.includes('BACKGLASS') || u.includes('GLASS') || u.includes('COVER')) return 4;
          if (u.includes('SPEAKER') || u.includes('SENSOR') || u.includes('CAMERA') || u.includes('FLASH')) return 5;
          return 6;
        };
        return getRank(a) - getRank(b);
      });
    });

    return map;
  }, [parts]);

  const availablePhoneModels = useMemo(() => {
    return Object.keys(phoneModelsMap)
      .filter(m => phoneModelsMap[m].length > 0 && m !== 'Other')
      .sort((a, b) => phoneModelsMap[b].length - phoneModelsMap[a].length);
  }, [phoneModelsMap]);

  const filteredPhoneModels = useMemo(() => {
    if (!seriesSearchTerm.trim()) return availablePhoneModels;
    const q = seriesSearchTerm.trim().toLowerCase();
    return availablePhoneModels.filter(m => m.toLowerCase().includes(q));
  }, [availablePhoneModels, seriesSearchTerm]);

  // Price Tracker Stats for Quiz Page
  const priceTrackerStats = useMemo(() => {
    const list = priceChanges || [];
    const increases = list.filter(c => c.type === 'increase');
    const decreases = list.filter(c => c.type === 'decrease');
    const newItems = list.filter(c => c.type === 'new');
    return {
      total: list.length,
      increasesCount: increases.length,
      decreasesCount: decreases.length,
      newItemsCount: newItems.length
    };
  }, [priceChanges]);

  // Learn Mode Batches
  const [learnBatches, setLearnBatches] = useState<QuestionItem[][]>([]);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);

  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState('ALL');

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    parts.forEach(p => set.add(p.cat));
    return Array.from(set).sort();
  }, [parts]);

  const filteredAvailableCategories = useMemo(() => {
    let list = availableCategories;
    if (selectedBrandFilter !== 'ALL') {
      list = list.filter(c => c.toLowerCase().includes(selectedBrandFilter.toLowerCase()));
    }
    if (categorySearchQuery.trim()) {
      const q = categorySearchQuery.trim().toLowerCase();
      list = list.filter(c => c.toLowerCase().includes(q));
    }
    return list;
  }, [availableCategories, selectedBrandFilter, categorySearchQuery]);

  const categoryProducts = useMemo(() => {
    let list = parts;
    if (previewCategory && previewCategory !== '__all__') {
      list = list.filter(p => p.cat.toLowerCase() === previewCategory.toLowerCase());
    } else if (selectedCats.length > 0) {
      list = list.filter(p => selectedCats.includes(p.cat));
    }
    if (previewSearch.trim()) {
      const q = previewSearch.trim().toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.cat.toLowerCase().includes(q));
    }
    return list;
  }, [parts, previewCategory, selectedCats, previewSearch]);

  const customFilteredProducts = useMemo(() => {
    if (!customSearch.trim()) return parts;
    const q = customSearch.trim().toLowerCase();
    return parts.filter(p => p.name.toLowerCase().includes(q) || p.cat.toLowerCase().includes(q));
  }, [parts, customSearch]);

  const handlePracticeSinglePart = (part: SparePartItem) => {
    sound.playVictory();
    const targetKind: 'D' | 'costUsd' | 'salesPrice' = pricePracticeTarget === 'all' ? 'D' : (pricePracticeTarget as any);
    const q: QuestionItem = {
      id: `q-single-${part.id}`,
      title: part.name,
      subtitle: `Category: ${part.cat}`,
      correctVal: getTargetPrice(part, targetKind),
      priceKind: targetKind,
      rawItem: part,
      breakdownStr: getBreakdown(part),
      companyName: part.companyName,
      shippingMethod: part.shippingMethod || 'air',
      origin: part.origin || (part.cat && part.cat.includes('LCD') ? 'China' : 'Dubai')
    };
    setCurrentQuestions([q]);
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
    setQuizPhase('running');
    setIsAnswered(false);
    setSelectedOption(null);
    setTypeInputValue('');
    setFeedback(null);
  };

  const fmt = (num: number) => {
    const r = Math.round(num * 10) / 10;
    return r === 0 && num !== 0 ? num.toFixed(2) : r.toFixed(1);
  };

  const getTargetPrice = (item: SparePartItem, target: 'D' | 'costUsd' | 'salesPrice' | 'yuan' | 'allThree'): string => {
    if (target === 'D') return `${fmt(item.d)} D`;
    if (target === 'costUsd') return `$${fmt(item.usd)}`;
    if (target === 'yuan') {
      const yuanVal = typeof item.yuan === 'number' && !isNaN(item.yuan) ? item.yuan : Number(((item.d / 3.67) * 7.23).toFixed(1));
      return `¥${fmt(yuanVal)}`;
    }
    if (target === 'allThree') return `${fmt(item.d)} D · $${fmt(item.usd)} · $${fmt(item.salesPrice)}`;
    return `$${fmt(item.salesPrice)}`;
  };

  const getBreakdown = (item: SparePartItem): string => {
    const yuanVal = typeof item.yuan === 'number' && !isNaN(item.yuan) ? item.yuan : (item.isCustom ? 0 : Number(((item.d / 3.67) * 7.23).toFixed(1)));
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

  const handleMistake = (title: string, correct: string, breakdown: string, userAns?: string, specificQ?: QuestionItem) => {
    setStreak(0);
    onStreakUpdate(0);
    sound.playWrong();
    const activeQ = specificQ || currentQuestions[currentIndex];
    setWrongAnswers(prev => [...prev, { 
      title, 
      correct, 
      breakdown, 
      userAns,
      companyName: activeQ?.companyName,
      shippingMethod: activeQ?.shippingMethod,
      origin: activeQ?.origin
    }]);

    if (isSurvivalMode) {
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
    setAllThreeD('');
    setAllThreeUsd('');
    setAllThreeSales('');
    setAllThreeResult(null);
    setFeedback(null);

    if (currentIndex + 1 >= currentQuestions.length) {
      finishQuiz();
    } else {
      setCurrentIndex(i => i + 1);
    }
  };

  const handleAllThreeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAnswered) return;
    const currentQ = currentQuestions[currentIndex];
    if (!currentQ || !currentQ.allThreeAnswers) return;

    setIsAnswered(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const userD = parseFloat(allThreeD.trim().replace(/[^0-9.]/g, ''));
    const userUsd = parseFloat(allThreeUsd.trim().replace(/[^0-9.]/g, ''));
    const userSales = parseFloat(allThreeSales.trim().replace(/[^0-9.]/g, ''));

    const expected = currentQ.allThreeAnswers;
    const dOk = !isNaN(userD) && Math.abs(userD - expected.d) < 0.25;
    const usdOk = !isNaN(userUsd) && Math.abs(userUsd - expected.usd) < 0.25;
    const salesOk = !isNaN(userSales) && Math.abs(userSales - expected.salesPrice) < 0.25;

    const allOk = dOk && usdOk && salesOk;
    setAllThreeResult({ dOk, usdOk, salesOk });

    if (allOk) {
      handleScoreIncrease();
      setFeedback({
        isCorrect: true,
        message: `All 3 Prices Correct! (${fmt(expected.d)} D · $${fmt(expected.usd)} · $${fmt(expected.salesPrice)})`,
        breakdown: currentQ.breakdownStr
      });
    } else {
      const userSummary = `D: ${allThreeD || 'empty'} | USD+: ${allThreeUsd || 'empty'} | Sales: ${allThreeSales || 'empty'}`;
      handleMistake(currentQ.title, `${fmt(expected.d)} D / $${fmt(expected.usd)} / $${fmt(expected.salesPrice)}`, currentQ.breakdownStr, userSummary);
      setFeedback({
        isCorrect: false,
        message: `Incorrect! Review saved prices below:`,
        breakdown: `Saved: ${fmt(expected.d)} D (${dOk ? '✓' : '✗ ' + (allThreeD || 'empty')}) · USD+: $${fmt(expected.usd)} (${usdOk ? '✓' : '✗ ' + (allThreeUsd || 'empty')}) · Sales $: $${fmt(expected.salesPrice)} (${salesOk ? '✓' : '✗ ' + (allThreeSales || 'empty')})`
      });
    }

    scheduleNext(allOk);
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
    // 1. Compatibility Mode
    if (specialChallenge === 'compat') {
      return compatList.map(c => ({
        id: c.id,
        title: c.lcd,
        subtitle: 'Compatible Screen Model',
        correctVal: c.fits,
        priceKind: 'D',
        rawItem: c,
        breakdownStr: `Cross-compatible with: ${c.fits}`,
        assignedMode: (['mcq', 'type', 'truefalse'] as const)[Math.floor(Math.random() * 3)]
      }));
    }

    // 2. Price Tracker Quiz Mode (Respects Step 1 Price choice!)
    if (specialChallenge === 'pricetracker') {
      let trackerList = (priceChanges && priceChanges.length > 0) ? priceChanges : [];
      if (trackerList.length === 0) {
        trackerList = parts.slice(0, 30).map((p, i) => {
          const type: 'new' | 'increase' | 'decrease' = (i % 3 === 0 ? 'increase' : (i % 3 === 1 ? 'decrease' : 'new'));
          const oldD = type === 'new' ? 0 : (type === 'increase' ? Number((p.d * 0.85).toFixed(1)) : Number((p.d * 1.15).toFixed(1)));
          const deltaD = Math.round((p.d - oldD) * 10) / 10;
          return {
            id: `pc-${p.id}`,
            name: p.name,
            cat: p.cat,
            oldD,
            newD: p.d,
            oldUsd: Number((oldD / 3.67).toFixed(2)),
            newUsd: p.usd,
            type,
            deltaD,
            percentage: oldD > 0 ? Math.round(((p.d - oldD) / oldD) * 100) : 100,
            date: new Date().toISOString().split('T')[0],
            note: 'Tracked product change'
          };
        });
      }

      if (priceTrackerQuizFilter !== 'all') {
        trackerList = trackerList.filter(c => c.type === priceTrackerQuizFilter);
      }

      return trackerList.map(item => {
        const typeLabel = 
          item.type === 'new' ? 'NEW PRODUCT ARRIVAL' :
          item.type === 'increase' ? 'PRICE INCREASE' : 'PRICE DECREASE';
        const oldInfo = item.type === 'new' 
          ? `Category: ${item.cat} · Newly Added` 
          : `Old Price was: ${fmt(item.oldD)} D ($${fmt(item.oldUsd)})`;

        const matchedPart = parts.find(p => p.name.toLowerCase() === item.name.toLowerCase());
        const targetKind: 'D' | 'costUsd' | 'salesPrice' =
          pricePracticeTarget === 'all'
            ? (['D', 'costUsd', 'salesPrice'][Math.floor(Math.random() * 3)] as 'D' | 'costUsd' | 'salesPrice')
            : pricePracticeTarget === 'dirham'
            ? 'D'
            : pricePracticeTarget === 'costUsd'
            ? 'costUsd'
            : 'salesPrice';

        const computedSales = matchedPart?.salesPrice ?? Number((item.newUsd * 1.3).toFixed(1));
        const correctVal =
          targetKind === 'D'
            ? `${fmt(item.newD)} D`
            : targetKind === 'costUsd'
            ? `$${fmt(item.newUsd)}`
            : `$${fmt(computedSales)}`;

        return {
          id: `pt-${item.id}`,
          title: item.name,
          subtitle: `${typeLabel} · ${oldInfo}`,
          correctVal,
          priceKind: targetKind,
          rawItem: item,
          breakdownStr: item.type === 'new'
            ? `New Product: ${item.name} (${item.cat}) · Price D: ${fmt(item.newD)} D · USD+: $${fmt(item.newUsd)} · Sales $: $${fmt(computedSales)}`
            : `Old: ${fmt(item.oldD)} D ($${fmt(item.oldUsd)}) ➔ New: ${fmt(item.newD)} D ($${fmt(item.newUsd)}) · Sales $: $${fmt(computedSales)} · Delta: ${item.deltaD > 0 ? '+' : ''}${fmt(item.deltaD)} D (${item.percentage}%)`,
          assignedMode: (['mcq', 'type', 'truefalse'] as const)[Math.floor(Math.random() * 3)],
          priceTrackerType: item.type,
          oldD: item.oldD,
          newD: item.newD,
          oldUsd: item.oldUsd,
          newUsd: item.newUsd,
          deltaD: item.deltaD,
          percentage: item.percentage,
          date: item.date,
          companyName: matchedPart?.companyName || (item as any).companyName,
          shippingMethod: matchedPart?.shippingMethod || (item as any).shippingMethod || 'air',
          origin: matchedPart?.origin || (item as any).origin || (item.cat && item.cat.includes('LCD') ? 'China' : 'Dubai')
        };
      });
    }

    // 3. Series Products Mode (Respects Step 1 Price choice & Step 2 Quiz Mode!)
    if (specialChallenge === 'series') {
      let modelsToPractice = availablePhoneModels;
      if (selectedSeriesModel && selectedSeriesModel !== '__all__') {
        modelsToPractice = [selectedSeriesModel];
      }

      const seriesPool: QuestionItem[] = [];
      modelsToPractice.forEach(model => {
        const modelParts = phoneModelsMap[model] || [];
        modelParts.forEach((part, idx) => {
          const makeSeriesQ = (
            targetKind: 'D' | 'costUsd' | 'salesPrice',
            label: string,
            stepText?: string
          ): QuestionItem => ({
            id: `series-${model}-${part.id}-${targetKind}`,
            title: part.name,
            subtitle: `📱 Series: ${model} · Part ${idx + 1} of ${modelParts.length} (${part.cat})`,
            priceTargetLabel: label,
            priceStep: stepText || `Part ${idx + 1} of ${modelParts.length}`,
            correctVal: getTargetPrice(part, targetKind),
            priceKind: targetKind,
            rawItem: part,
            breakdownStr: `Model: ${model} · Part: ${part.name} (${part.cat}) ➔ Price D: ${fmt(part.d)} D · USD+: $${fmt(part.usd)} · Sales $: $${fmt(part.salesPrice)}`,
            seriesModel: model,
            seriesPartName: part.name,
            seriesPartIndex: idx + 1,
            seriesTotalParts: modelParts.length,
            assignedMode: (['mcq', 'type', 'truefalse'] as const)[Math.floor(Math.random() * 3)],
            companyName: part.companyName,
            shippingMethod: part.shippingMethod || 'air',
            origin: part.origin || (part.cat && part.cat.includes('LCD') ? 'China' : 'Dubai')
          });

          if (pricePracticeTarget === 'dirham') {
            seriesPool.push(makeSeriesQ('D', 'Price D (Dirham AED)'));
          } else if (pricePracticeTarget === 'costUsd') {
            seriesPool.push(makeSeriesQ('costUsd', 'USD+ (Cost in USD)'));
          } else if (pricePracticeTarget === 'salesPrice') {
            seriesPool.push(makeSeriesQ('salesPrice', 'Sale Price ($)'));
          } else {
            const kinds: ('D' | 'costUsd' | 'salesPrice')[] = ['D', 'costUsd', 'salesPrice'];
            const chosen = kinds[Math.floor(Math.random() * kinds.length)];
            const label = chosen === 'D' ? 'Price D (Dirham AED)' : chosen === 'costUsd' ? 'USD+ (Cost in USD)' : 'Sale Price ($)';
            seriesPool.push(makeSeriesQ(chosen, label));
          }
        });
      });
      return seriesPool;
    }

    // 4. Standard Catalog Changes Mode
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
            breakdownStr: getBreakdown(actual),
            companyName: actual.companyName,
            shippingMethod: actual.shippingMethod || 'air',
            origin: actual.origin || (actual.cat && actual.cat.includes('LCD') ? 'China' : 'Dubai')
          };
        })
        .filter(Boolean) as QuestionItem[];
    }

    // 5. Standard Catalog Products Mode with Category, Custom, or Range filtering
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
      pool = shuffleArray(pool);
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
        breakdownStr: getBreakdown(p),
        assignedMode: (['mcq', 'type', 'truefalse'] as const)[Math.floor(Math.random() * 3)],
        companyName: p.companyName,
        shippingMethod: p.shippingMethod || 'air',
        origin: p.origin || (p.cat && p.cat.includes('LCD') ? 'China' : 'Dubai')
      };
    });
  };

  const handleStartQuiz = () => {
    if (selMode === 'custom' && customPickedIds.size === 0) {
      alert("Please select at least one product using the checkboxes below before starting the quiz.");
      return;
    }
    const rawPool = buildPool();
    if (rawPool.length === 0) {
      alert("Please select at least one product category or model.");
      return;
    }

    const effectiveCount = isCustomCount ? (parseInt(customCountInput) || 20) : questionCount;
    const randomizedPool = selMode === 'range' ? rawPool : shuffleArray(rawPool);
    const selectedPool = randomizedPool.slice(0, effectiveCount);
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
    setWrongAnswers([]);
    setLives(3);
    setIsAnswered(false);
    setSelectedOption(null);
    setTypeInputValue('');
    setMatchSelectedLeft(null);
    setMatchedPairs(new Set());
    setMatchFlashKey(null);
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
        breakdownStr: w.breakdown,
        companyName: w.companyName || found?.companyName,
        shippingMethod: w.shippingMethod || found?.shippingMethod || 'air',
        origin: w.origin || found?.origin || (found?.cat && found.cat.includes('LCD') ? 'China' : 'Dubai')
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

    if (specialChallenge === 'compat') {
      const allFits = compatList.map(c => c.fits);
      const shuffled = [...allFits].sort(() => Math.random() - 0.5);
      for (const fit of shuffled) {
        if (options.size >= 4) break;
        options.add(fit);
      }
    } else if (specialChallenge === 'pricetracker' && currentQ.priceKind === 'D') {
      if (currentQ.oldD && currentQ.oldD > 0) {
        options.add(`${fmt(currentQ.oldD)} D`);
      }
      const shuffled = [...parts].sort(() => Math.random() - 0.5);
      for (const p of shuffled) {
        if (options.size >= 4) break;
        options.add(`${fmt(p.d)} D`);
      }
    } else if (currentQ.priceKind === 'allThree') {
      const otherParts = shuffleArray(parts.filter(p => p.name !== currentQ.title));
      for (const p of otherParts) {
        if (options.size >= 4) break;
        options.add(`${fmt(p.d)} D · $${fmt(p.usd)} · $${fmt(p.salesPrice)}`);
      }
      if (options.size < 4 && currentQ.allThreeAnswers) {
        const { d, usd, salesPrice } = currentQ.allThreeAnswers;
        options.add(`${fmt(d * 1.2)} D · $${fmt(usd * 1.2)} · $${fmt(salesPrice * 1.2)}`);
        options.add(`${fmt(d * 0.8)} D · $${fmt(usd * 0.8)} · $${fmt(salesPrice * 0.8)}`);
        options.add(`${fmt(d * 1.5)} D · $${fmt(usd * 1.5)} · $${fmt(salesPrice * 1.5)}`);
      }
    } else {
      const targetKind = currentQ.priceKind as ('D' | 'costUsd' | 'salesPrice' | 'yuan');
      const shuffledParts = shuffleArray(parts);
      for (const p of shuffledParts) {
        if (options.size >= 4) break;
        const candidate = getTargetPrice(p, targetKind);
        options.add(candidate);
      }
    }

    return shuffleArray(Array.from(options));
  }, [quizPhase, currentIndex, currentQuestions, specialChallenge, parts, compatList]);

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
      const effMode = mode === 'any' ? (currentQuestions[currentIndex]?.assignedMode || 'mcq') : mode;
      if (effMode === 'mcq') {
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
  }, [quizPhase, isAnswered, currentMcqOptions, mode, currentIndex, currentQuestions]);

  const handleTypeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAnswered || !typeInputValue.trim()) return;

    setIsAnswered(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const currentQ = currentQuestions[currentIndex];
    let isCorrect = false;
    if (specialChallenge === 'compat' || currentQ.subtitle === 'Compatible Screen Model') {
      const u = typeInputValue.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      const c = currentQ.correctVal.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      isCorrect = u.length >= 2 && (c === u || c.includes(u) || u.includes(c));
    } else {
      const cleanUser = typeInputValue.trim().toLowerCase().replace(/[^0-9.]/g, '');
      const cleanCorrect = currentQ.correctVal.toLowerCase().replace(/[^0-9.]/g, '');
      const userNum = parseFloat(cleanUser);
      const correctNum = parseFloat(cleanCorrect);
      isCorrect = !isNaN(userNum) && !isNaN(correctNum) && Math.abs(userNum - correctNum) < 0.25;
    }

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
        message: `Incorrect! Correct answer is: ${currentQ.correctVal}`,
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
      if (specialChallenge === 'compat') {
        const otherCompat = compatList.find(c => c.fits !== currentQ.correctVal);
        return { shownVal: otherCompat ? otherCompat.fits : 'iPhone 13 Pro / 13 Pro Max', isActuallyTrue: false };
      }
      if (currentQ.priceKind === 'allThree') {
        const other = parts.find(p => p.name !== currentQ.title);
        const fake = other 
          ? `${fmt(other.d)} D · $${fmt(other.usd)} · $${fmt(other.salesPrice)}`
          : (currentQ.allThreeAnswers 
              ? `${fmt(currentQ.allThreeAnswers.d * 1.3)} D · $${fmt(currentQ.allThreeAnswers.usd * 1.3)} · $${fmt(currentQ.allThreeAnswers.salesPrice * 1.3)}`
              : '24.5 D · $6.8 · $6.8');
        return { shownVal: fake, isActuallyTrue: false };
      }
      const other = parts.find(p => p.name !== currentQ.title);
      const fake = other ? getTargetPrice(other, currentQ.priceKind) : '$24.5';
      return { shownVal: fake, isActuallyTrue: false };
    }
  }, [quizPhase, currentIndex, currentQuestions, parts, compatList, specialChallenge]);

  // Determine active question mode (supports 'any' mode where each question can be MCQ, Type, or T/F)
  const activeQuestionMode = useMemo<QuizMode>(() => {
    if (quizPhase !== 'running') return mode === 'any' ? 'mcq' : mode;
    const currentQ = currentQuestions[currentIndex];
    if (!currentQ) return mode === 'any' ? 'mcq' : mode;
    if (mode === 'any') {
      return currentQ.assignedMode || 'mcq';
    }
    return mode;
  }, [quizPhase, currentIndex, currentQuestions, mode]);

  // Match Pairs current batch (4 pairs per round when activeQuestionMode === 'match')
  const matchBatchQuestions = useMemo(() => {
    if (quizPhase !== 'running' || activeQuestionMode !== 'match') return [];
    const batchStart = Math.floor(currentIndex / 4) * 4;
    return currentQuestions.slice(batchStart, batchStart + 4);
  }, [quizPhase, activeQuestionMode, currentIndex, currentQuestions]);

  const matchShuffledRight = useMemo(() => {
    return shuffleArray(matchBatchQuestions);
  }, [matchBatchQuestions]);

  const handleMatchRightClick = (rightQ: QuestionItem) => {
    if (!matchSelectedLeft || matchedPairs.has(rightQ.id)) return;
    const leftQ = matchBatchQuestions.find(q => q.id === matchSelectedLeft);
    if (!leftQ) return;

    if (leftQ.id === rightQ.id || leftQ.correctVal === rightQ.correctVal) {
      const nextMatched = new Set(matchedPairs);
      nextMatched.add(leftQ.id);
      setMatchedPairs(nextMatched);
      setMatchSelectedLeft(null);
      handleScoreIncrease();

      if (nextMatched.size >= matchBatchQuestions.length) {
        const batchStart = Math.floor(currentIndex / 4) * 4;
        const nextIdx = batchStart + matchBatchQuestions.length;
        setTimeout(() => {
          setMatchedPairs(new Set());
          setMatchSelectedLeft(null);
          if (nextIdx >= currentQuestions.length) {
            finishQuiz();
          } else {
            setCurrentIndex(nextIdx);
          }
        }, 650);
      }
    } else {
      setMatchFlashKey(`${leftQ.id}-${rightQ.id}`);
      handleMistake(leftQ.title, leftQ.correctVal, leftQ.breakdownStr, rightQ.correctVal, leftQ);
      setMatchSelectedLeft(null);
      setTimeout(() => setMatchFlashKey(null), 700);
    }
  };

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

  const getQuestionLabel = (q: QuestionItem) => {
    if (q.subtitle === 'Compatible Screen Model') {
      return "COMPATIBILITY · Which Phone Models Fit This LCD?";
    }
    if (q.priceTrackerType) {
      const kindText = q.priceKind === 'D' ? 'Price D (AED)' : q.priceKind === 'costUsd' ? 'USD+ (Cost)' : 'Sale Price ($)';
      if (q.priceTrackerType === 'new') return `NEW PRODUCT ARRIVAL · What is the New ${kindText}?`;
      if (q.priceTrackerType === 'increase') return `PRICE INCREASE (Price Up) · What is the New ${kindText}?`;
      return `PRICE DECREASE (Price Down) · What is the New ${kindText}?`;
    }
    if (q.priceTargetLabel) return `${q.priceTargetLabel}`;
    if (q.priceKind === 'allThree') return "Price D / USD + / Sale · Enter All 3 Prices";
    if (q.priceKind === 'D') return "What is the Price D (Dirham AED)?";
    if (q.priceKind === 'costUsd') return "What is the USD+ (Cost = D/3.67)?";
    if (q.priceKind === 'yuan') return "What is the Yuan ¥ (China RMB)?";
    return "What is the Sale Price ($)?";
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
                { id: 'all', title: 'All 3 (Mixed)', desc: 'Rotate between Price D, USD+, and Sales $', color: 'text-slate-300' }
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { id: 'mcq', label: 'Multiple Choice', desc: '4 Options (Keys 1-4)' },
                { id: 'type', label: 'Type Price', desc: 'Fast numerical input' },
                { id: 'truefalse', label: 'True / False', desc: 'Flashcard speed quiz' },
                { id: 'any', label: 'Any Quiz Mode', desc: 'Randomly mix all question types' },
                { id: 'match', label: 'Match Pairs', desc: 'Connect part with price' }
              ].map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => { sound.playTick(); setMode(m.id as QuizMode); }}
                  className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                    mode === m.id
                      ? 'bg-gradient-to-br from-cyan-600/30 to-indigo-600/30 border-cyan-400 text-white shadow-lg ring-1 ring-cyan-300'
                      : 'bg-[#070c18] border-slate-700/80 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <span className="font-semibold text-sm sm:text-base text-white block">{m.label}</span>
                  <span className="text-xs text-slate-400 font-normal mt-1 block">{m.desc}</span>
                </button>
              ))}
            </div>

            {/* Dedicated Div for Special Practice Modes (Series Products, Compatibility, Survival Mode, Price Tracker Quiz) */}
            <div className="bg-[#070c18]/90 border border-slate-700/80 rounded-2xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                  Special Practice Modes (Works with Step 1 Price &amp; Step 2 Quiz Mode):
                </span>
                <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-cyan-300">
                  Active: {specialChallenge === 'catalog' ? 'Standard Catalog' : specialChallenge === 'series' ? 'Series Products' : specialChallenge === 'compat' ? 'Compatibility' : 'Price Tracker Quiz'}
                  {isSurvivalMode ? ' + Survival (3 Lives ❤️)' : ''}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. Series Products */}
                <button
                  type="button"
                  onClick={() => {
                    sound.playTick();
                    setSpecialChallenge(prev => prev === 'series' ? 'catalog' : 'series');
                  }}
                  className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                    specialChallenge === 'series'
                      ? 'bg-gradient-to-br from-amber-600/30 to-orange-600/30 border-amber-400 text-white shadow-lg ring-1 ring-amber-300'
                      : 'bg-slate-900/70 border-slate-700/80 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <span className="font-semibold text-sm sm:text-base text-amber-300 block">Series Products</span>
                  <span className="text-xs text-slate-400 font-normal mt-1 block">All spare parts for each phone model</span>
                </button>

                {/* 2. Compatibility */}
                <button
                  type="button"
                  onClick={() => {
                    sound.playTick();
                    setSpecialChallenge(prev => prev === 'compat' ? 'catalog' : 'compat');
                  }}
                  className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                    specialChallenge === 'compat'
                      ? 'bg-gradient-to-br from-cyan-600/30 to-blue-600/30 border-cyan-400 text-white shadow-lg ring-1 ring-cyan-300'
                      : 'bg-slate-900/70 border-slate-700/80 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <span className="font-semibold text-sm sm:text-base text-cyan-300 block">Compatibility</span>
                  <span className="text-xs text-slate-400 font-normal mt-1 block">Which LCD fits which phone</span>
                </button>

                {/* 3. Survival Mode */}
                <button
                  type="button"
                  onClick={() => {
                    sound.playTick();
                    setIsSurvivalMode(prev => !prev);
                  }}
                  className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                    isSurvivalMode
                      ? 'bg-gradient-to-br from-rose-600/30 to-pink-600/30 border-rose-400 text-white shadow-lg ring-1 ring-rose-300'
                      : 'bg-slate-900/70 border-slate-700/80 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <span className="font-semibold text-sm sm:text-base text-rose-300 block">Survival Mode</span>
                  <span className="text-xs text-slate-400 font-normal mt-1 block">3 Lives · Beat high score</span>
                </button>

                {/* 4. Price Tracker Quiz */}
                <button
                  type="button"
                  onClick={() => {
                    sound.playTick();
                    setSpecialChallenge(prev => prev === 'pricetracker' ? 'catalog' : 'pricetracker');
                  }}
                  className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                    specialChallenge === 'pricetracker'
                      ? 'bg-gradient-to-br from-emerald-600/30 to-teal-600/30 border-emerald-400 text-white shadow-lg ring-1 ring-emerald-300'
                      : 'bg-slate-900/70 border-slate-700/80 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <span className="font-semibold text-sm sm:text-base text-emerald-300 block">Price Tracker Quiz</span>
                  <span className="text-xs text-slate-400 font-normal mt-1 block">New, Up 📈 &amp; Down 📉</span>
                </button>
              </div>
            </div>

            {/* Series Phone Model Selector */}
            {specialChallenge === 'series' && (
              <div className="bg-[#070c18] border border-cyan-500/40 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xl animate-in slide-in-from-top-2 duration-150">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-cyan-400" />
                    <div>
                      <h4 className="text-sm font-bold text-white">Select Mobile Phone Model / Series</h4>
                      <p className="text-xs text-slate-400">Tests all spare parts for this model (LCD, Battery, Flex, etc.)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        sound.playTick();
                        setSelectedSeriesModel('__all__');
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        selectedSeriesModel === '__all__'
                          ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                          : 'bg-slate-900 border border-slate-700 text-slate-300 hover:text-white'
                      }`}
                    >
                      All Series ({availablePhoneModels.length} Models)
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={seriesSearchTerm}
                    onChange={(e) => setSeriesSearchTerm(e.target.value)}
                    placeholder="Search model (e.g. 13 Pro Max, A12, Redmi 9C, Spark 10)..."
                    className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-white font-medium outline-none"
                  />
                  {seriesSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setSeriesSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
                  {filteredPhoneModels.map(model => {
                    const isSelected = selectedSeriesModel === model;
                    const partsCount = phoneModelsMap[model]?.length || 0;
                    return (
                      <button
                        key={model}
                        type="button"
                        onClick={() => {
                          sound.playTick();
                          setSelectedSeriesModel(model);
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-2 ${
                          isSelected
                            ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-md ring-1 ring-cyan-300'
                            : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-600 hover:text-white'
                        }`}
                      >
                        <span>{model}</span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                          isSelected ? 'bg-slate-950/30 text-slate-950 font-bold' : 'bg-slate-800 text-cyan-400'
                        }`}>
                          {partsCount} parts
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Price Tracker Quiz Filter & History Drawer (Feature 1 & 2C) */}
            {specialChallenge === 'pricetracker' && (
              <div className="bg-[#070c18] border border-cyan-500/40 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl animate-in slide-in-from-top-2 duration-150">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>Price Tracker Quiz Filter</span>
                        <span className="text-[10px] font-normal text-cyan-400 font-mono">· {priceTrackerStats.total} Total Records</span>
                      </h4>
                      <p className="text-xs text-slate-400">Select which type of price movements to practice</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      sound.playTick();
                      setShowPriceTrackerHistory(!showPriceTrackerHistory);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer self-start sm:self-auto ${
                      showPriceTrackerHistory
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
                        : 'bg-slate-900 border-slate-700 text-cyan-300 hover:text-white'
                    }`}
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>{showPriceTrackerHistory ? 'Hide Records Table' : 'View Price History Records Table'}</span>
                  </button>
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap gap-2 text-xs">
                  {[
                    { id: 'all', label: `All Changes (${priceTrackerStats.total})`, color: 'text-white' },
                    { id: 'new', label: `New Products (${priceTrackerStats.newItemsCount})`, color: 'text-cyan-300' },
                    { id: 'increase', label: `Price Increases (${priceTrackerStats.increasesCount})`, color: 'text-amber-300' },
                    { id: 'decrease', label: `Price Decreases (${priceTrackerStats.decreasesCount})`, color: 'text-emerald-300' }
                  ].map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        sound.playTick();
                        setPriceTrackerQuizFilter(f.id as any);
                      }}
                      className={`px-3 py-1.5 rounded-xl font-semibold border transition-all cursor-pointer ${
                        priceTrackerQuizFilter === f.id
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-md'
                          : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Expandable Price History Records Table */}
                {showPriceTrackerHistory && (
                  <div className="pt-2 animate-in fade-in duration-150 space-y-2">
                    <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-72">
                      <table className="w-full text-left text-xs font-sans">
                        <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                          <tr>
                            <th className="py-2.5 px-3">Type</th>
                            <th className="py-2.5 px-3">Product Name</th>
                            <th className="py-2.5 px-3">Category</th>
                            <th className="py-2.5 px-3 text-right">Old Price</th>
                            <th className="py-2.5 px-3 text-right">New Price</th>
                            <th className="py-2.5 px-3 text-right">Difference</th>
                            <th className="py-2.5 px-3 text-right">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-mono">
                          {(priceChanges || []).length === 0 ? (
                            <tr>
                              <td colSpan={7} className="py-4 text-center text-slate-500 font-sans">
                                No price changes recorded yet. You can log changes in Catalog or Add Part.
                              </td>
                            </tr>
                          ) : (
                            (priceChanges || []).map(r => (
                              <tr key={r.id} className="hover:bg-slate-900/50">
                                <td className="py-2 px-3 whitespace-nowrap font-sans font-semibold">
                                  <span className={`px-2 py-0.5 rounded text-[10px] ${
                                    r.type === 'increase'
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                      : r.type === 'decrease'
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                  }`}>
                                    {r.type === 'increase' ? 'Up 📈' : r.type === 'decrease' ? 'Down 📉' : 'New 📦'}
                                  </span>
                                </td>
                                <td className="py-2 px-3 font-sans font-medium text-white whitespace-nowrap">{r.name}</td>
                                <td className="py-2 px-3 font-sans text-slate-400 text-[11px] whitespace-nowrap">{r.cat}</td>
                                <td className="py-2 px-3 text-right text-slate-400">{r.type === 'new' ? '—' : `${fmt(r.oldD)} D`}</td>
                                <td className="py-2 px-3 text-right font-bold text-cyan-300">{fmt(r.newD)} D</td>
                                <td className={`py-2 px-3 text-right font-bold ${r.deltaD > 0 ? 'text-amber-400' : (r.type === 'new' ? 'text-cyan-400' : 'text-emerald-400')}`}>
                                  {r.type === 'new' ? 'New' : `${r.deltaD > 0 ? '+' : ''}${fmt(r.deltaD)} D`}
                                </td>
                                <td className="py-2 px-3 text-right text-slate-500 text-[11px] whitespace-nowrap">{r.date}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* STEP 3: PRODUCT & CATEGORY SELECTION */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="block text-xs font-medium uppercase tracking-wider text-cyan-400">
                3. Select Products to Include in Quiz:
              </label>

              {/* Mode Toggle: Categories vs Custom Picked Products */}
              <div className="flex items-center p-1 bg-slate-900 rounded-xl border border-slate-700/80 w-max">
                <button
                  type="button"
                  onClick={() => {
                    sound.playTick();
                    setSelMode('random');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    selMode !== 'custom'
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  By Category ({selectedCats.length > 0 ? selectedCats.length : 'All'})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sound.playTick();
                    setSelMode('custom');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    selMode === 'custom'
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Choose Specific Products ({customPickedIds.size})</span>
                </button>
              </div>
            </div>

            {/* Sub-mode A: Category Buttons with Easy Search & Brand Shortcuts */}
            {selMode !== 'custom' && (
              <div className="space-y-3">
                {/* Search & Fast Filter Box */}
                <div className="bg-[#070c18] border border-cyan-500/40 p-3 sm:p-3.5 rounded-2xl space-y-2.5 shadow-lg">
                  <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={categorySearchQuery}
                        onChange={(e) => setCategorySearchQuery(e.target.value)}
                        placeholder="Search category (e.g. iPhone, Samsung, Tecno, Battery, Glass)..."
                        className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-xl text-white placeholder-slate-400 outline-none font-medium"
                      />
                      {categorySearchQuery && (
                        <button
                          type="button"
                          onClick={() => setCategorySearchQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          sound.playTick();
                          setSelectedCats([]);
                          setPreviewCategory('__all__');
                          setCategorySearchQuery('');
                          setSelectedBrandFilter('ALL');
                        }}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-xs border border-slate-700 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        Select All ({parts.length} parts)
                      </button>
                    </div>
                  </div>

                  {/* Brand Shortcuts to find any brand instantly */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                      Quick Find:
                    </span>
                    {[
                      { id: 'ALL', label: 'All Categories' },
                      { id: 'iPhone', label: 'iPhone' },
                      { id: 'Samsung', label: 'Samsung' },
                      { id: 'Tecno', label: 'Tecno' },
                      { id: 'Infinix', label: 'Infinix' },
                      { id: 'Redmi', label: 'Redmi / Xiaomi' },
                      { id: 'Honor', label: 'Honor' },
                      { id: 'Battery', label: 'Battery' },
                      { id: 'Touch', label: 'iPad / Touch' },
                      { id: 'Glass', label: 'Glass & OCA' }
                    ].map(b => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          sound.playTick();
                          setSelectedBrandFilter(b.id);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                          selectedBrandFilter === b.id
                            ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                            : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filtered Category Chips */}
                <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto pr-1">
                  {filteredAvailableCategories.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-400 w-full bg-[#070c18] rounded-xl border border-slate-800">
                      No categories found matching "{categorySearchQuery}".
                      <button
                        type="button"
                        onClick={() => { setCategorySearchQuery(''); setSelectedBrandFilter('ALL'); }}
                        className="ml-2 text-cyan-400 underline font-semibold cursor-pointer"
                      >
                        Clear filter
                      </button>
                    </div>
                  ) : (
                    filteredAvailableCategories.map(cat => {
                      const isSelected = selectedCats.includes(cat);
                      const isPreview = previewCategory === cat;
                      const count = parts.filter(p => p.cat === cat).length;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            sound.playTick();
                            setPreviewCategory(cat);
                            if (isSelected) {
                              setSelectedCats(selectedCats.filter(c => c !== cat));
                            } else {
                              setSelectedCats([...selectedCats, cat]);
                            }
                          }}
                          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSelected || isPreview
                              ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md ring-1 ring-cyan-300 font-bold'
                              : 'bg-[#070c18] border-slate-700/80 text-slate-300 hover:border-slate-500'
                          }`}
                        >
                          <span>{cat}</span>
                          <span className={`text-[11px] font-mono font-bold px-1.5 py-0.2 rounded-md ${
                            isSelected || isPreview ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-800 text-cyan-300'
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Sub-mode B: Choose Specific Products Picker (Point 6) */}
            {selMode === 'custom' && (
              <div className="bg-[#070c18] border border-cyan-500/40 rounded-2xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                      Pick The Products You Want In Quiz:
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-xs font-bold border border-cyan-500/40">
                      {customPickedIds.size} Selected
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        sound.playTick();
                        const allFilteredIds = new Set(customPickedIds);
                        customFilteredProducts.forEach(p => allFilteredIds.add(p.id));
                        setCustomPickedIds(allFilteredIds);
                      }}
                      className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 px-2 py-1 rounded-md bg-slate-900 border border-slate-700 cursor-pointer"
                    >
                      Select All Filtered ({customFilteredProducts.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        sound.playTick();
                        setCustomPickedIds(new Set());
                      }}
                      className="text-xs font-semibold text-slate-400 hover:text-white px-2 py-1 rounded-md bg-slate-900 border border-slate-700 cursor-pointer"
                    >
                      Clear Selection
                    </button>
                  </div>
                </div>

                {/* Search Box */}
                <div className="relative">
                  <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={customSearch}
                    onChange={(e) => setCustomSearch(e.target.value)}
                    placeholder="Search specific models to add to quiz (e.g. DD X13, A15, Hot 60i, Realme)..."
                    className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {/* Multi-Select Products List */}
                <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                  {customFilteredProducts.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500">
                      No products match your search.
                    </div>
                  ) : (
                    customFilteredProducts.map((p) => {
                      const isPicked = customPickedIds.has(p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={() => {
                            sound.playTick();
                            const next = new Set(customPickedIds);
                            if (isPicked) {
                              next.delete(p.id);
                            } else {
                              next.add(p.id);
                            }
                            setCustomPickedIds(next);
                          }}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                            isPicked 
                              ? 'bg-cyan-500/20 border-cyan-400 text-white' 
                              : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={isPicked}
                              onChange={() => {}} // handled by parent div
                              className="w-4 h-4 rounded text-cyan-500 border-slate-700 bg-slate-950 focus:ring-cyan-400 shrink-0 pointer-events-none"
                            />
                            <span className="font-semibold text-xs sm:text-sm truncate">{p.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">({p.cat})</span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
                            <span className="text-cyan-400 font-bold">{fmt(p.d)} D</span>
                            <span className="text-emerald-400">${fmt(p.salesPrice)}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* STEP 4: QUESTION COUNT & TIMER */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-300">
                  Questions Limit
                </label>
                <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-lg border border-cyan-800/60">
                  {isCustomCount ? `${customCountInput || 0} Questions (Custom)` : `${questionCount} Questions`}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {[10, 20, 30, 100].map(cnt => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => {
                      sound.playTick();
                      setIsCustomCount(false);
                      setQuestionCount(cnt);
                    }}
                    className={`py-2 px-1 rounded-xl text-xs sm:text-sm font-semibold border transition-all cursor-pointer text-center ${
                      !isCustomCount && questionCount === cnt
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-md ring-1 ring-cyan-300'
                        : 'bg-[#070c18] border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white'
                    }`}
                  >
                    {cnt}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    sound.playTick();
                    setIsCustomCount(true);
                  }}
                  className={`py-2 px-1 rounded-xl text-xs sm:text-sm font-semibold border transition-all cursor-pointer text-center ${
                    isCustomCount
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-md ring-1 ring-cyan-300'
                      : 'bg-[#070c18] border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white'
                  }`}
                >
                  Custom
                </button>
              </div>

              {isCustomCount && (
                <div className="mt-2.5 flex items-center gap-2 animate-in slide-in-from-top-1">
                  <input
                    type="number"
                    min="1"
                    max={parts.length || 584}
                    value={customCountInput}
                    onChange={(e) => setCustomCountInput(e.target.value)}
                    placeholder="e.g. 15 or 45"
                    className="w-full bg-[#070c18] border border-cyan-500 rounded-xl px-3 py-1.5 text-xs sm:text-sm font-mono font-bold text-white focus:outline-none ring-1 ring-cyan-400"
                  />
                  <span className="text-xs text-cyan-300 font-semibold shrink-0">custom count</span>
                </div>
              )}

              <p className="text-[11px] text-slate-400 mt-1.5">
                Practice 10, 20, 30, 100, or your own custom number of questions.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-300 mb-2">
                Speed Timer
              </label>
              <div className="flex gap-2">
                {[
                  { sec: 0, label: 'Off' },
                  { sec: 20, label: '20s' },
                  { sec: 25, label: '25s' },
                  { sec: 30, label: '30s' }
                ].map(t => (
                  <button
                    key={t.sec}
                    type="button"
                    onClick={() => {
                      sound.playTick();
                      setTimerDuration(t.sec);
                    }}
                    className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all cursor-pointer ${
                      timerDuration === t.sec
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-md'
                        : 'bg-[#070c18] border-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Per-question countdown: 20s, 25s, or 30s.
              </p>
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

      {/* ================= GREEN BOX: CATEGORY PRODUCTS VIEWER ================= */}
      {quizPhase === 'setup' && (
        <div className="border-2 border-emerald-500 rounded-3xl p-5 sm:p-7 bg-[#07131b]/95 shadow-2xl shadow-emerald-950/40 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-emerald-500/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <Check className="w-5 h-5 text-emerald-400 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Category Products Viewer
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold border border-emerald-500/40">
                    {categoryProducts.length} {categoryProducts.length === 1 ? 'Product' : 'Products'}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 flex-wrap mt-0.5">
                  <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    {previewCategory === '__all__' ? 'All Categories' : previewCategory || 'Select a Category'}
                  </h3>
                  <select
                    value={previewCategory}
                    onChange={(e) => {
                      sound.playTick();
                      setPreviewCategory(e.target.value);
                    }}
                    className="bg-slate-900 border border-emerald-500/50 hover:border-emerald-400 rounded-xl px-2.5 py-1 text-xs text-emerald-300 font-semibold focus:outline-none focus:border-emerald-400 cursor-pointer"
                  >
                    <option value="__all__">All Categories ({parts.length})</option>
                    {availableCategories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat} ({parts.filter(p => p.cat === cat).length})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Search filter within active category + Quiz selection shortcuts */}
            <div className="flex items-center flex-wrap gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={previewSearch}
                  onChange={(e) => setPreviewSearch(e.target.value)}
                  placeholder={`Search ${previewCategory === '__all__' ? 'all' : (previewCategory || 'category')} products...`}
                  className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-900/90 border border-emerald-500/40 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                />
              </div>
              {previewSearch && (
                <button
                  type="button"
                  onClick={() => setPreviewSearch('')}
                  className="text-xs text-slate-400 hover:text-white px-2 py-1"
                >
                  Clear
                </button>
              )}

              {categoryProducts.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    sound.playTick();
                    setSelMode('custom');
                    setCustomPickedIds(prev => {
                      const next = new Set(prev);
                      categoryProducts.forEach(p => next.add(p.id));
                      return next;
                    });
                  }}
                  className="px-3 py-2 text-xs font-semibold rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 cursor-pointer transition-all flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add {categoryProducts.length} to Quiz</span>
                </button>
              )}
            </div>
          </div>

          {/* Product Items Table */}
          {categoryProducts.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <p className="text-sm font-medium">No products found for this category or filter.</p>
              <p className="text-xs text-slate-500">Click any category button above (such as Honor LCD, Samsung LCD, Redmi LCD, etc.) to view its products.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-emerald-500/30 bg-slate-950/70">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[#0b1c1e] text-slate-300 uppercase tracking-wider text-[11px] font-semibold border-b border-emerald-500/30">
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Price D (AED)</th>
                    <th className="py-3 px-4 text-right">Yuan (¥)</th>
                    <th className="py-3 px-4 text-right">USD+ (Cost)</th>
                    <th className="py-3 px-4 text-right">Sales $ (Retail)</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-mono">
                  {categoryProducts.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-emerald-500/10 transition-colors border-b border-slate-800/80">
                      <td className="py-3 px-4 text-slate-500 text-xs border-b border-slate-800/80">{idx + 1}</td>
                      <td className="py-3 px-4 font-sans font-semibold text-white whitespace-nowrap border-b border-slate-800/80">{p.name}</td>
                      <td className="py-3 px-4 font-sans text-slate-400 text-xs whitespace-nowrap border-b border-slate-800/80">{p.cat}</td>
                      <td className="py-3 px-4 text-right font-bold text-cyan-400 border-b border-slate-800/80">{fmt(p.d)} D</td>
                      <td className="py-3 px-4 text-right text-amber-300 border-b border-slate-800/80">¥{fmt(p.yuan ?? 0)}</td>
                      <td className="py-3 px-4 text-right font-semibold text-emerald-400 border-b border-slate-800/80">${fmt(p.usd)}</td>
                      <td className="py-3 px-4 text-right font-bold text-violet-300 border-b border-slate-800/80">${fmt(p.salesPrice)}</td>
                      <td className="py-3 px-4 text-center border-b border-slate-800/80">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              sound.playTick();
                              setSelMode('custom');
                              setCustomPickedIds(prev => {
                                const next = new Set(prev);
                                if (next.has(p.id)) {
                                  next.delete(p.id);
                                } else {
                                  next.add(p.id);
                                }
                                return next;
                              });
                            }}
                            className={`px-2.5 py-1 text-xs font-sans font-semibold rounded-lg border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                              customPickedIds.has(p.id)
                                ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
                                : 'bg-slate-900 hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 border-slate-700'
                            }`}
                            title={customPickedIds.has(p.id) ? 'Remove from custom quiz' : 'Select for custom quiz'}
                          >
                            <input
                              type="checkbox"
                              checked={customPickedIds.has(p.id)}
                              onChange={() => {}}
                              className="w-3.5 h-3.5 rounded text-cyan-500 bg-slate-950 border-slate-600 pointer-events-none"
                            />
                            <span>{customPickedIds.has(p.id) ? 'Selected' : '+ Quiz'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handlePracticeSinglePart(p)}
                            className="px-2.5 py-1 text-xs font-sans font-semibold rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition-all cursor-pointer whitespace-nowrap"
                          >
                            Practice
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ================= PHASE 2: RUNNING QUIZ ================= */}
      {quizPhase === 'running' && currentQuestions[currentIndex] && (
        <div className="bg-[#0b111e] border-2 border-slate-700/80 rounded-3xl p-6 sm:p-10 lg:p-12 shadow-2xl space-y-8 w-full">
          
          {/* Top Status Row with Progress & Speed Timer */}
          <div className="space-y-3 pb-6 border-b border-slate-800">
            <div className="flex items-center justify-between gap-4">
              {/* Question Progress Indicator */}
              <div className="flex items-center gap-3">
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-400">Question</span>
                <span className="font-mono font-bold text-xl sm:text-2xl text-cyan-400">
                  {currentIndex + 1}
                </span>
                <span className="text-slate-500 font-mono text-base sm:text-lg">/</span>
                <span className="font-mono text-slate-400 font-medium text-base sm:text-lg">
                  {currentQuestions.length}
                </span>
              </div>

              {/* Speed Timer Countdown */}
              {timerDuration > 0 && (
                <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-mono font-bold text-sm shadow-md transition-all ${
                  timeLeft <= 5 
                    ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse ring-1 ring-rose-500' 
                    : 'bg-slate-900 border-cyan-500/50 text-cyan-300'
                }`}>
                  <Timer className={`w-4 h-4 ${timeLeft <= 5 ? 'text-rose-400 animate-spin' : 'text-cyan-400'}`} />
                  <span>{timeLeft}s remaining</span>
                </div>
              )}

              {/* Streak & Score & Exit */}
              <div className="flex items-center gap-2.5 sm:gap-4">
                {streak > 1 && (
                  <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 font-mono font-bold text-xs animate-pulse">
                    <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{streak} STREAK</span>
                  </div>
                )}

                {isSurvivalMode && (
                  <div className="flex items-center gap-1">
                    {[...Array(3)].map((_, i) => (
                      <Heart
                        key={i}
                        className={`w-5 h-5 ${i < lives ? 'fill-rose-500 text-rose-500' : 'text-slate-700'}`}
                      />
                    ))}
                  </div>
                )}

                <span className="font-mono text-xs sm:text-sm font-bold text-emerald-400 bg-emerald-950/40 px-3 py-1 rounded-xl border border-emerald-900/40">
                  Score: {score}
                </span>

                <button
                  type="button"
                  onClick={() => setQuizPhase('setup')}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Exit Quiz"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Sleek Progress Bar */}
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-400 transition-all duration-300 rounded-full"
                style={{ width: `${((currentIndex + 1) / currentQuestions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Banner - 700 Bold headings */}
          <div className="text-center space-y-3 py-4">
            
            {/* Series Model Progress Badge (Feature 2B) */}
            {currentQuestions[currentIndex].seriesModel && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/70 border border-indigo-500/50 text-indigo-300 text-xs sm:text-sm font-semibold mb-1 shadow-md">
                <Smartphone className="w-4 h-4 text-indigo-400" />
                <span>Series Phone Model: <strong>{currentQuestions[currentIndex].seriesModel}</strong></span>
                <span className="px-2 py-0.5 rounded-md bg-indigo-900/80 text-[11px] font-mono font-bold text-white">
                  Part {currentQuestions[currentIndex].seriesPartIndex} of {currentQuestions[currentIndex].seriesTotalParts}
                </span>
              </div>
            )}

            {/* Price Tracker Change Context Badge (Feature 1 & 2C) */}
            {currentQuestions[currentIndex].priceTrackerType && (
              <div className="max-w-xl mx-auto p-3.5 sm:p-4 rounded-2xl bg-[#070c18] border border-cyan-500/40 text-left space-y-2 mb-2">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    currentQuestions[currentIndex].priceTrackerType === 'increase'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : currentQuestions[currentIndex].priceTrackerType === 'decrease'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  }`}>
                    {currentQuestions[currentIndex].priceTrackerType === 'increase' ? '📈 Price Increase' : currentQuestions[currentIndex].priceTrackerType === 'decrease' ? '📉 Price Decrease' : '📦 New Product Arrival'}
                  </span>
                  {currentQuestions[currentIndex].date && (
                    <span className="text-[11px] font-mono text-slate-400">
                      {currentQuestions[currentIndex].date}
                    </span>
                  )}
                </div>
                {currentQuestions[currentIndex].priceTrackerType !== 'new' && (
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-sans">Old Price was:</span>
                      <span className="font-bold text-slate-200">{fmt(currentQuestions[currentIndex].oldD || 0)} D</span>
                      <span className="text-slate-400 ml-1.5">(${fmt(currentQuestions[currentIndex].oldUsd || 0)})</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-sans">Price Movement:</span>
                      <span className={`font-bold ${currentQuestions[currentIndex].priceTrackerType === 'increase' ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {currentQuestions[currentIndex].priceTrackerType === 'increase' ? 'Supplier Price Up 📈' : 'Supplier Price Down 📉'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div>
              <span className="inline-block px-4 py-1.5 rounded-xl bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 font-mono text-xs sm:text-sm font-semibold uppercase tracking-wider">
                {getQuestionLabel(currentQuestions[currentIndex])}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">
              {currentQuestions[currentIndex].title}
            </h1>
            {currentQuestions[currentIndex].subtitle && (
              <span className="text-xs sm:text-sm text-slate-400 font-normal block">
                {currentQuestions[currentIndex].subtitle}
              </span>
            )}

            {/* User Requirements: Product ID / SKU, Supplier Company Name, Shipment (Air / Sea), Origin (Dubai / China) */}
            {(() => {
              const currentQ = currentQuestions[currentIndex];
              const partId = (currentQ.rawItem as any)?.id || currentQ.id;
              const company = currentQ.companyName || (currentQ.rawItem as any)?.companyName || 'Registered Supplier';
              const isSea = (currentQ.shippingMethod || (currentQ.rawItem as any)?.shippingMethod) === 'sea';
              const isChina = (currentQ.origin || (currentQ.rawItem as any)?.origin) === 'China' || (currentQ.subtitle && currentQ.subtitle.includes('LCD'));

              return (
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2.5">
                  {/* Product ID Badge */}
                  {partId && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/90 border border-cyan-600/70 text-cyan-200 text-xs sm:text-sm font-medium shadow-md">
                      <span className="text-cyan-400/80 text-[11px] uppercase tracking-wider font-mono">ID / SKU:</span>
                      <span className="font-mono font-bold text-cyan-300 tracking-wider">{partId}</span>
                    </div>
                  )}

                  {/* Supplier Company Badge */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-950/80 border border-indigo-700/60 text-indigo-200 text-xs sm:text-sm font-medium shadow-md">
                    <Building2 className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="text-indigo-400/80 text-[11px] uppercase tracking-wider font-mono">Company:</span>
                    <span className="font-bold text-white tracking-wide">{company}</span>
                  </div>

                  {/* Cargo / Shipment Method Badge */}
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-semibold shadow-md ${
                    isSea
                      ? 'bg-cyan-950/80 border-cyan-600/60 text-cyan-200'
                      : 'bg-sky-950/80 border-sky-600/60 text-sky-200'
                  }`}>
                    {isSea ? <Ship className="w-4 h-4 text-cyan-400 shrink-0" /> : <Plane className="w-4 h-4 text-sky-400 shrink-0" />}
                    <span>{isSea ? '🚢 Cargo: By Sea (Markab)' : '✈️ Cargo: By Air (Diyaarad)'}</span>
                  </div>

                  {/* Origin Badge */}
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-semibold shadow-md ${
                    isChina 
                      ? 'bg-rose-950/80 border-rose-600/60 text-rose-200' 
                      : 'bg-amber-950/80 border-amber-600/60 text-amber-200'
                  }`}>
                    <span>{isChina ? '🇨🇳' : '🇦🇪'}</span>
                    <span>{isChina ? 'Sourced: China' : 'Sourced: Dubai'}</span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* 1. Type Price Mode for Price D / USD + / Sale (3 inputs) */}
          {activeQuestionMode === 'type' && currentQuestions[currentIndex].priceKind === 'allThree' && (
            <form onSubmit={handleAllThreeSubmit} className="max-w-2xl mx-auto space-y-5">
              <div className="bg-[#070c18] border-2 border-cyan-500/40 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
                <div className="text-center pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                    Input All 3 Relevant Prices for This Spare Part
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {/* 1. Price D */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-cyan-400 uppercase tracking-wide">
                      1. Price D (Dirham) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        inputMode="decimal"
                        autoFocus
                        disabled={isAnswered}
                        value={allThreeD}
                        onChange={(e) => setAllThreeD(e.target.value)}
                        placeholder="e.g. 115"
                        className={`w-full bg-slate-900 border-2 rounded-xl px-3.5 py-3 text-lg font-mono font-bold text-white outline-none transition-colors ${
                          isAnswered
                            ? allThreeResult?.dOk
                              ? 'border-emerald-500 bg-emerald-950/30 text-emerald-200'
                              : 'border-rose-500 bg-rose-950/30 text-rose-200'
                            : 'border-slate-700 focus:border-cyan-400'
                        }`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-cyan-400 pointer-events-none">
                        AED
                      </span>
                    </div>
                    {isAnswered && (
                      <span className={`text-[11px] font-mono font-bold block ${allThreeResult?.dOk ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {allThreeResult?.dOk ? '✓ Correct' : `✗ Correct: ${fmt(currentQuestions[currentIndex].allThreeAnswers?.d || 0)} D`}
                      </span>
                    )}
                  </div>

                  {/* 2. USD+ Cost */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wide">
                      2. USD+ (Cost) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        inputMode="decimal"
                        disabled={isAnswered}
                        value={allThreeUsd}
                        onChange={(e) => setAllThreeUsd(e.target.value)}
                        placeholder="e.g. 31.33"
                        className={`w-full bg-slate-900 border-2 rounded-xl px-3.5 py-3 text-lg font-mono font-bold text-white outline-none transition-colors ${
                          isAnswered
                            ? allThreeResult?.usdOk
                              ? 'border-emerald-500 bg-emerald-950/30 text-emerald-200'
                              : 'border-rose-500 bg-rose-950/30 text-rose-200'
                            : 'border-slate-700 focus:border-emerald-400'
                        }`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-emerald-400 pointer-events-none">
                        USD
                      </span>
                    </div>
                    {isAnswered && (
                      <span className={`text-[11px] font-mono font-bold block ${allThreeResult?.usdOk ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {allThreeResult?.usdOk ? '✓ Correct' : `✗ Correct: $${fmt(currentQuestions[currentIndex].allThreeAnswers?.usd || 0)}`}
                      </span>
                    )}
                  </div>

                  {/* 3. Sale Price */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-violet-400 uppercase tracking-wide">
                      3. Sale Price ($) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        inputMode="decimal"
                        disabled={isAnswered}
                        value={allThreeSales}
                        onChange={(e) => setAllThreeSales(e.target.value)}
                        placeholder="e.g. 31.33"
                        className={`w-full bg-slate-900 border-2 rounded-xl px-3.5 py-3 text-lg font-mono font-bold text-white outline-none transition-colors ${
                          isAnswered
                            ? allThreeResult?.salesOk
                              ? 'border-emerald-500 bg-emerald-950/30 text-emerald-200'
                              : 'border-rose-500 bg-rose-950/30 text-rose-200'
                            : 'border-slate-700 focus:border-violet-400'
                        }`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-violet-400 pointer-events-none">
                        USD
                      </span>
                    </div>
                    {isAnswered && (
                      <span className={`text-[11px] font-mono font-bold block ${allThreeResult?.salesOk ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {allThreeResult?.salesOk ? '✓ Correct' : `✗ Correct: $${fmt(currentQuestions[currentIndex].allThreeAnswers?.salesPrice || 0)}`}
                      </span>
                    )}
                  </div>
                </div>

                {!isAnswered && (
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-bold text-sm sm:text-base shadow-lg cursor-pointer transition-all active:scale-95 mt-2"
                  >
                    Check All 3 Prices (Press Enter)
                  </button>
                )}
              </div>
            </form>
          )}

          {/* 2. Multiple Choice Mode (MCQ) */}
          {activeQuestionMode === 'mcq' && (
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
                    className={`p-4 sm:p-5 rounded-2xl flex items-center justify-between font-mono text-base sm:text-lg font-semibold transition-all active:scale-95 cursor-pointer ${btnStyle}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 text-xs font-sans font-medium flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-left">{opt}</span>
                    </div>

                    {isAnswered && isCorrect && <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 ml-2" />}
                    {isAnswered && isSelected && !isCorrect && <XCircle className="w-6 h-6 text-rose-400 shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* 2B. Match Pairs Mode */}
          {activeQuestionMode === 'match' && (
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="text-center text-xs text-cyan-300 font-semibold uppercase tracking-wider">
                Click a Product on the left, then match its correct answer on the right ({matchedPairs.size}/{matchBatchQuestions.length})
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2.5">
                  {matchBatchQuestions.map((q) => {
                    const isMatched = matchedPairs.has(q.id);
                    const isLeftSelected = matchSelectedLeft === q.id;
                    return (
                      <button
                        key={`left-${q.id}`}
                        type="button"
                        disabled={isMatched}
                        onClick={() => {
                          sound.playTick();
                          setMatchSelectedLeft(q.id);
                        }}
                        className={`w-full p-4 rounded-2xl border-2 text-left font-semibold text-sm sm:text-base transition-all cursor-pointer ${
                          isMatched
                            ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300 opacity-60'
                            : isLeftSelected
                            ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-lg ring-2 ring-cyan-400/40'
                            : 'bg-[#070c18] border-slate-700 hover:border-cyan-400 text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span>{q.title}</span>
                          {isMatched && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                        </div>
                        {q.companyName && (
                          <span className="text-[11px] font-mono text-indigo-300 block mt-1">{q.companyName}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="space-y-2.5">
                  {matchShuffledRight.map((q) => {
                    const isMatched = matchedPairs.has(q.id);
                    const isWrongFlash = matchFlashKey && matchFlashKey.endsWith(`-${q.id}`);
                    return (
                      <button
                        key={`right-${q.id}`}
                        type="button"
                        disabled={isMatched || !matchSelectedLeft}
                        onClick={() => handleMatchRightClick(q)}
                        className={`w-full p-4 rounded-2xl border-2 text-center font-mono font-bold text-base sm:text-lg transition-all cursor-pointer ${
                          isMatched
                            ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300 opacity-60'
                            : isWrongFlash
                            ? 'bg-rose-600/30 border-rose-500 text-rose-200 animate-pulse'
                            : matchSelectedLeft
                            ? 'bg-[#070c18] border-cyan-500/60 hover:bg-cyan-500/15 hover:border-cyan-400 text-cyan-300'
                            : 'bg-[#070c18] border-slate-800 text-slate-400'
                        }`}
                      >
                        {q.correctVal}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 3. Single Price Type Mode (for dirham, costUsd, salesPrice, compat) */}
          {activeQuestionMode === 'type' && currentQuestions[currentIndex].priceKind !== 'allThree' && (
            <form onSubmit={handleTypeSubmit} className="max-w-xl mx-auto space-y-4">
              <div className="relative">
                <input
                  type="text"
                  autoFocus
                  disabled={isAnswered}
                  value={typeInputValue}
                  onChange={(e) => setTypeInputValue(e.target.value)}
                  placeholder={specialChallenge === 'compat' ? 'Type compatible phone models...' : 'Type number (e.g. 115 or 32.02)...'}
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

          {/* 4. True / False Mode - Works for both allThree and single prices */}
          {activeQuestionMode === 'truefalse' && (
            <div className="max-w-2xl mx-auto space-y-6 text-center">
              <div className="p-6 rounded-2xl bg-[#070c18] border-2 border-slate-700 shadow-xl space-y-2">
                <span className="text-slate-400 text-xs sm:text-sm font-semibold uppercase tracking-wider block">
                  Proposed Price Evaluation:
                </span>
                <span className="text-2xl sm:text-3xl font-mono font-bold text-cyan-300 block">
                  {currentTfData.shownVal}
                </span>
                <span className="text-xs text-slate-400 block">
                  Is this the correct recorded price for {currentQuestions[currentIndex].title}?
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  disabled={isAnswered}
                  onClick={() => handleTfAnswer(true)}
                  className="py-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xl shadow-lg transition-all cursor-pointer"
                >
                  TRUE
                </button>
                <button
                  type="button"
                  disabled={isAnswered}
                  onClick={() => handleTfAnswer(false)}
                  className="py-5 rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xl shadow-lg transition-all cursor-pointer"
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

              {/* Price Tracker Old Price vs New Price Review Box (Feature 1 & 2C) */}
              {currentQuestions[currentIndex].priceTrackerType && (
                <div className="mt-3 p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-xs font-mono max-w-lg mx-auto grid grid-cols-2 gap-2 text-left">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">Previous Old Price:</span>
                    <span className="font-bold text-slate-300">
                      {currentQuestions[currentIndex].priceTrackerType === 'new' ? 'None (New)' : `${fmt(currentQuestions[currentIndex].oldD || 0)} D ($${fmt(currentQuestions[currentIndex].oldUsd || 0)})`}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-400 block font-sans">Current New Price:</span>
                    <span className="font-bold text-emerald-300">{fmt(currentQuestions[currentIndex].newD || 0)} D (${fmt(currentQuestions[currentIndex].newUsd || 0)})</span>
                  </div>
                  {currentQuestions[currentIndex].deltaD !== undefined && currentQuestions[currentIndex].priceTrackerType !== 'new' && (
                    <div className="col-span-2 pt-1 border-t border-slate-800 text-[11px] text-slate-300">
                      Difference: <strong className={currentQuestions[currentIndex].deltaD > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                        {currentQuestions[currentIndex].deltaD > 0 ? '+' : ''}{fmt(currentQuestions[currentIndex].deltaD)} D ({currentQuestions[currentIndex].percentage}%)
                      </strong>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={goNextQuestion}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 active:scale-95 text-white font-bold text-sm sm:text-base shadow-lg shadow-cyan-900/40 flex items-center gap-2 cursor-pointer transition-all"
                >
                  <span>{currentIndex + 1 >= currentQuestions.length ? 'Finish Quiz' : 'Next Question'}</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>

              <div className="text-xs text-slate-400 pt-0.5 font-normal">
                Auto-advancing in a few seconds... or click <strong>Next Question</strong> / press <strong>Enter</strong>
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
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-semibold text-white block">{w.title}</span>
                        {w.companyName && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-700/60 text-[10px] text-indigo-300 font-mono">
                            <Building2 className="w-2.5 h-2.5" />
                            {w.companyName}
                          </span>
                        )}
                        {w.shippingMethod === 'sea' ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-700/60 text-[10px] text-cyan-300 font-mono">
                            <Ship className="w-2.5 h-2.5" /> By Sea
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-950/80 border border-sky-700/60 text-[10px] text-sky-300 font-mono">
                            <Plane className="w-2.5 h-2.5" /> By Air
                          </span>
                        )}
                        {w.origin && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] text-slate-300 font-mono">
                            {w.origin === 'China' ? '🇨🇳 China' : '🇦🇪 Dubai'}
                          </span>
                        )}
                      </div>
                      <span className="text-slate-400 text-xs font-mono font-normal block">{w.breakdown}</span>
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
