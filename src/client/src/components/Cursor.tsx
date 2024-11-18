// Cursor.tsx
import { useCallback, useRef, useLayoutEffect } from "react";
import { usePerfectCursor } from "../hooks/usePerfectCursors";
import { CursorProps, CursorPath } from "../types/clientTypes";
import "./Cursor.css";

const CURSOR_PATHS: CursorPath = {
  shadow: [
    "m12 24.4219v-16.015l11.591 11.619h-6.781l-.411.124z",
    "m21.0845 25.0962-3.605 1.535-4.682-11.089 3.686-1.553z",
  ],
  base: [
    "m12 24.4219v-16.015l11.591 11.619h-6.781l-.411.124z",
    "m21.0845 25.0962-3.605 1.535-4.682-11.089 3.686-1.553z",
  ],
  accent: [
    "m19.751 24.4155-1.844.774-3.1-7.374 1.841-.775z",
    "m13 10.814v11.188l2.969-2.866.428-.139h4.768z",
  ],
};

export function Cursor({ point }: CursorProps) {
  const cursorRef = useRef<SVGSVGElement>(null);

  const updateCursorPosition = useCallback((point: number[]) => {
    const cursor = cursorRef.current;
    if (!cursor) return;
    cursor.style.setProperty(
      "transform",
      `translate(${point[0]}px, ${point[1]}px)`
    );
  }, []);

  const onPointMove = usePerfectCursor(updateCursorPosition);

  useLayoutEffect(() => {
    onPointMove(point);
  }, [onPointMove, point]);

  return (
    <svg
      ref={cursorRef}
      style={{
        position: "absolute",
        width: 35,
        height: 35,
        marginLeft: -15,
        marginTop: -15,
      }}
      className="cursor"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 35 35"
      fill="none"
      fillRule="evenodd"
    >
      <g className="cursor-shadow" transform="translate(1,1)">
        {CURSOR_PATHS.shadow.map((path, index) => (
          <path key={`shadow-${index}`} d={path} />
        ))}
      </g>

      <g className="cursor-base">
        {CURSOR_PATHS.base.map((path, index) => (
          <path key={`base-${index}`} d={path} />
        ))}
      </g>

      <g className="cursor-accent">
        {CURSOR_PATHS.accent.map((path, index) => (
          <path key={`accent-${index}`} d={path} />
        ))}
      </g>
    </svg>
  );
}
