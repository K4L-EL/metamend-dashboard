import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Sparkles, X, Microscope, TrendingUp, Shield, Workflow, ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const STORAGE_KEY = "metamed.lab-briefing.dismissed.v1";

interface Briefing {
  icon: LucideIcon;
  title: string;
  blurb: string;
  linkTo: string;
  linkLabel: string;
}

const BRIEFINGS: Briefing[] = [
  {
    icon: TrendingUp,
    title: "Risk forecasts refresh hourly",
    blurb: "Ward- and patient-level models are continuously retrained. Review the top-10 at-risk list each morning.",
    linkTo: "/app/forecasting",
    linkLabel: "Open Risk Forecast",
  },
  {
    icon: Shield,
    title: "Outbreak detection is automatic",
    blurb: "Spatial-temporal scan statistics run every 15 minutes. Investigate flagged clusters from the Outbreaks tab.",
    linkTo: "/app/outbreaks",
    linkLabel: "View Outbreaks",
  },
  {
    icon: Workflow,
    title: "Custom pipelines, no code",
    blurb: "Build ward-specific surveillance logic in the Data Pipelines editor. Templates available for CDI, MRSA and CRE.",
    linkTo: "/app/pipelines",
    linkLabel: "Open Pipelines",
  },
];

export function LabBriefing() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      setDismissed(raw === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  function dismiss() {
    setDismissed(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  function reset() {
    setDismissed(false);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  if (dismissed) {
    return (
      <button
        onClick={reset}
        className="flex items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-[10px] font-medium text-neutral-500 transition-colors hover:border-neutral-300 hover:text-neutral-800"
      >
        <Sparkles className="h-3 w-3 text-sky-500" />
        Show Lab briefing
      </button>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-white">
      <div className="flex items-start justify-between gap-4 border-b border-sky-100/60 px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600">
            <Sparkles className="h-4 w-4" strokeWidth={1.8} />
          </div>
          <div>
            <p className="text-[10px] font-semibold tracking-widest text-sky-600 uppercase">
              MetaMed Lab briefing
            </p>
            <h3 className="mt-0.5 text-sm font-semibold text-neutral-900">
              Welcome back. Here&apos;s how the system is working for you today.
            </h3>
            <p className="mt-1 text-xs text-neutral-600">
              Three things running in the background right now. Explore the Lab for the full
              methodology behind each module.
            </p>
          </div>
        </div>
        <button
          onClick={dismiss}
          title="Hide briefing"
          className="shrink-0 rounded-lg p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-3">
        {BRIEFINGS.map(({ icon: Icon, title, blurb, linkTo, linkLabel }) => (
          <Link
            key={title}
            to={linkTo}
            className="group flex flex-col gap-2 rounded-lg border border-neutral-200 bg-white p-3.5 transition-all hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md"
          >
            <Icon className="h-4 w-4 text-sky-600" strokeWidth={1.8} />
            <h4 className="text-[13px] font-semibold leading-tight text-neutral-900">{title}</h4>
            <p className="flex-1 text-[11px] leading-relaxed text-neutral-600">{blurb}</p>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-700 group-hover:gap-1.5">
              {linkLabel}
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-sky-100/60 bg-white/60 px-5 py-2.5">
        <p className="text-[11px] text-neutral-500">
          New to MetaMed? The Lab explains every model, pipeline and alert in plain language.
        </p>
        <Link
          to="/app/lab"
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-900 hover:text-sky-700"
        >
          <Microscope className="h-3 w-3" /> Open MetaMed Lab
        </Link>
      </div>
    </div>
  );
}
