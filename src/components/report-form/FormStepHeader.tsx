interface FormStepHeaderProps {
  title: string;
  accent?: string;
  description: string;
}

export function FormStepHeader({ title, accent, description }: FormStepHeaderProps) {
  return (
    <div className="mb-6 space-y-1.5 border-b border-border/60 pb-4 md:mb-8 md:pb-5">
      <h2 className="text-2xl font-semibold tracking-tight text-foreground lg:text-3xl">
        {title}
        {accent ? (
          <>
            {" "}
            <span className="text-brand">{accent}</span>
          </>
        ) : null}
      </h2>
      <p className="max-w-lg text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
