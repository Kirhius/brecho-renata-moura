import { RM_PATH } from '@/lib/logo-path';

// Logo "RM" (Renata Moura): monograma em medalhao dourado. Vetorial, sem depender de fonte.
export default function Logo({ className = 'logo', title = 'Renata Moura' }) {
  return (
    <svg className={className} viewBox="40 40 432 432" role="img" aria-label={title}>
      <defs>
        <linearGradient id="rm-ouro" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e6cc9a" />
          <stop offset="0.5" stopColor="#b38a4a" />
          <stop offset="1" stopColor="#d9bb86" />
        </linearGradient>
      </defs>
      <circle cx="256" cy="256" r="196" fill="none" stroke="url(#rm-ouro)" strokeWidth="6" />
      <circle cx="256" cy="256" r="179" fill="none" stroke="url(#rm-ouro)" strokeWidth="2" />
      <path d={RM_PATH} fill="#5b2b3b" />
      <path d="M196 338 H238 M274 338 H316" stroke="url(#rm-ouro)" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M256 330 l7 8 -7 8 -7 -8 z" fill="url(#rm-ouro)" />
    </svg>
  );
}
