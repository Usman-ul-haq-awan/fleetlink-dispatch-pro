import React, { useState, useEffect, useCallback, useRef } from "react";
import { Loader2, Clock, CheckCircle, XCircle, Award, RotateCcw, ChevronRight } from "lucide-react";
import { fetchQuestionBank, submitQuizResult } from "@/data/quizModules";

const QUESTION_COUNT = 20;
const TIME_PER_QUESTION = 30;
const PASS_PERCENT = 70;

const inputCls = "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500";

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function QuizRunner({ module, title, onExit }) {
  const [bank, setBank] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [phase, setPhase] = useState("loading"); // loading | form | quiz | result
  const [student, setStudent] = useState({ name: "", email: "", whatsapp: "" });
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  const [result, setResult] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    let alive = true;
    setPhase("loading");
    setBank(null);
    setLoadError("");
    fetchQuestionBank(module)
      .then((b) => { if (alive) { setBank(b); setPhase("form"); } })
      .catch((err) => { if (alive) { setLoadError(err.message); setPhase("form"); } });
    return () => { alive = false; };
  }, [module]);

  const startQuiz = () => {
    if (!student.name || !student.email) return;
    const picked = shuffle(bank).slice(0, Math.min(QUESTION_COUNT, bank.length));
    setQuestions(picked);
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setAnswers([]);
    setTimeLeft(TIME_PER_QUESTION);
    setPhase("quiz");
  };

  const recordAnswer = useCallback((qIdx, choice) => {
    const q = questions[qIdx];
    const isCorrect = choice === q.correct;
    setAnswers((prev) => [...prev, { qIdx, choice, correct: isCorrect, skipped: choice === null }]);
    if (isCorrect) setScore((s) => s + 1);
  }, [questions]);

  const goNext = useCallback(() => {
    if (current + 1 >= questions.length) {
      // finish
      setPhase("result");
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
      setTimeLeft(TIME_PER_QUESTION);
    }
  }, [current, questions.length]);

  // Timer
  useEffect(() => {
    if (phase !== "quiz") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, current]);

  // When timer hits 0, auto-advance (counts as skipped)
  useEffect(() => {
    if (phase === "quiz" && timeLeft === 0 && selected === null) {
      recordAnswer(current, null);
      setTimeout(() => goNext(), 600);
    }
  }, [timeLeft, phase, selected, current, recordAnswer, goNext]);

  const handleSelect = (idx) => {
    if (selected !== null) return;
    setSelected(idx);
    recordAnswer(current, idx);
  };

  // Finalize result when entering result phase
  useEffect(() => {
    if (phase !== "result" || !questions.length) return;
    const finalScore = answers.filter((a) => a.correct).length;
    const total = questions.length;
    const pct = Math.round((finalScore / total) * 100);
    const passed = pct >= PASS_PERCENT;
    setResult({ score: finalScore, total, pct, passed });
    submitQuizResult({
      name: student.name,
      email: student.email,
      whatsapp: student.whatsapp,
      moduleNumber: module,
      moduleTitle: title,
      score: finalScore,
      total,
      pct,
      passed,
    });
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  if (phase === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-3" />
        <p className="text-sm text-slate-500">Loading Module {module} question bank…</p>
      </div>
    );
  }

  if (phase === "form") {
    return (
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-lg border border-slate-200 border-l-4 border-l-red-600 p-6">
          <h2 className="text-lg font-bold text-blue-800 mb-1">📋 Enter Your Details to Begin</h2>
          <p className="text-xs text-slate-500 mb-5">
            Required to record your score and issue your certificate. Stored securely and only used for your quiz results.
          </p>
          {loadError && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
              ⚠️ {loadError}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1.5">Full Name</label>
              <input className={inputCls} value={student.name} onChange={(e) => setStudent({ ...student, name: e.target.value })} placeholder="e.g. Ali Hassan" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1.5">Email Address</label>
              <input type="email" className={inputCls} value={student.email} onChange={(e) => setStudent({ ...student, email: e.target.value })} placeholder="e.g. ali@gmail.com" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1.5">WhatsApp Number</label>
              <input className={inputCls} value={student.whatsapp} onChange={(e) => setStudent({ ...student, whatsapp: e.target.value })} placeholder="e.g. 923001234567" />
            </div>
          </div>
          <button onClick={startQuiz} disabled={!student.name || !student.email || !bank}
            className="w-full bg-blue-800 hover:bg-red-600 text-white text-sm font-bold py-3 rounded-full transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            🚀 Start Quiz — Module {module}
          </button>
          <p className="text-center text-xs text-slate-400 mt-3">
            {bank ? `${bank.length} questions in bank · 20 randomly selected · 30s per question · 70% to pass` : "Preparing question bank…"}
          </p>
        </div>
      </div>
    );
  }

  if (phase === "quiz" && questions.length > 0) {
    const q = questions[current];
    const progress = ((current) / questions.length) * 100;
    const timerPct = (timeLeft / TIME_PER_QUESTION) * 100;
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-slate-700">Question {current + 1} of {questions.length}</span>
            <span className="text-sm font-semibold text-blue-700">Score: {score}</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div className="bg-blue-700 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div className={`h-1.5 rounded-full transition-all ${timeLeft <= 5 ? "bg-red-500" : "bg-amber-500"}`} style={{ width: `${timerPct}%` }} />
            </div>
            <span className={`text-xs font-bold ${timeLeft <= 5 ? "text-red-600" : "text-slate-500"}`}>{timeLeft}s</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <p className="text-base font-semibold text-slate-900 mb-5">{q.q}</p>
          <div className="space-y-2.5">
            {q.opts.map((opt, i) => {
              let cls = "border-slate-200 hover:border-blue-400 hover:bg-blue-50";
              if (selected !== null) {
                if (i === q.correct) cls = "border-green-500 bg-green-50 text-green-800";
                else if (i === selected) cls = "border-red-500 bg-red-50 text-red-800";
                else cls = "border-slate-200 opacity-60";
              }
              return (
                <button key={i} onClick={() => handleSelect(i)} disabled={selected !== null}
                  className={`w-full text-left px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${cls} disabled:cursor-default`}>
                  <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span>{opt}
                  {selected !== null && i === q.correct && <CheckCircle className="inline-block w-4 h-4 ml-2 text-green-600" />}
                  {selected !== null && i === selected && i !== q.correct && <XCircle className="inline-block w-4 h-4 ml-2 text-red-600" />}
                </button>
              );
            })}
          </div>
          {selected !== null && q.exp && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800"><strong>💡 Explanation:</strong> {q.exp}</p>
            </div>
          )}
          {selected !== null && (
            <button onClick={goNext} className="mt-4 w-full bg-blue-800 hover:bg-red-600 text-white text-sm font-bold py-3 rounded-full transition-colors flex items-center justify-center gap-2">
              {current + 1 >= questions.length ? "Finish Quiz" : "Next Question"} <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  if (phase === "result" && result) {
    return (
      <div className="max-w-xl mx-auto">
        {result.passed ? (
          <div className="bg-white rounded-lg border-2 border-green-300 overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-5 text-center">
              <Award className="w-14 h-14 text-yellow-300 mx-auto mb-2" />
              <h2 className="text-2xl font-bold text-white">Congratulations! 🎉</h2>
              <p className="text-green-100 text-sm mt-1">You passed Module {module} — {title}</p>
            </div>
            <div className="p-6 text-center">
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-blue-800">{result.score}</p>
                  <p className="text-xs text-slate-500">Correct</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-blue-800">{result.total}</p>
                  <p className="text-xs text-slate-500">Total</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-green-700">{result.pct}%</p>
                  <p className="text-xs text-slate-500">Score</p>
                </div>
              </div>
              <div className="border-2 border-blue-800 rounded-lg p-5 bg-gradient-to-br from-blue-50 to-white">
                <p className="text-xs text-slate-500 uppercase tracking-wide font-bold mb-1">Certificate of Completion</p>
                <p className="text-lg font-bold text-blue-800">{student.name}</p>
                <p className="text-xs text-slate-600 mt-1">has successfully completed</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">Module {module}: {title}</p>
                <p className="text-xs text-slate-500 mt-2">Score: {result.pct}% · {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                <p className="text-[10px] text-slate-400 mt-3">Tycoon Dispatch Academy · Tycoon Logistics</p>
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={() => setPhase("form")} className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold py-2.5 rounded-full transition-colors">
                  <RotateCcw className="w-4 h-4" /> Retake
                </button>
                <button onClick={onExit} className="flex-1 bg-blue-800 hover:bg-red-600 text-white text-sm font-bold py-2.5 rounded-full transition-colors">
                  Back to Modules
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border-2 border-red-300 overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-5 text-center">
              <XCircle className="w-14 h-14 text-white mx-auto mb-2" />
              <h2 className="text-2xl font-bold text-white">Not Quite There</h2>
              <p className="text-red-100 text-sm mt-1">You need 70% to pass — you scored {result.pct}%</p>
            </div>
            <div className="p-6 text-center">
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="bg-slate-50 rounded-lg p-3"><p className="text-2xl font-bold text-blue-800">{result.score}</p><p className="text-xs text-slate-500">Correct</p></div>
                <div className="bg-slate-50 rounded-lg p-3"><p className="text-2xl font-bold text-blue-800">{result.total}</p><p className="text-xs text-slate-500">Total</p></div>
                <div className="bg-red-50 rounded-lg p-3"><p className="text-2xl font-bold text-red-700">{result.pct}%</p><p className="text-xs text-slate-500">Score</p></div>
              </div>
              <p className="text-sm text-slate-600 mb-5">Review the module material and try again. Every attempt draws different questions from the bank.</p>
              <div className="flex gap-2">
                <button onClick={() => setPhase("form")} className="flex-1 flex items-center justify-center gap-2 bg-blue-800 hover:bg-red-600 text-white text-sm font-bold py-2.5 rounded-full transition-colors">
                  <RotateCcw className="w-4 h-4" /> Try Again
                </button>
                <button onClick={onExit} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold py-2.5 rounded-full transition-colors">
                  Back to Modules
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}