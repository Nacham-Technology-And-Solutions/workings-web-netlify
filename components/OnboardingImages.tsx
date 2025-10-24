import React from 'react';

export const OnboardingImage1: React.FC = () => (
<svg width="320" height="340" viewBox="0 0 320 340" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <filter id="scatter" x="-50%" y="-50%" width="200%" height="200%">
            <feTurbulence type="fractalNoise" baseFrequency="1.5" numOctaves="1" result="turbulence"/>
            <feComposite operator="in" in="turbulence" in2="SourceGraphic" result="noise"/>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
        <pattern id="grid-pattern" width="6" height="6" patternUnits="userSpaceOnUse">
            <path d="M 6 0 L 0 0 0 6" fill="none" stroke="#E0E7FF" strokeWidth="0.5"/>
        </pattern>
        <linearGradient id="bg-grad-1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E0E7FF"/>
            <stop offset="100%" stopColor="#F3F4F6"/>
        </linearGradient>
    </defs>
    <rect width="320" height="340" rx="24" fill="url(#bg-grad-1)"/>
    <g opacity="0.3" filter="url(#scatter)">
      <circle cx="280" cy="120" r="100" fill="#CFD8DC" opacity="0.5"/>
      <circle cx="30" cy="250" r="80" fill="#CFD8DC" opacity="0.5"/>
    </g>
    <g transform="translate(40, 50) rotate(-5)">
        <rect x="0" y="0" width="240" height="240" rx="12" fill="white" filter="drop-shadow(0 10px 8px rgb(0 0 0 / 0.04)) drop-shadow(0 4px 3px rgb(0 0 0 / 0.1))"/>
        <text x="15" y="30" fontFamily="sans-serif" fontSize="10" fill="#6B7280">Quantity</text>
        <text x="225" y="30" fontFamily="sans-serif" fontSize="10" fill="#374151" textAnchor="end">20 length</text>
        <line x1="15" y1="40" x2="225" y2="40" stroke="#E5E7EB" strokeWidth="1"/>
        
        <text x="15" y="65" fontFamily="sans-serif" fontSize="12" fill="#374151" fontWeight="500">Layout A</text>
        <text x="150" y="65" fontFamily="sans-serif" fontSize="10" fill="#6B7280">Repetition</text>
        <text x="225" y="65" fontFamily="sans-serif" fontSize="12" fill="#111827" fontWeight="600" textAnchor="end">6X</text>
        <rect x="15" y="75" width="160" height="18" rx="4" fill="#60A5FA"/>
        <text x="95" y="87" fontFamily="sans-serif" fontSize="9" fill="white" textAnchor="middle">4.5m</text>
        <rect x="180" y="75" width="45" height="18" fill="#F3F4F6" rx="4"/>
        <rect x="180" y="75" width="45" height="18" fill="url(#grid-pattern)" rx="4"/>
        <text x="15" y="105" fontFamily="sans-serif" fontSize="9" fill="#9CA3AF">Off-cut: 1.5m</text>
        
        <line x1="15" y1="125" x2="225" y2="125" stroke="#F3F4F6" strokeWidth="1"/>
        
        <text x="15" y="150" fontFamily="sans-serif" fontSize="12" fill="#374151" fontWeight="500">Layout B</text>
        <text x="150" y="150" fontFamily="sans-serif" fontSize="10" fill="#6B7280">Repetition</text>
        <text x="225" y="150" fontFamily="sans-serif" fontSize="12" fill="#111827" fontWeight="600" textAnchor="end">3X</text>
        <rect x="15" y="160" width="50" height="18" rx="4" fill="#60A5FA"/>
        <text x="40" y="172" fontFamily="sans-serif" fontSize="9" fill="white" textAnchor="middle">1.2m</text>
        <rect x="70" y="160" width="50" height="18" rx="4" fill="#60A5FA"/>
        <text x="95" y="172" fontFamily="sans-serif" fontSize="9" fill="white" textAnchor="middle">1.2m</text>
        <rect x="125" y="160" width="48" height="18" rx="4" fill="#60A5FA"/>
        <text x="149" y="172" fontFamily="sans-serif" fontSize="9" fill="white" textAnchor="middle">1.1m</text>
    </g>
</svg>
);


export const OnboardingImage2: React.FC = () => (
<svg width="320" height="340" viewBox="0 0 320 340" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <filter id="scatter2" x="-50%" y="-50%" width="200%" height="200%">
            <feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="1" result="turbulence"/>
            <feComposite operator="in" in="turbulence" in2="SourceGraphic" result="noise"/>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
        <linearGradient id="bg-grad-2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E0F2FE"/>
            <stop offset="100%" stopColor="#F0F9FF"/>
        </linearGradient>
    </defs>
    <rect width="320" height="340" rx="24" fill="url(#bg-grad-2)"/>
    <g opacity="0.3" filter="url(#scatter2)">
        <path d="M 200 20 C 250 20, 300 80, 300 130 S 250 240, 200 240 S 100 180, 100 130 S 150 20, 200 20 Z" fill="#A5D8FF" opacity="0.5"/>
        <path d="M 50 200 C 100 200, 150 260, 150 310 S 100 420, 50 420 S -50 360, -50 310 S 0 200, 50 200 Z" fill="#A5D8FF" opacity="0.5"/>
    </g>
    
    <g transform="translate(85, 20)">
        <rect x="0" y="0" width="150" height="300" rx="18" fill="#111827"/>
        <rect x="4" y="4" width="142" height="292" rx="14" fill="white"/>
        <rect x="50" y="8" width="50" height="4" rx="2" fill="#E5E7EB"/>
        
        {/* Screen Content */}
        <text x="38" y="32" fontFamily="sans-serif" fontSize="10" fontWeight="500" fill="#1F2937">Olumide Residence Renovat...</text>
        <path d="M 15 28 L 19 25 L 15 22" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M 130 25.5 L 132 25.5 M 135 25.5 L 137 25.5 M 140 25.5 L 142 25.5" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round"/>

        <circle cx="30" cy="65" r="14" fill="#F0F9FF"/>
        <circle cx="30" cy="65" r="12" stroke="#38BDF8" strokeWidth="2" strokeDasharray="56.5" strokeDashoffset="14.1" transform="rotate(-90 30 65)"/>
        <text x="30" y="68" fontFamily="sans-serif" fontSize="8" fill="#0284C7" textAnchor="middle" fontWeight="600">3/4</text>
        <text x="55" y="62" fontFamily="sans-serif" fontSize="9" fill="#4B5563">Project description</text>
        <text x="55" y="72" fontFamily="sans-serif" fontSize="8" fill="#9CA3AF">Fill in all the necessary details</text>
        
        <rect x="15" y="90" width="120" height="150" fill="#F9FAFB" rx="8"/>
        <rect x="25" y="100" width="100" height="130" stroke="#9CA3AF" strokeWidth="1" rx="4"/>
        <line x1="75" y1="100" x2="75" y2="230" stroke="#9CA3AF" strokeWidth="1"/>
        <text x="18" y="165" fontFamily="sans-serif" fontSize="8" fill="#9CA3AF" transform="rotate(-90 18 165)">1200</text>
        <text x="78" y="98" fontFamily="sans-serif" fontSize="8" fill="#9CA3AF">1200</text>
        
        <text x="75" y="248" fontFamily="sans-serif" fontSize="9" fill="#374151" textAnchor="middle" fontWeight="500">2 Panels</text>
        <text x="130" y="258" fontFamily="sans-serif" fontSize="8" fill="#9CA3AF">mm</text>
        <path d="M 140 255 l -3 3 l -3 -3" stroke="#9CA3AF" strokeWidth="1" strokeLinecap="round"/>
    </g>
</svg>
);


export const OnboardingImage3: React.FC = () => (
<svg width="320" height="340" viewBox="0 0 320 340" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <filter id="scatter3" x="-50%" y="-50%" width="200%" height="200%">
            <feTurbulence type="fractalNoise" baseFrequency="1.8" numOctaves="1" result="turbulence"/>
            <feComposite operator="in" in="turbulence" in2="SourceGraphic" result="noise"/>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
        <linearGradient id="bg-grad-3" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0F766E"/>
            <stop offset="100%" stopColor="#115E59"/>
        </linearGradient>
    </defs>
    <rect width="320" height="340" rx="24" fill="#14B8A6"/>
    <g opacity="0.1" filter="url(#scatter3)">
      <rect width="320" height="340" rx="24" fill="white"/>
    </g>
    <rect x="0" y="0" width="320" height="280" rx="24" fill="url(#bg-grad-3)"/>
    
    <g transform="translate(85, 20)">
        <rect x="0" y="0" width="150" height="300" rx="18" fill="#111827"/>
        <rect x="4" y="4" width="142" height="292" rx="14" fill="white"/>
        <rect x="50" y="8" width="50" height="4" rx="2" fill="#E5E7EB"/>
        
        {/* Screen Content */}
        <text x="38" y="32" fontFamily="sans-serif" fontSize="10" fontWeight="500" fill="#1F2937">Olumide Residence Renovat...</text>
        <path d="M 15 28 L 19 25 L 15 22" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>

        <rect x="15" y="50" width="120" height="25" fill="#F3F4F6" rx="6"/>
        <rect x="17" y="52" width="58" height="21" fill="white" rx="4" filter="drop-shadow(0 1px 1px rgb(0 0 0 / 0.05))"/>
        <text x="28" y="66" fontFamily="sans-serif" fontSize="9" fontWeight="500" fill="#111827">Material List</text>
        <text x="86" y="66" fontFamily="sans-serif" fontSize="9" fill="#6B7280">Cutting List</text>
        <path d="M 125 65.5 L 128 62.5 L 131 65.5" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        
        <line x1="15" y1="85" x2="135" y2="85" stroke="#E5E7EB" strokeWidth="1"/>
        <text x="15" y="105" fontFamily="sans-serif" fontSize="10" fill="#6B7280">Profile</text>
        <text x="80" y="105" fontFamily="sans-serif" fontSize="10" fill="#6B7280">10 units</text>
        <path d="M 125 104 l 3 3 l 3 -3" stroke="#9CA3AF" strokeWidth="1" strokeLinecap="round"/>
        <line x1="15" y1="118" x2="135" y2="118" stroke="#F3F4F6" strokeWidth="1"/>
        
        <text x="15" y="135" fontFamily="sans-serif" fontSize="10" fill="#6B7280">Width</text>
        <text x="80" y="135" fontFamily="sans-serif" fontSize="10" fill="#6B7280">10 units</text>
        <path d="M 125 134 l 3 3 l 3 -3" stroke="#9CA3AF" strokeWidth="1" strokeLinecap="round"/>
        <line x1="15" y1="148" x2="135" y2="148" stroke="#F3F4F6" strokeWidth="1"/>
        
        <text x="15" y="165" fontFamily="sans-serif" fontSize="10" fill="#6B7280">Height</text>
        <text x="80" y="165" fontFamily="sans-serif" fontSize="10" fill="#6B7280">10 units</text>
        <path d="M 125 164 l 3 3 l 3 -3" stroke="#9CA3AF" strokeWidth="1" strokeLinecap="round"/>
        <line x1="15" y1="178" x2="135" y2="178" stroke="#F3F4F6" strokeWidth="1"/>
        
        <text x="15" y="195" fontFamily="sans-serif" fontSize="10" fill="#6B7280">Mullium</text>
        <text x="80" y="195" fontFamily="sans-serif" fontSize="10" fill="#6B7280">10 units</text>
        <path d="M 125 194 l 3 3 l 3 -3" stroke="#9CA3AF" strokeWidth="1" strokeLinecap="round"/>
    </g>
</svg>
);