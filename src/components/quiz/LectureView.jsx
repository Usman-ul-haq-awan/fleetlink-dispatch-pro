import React from "react";
import Module1Lecture from "./Module1Lecture";
import Module2Lecture from "./Module2Lecture";
import Module3Lecture from "./Module3Lecture";
import Module4Lecture from "./Module4Lecture";
import Module5Lecture from "./Module5Lecture";
import Module6Lecture from "./Module6Lecture";

// Registry of lecture components per module. Only modules with authored
// lecture content are listed here; others fall back to the "coming soon" state.
const LECTURES = {
  1: Module1Lecture,
  2: Module2Lecture,
  3: Module3Lecture,
  4: Module4Lecture,
  5: Module5Lecture,
  6: Module6Lecture,
};

export default function LectureView({ module, title, onStartQuiz }) {
  const Lecture = LECTURES[module];

  return (
    <div>
      {Lecture ? (
        <Lecture />
      ) : (
        <div className="max-w-3xl mx-auto px-4 py-12 text-center">
          <div className="bg-white rounded-xl border border-slate-200 p-10">
            <span className="text-5xl block mb-3">📚</span>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Module {module}: {title}</h2>
            <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
              The full lecture for this module is being prepared. You can still test your knowledge by taking the quiz below.
            </p>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 pb-12 text-center">
        <button
          onClick={onStartQuiz}
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-sm font-black text-white transition-colors hover:bg-white hover:text-[#cc0000]"
          style={{ background: "#cc0000", border: "3px solid #cc0000" }}
        >
          📝 Take the Module {module} Quiz →
        </button>
      </div>
    </div>
  );
}