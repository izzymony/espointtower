// components/Loader.tsx
import React from "react";

const Loader = () => (
  <div className="flex items-center justify-center ">
    <svg
      className="animate-spin"
      width={48}
      height={48}
      viewBox="0 0 24 24"
      fill="none"
      style={{ color: 'black'}}
    >
      <circle
        className="opacity-20"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-85"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  </div>
);

export default Loader;