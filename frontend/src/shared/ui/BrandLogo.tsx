type Props = {
  compact?: boolean;
  className?: string;
};

export function BrandLogo({ compact = false, className = "" }: Props) {
  if (compact) {
    return (
      <img
        src="/logo.png"
        alt="Farmácia Bairro Saúde"
        className={`h-25 w-auto object-contain object-left mb-1 ${className}`}
      />
    );
  }

  return (
    <img
      src="/logo.png"
      alt="Farmácia Bairro Saúde"
      width={420}
      height={190}
      className={`h-auto w-full max-w-[280px] object-contain object-left ${className}`}
    />
  );
}
