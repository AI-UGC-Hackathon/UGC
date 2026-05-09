import { Check } from "./icons";

export type Step = {
  label: string;
  done: boolean;
  active: boolean;
};

type Props = {
  steps: Step[];
};

export function WorkflowSteps({ steps }: Props) {
  return (
    <div className="card px-6 py-5">
      <ol className="flex items-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar">
        {steps.map((s, i) => (
          <li key={s.label} className="flex items-center gap-2 sm:gap-4 min-w-fit">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-7 h-7 rounded-full grid place-items-center text-[12px] font-semibold transition ${
                  s.done
                    ? "bg-ink-900 text-white"
                    : s.active
                    ? "bg-accent text-white"
                    : "bg-ink-900/5 text-ink-500"
                }`}
              >
                {s.done ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span
                className={`text-[13px] font-medium ${
                  s.active ? "text-ink-900" : "text-ink-500"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="h-px w-8 sm:w-12 bg-ink-100" />
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
