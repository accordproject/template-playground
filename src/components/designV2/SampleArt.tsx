import type { StartArt } from "./constants";

/**
 * Line-art illustration at the top of a gallery card, one per template plus
 * one for the blank card. Drawn in `currentColor`, which the card sets to its
 * accent colour, so the drawings follow the spine colour of each card.
 * Each one pictures the feature its template demonstrates, not the agreement.
 */
const SampleArt = ({ kind }: { kind: StartArt }) => {
  if (kind === "variables") return <VariablesArt />;
  if (kind === "clauses") return <ClausesArt />;
  if (kind === "blank") return <BlankArt />;
  return <LogicArt />;
};

const svgProps = {
  viewBox: "0 0 160 120",
  className: "nd-sample-art-svg",
  "aria-hidden": true,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/** A page of text with two filled-in blanks: variables resolved from the data. */
const VariablesArt = () => (
  <svg {...svgProps}>
    <path d="M46 12 H100 L118 30 V104 A4 4 0 0 1 114 108 H46 A4 4 0 0 1 42 104 V16 A4 4 0 0 1 46 12 Z" fill="#fff" />
    <path d="M100 12 V30 H118" />
    <line x1="54" y1="44" x2="72" y2="44" opacity="0.45" />
    <rect x="76" y="38" width="30" height="12" rx="6" fill="currentColor" fillOpacity="0.28" />
    <line x1="54" y1="60" x2="106" y2="60" opacity="0.45" />
    <line x1="54" y1="76" x2="64" y2="76" opacity="0.45" />
    <rect x="68" y="70" width="24" height="12" rx="6" fill="currentColor" fillOpacity="0.28" />
    <line x1="96" y1="76" x2="106" y2="76" opacity="0.45" />
    <line x1="54" y1="92" x2="90" y2="92" opacity="0.45" />
    <circle cx="128" cy="86" r="15" fill="currentColor" stroke="none" />
    <text x="128" y="91" textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff" stroke="none" fontFamily="system-ui, sans-serif">
      {"{ }"}
    </text>
  </svg>
);

/** Two clauses on a page: one in, ticked; one dashed, left out because it does not apply. */
const ClausesArt = () => (
  <svg {...svgProps}>
    <path d="M46 12 H100 L118 30 V104 A4 4 0 0 1 114 108 H46 A4 4 0 0 1 42 104 V16 A4 4 0 0 1 46 12 Z" fill="#fff" />
    <path d="M100 12 V30 H118" />
    <rect x="52" y="40" width="56" height="24" rx="4" fill="currentColor" fillOpacity="0.16" />
    <line x1="60" y1="48" x2="98" y2="48" opacity="0.6" />
    <line x1="60" y1="56" x2="86" y2="56" opacity="0.6" />
    <rect x="52" y="72" width="56" height="24" rx="4" strokeDasharray="5 4" opacity="0.7" />
    <line x1="60" y1="80" x2="98" y2="80" opacity="0.35" strokeDasharray="5 4" />
    <line x1="60" y1="88" x2="86" y2="88" opacity="0.35" strokeDasharray="5 4" />
    <circle cx="128" cy="52" r="15" fill="currentColor" stroke="none" />
    <path d="M121 52 L126 57 L136 47" stroke="#fff" strokeWidth="3" />
    <circle cx="128" cy="84" r="15" fill="#fff" />
    <line x1="121" y1="84" x2="135" y2="84" strokeWidth="3" />
  </svg>
);

/** An invoice with a total that has grown, and a percent badge: terms that compute. */
const LogicArt = () => (
  <svg {...svgProps}>
    <path d="M40 14 H104 V106 L96 100 L88 106 L80 100 L72 106 L64 100 L56 106 L48 100 L40 106 Z" fill="#fff" />
    <line x1="50" y1="32" x2="78" y2="32" opacity="0.6" />
    <line x1="50" y1="46" x2="94" y2="46" opacity="0.45" />
    <line x1="50" y1="58" x2="94" y2="58" opacity="0.45" />
    <line x1="50" y1="70" x2="94" y2="70" opacity="0.45" />
    <line x1="50" y1="82" x2="94" y2="82" />
    <rect x="72" y="86" width="22" height="8" rx="2" fill="currentColor" fillOpacity="0.35" stroke="none" />
    <circle cx="128" cy="40" r="15" fill="currentColor" stroke="none" />
    <text x="128" y="45" textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff" stroke="none" fontFamily="system-ui, sans-serif">
      %
    </text>
    <path d="M114 90 L122 78 L132 84 L146 66" strokeWidth="3" />
    <path d="M138 66 H146 V74" strokeWidth="3" />
  </svg>
);

/** An empty, dashed page with a "+" badge: nothing written yet. */
const BlankArt = () => (
  <svg {...svgProps}>
    <path d="M52 14 H92 L112 34 V104 A4 4 0 0 1 108 108 H52 A4 4 0 0 1 48 104 V18 A4 4 0 0 1 52 14 Z" fill="#fff" strokeDasharray="6 5" />
    <path d="M92 14 V34 H112" strokeDasharray="6 5" />
    <line x1="62" y1="52" x2="98" y2="52" opacity="0.35" />
    <line x1="62" y1="66" x2="90" y2="66" opacity="0.35" />
    <line x1="62" y1="80" x2="94" y2="80" opacity="0.35" />
    <circle cx="124" cy="86" r="15" fill="currentColor" stroke="none" />
    <line x1="124" y1="78" x2="124" y2="94" stroke="#fff" strokeWidth="3" />
    <line x1="116" y1="86" x2="132" y2="86" stroke="#fff" strokeWidth="3" />
  </svg>
);

export default SampleArt;
