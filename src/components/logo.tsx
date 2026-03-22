export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* C shape: outer arc minus inner arc, opening to the right */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M 74 16 A 43 43 0 1 0 74 84 L 63 72 A 27 27 0 1 1 63 28 Z"
        fill="currentColor"
      />
      {/* Keyhole – circle on top */}
      <circle cx="50" cy="43" r="7.5" fill="currentColor" />
      {/* Keyhole – tapered body below */}
      <path d="M 44 50 L 56 50 L 53 64 L 47 64 Z" fill="currentColor" />
    </svg>
  );
}
