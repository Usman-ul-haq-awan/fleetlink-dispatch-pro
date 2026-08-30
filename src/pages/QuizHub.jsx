import React, { useState } from "react";
import { BookOpen, ArrowLeft, GraduationCap } from "lucide-react";
import { QUIZ_MODULES } from "@/data/quizModules";
import QuizRunner from "@/components/quiz/QuizRunner";

export default function QuizHub() {
  const [selected, setSelected] = useState(null);

  if (selected) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 mb-4 font-medium">
          <ArrowLeft className="w-4 h-4" /> All Modules
        </button>
        <div className="bg-gradient-to-r from-blue-800 to-blue-900 rounded-lg p-6 mb-6 text-center">
          <span className="inline-block bg-red-600 text-white text-xs font-bold px-4 py-1 rounded-full mb-3 uppercase tracking-wide">
            📚 Module {selected.module} of 23{selected.module === 23 && " — Final Module 🏆"}
          </span>
          <h1 className="text-2xl font-bold text-white">{selected.title}</h1>
          <p className="text-blue-100 text-sm mt-2">20 questions randomly selected · 30s per question · 70% to pass for certificate</p>
        </div>
        <QuizRunner module={selected.module} title={selected.title} onExit={() => setSelected(null)} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <GraduationCap className="w-7 h-7 text-blue-700" />
          Quiz Hub
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Tycoon Dispatch Academy — 23-module truck dispatching course. Pass each module quiz with 70%+ to claim your certificate.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {QUIZ_MODULES.map((m) => (
          <button key={m.module} onClick={() => setSelected(m)}
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
    </div>
  );
}