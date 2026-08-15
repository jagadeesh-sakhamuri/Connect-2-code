import React from 'react';

/**
 * 100% Official Brand Logos for GeeksforGeeks, LeetCode, and HackerRank
 */

// GeeksforGeeks (GFG) Iconic Curly Brackets { } Logo SVG
export const GfgLogoIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="GeeksforGeeks Logo">
    <path d="M8 4C6 4 4.5 5.5 4.5 7.5V10C4.5 11 3.5 12 2 12C3.5 12 4.5 13 4.5 14V16.5C4.5 18.5 6 20 8 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 4C18 4 19.5 5.5 19.5 7.5V10C19.5 11 20.5 12 22 12C20.5 12 19.5 13 19.5 14V16.5C19.5 18.5 18 20 16 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// LeetCode (LC) Official Arrow & Bracket Logo SVG
export const LeetCodeLogoIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-label="LeetCode Logo">
    <path d="M16.102 17.93l-2.697 2.607c-.466.45-1.22.45-1.687 0l-5.694-5.503a1.164 1.164 0 010-1.672l5.694-5.503c.467-.45 1.22-.45 1.687 0l2.697 2.606c.412.398 1.05.412 1.48.032.45-.397.47-1.077.05-1.488l-3.41-3.297a2.894 2.894 0 00-4.135 0l-7.07 6.833a2.83 2.83 0 000 4.072l7.07 6.833a2.894 2.894 0 004.135 0l3.41-3.297c.42-.41.4-1.09-.05-1.488a1.05 1.05 0 00-1.48.032zM21.5 11.25h-6c-.55 0-1 .45-1 1s.45 1 1 1h6c.55 0 1-.45 1-1s-.45-1-1-1z"/>
  </svg>
);

// HackerRank (HR) Official Bold "H" Logo SVG
export const HackerRankLogoIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-label="HackerRank Logo">
    <path d="M17.5 4h-3v6h-5V4h-3v16h3v-7h5v7h3V4z"/>
  </svg>
);
