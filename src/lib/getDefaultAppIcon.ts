export function getDefaultAppIcon(): string {
  const svg = `
    <svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 256 256"
  role="img"
  aria-labelledby="title desc"
  class="group-icon"
  data-compact="false"
>
  <title id="title">videome.video — default group icon</title>
  <desc id="desc">Rounded tile with play emblem and the label “videome.video”, themed by the site accent color.</desc>

  <defs>
    <style>
      :root{
        /* Your site accent */
        --accent: oklch(0.696 0.17 162.48);

        /* Derivatives (OKLCH, supported in modern browsers) */
        --bg1: color-mix(in oklch, var(--accent) 85%, white);  /* lighter */
        --bg2: color-mix(in oklch, var(--accent) 70%, black);  /* deeper */
        --fg:  oklch(0.98 0 0);                                /* white-ish for icon surface */
        --label: oklch(0.98 0 0 / 0.95);
        --stroke: oklch(0.18 0 0 / 0.25);
        --glow:  oklch(0.98 0 0 / 0.16);
      }
      @media (prefers-color-scheme: dark){
        :root{
          --bg1: color-mix(in oklch, var(--accent) 78%, black);
          --bg2: color-mix(in oklch, var(--accent) 60%, black);
          --label: oklch(0.97 0 0 / 0.96);
          --stroke: oklch(0.12 0 0 / 0.32);
          --glow:  oklch(0.97 0 0 / 0.20);
        }
      }
      /* Hide label when compact */
      svg[data-compact="true"] .label { display:none }
    </style>

    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"  stop-color="var(--bg1)"/>
      <stop offset="100%" stop-color="var(--bg2)"/>
    </linearGradient>

    <clipPath id="squircle">
      <rect x="8" y="8" width="240" height="240" rx="40" ry="40"/>
    </clipPath>
  </defs>

  <!-- background -->
  <g clip-path="url(#squircle)">
    <rect x="8" y="8" width="240" height="240" fill="url(#g)"/>
  </g>
  <rect x="8.5" y="8.5" width="239" height="239" rx="40" ry="40" fill="none" stroke="var(--stroke)"/>

  <!-- emblem -->
  <g transform="translate(0,-6)">
    <circle cx="128" cy="112" r="42" fill="var(--glow)"/>
    <circle cx="128" cy="112" r="36" fill="var(--fg)"/>
    <path d="M118 95 L146 112 L118 129 Z" fill="var(--accent)"/>
  </g>

  <!-- label -->
  <g class="label" aria-hidden="false">
    <text
      x="128" y="212"
      text-anchor="middle"
      font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Inter, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji"
      font-size="20" font-weight="700" letter-spacing=".2"
      fill="var(--label)"
    >videome.video</text>
  </g>
</svg>
  `;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}