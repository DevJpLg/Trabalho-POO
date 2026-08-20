import type { HTMLAttributes, ReactNode } from "react";

type Props = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  padded?: boolean;
};

export function Card({ children, className = "", padded = true, ...props }: Props) {
  return (
    <section
      className={`rounded-[25px] bg-white shadow-[0_8px_30px_rgba(26,46,37,0.04)] ${
        padded ? "p-6" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </section>
  );
}

export function SectionTitle({ children, className = "mb-5" }: { children: ReactNode; className?: string }) {
  return <h2 className={`text-lg font-semibold tracking-tight text-ink ${className}`}>{children}</h2>;
}
