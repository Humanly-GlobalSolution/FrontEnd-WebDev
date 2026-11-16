/** Outline version of the supplied pedestrian emblem for the car display. */
export function MultimediaMark() {
  const ring = "M22 3 A21 21 0 1 1 3 23 M4 17 A21 21 0 0 1 16 5";

  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={ring} stroke="currentColor" strokeWidth="3.6" />
      <path d={ring} stroke="#121619" strokeWidth="2" />
      <circle cx="24" cy="11" r="3.2" stroke="currentColor" strokeWidth="0.9" />
      <path d="M23 16 Q26 15 27 19 L28 21 Q28 22 30 22 L35 23 Q38 23 38 25 Q38 27 35 27 L29 26 L28 29 L33 35 L35 39 Q36 42 33 42 Q31 42 30 40 L26 34 L23 31 L19 38 L17 41 Q15 43 13 41 Q12 40 14 37 L18 31 L20 22 L15 26 Q13 28 12 26 Q10 24 12 22 L21 17 Q22 16 23 16 Z" stroke="currentColor" strokeWidth="0.9" />
    </g>
  );
}
