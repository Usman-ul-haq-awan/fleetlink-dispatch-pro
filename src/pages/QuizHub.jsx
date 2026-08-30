import React, { useState, useEffect } from "react";
import { BookOpen, ArrowLeft, GraduationCap, BarChart3 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { QUIZ_MODULES } from "@/data/quizModules";
import QuizRunner from "@/components/quiz/QuizRunner";
import QuizResultsAdmin from "@/components/quiz/QuizResultsAdmin";
import LectureView from "@/components/quiz/LectureView";

export default function QuizHub() {
  const [selected, setSelected] = useState(null); // module object
  const [view, setView] = useState("lecture"); // lecture | quiz
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("modules");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const isAdmin = user?.role === "admin";

  const openModule = (m) => {
    setSelected(m);
    setView("lecture");
  };

  const startQuiz = () => setView("quiz");

  const backToList = () => {
    setSelected(null);
    setView("lecture");
  };

  if (selected && view === "quiz") {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <button onClick={() => setView("lecture")} className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 mb-4 font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Lecture
        </button>
        <div className="bg-gradient-to-r from-blue-800 to-blue-900 rounded-lg p-6 mb-6 text-center">
          <span className="inline-block bg-red-600 text-white text-xs font-bold px-4 py-1 rounded-full mb-3 uppercase tracking-wide">
            📝 Module {selected.module} of 23{selected.module === 23 && " — Final Module 🏆"}
          </span>
          <h1 className="text-2xl font-bold text-white">{selected.title}</h1>
          <p className="text-blue-100 text-sm mt-2">20 questions randomly selected · 30s per question · 70% to pass for certificate</p>
        </div>
        <QuizRunner module={selected.module} title={selected.title} onExit={backToList} />
      </div>
    );
  }

  if (selected && view === "lecture") {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="px-4 pt-4">
          <button onClick={backToList} className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 font-medium">
            <ArrowLeft className="w-4 h-4" /> All Modules
          </button>
        </div>
        <LectureView module={selected.module} title={selected.title} onStartQuiz={startQuiz} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-blue-700" />
            Knowledge Base
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Tycoon Dispatch Academy — 23-module truck dispatching course. Read each lecture, then pass the module quiz with 70%+ to claim your certificate.
          </p>
        </div>
      </div>

      <div className="flex gap-1 mb-6 border-b border-slate-200">
        <button onClick={() => setTab("modules")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === "modules" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
          <BookOpen className="w-4 h-4" /> Modules
        </button>
        {isAdmin && (
          <button onClick={() => setTab("results")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === "results" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
            <BarChart3 className="w-4 h-4" /> Student Results
          </button>
        )}
      </div>

      {tab === "results" && isAdmin ? (
        <QuizResultsAdmin />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {QUIZ_MODULES.map((m) => (
            <button key={m.module} onClick={() => openModule(m)}
              className="text-left bg-white rounded-lg border border-slate-200 p-4 hover:border-blue-400 hover:shadow-md hover:-translate-y-0.5 transition-all group">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-800 text-white flex items-center justify-center font-bold text-sm">
                  {m.module}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-400 font-medium mb-0.5">Module {m.module} of 23</p>
                  <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-700 leading-snug">{m.title}</p>
                </div>
                <BookOpen className="w-4 h-4 text-slate-300 group-hover:text-blue-500 flex-shrink-0 mt-1" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}