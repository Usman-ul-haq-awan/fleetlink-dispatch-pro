import React from "react";
import LectureSlider from "./LectureSlider";

const NAVY = "#0a2a6e";
const RED = "#cc0000";

function Block({ icon, title, children }) {
  return (
    <div className="bg-white rounded-xl p-5 sm:p-8 mb-5 shadow-sm" style={{ borderLeft: `6px solid ${RED}` }}>
      <h2 className="text-lg sm:text-xl font-black mb-3 pb-3 border-b-2 border-slate-100" style={{ color: NAVY }}>{icon} {title}</h2>
      <div className="text-sm text-slate-600 leading-relaxed space-y-3">{children}</div>
    </div>
  );
}

function Highlight({ children }) {
  return (
    <div className="rounded-lg p-4 my-3" style={{ background: "#f0f4ff", border: `2px solid ${NAVY}` }}>
      <p className="text-sm font-bold leading-relaxed" style={{ color: NAVY }}>{children}</p>
    </div>
  );
}

const TRUCKS = [
  {
    num: "Type 01", rate: "💰 $2.00–$3.50/mile", name: "🚛 Dry Van",
    img: "https://blogger.googleusercontent.com/img/a/AVvXsEgbZYW7vHyjpbXVIkq7OADW2KxhGt6QN6BIsIlmNHDaxTXEuoyzQU00zVY_eg11KuCAQeSQc86hPD65y7y1opcPv3MDNaPAbgXRb_SuCk_i1Ps4OqWgnxlOlr9hsVn9l-Ycm5Ueaq64NzpCF6QMBvwJTIKJ3Xm6FDcgJMKTE-jhv8MVXXa20-NtdHf0z2g=s272",
    desc: "The most common trailer type in American trucking. A fully enclosed weatherproof rectangular box trailer with four solid walls, a roof, a floor, and rear doors. Standard size: 53 feet long.",
    weight: "Maximum cargo weight: 44,000–45,000 lbs",
    cargo: ["📦 Packaged Foods", "📱 Electronics", "👗 Clothing", "🪑 Furniture", "🧸 Toys", "🔧 Auto Parts", "📚 Books", "🏗️ Building Materials"],
    note: "💼 Dispatcher Note: Best starting point for new dispatchers. Loads are abundant on DAT and Truckstop at all times. Rules are straightforward and brokers are familiar with the commodity.",
  },
  {
    num: "Type 02", rate: "💰 $2.50–$4.00/mile", name: "❄️ Reefer (Refrigerated)",
    img: "https://blogger.googleusercontent.com/img/a/AVvXsEgfU6ZTe2Pt-DY4Toolf4avJntNgUim_Kixio-nQ5RogsUhgcaEmm5NiVPAS8qEu-mkMVcuo1jNLVVtH0ekRLoQfik48gJjrF36KcmnwfJyYBfNnQgzaTNwWQvIKS_RsjqxgwxuBp0uZvZQckR_pigxk8SwZeBcBHkD5J-1fb1YdvqCk8HLOBhVwBDkapQ=s800",
    desc: "Looks like a dry van from the outside but has a refrigeration unit mounted at the front. Maintains temperatures from -20°F (frozen) to 70°F (cool). Temperature must be monitored and documented throughout the trip.",
    cargo: ["🥦 Fresh Produce", "🥛 Dairy Products", "🥩 Meat and Poultry", "💊 Pharmaceuticals", "🌸 Flowers", "🍦 Ice Cream"],
    note: "💼 Dispatcher Note: Pays more than dry van due to complexity. Requires attention to temperature requirements, pre-cooling instructions, and strict delivery time windows. Failed deliveries due to temperature issues result in significant financial claims.",
  },
  {
    num: "Type 03", rate: "💰 $2.50–$4.50/mile", name: "🏗️ Flatbed",
    img: "https://blogger.googleusercontent.com/img/a/AVvXsEgJvaMm8ZotzDFUGC1AmAr976Ra0-6Mc4bxvBgowMfNzBW7E7-_XUs1E2NDhBmtol-JqHkapRtXCtYGFSjBwrTOq-qBK4aA0axQrG4q4y1lM5gemT8lhNlwovXBzdQ03z0nEXItu_fgUtYst8Ta2hA_LWUTBu4SpS3J13w44zTa_uV-TqWU29iCV6q7S9Q=s275",
    desc: "A flat platform with no sides, no walls, and no roof — simply a deck on wheels. Standard size: 48 or 53 feet long. Cargo must be tarped, strapped, and secured properly.",
    cargo: ["🔩 Steel Coils", "🪵 Lumber", "🏗️ Construction Equipment", "🔧 Machinery", "🏛️ Structural Steel", "🌾 Agricultural Equipment"],
    note: "💼 Dispatcher Note: Higher rates than dry van. Requires knowledge of tarping requirements, axle weight limits, and securement regulations. Drivers need special skills and equipment.",
  },
  {
    num: "Type 04", rate: "💰 $2.75–$4.75/mile", name: "📐 Step Deck (Drop Deck)",
    img: "https://blogger.googleusercontent.com/img/a/AVvXsEhB-APwv0N8vWzq1i29z78z5mRlOYTTpm8JCcl04ir5JHtVoFeknhUwMcp1H-ZCQrs5GTRgPJYzC0Qgt5xgNKHFUe2kwVwQxCmvg6H1kItl1w3_ZKhWYecgwbUVu94aR9Kye0mr7Jf6iZLKSYCdx8JzOv3IBtt3-HMmajas5s8mBjkV7Qlq9PZ0p0GAMDw=s275",
    desc: "Has two deck levels — a higher front section and a lower rear section. This step allows taller cargo to be transported while meeting the maximum legal highway height of 13 feet 6 inches.",
    cargo: ["🚜 Excavators", "🏗️ Forklifts", "⚡ Large Generators", "🌾 Agricultural Machinery", "🏭 Industrial Equipment"],
    note: "💼 Dispatcher Note: Good niche for dispatchers targeting heavy equipment carriers. Higher rates than standard flatbed due to specialized equipment requirements.",
  },
  {
    num: "Type 05", rate: "💰 $4.00–$8.00+/mile", name: "⚓ Lowboy (Double Drop)",
    img: "https://blogger.googleusercontent.com/img/a/AVvXsEi5gsuT47zS00D7RyCP6G6M9yeXj-S-xVg38Q5f5gNEQuvRv2cEQBijlrzbZ-tZf7YgB_cXmooAUOcKUwnZZYwdmEzAiUblY6Uy8qKauCP1zSvO9vKfjBLED6JGg31-f4_XBB7R66Ml8SeszEo2-gWg_tK2Vh6aG6QA43AiNnC4zKKtVsEo1Fa0BYVhbk0=s375",
    desc: "Extremely low deck height — sometimes only 18 inches off the ground. Allows transportation of the heaviest and tallest equipment in the industry. Most moves require permits and pilot cars.",
    cargo: ["🏗️ Cranes", "🚧 Large Bulldozers", "🏭 Industrial Machinery", "🪖 Military Equipment", "⚙️ Oversized Construction Equipment"],
    note: "💼 Dispatcher Note: Highest paying loads in the industry. Requires permits, pilot car arrangements, and specialized route planning. Advanced dispatching niche with exceptional income potential.",
  },
  {
    num: "Type 06", rate: "💰 Flat Rate or Per Mile", name: "📦 Box Truck (Straight Truck)",
    img: "https://blogger.googleusercontent.com/img/a/AVvXsEggYTujjANazSQC4eNiJEjxe6Ab0VYIY4WoTnWBHK6dLAzX24y9Cqn-P2Ocmr4u1PvVRl_KfC1eOH2lXdOi8ZW4qxjLNQMW9G6-SU9vJqk2iNKhBZnl2djPGmGFDSzR9MrgLKo9CEvT_z0bCC_mjoimCTDZQTqRZTEetczsEMZFehmxGo45UaGwBakKTcc=s300",
    desc: "A single vehicle where the cab and enclosed cargo area are on the same chassis. Common sizes from 10 to 26 feet. Used by Amazon, FedEx, UPS, and local delivery services daily.",
    cargo: ["📦 Last-Mile Delivery", "🏠 Moving Company Loads", "🛍️ Local Deliveries", "📫 Regional Shipments"],
    note: "💼 Dispatcher Note: Great niche for new dispatchers. Amazon Relay and FedEx Ground use box trucks extensively. Contracts can be more stable than OTR loads.",
  },
  {
    num: "Type 07", rate: "💰 Premium Rates", name: "🛢️ Tanker",
    img: "https://blogger.googleusercontent.com/img/a/AVvXsEjmkM1D1LAetC_SOX9kkb89GtZl3g0COf-LoCtJ5nucI5hswpy5HnbmrkBTA7NdSQivwXDdJMUjiFNQV8rYGdLB1Q-7uhDr_pZRoyv06ChBDKCHJJ6UGXwt2ofwWwU2jTSS1vfuYCH_RiCs8u2AYEqfvO8KZUHascc5KXmS_I8ORBQGfbrpPytD7zpAdwU=s300",
    desc: "A cylindrical vessel designed to carry liquids or gases. Different types exist for different materials — food-grade tankers, chemical tankers, petroleum tankers, and cryogenic tankers.",
    cargo: ["⛽ Fuel", "🥛 Milk", "💧 Water", "⚗️ Chemicals", "🧃 Liquid Foods", "💨 Industrial Gases"],
    note: "💼 Dispatcher Note: Many tanker loads involve HAZMAT requiring additional driver certifications and strict regulatory compliance. Rates are high but compliance requirements are significant.",
  },
  {
    num: "Type 08", rate: "💰 Per Vehicle Rate", name: "🚗 Auto Carrier (Car Hauler)",
    img: "https://blogger.googleusercontent.com/img/a/AVvXsEjw14JwI4NWlTKBW4SO492nDqEEgCrhuktUCwCD5izf-ua784CTqUSD1LJtBo8Dvo56OS5iZ3Ss4t0vCidAW_mCxd_-JJlTLobpZ7jYnbCSoOFSHMzvW3Z0yfQdnYFu9TIKfsOpKkicXsAtLnVucxCZ9u8tRi3Xlhlz03sTk97HxiEBNYbTZeYco78qwEk=s340",
    desc: "Specialized trailer designed to transport multiple vehicles simultaneously — typically 8 to 10 cars or trucks. Used to move new cars from manufacturing plants to dealerships nationwide.",
    cargo: ["🚗 New Cars", "🚙 Used Cars", "🚕 SUVs and Trucks", "🏎️ Auction Vehicles"],
    note: "💼 Dispatcher Note: Auto transport is a specialized niche with its own load boards — uShip and Central Dispatch. Different pricing structure from general freight dispatching.",
  },
  {
    num: "Type 09", rate: "💰 $2.00–$3.50/mile", name: "⚡ Power Only",
    img: "https://blogger.googleusercontent.com/img/a/AVvXsEiY-FTpvNi5Vx-oVo3-zpCaAqsJGvUvlB_UGr7xGVk579FBn3f0XKeu3_8GpZz2DrkP-zylidApm2W3goyFouggovsSKaISU9fF8gjoVEVlYPspvLsDMrniZWoGyYXlviG2L6xNI4erCnWFGFhDeKID_CZ9tndBSJJuojco6WxU--XaFy4QyJfqGTK3kVw=s225",
    desc: "The carrier provides only the tractor — the truck cab — without a trailer. The shipper or broker already has the trailer and just needs a truck to pull it. The trailer is already loaded and waiting.",
    cargo: ["📦 Anything", "🏪 Shipper Trailers", "🔄 Drop and Hook Loads"],
    note: "💼 Dispatcher Note: Common when companies have their own trailer fleets but need additional trucks during peak seasons. Can pay well and are easier to manage because the trailer is pre-loaded.",
  },
  {
    num: "Type 10", rate: "💰 Premium Rush Rates", name: "🔥 Hotshot",
    img: "https://blogger.googleusercontent.com/img/a/AVvXsEir_RSTPyQimrP9yhPE31PoevtojxMGQ-iRLQxq315bGvd0TUEnY83ClCvRr_eQT4rLGui9DaLA7CAWnuPB2993iyxPxfHuh1KTVfq9ZKRKgjhZ1YT52tVWcwgUQVyPoaMq1YWgjNGQSKC7tkKohYKQ0rPWKsIuEZgK4exzIHHQVLInsLVmtD7IfiyKHTI=s318",
    desc: "Uses medium-duty pickup trucks like Ford F-350 or Ram 3500 pulling smaller flatbed trailers — typically 40 feet or less. All about speed — urgent time-sensitive freight delivered fast.",
    cargo: ["⚙️ Urgent Industrial Parts", "🛢️ Oil Field Equipment", "🏗️ Construction Materials", "🚜 Agricultural Parts"],
    note: "💼 Dispatcher Note: Growing niche. Many small owner-operators start with hotshot equipment. Premium rates for rush deliveries. Great starting point for building your first carrier relationships.",
  },
  {
    num: "Type 11", rate: "💰 $2.50–$4.00/mile", name: "🎪 Conestoga (Rolling Tarp)",
    img: "https://blogger.googleusercontent.com/img/a/AVvXsEi2dN99veeUCaMsloqZS0ihgzb0zpWxDiH2sRZUcYOLOPvDpn9Qb2nhkQyl5wdwGz_d04AHv1UDQ7F1cf2E0FBJ4obiXq3DocWuwaUGfXMZ1InXA9ZYB2SF-GrHLPJueUspFuNN82GxOeyKsx9DjpBN78wLqO0i1-K1H2r4sRB33i7I4fxJmV51sYaaM3U=s350",
    desc: "Has a rolling tarp system that can cover and uncover the flat deck quickly — combining the accessibility of a flatbed with weather protection similar to a dry van. Best of both worlds.",
    cargo: ["🔩 Steel", "🪵 Lumber", "🏭 Manufactured Goods", "📦 Weather-Sensitive Flatbed Cargo"],
    note: "💼 Dispatcher Note: Great for carriers who want flatbed loads but with added weather protection capability. Rates similar to standard flatbed with slight premium for the rolling tarp feature.",
  },
];

function TruckCard({ t }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-md mb-6 transition-transform hover:-translate-y-1" style={{ borderTop: `5px solid ${RED}` }}>
      <img src={t.img} alt={t.name} className="w-full h-[250px] object-contain block" style={{ background: "#f4f6fb" }} />
      <div className="p-5 sm:p-6">
        <div className="flex items-center justify-between flex-wrap gap-2.5 mb-3">
          <span className="text-xs font-black text-white px-3.5 py-1 rounded-full" style={{ background: RED }}>{t.num}</span>
          <span className="text-xs font-black text-white px-3.5 py-1 rounded-full" style={{ background: NAVY }}>{t.rate}</span>
        </div>
        <h3 className="text-lg font-black mb-3" style={{ color: NAVY }}>{t.name}</h3>
        <p className="text-xs text-slate-600 leading-relaxed mb-2">{t.desc}</p>
        {t.weight && <p className="text-xs text-slate-600 mb-2"><strong>{t.weight}</strong></p>}
        <p className="text-xs text-slate-600 mb-1.5"><strong>What it carries:</strong></p>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {t.cargo.map((c) => (
            <span key={c} className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: "#f4f6fb", color: NAVY }}>{c}</span>
          ))}
        </div>
        <div className="rounded-r-lg px-4 py-3 mt-3" style={{ background: "#fff8f0", borderLeft: `4px solid ${RED}` }}>
          <p className="text-xs font-bold" style={{ color: RED }}>{t.note}</p>
        </div>
      </div>
    </div>
  );
}

const WEIGHT_ROWS = [
  ["Maximum Gross Vehicle Weight", "80,000 lbs", "Truck + Trailer + Cargo combined"],
  ["Maximum Cargo Weight", "44,000–45,000 lbs", "Typical for standard trailers"],
  ["Maximum Height", "13 feet 6 inches", "Most US states — verify per route"],
  ["Maximum Width", "8 feet 6 inches", "Wider loads require permits"],
  ["Maximum Trailer Length", "53 feet", "Standard 53-foot trailer"],
];

export default function Module2Lecture() {
  return (
    <div className="font-sans">
      <LectureSlider />

      {/* AUDIO PLAYER */}
      <div className="py-6 px-4 text-center" style={{ background: NAVY }}>
        <p className="text-xs font-black uppercase tracking-wide mb-3" style={{ color: RED }}>🎙️ Module 2 — Audio Lecture — Press Play To Listen While You Read</p>
        <div className="max-w-2xl mx-auto rounded-lg p-5" style={{ background: "rgba(255,255,255,0.1)", border: `2px dashed ${RED}` }}>
          <iframe width="100%" height="300" scrolling="no" frameBorder="no" allow="autoplay; encrypted-media"
            title="Module 2 Audio Lecture"
            src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/soundcloud%253Atracks%253A2330476166&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true" />
        </div>
      </div>

      {/* VIDEO */}
      <div className="py-10 px-5 text-center" style={{ background: "#f4f6fb" }}>
        <h2 className="text-xl sm:text-2xl font-black mb-4" style={{ color: NAVY }}>🎥 Module 2 — Video Lecture</h2>
        <div className="max-w-3xl mx-auto rounded-xl p-10 sm:p-14" style={{ background: NAVY, border: `3px dashed ${RED}` }}>
          <span className="text-5xl block mb-3">▶️</span>
          <h3 className="text-lg font-black text-white mb-2">Video Coming Soon</h3>
          <p className="text-sm text-slate-300">This lecture video is being produced. <a href="https://wa.me/923114111899" target="_blank" rel="noopener noreferrer" className="font-black" style={{ color: RED }}>WhatsApp us</a> to join the live batch now.</p>
        </div>
      </div>

      {/* HERO */}
      <div className="text-center text-white px-5 py-12" style={{ background: "linear-gradient(135deg, #0a2a6e 0%, #0d3080 50%, #0a2a6e 100%)" }}>
        <span className="inline-block text-xs font-black px-5 py-1.5 rounded-full mb-4 uppercase tracking-wide text-white" style={{ background: RED }}>
          📚 Module 2 of 23
        </span>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black mb-3 leading-tight">
          Types of <span style={{ color: RED }}>Trucks</span>
        </h1>
        <p className="text-sm sm:text-base max-w-2xl mx-auto leading-relaxed text-slate-300">
          Know your equipment — know your business. A dispatcher who cannot identify truck types cannot book loads correctly. This module makes you an equipment expert.
        </p>
      </div>

      {/* CONTENT */}
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Block icon="📖" title="Introduction">
          <p>In the previous lecture, we established what truck dispatching is and how the entire logistics ecosystem operates. Now it is time to go one level deeper into something that every professional dispatcher must know thoroughly — the types of trucks and trailers used in American trucking.</p>
          <Highlight>⚠️ Why This Matters: Booking a refrigerated load for a flatbed truck, or an oversized piece of machinery for a dry van, is not just a mistake — it is a professional failure that costs your carrier money, damages your reputation with brokers, and could end your dispatching relationship permanently.</Highlight>
          <p>Understanding truck types is not optional knowledge. It is fundamental expertise that every dispatcher must master before making a single call.</p>
        </Block>

        <Block icon="🚛" title="Truck vs Trailer — Important Distinction">
          <p>Before we categorize the types, let us clarify an important distinction that confuses many beginners. In American trucking:</p>
          <p>The <strong style={{ color: NAVY }}>Truck (Tractor/Cab)</strong> — the front part with the engine and driver's compartment. This is the power unit.</p>
          <p>The <strong style={{ color: RED }}>Trailer</strong> — the back part that carries the cargo. This is what varies and determines what cargo can be hauled.</p>
          <Highlight>💡 When dispatchers talk about "types of trucks" they are almost always referring to the type of TRAILER — because that determines what cargo can be hauled and what rates you can charge.</Highlight>
        </Block>

        {/* TRUCKS GRID */}
        <h2 className="text-xl sm:text-2xl font-black text-center mb-5 pb-3" style={{ color: NAVY, borderBottom: `3px solid ${RED}` }}>🚛 Complete Guide to Truck Types</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {TRUCKS.map((t) => <TruckCard key={t.num} t={t} />)}
        </div>

        {/* WEIGHT LIMITS */}
        <Block icon="⚖️" title="Legal Weight and Dimension Limits — Every Dispatcher Must Know">
          <div className="w-full mt-3 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left text-xs font-bold text-white px-4 py-3" style={{ background: NAVY }}>Measurement</th>
                  <th className="text-left text-xs font-bold text-white px-4 py-3" style={{ background: NAVY }}>Legal Limit</th>
                  <th className="text-left text-xs font-bold text-white px-4 py-3" style={{ background: NAVY }}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {WEIGHT_ROWS.map(([m, l, n], i) => (
                  <tr key={m} className={i % 2 === 1 ? "bg-slate-50" : ""}>
                    <td className="px-4 py-3 text-xs text-slate-600 border-b border-slate-100">{m}</td>
                    <td className="px-4 py-3 text-xs font-black border-b border-slate-100" style={{ color: RED }}>{l}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 border-b border-slate-100">{n}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Highlight>⚠️ Loads exceeding these limits require special permits, pilot cars, and route planning — all of which affect the dispatcher's work and add complexity to the load.</Highlight>
        </Block>

        <Block icon="📅" title="Seasonal Considerations">
          <p>Different truck types perform differently across seasons — understanding this helps you advise your carriers on equipment investment and lane selection:</p>
          <Highlight>❄️ <strong>Reefer:</strong> Demand spikes in summer (produce season) and holiday food seasons</Highlight>
          <Highlight>🏗️ <strong>Flatbed:</strong> Demand spikes in spring and summer (construction season)</Highlight>
          <Highlight>📦 <strong>Dry Van:</strong> Consistent year-round but peaks around retail holiday seasons (Q4)</Highlight>
        </Block>

        {/* KEY TAKEAWAYS */}
        <div className="rounded-2xl p-6 sm:p-8 mb-5" style={{ background: NAVY }}>
          <h2 className="text-xl font-black text-white mb-4 pb-3 border-b-2 border-white/20">✅ Key Takeaways — Module 2</h2>
          {[
            ["🚛", "The trailer determines everything", " — what cargo it carries, what rates it commands, and what loads you can book."],
            ["📦", "Dry Van is where beginners start", " — most loads, most brokers, most straightforward rules. Perfect starting point."],
            ["💰", "Specialty equipment pays more", " — Lowboy, Reefer, and Tanker pay premium rates but require more expertise."],
            ["⚖️", "Know the legal limits", " — 80,000 lbs gross, 13'6\" height, 8'6\" width, 53 feet length. Loads exceeding these need permits."],
            ["📅", "Seasonality drives demand", " — understanding seasonal patterns helps you keep your carriers loaded year round."],
          ].map(([icon, bold, rest]) => (
            <div key={bold} className="flex items-start gap-3 mb-3 last:mb-0">
              <span className="text-lg flex-shrink-0 mt-0.5">{icon}</span>
              <p className="text-sm text-slate-300 leading-relaxed"><strong className="text-white">{bold}</strong>{rest}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="rounded-2xl p-6 sm:p-8 text-center mb-5" style={{ background: "linear-gradient(135deg, #cc0000 0%, #aa0000 100%)" }}>
          <h2 className="text-xl sm:text-2xl font-black text-white mb-2">🚀 Ready To Continue?</h2>
          <p className="text-sm text-red-200 mb-4">Module 3 is next — Terms Used in USA Trucking. Master the language of the industry and speak like a professional dispatcher from day one.</p>
          <a href="https://wa.me/923114111899" target="_blank" rel="noopener noreferrer"
            className="inline-block rounded-full px-8 py-3 text-sm font-black text-white transition-colors hover:bg-white hover:text-[#25d366]"
            style={{ background: "#25d366", border: "3px solid #25d366" }}>
            💬 Join The Full Course — WhatsApp Us
          </a>
        </div>

        {/* COPYRIGHT */}
        <div className="text-center py-4" style={{ background: NAVY }}>
          <p className="text-xs text-slate-300">© 2026 Tycoon Dispatch Academy — All Rights Reserved</p>
        </div>
      </div>
    </div>
  );
}