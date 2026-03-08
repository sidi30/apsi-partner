interface BadgeProps {
  color: string;
  children: React.ReactNode;
}

export function Badge({ color, children }: BadgeProps) {
  return (
    <span
      className="text-[0.68rem] font-semibold tracking-wide whitespace-nowrap rounded-full px-2 py-0.5"
      style={{
        color,
        backgroundColor: color + "18",
        border: `1px solid ${color}35`,
      }}
    >
      {children}
    </span>
  );
}
