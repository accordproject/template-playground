import type { StartArt } from "./constants";

/**
 * Line-art illustration at the top of a gallery card, one per template.
 * Drawn in `currentColor`, which the card sets to its accent colour, so the
 * same three drawings follow the teal / amber / blue spine of each card.
 */
const SampleArt = ({ kind }: { kind: StartArt }) => {
  if (kind === "counter") return <CounterArt />;
  if (kind === "offer") return <OfferArt />;
  return <NdaArt />;
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

/** Three rising bars under a dashed ceiling, with a "+1" badge: a count that grows and stops at a maximum. */
const CounterArt = () => (
  <svg {...svgProps}>
    <line x1="22" y1="26" x2="118" y2="26" strokeDasharray="5 5" opacity="0.6" />
    <rect x="30" y="72" width="18" height="30" rx="4" fill="currentColor" fillOpacity="0.18" />
    <rect x="58" y="54" width="18" height="48" rx="4" fill="currentColor" fillOpacity="0.28" />
    <rect x="86" y="36" width="18" height="66" rx="4" fill="currentColor" fillOpacity="0.4" />
    <line x1="22" y1="102" x2="118" y2="102" />
    <circle cx="130" cy="44" r="15" fill="currentColor" stroke="none" />
    <text x="130" y="49" textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff" stroke="none" fontFamily="system-ui, sans-serif">
      +1
    </text>
  </svg>
);

/** A letter in an open envelope, with a tick badge: an offer that gets answered. */
const OfferArt = () => (
  <svg {...svgProps}>
    <rect x="46" y="18" width="68" height="60" rx="5" fill="#fff" />
    <line x1="58" y1="34" x2="102" y2="34" opacity="0.7" />
    <line x1="58" y1="46" x2="94" y2="46" opacity="0.7" />
    <line x1="58" y1="58" x2="86" y2="58" opacity="0.7" />
    <path d="M28 58 L80 90 L132 58 V102 A6 6 0 0 1 126 108 H34 A6 6 0 0 1 28 102 Z" fill="currentColor" fillOpacity="0.16" />
    <path d="M28 58 L80 90 L132 58" />
    <circle cx="128" cy="30" r="15" fill="currentColor" stroke="none" />
    <path d="M121 30 L126 35 L136 25" stroke="#fff" strokeWidth="3" />
  </svg>
);

/** A shield with a keyhole beside a small calendar: confidentiality with a term. */
const NdaArt = () => (
  <svg {...svgProps}>
    <path d="M72 14 L110 28 V60 C110 84 94 100 72 108 C50 100 34 84 34 60 V28 Z" fill="currentColor" fillOpacity="0.16" />
    <circle cx="72" cy="56" r="9" fill="#fff" />
    <rect x="68" y="62" width="8" height="16" rx="3" fill="currentColor" stroke="none" />
    <rect x="108" y="66" width="36" height="34" rx="5" fill="#fff" />
    <line x1="108" y1="78" x2="144" y2="78" />
    <line x1="118" y1="60" x2="118" y2="70" />
    <line x1="134" y1="60" x2="134" y2="70" />
    <circle cx="120" cy="88" r="2" fill="currentColor" stroke="none" />
    <circle cx="132" cy="88" r="2" fill="currentColor" stroke="none" />
  </svg>
);

export default SampleArt;
