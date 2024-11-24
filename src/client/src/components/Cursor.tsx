// Cursor.tsx
import { motion } from "framer-motion";
/* import { useCallback, useRef, useLayoutEffect } from "react";
 * import { usePerfectCursor } from "../hooks/usePerfectCursors";
 * import { CursorProps, CursorPath } from "../types/clientTypes";
 *  */
// Spring animated cursor

interface CursorProps {
  color: string;
  x: number;
  y: number;
}

export function Cursor({ color, x, y }: CursorProps) {
  return (
    <motion.div
      style={{
        position: "absolute",
        top: "0",
        left: "0",
      }}
      initial={{ x, y }}
      animate={{ x, y }}
      transition={{
        type: "spring",
        damping: 50,
        mass: 0.6,
        stiffness: 500,
      }}
    >
      <CursorSvg color={color} />
    </motion.div>
  );
}

// SVG cursor shape

function CursorSvg({ color }: any) {
  return (
    <svg width="32" height="44" viewBox="0 0 24 36" fill="none">
      <path
        fill={color}
        d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
      />
    </svg>
  );
}

export default Cursor;
