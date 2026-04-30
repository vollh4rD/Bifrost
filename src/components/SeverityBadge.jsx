import { SEV_BADGE_CLASSES } from "../constants/report";

export default function SeverityBadge({ severity }) {
  return (
    <span
      className={`inline-block rounded-[3px] px-3 py-[3px] text-xs font-bold tracking-[0.04em] ${SEV_BADGE_CLASSES[severity] ?? SEV_BADGE_CLASSES.Info}`}
    >
      {severity}
    </span>
  );
}
