interface FormStepHeaderProps {
  title: string;
  accent?: string;
  description: string;
}

export function FormStepHeader({ title, accent, description }: FormStepHeaderProps) {
  return (
    <div className="mb-8 space-y-1.5 border-b border-border/60 pb-6">
      <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
        {title}
        {accent ? (
          <>
            {" "}
            <span className="text-[#FF0C60]">{accent}</span>
          </>
        ) : null}
      </h2>
      <p className="max-w-lg text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
