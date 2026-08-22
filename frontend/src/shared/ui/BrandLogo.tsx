type Props = {
  compact?: boolean;
  className?: string;
};

export function BrandLogo({ compact = false, className = "" }: Props) {
  if (compact) {
    return (
      <div className={`mb-1 inline-block ${className}`}>
        <img
          src="/logo.png"
          alt="Farmácia Bairro Saúde"
          className="h-24 w-auto object-contain object-left"
        />
      </div>
    );
  }

  return (
    <div className={`inline-block max-w-[280px] ${className}`}>
      <img
        src="/logo.png"
        alt="Farmácia Bairro Saúde"
        width={420}
        height={190}
        className="h-auto w-full object-contain object-left"
      />
    </div>
  );
}
