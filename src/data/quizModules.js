// Metadata for the 23 Tycoon Dispatch Academy quiz modules.
// Question banks are fetched at runtime from the GitHub raw files so the
// hub stays in sync with the source repository without bundling ~460 questions.
export const QUIZ_MODULES = [
  { module: 1, title: "What Is Truck Dispatching?" },
  { module: 2, title: "Types of Trucks" },
  { module: 3, title: "Terms Used in USA Trucking" },
  { module: 4, title: "Requirements for Dispatching" },
  { module: 5, title: "How to Find Carriers" },
  { module: 6, title: "Finding Carriers by Cold Calling" },
  { module: 7, title: "Three Recommended Dialers" },
  { module: 8, title: "Finding Carriers Through Emails" },
  { module: 9, title: "FMCSA and Safer Web" },
  { module: 10, title: "Five Free Websites to Find Carriers" },
  { module: 11, title: "Finding Carriers Through Social Media" },
  { module: 12, title: "How to Find Loads Through Load Boards" },
  { module: 13, title: "Dealing With Carriers" },
  { module: 14, title: "Dealing With Brokers" },
  { module: 15, title: "Payment Gateways in USA" },
  { module: 16, title: "Dealing and Setup With Carriers" },
  { module: 17, title: "Dealing and Setup With Brokers" },
  { module: 18, title: "Certificate of Insurance" },
  { module: 19, title: "Notice of Assignment" },
  { module: 20, title: "W9 Form" },
  { module: 21, title: "Rate Confirmation" },
  { module: 22, title: "Bill of Lading" },
  { module: 23, title: "Company Setup and LLC Formation" },
];

const RAW_BASE = "https://raw.githubusercontent.com/Usman-ul-haq-awan/tycoon-tours-tools/main";

export const quizRawUrl = (module) => `${RAW_BASE}/module${module}-quiz.html`;

// Fetch a module's raw HTML and extract the QUESTION_BANK array.
export async function fetchQuestionBank(module) {
  const res = await fetch(quizRawUrl(module));
  if (!res.ok) throw new Error(`Failed to load module ${module}`);
  const html = await res.text();
  const start = html.indexOf("var QUESTION_BANK");
  if (start === -1) throw new Error("Question bank not found in module file");
  const arrStart = html.indexOf("[", start);
  const arrEnd = html.indexOf("];", arrStart);
  if (arrStart === -1 || arrEnd === -1) throw new Error("Could not parse question bank");
  const arrText = html.slice(arrStart, arrEnd + 1);
  // eslint-disable-next-line no-new-func
  const bank = new Function("return " + arrText)();
  if (!Array.isArray(bank) || bank.length === 0) throw new Error("Question bank is empty");
  return bank;
}

// Submit quiz results to the Tycoon Dispatch Academy Google Form.
// Uses no-cors mode (opaque response) — the data is recorded even though
// the response cannot be read, matching the original hidden-iframe behavior.
const GFORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSdw5ZMRc3Z9XoCHX-tJPcPW-HZ-HfaiKropVIm_E3ScEkrrMQ/formResponse";

export async function submitQuizResult({ name, email, whatsapp, moduleNumber, moduleTitle, score, total, pct, passed }) {
  const now = new Date();
  const params = new URLSearchParams({
    "entry.162722829": name,
    "entry.295556761": email,
    "entry.777151074": whatsapp,
    "entry.2029299506": String(moduleNumber),
    "entry.171128487": moduleTitle,
    "entry.1707671960": String(score),
    "entry.255573310": String(total),
    "entry.1021719303": String(pct),
    "entry.746918137": passed ? "PASS" : "FAIL",
    "entry.170755011": now.toLocaleDateString("en-US"),
    "entry.489384834": now.toLocaleTimeString("en-US"),
  });
  try {
    await fetch(`${GFORM_URL}?${params.toString()}`, { method: "POST", mode: "no-cors" });
  } catch {
    // Submission is best-effort — do not block the certificate on failure
  }
}