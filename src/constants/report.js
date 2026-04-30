export const SEVERITIES = ["Critical", "High", "Medium", "Low", "Info"];

export const SEV_BADGE_CLASSES = {
  Critical: "bg-[#C00000] text-white",
  High: "bg-[#FF0000] text-white",
  Medium: "bg-[#FF6600] text-white",
  Low: "bg-[#00B050] text-white",
  Info: "bg-[#0070C0] text-white",
};

export const EXCEL_NAVY = "FF1F3864";

export const SEV_EXCEL_COLORS = {
  Critical: "FFC00000",
  High: "FFFF0000",
  Medium: "FFFF6600",
  Low: "FF00B050",
  Info: "FF0070C0",
};

const genId = () => Math.random().toString(36).slice(2, 10);

export const truncate = (s = "", n = 90) => (s.length > n ? `${s.slice(0, n)}…` : s || "—");

export const defaultStep = (stepNumber) => ({
  id: genId(),
  stepNumber,
  caption: "",
  imageBase64: null,
  imageMimeType: null,
});

export const defaultFinding = (siNo = 1) => ({
  id: genId(),
  siNo,
  issueName: "",
  observation: "",
  riskImpact: "",
  affectedURL: "",
  severity: "High",
  recommendation: "",
  testEvidence: "",
  notes: "",
  annexureSteps: [],
});

export const mimeToExcelExt = (mimeType = "") => {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/gif") return "gif";
  if (mimeType === "image/bmp") return "bmp";
  return "jpeg";
};
