import ReportApp from "./components/ReportApp";

export default function App() {
  return <ReportApp />;
}
/*
import { useRef, useState } from "react";
import ExcelJS from "exceljs";

const SEVERITIES = ["Critical", "High", "Medium", "Low", "Info"];

const SEV_BADGE_CLASSES = {
  Critical: "bg-[#C00000] text-white",
  High: "bg-[#FF0000] text-white",
  Medium: "bg-[#FF6600] text-white",
  Low: "bg-[#00B050] text-white",
  Info: "bg-[#0070C0] text-white",
};

const EXCEL_NAVY = "FF1F3864";
const SEV_EXCEL_COLORS = {
  Critical: "FFC00000",
  High: "FFFF0000",
  Medium: "FFFF6600",
  Low: "FF00B050",
  Info: "FF0070C0",
};

const baseInputClass =
  "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-800 outline-none focus:border-slate-400";
const baseTextareaClass = `${baseInputClass} min-h-[90px] resize-y leading-relaxed`;
const baseLabelClass = "mb-1 block text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500";

const genId = () => Math.random().toString(36).slice(2, 10);
const truncate = (s = "", n = 90) => (s.length > n ? `${s.slice(0, n)}…` : s || "—");

const defaultFinding = (siNo = 1) => ({
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

const defaultStep = (stepNumber) => ({
  id: genId(),
  stepNumber,
  caption: "",
  imageBase64: null,
  imageMimeType: null,
});

const mimeToExcelExt = (mimeType = "") => {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/gif") return "gif";
  if (mimeType === "image/bmp") return "bmp";
  return "jpeg";
};

function SeverityBadge({ severity }) {
  return (
    <span
      className={`inline-block rounded-[3px] px-3 py-[3px] text-xs font-bold tracking-[0.04em] ${SEV_BADGE_CLASSES[severity] ?? SEV_BADGE_CLASSES.Info}`}
    >
      {severity}
    </span>
  );
}

function Modal({ children, onClose }) {
  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-6"
    >
      <div className="mb-6 w-full max-w-[860px] rounded-[10px] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
        {children}
      </div>
    </div>
  );
}

function StepRow({ step, onUpdate, onRemove }) {
  const fileRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      onUpdate({
        ...step,
        imageBase64: ev.target.result.split(",")[1],
        imageMimeType: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="mb-2.5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3.5">
      <div className="mb-2.5 flex items-center gap-2.5">
        <span className="whitespace-nowrap rounded bg-[#1F3864] px-3 py-[3px] text-xs font-bold text-white">
          Step - {step.stepNumber}
        </span>
        <input
          value={step.caption}
          onChange={(e) => onUpdate({ ...step, caption: e.target.value })}
          placeholder="Describe what this step shows..."
          className={`${baseInputClass} flex-1`}
        />
        <button
          onClick={onRemove}
          className="whitespace-nowrap rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
        >
          Remove
        </button>
      </div>

      <div className="flex items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
        <button
          onClick={() => fileRef.current?.click()}
          className="rounded-md border border-dashed border-blue-300 bg-white px-4 py-[7px] text-[13px] text-blue-600 hover:bg-blue-50"
        >
          {step.imageBase64 ? "🔄 Replace Screenshot" : "📁 Upload Screenshot"}
        </button>

        {step.imageBase64 && (
          <div className="flex items-center gap-2">
            <img
              src={`data:${step.imageMimeType};base64,${step.imageBase64}`}
              alt="step preview"
              className="h-12 w-[72px] rounded border border-slate-200 object-cover"
            />
            <button
              onClick={() => onUpdate({ ...step, imageBase64: null, imageMimeType: null })}
              className="text-lg leading-none text-slate-400 hover:text-slate-600"
            >
              ×
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function FindingForm({ finding, allFindings, onSave, onClose, claudeApiKey }) {
  const [f, setF] = useState(finding);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const isEdit = allFindings.some((x) => x.id === f.id);

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const addStep = () => {
    setF((p) => ({
      ...p,
      annexureSteps: [...p.annexureSteps, defaultStep(p.annexureSteps.length + 1)],
    }));
  };

  const updateStep = (id, updated) => {
    setF((p) => ({
      ...p,
      annexureSteps: p.annexureSteps.map((s) => (s.id === id ? updated : s)),
    }));
  };

  const removeStep = (id) => {
    setF((p) => ({
      ...p,
      annexureSteps: p.annexureSteps
        .filter((s) => s.id !== id)
        .map((s, i) => ({ ...s, stepNumber: i + 1 })),
    }));
  };

  const handleSave = () => {
    if (!f.issueName.trim()) {
      alert("Issue Name is required.");
      return;
    }
    onSave(f);
  };

  const extractJson = (raw) => {
    try {
      return JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON object found in AI response.");
      return JSON.parse(match[0]);
    }
  };

  const handleGenerate = async () => {
    setGenerateError("");

    if (!claudeApiKey) {
      setGenerateError("Missing API key. Set VITE_CLAUDE_API_KEY in your environment.");
      return;
    }
    if (!f.issueName.trim()) {
      setGenerateError("Issue Name is required to generate content.");
      return;
    }
    if (!f.notes.trim()) {
      setGenerateError("Brief Notes are required to generate content.");
      return;
    }

    setIsGenerating(true);
    try {
      const systemPrompt =
        "You are a senior application security consultant writing VAPT report content. " +
        "Write in formal, third-person, professional audit language with detailed and precise paragraphs. " +
        "Return JSON only with exactly these keys: observation, riskImpact, recommendation.";

      const userPrompt = JSON.stringify(
        { issueName: f.issueName, severity: f.severity, notes: f.notes },
        null,
        2
      );

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": claudeApiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1200,
          temperature: 0.3,
          system: systemPrompt,
          messages: [
            {
              role: "user",
              content: `Generate report text for this vulnerability and respond in JSON.\n\n${userPrompt}`,
            },
          ],
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Claude API error (${res.status}): ${errText || "Request failed"}`);
      }

      const data = await res.json();
      const text = data?.content?.find((x) => x.type === "text")?.text || "";
      const parsed = extractJson(text);

      if (!parsed?.observation || !parsed?.riskImpact || !parsed?.recommendation) {
        throw new Error("AI response did not include all required fields.");
      }

      setF((prev) => ({
        ...prev,
        observation: parsed.observation.trim(),
        riskImpact: parsed.riskImpact.trim(),
        recommendation: parsed.recommendation.trim(),
      }));
    } catch (err) {
      setGenerateError(err?.message || "Failed to generate content.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <div className="flex items-center justify-between rounded-t-[10px] bg-[#1F3864] px-6 py-[18px]">
        <div>
          <h2 className="m-0 text-[17px] font-bold text-white">{isEdit ? "Edit Finding" : "Add New Finding"}</h2>
          <p className="mt-[3px] text-xs text-blue-200">
            {isEdit ? `Editing: ${f.issueName}` : "Fill in vulnerability details"}
          </p>
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-md bg-white/10 text-xl text-white hover:bg-white/20"
        >
          ×
        </button>
      </div>

      <div className="max-h-[70vh] overflow-y-auto px-6 py-[22px]">
        <div className="mb-4 grid gap-3.5 md:grid-cols-[1fr_180px]">
          <div>
            <label className={baseLabelClass}>Issue Name *</label>
            <input
              value={f.issueName}
              onChange={(e) => set("issueName", e.target.value)}
              placeholder="e.g. Privilege Escalation"
              className={baseInputClass}
            />
          </div>
          <div>
            <label className={baseLabelClass}>Severity *</label>
            <select
              value={f.severity}
              onChange={(e) => set("severity", e.target.value)}
              className={`${baseInputClass} cursor-pointer`}
            >
              {SEVERITIES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-4 grid gap-3.5 md:grid-cols-2">
          <div>
            <label className={baseLabelClass}>Affected URL</label>
            <input
              value={f.affectedURL}
              onChange={(e) => set("affectedURL", e.target.value)}
              placeholder="https://target.com/vulnerable-endpoint"
              className={baseInputClass}
            />
          </div>
          <div>
            <label className={baseLabelClass}>Test Evidence</label>
            <input
              value={f.testEvidence}
              onChange={(e) => set("testEvidence", e.target.value)}
              placeholder="Annexures / CVE / Tool output"
              className={baseInputClass}
            />
          </div>
        </div>

        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3.5">
          <div className="mb-2.5 flex items-center justify-between">
            <div>
              <p className="m-0 text-[13px] font-bold text-[#1F3864]">✦ AI Content Generation</p>
              <p className="mt-0.5 text-xs text-slate-500">
                Add brief notes, then click Generate to auto-fill the fields below.
              </p>
            </div>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              title={isGenerating ? "Generating..." : "Generate with Claude"}
              className="rounded-md bg-[#1F3864] px-[18px] py-2 text-[13px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-65"
            >
              {isGenerating ? "Generating..." : "✦ Generate"}
            </button>
          </div>
          <label className={baseLabelClass}>Brief Notes (input for AI)</label>
          <textarea
            value={f.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Briefly describe what was found, how it was exploited, and what the impact is..."
            className={`${baseTextareaClass} min-h-16 bg-white`}
          />
          {generateError && <p className="mt-2 text-xs text-red-700">{generateError}</p>}
        </div>

        <div className="mb-3.5">
          <label className={baseLabelClass}>Observation</label>
          <textarea
            value={f.observation}
            onChange={(e) => set("observation", e.target.value)}
            placeholder="The test team observed that the application is vulnerable to..."
            className={baseTextareaClass}
          />
        </div>
        <div className="mb-3.5">
          <label className={baseLabelClass}>Risk Impact</label>
          <textarea
            value={f.riskImpact}
            onChange={(e) => set("riskImpact", e.target.value)}
            placeholder="This vulnerability allows an attacker to..."
            className={baseTextareaClass}
          />
        </div>
        <div className="mb-5">
          <label className={baseLabelClass}>Recommendation</label>
          <textarea
            value={f.recommendation}
            onChange={(e) => set("recommendation", e.target.value)}
            placeholder="It is recommended to implement..."
            className={baseTextareaClass}
          />
        </div>

        <div className="border-t-2 border-slate-200 pt-[18px]">
          <div className="mb-3 flex items-center justify-between gap-4">
            <div>
              <p className="m-0 text-sm font-bold text-slate-800">Annexure Steps</p>
              <p className="mt-0.5 text-xs text-slate-500">
                Add step-by-step screenshots — these populate the Annexures tab in the Excel export.
              </p>
            </div>
            <button
              onClick={addStep}
              className="whitespace-nowrap rounded-md bg-[#1F3864] px-4 py-2 text-[13px] font-semibold text-white"
            >
              + Add Step
            </button>
          </div>

          {f.annexureSteps.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-slate-200 px-5 py-7 text-center text-[13px] text-slate-400">
              No steps yet. Click "Add Step" to attach screenshots for the Annexures tab.
            </div>
          ) : (
            f.annexureSteps.map((step) => (
              <StepRow
                key={step.id}
                step={step}
                onUpdate={(updated) => updateStep(step.id, updated)}
                onRemove={() => removeStep(step.id)}
              />
            ))
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2.5 rounded-b-[10px] border-t border-slate-200 bg-slate-50 px-6 py-3.5">
        <button
          onClick={onClose}
          className="rounded-md border border-slate-200 bg-white px-[22px] py-[9px] text-sm text-slate-500 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="rounded-md bg-[#1F3864] px-[26px] py-[9px] text-sm font-bold text-white"
        >
          {isEdit ? "Update Finding" : "Save Finding"}
        </button>
      </div>
    </Modal>
  );
}

function DeleteConfirm({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60">
      <div className="w-[90%] max-w-[380px] rounded-[10px] bg-white px-8 py-7 text-center shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
        <div className="mb-3 text-4xl">⚠️</div>
        <h3 className="mb-2 text-base font-semibold text-slate-800">Delete this finding?</h3>
        <p className="mb-5 text-[13px] leading-relaxed text-slate-500">
          This will permanently remove the finding and all its annexure steps.
        </p>
        <div className="flex justify-center gap-2.5">
          <button
            onClick={onCancel}
            className="rounded-md border border-slate-200 bg-white px-6 py-[9px] text-sm text-slate-500 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button onClick={onConfirm} className="rounded-md bg-red-600 px-6 py-[9px] text-sm font-bold text-white">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [findings, setFindings] = useState([]);
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const claudeApiKey = import.meta.env.VITE_CLAUDE_API_KEY || "";

  const openAdd = () => {
    const nextSi = findings.length ? Math.max(...findings.map((f) => f.siNo)) + 1 : 1;
    setModal(defaultFinding(nextSi));
  };

  const openEdit = (f) => setModal({ ...f });

  const saveFinding = (f) => {
    setFindings((prev) => {
      const exists = prev.some((x) => x.id === f.id);
      return exists ? prev.map((x) => (x.id === f.id ? f : x)) : [...prev, f];
    });
    setModal(null);
  };

  const confirmDelete = () => {
    setFindings((prev) => prev.filter((x) => x.id !== deleteTarget).map((f, i) => ({ ...f, siNo: i + 1 })));
    setDeleteTarget(null);
  };

  const handleExportExcel = async () => {
    if (!findings.length || isExporting) return;
    setIsExporting(true);
    setExportError("");

    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "SecReport";
      workbook.created = new Date();

      const observations = workbook.addWorksheet("Observations");
      observations.columns = [
        { header: "SI No", key: "siNo", width: 6 },
        { header: "Issue Name", key: "issueName", width: 20 },
        { header: "Observation", key: "observation", width: 40 },
        { header: "Risk Impact", key: "riskImpact", width: 40 },
        { header: "Affected URL", key: "affectedURL", width: 30 },
        { header: "Severity", key: "severity", width: 12 },
        { header: "Recommendation", key: "recommendation", width: 40 },
        { header: "Test Evidence", key: "testEvidence", width: 15 },
      ];

      const headerRow = observations.getRow(1);
      headerRow.height = 22;
      headerRow.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: EXCEL_NAVY } };
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.alignment = { vertical: "middle", horizontal: "left" };
        cell.border = {
          top: { style: "thin", color: { argb: "FFD9E2F3" } },
          left: { style: "thin", color: { argb: "FFD9E2F3" } },
          bottom: { style: "thin", color: { argb: "FFD9E2F3" } },
          right: { style: "thin", color: { argb: "FFD9E2F3" } },
        };
      });

      findings.forEach((finding) => {
        const row = observations.addRow({
          siNo: finding.siNo,
          issueName: finding.issueName,
          observation: finding.observation,
          riskImpact: finding.riskImpact,
          affectedURL: finding.affectedURL,
          severity: finding.severity,
          recommendation: finding.recommendation,
          testEvidence: finding.testEvidence,
        });

        row.alignment = { wrapText: true, vertical: "top" };
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin", color: { argb: "FFE2E8F0" } },
            left: { style: "thin", color: { argb: "FFE2E8F0" } },
            bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
            right: { style: "thin", color: { argb: "FFE2E8F0" } },
          };
        });

        const sevCell = row.getCell(6);
        sevCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: SEV_EXCEL_COLORS[finding.severity] || SEV_EXCEL_COLORS.Info },
        };
        sevCell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      });

      const annexures = workbook.addWorksheet("Annexures");
      annexures.columns = [{ width: 24 }, { width: 24 }, { width: 24 }, { width: 24 }, { width: 24 }, { width: 24 }];

      let currentRow = 1;
      findings.forEach((finding) => {
        annexures.mergeCells(`A${currentRow}:F${currentRow}`);
        const titleCell = annexures.getCell(`A${currentRow}`);
        titleCell.value = finding.issueName || `Finding ${finding.siNo}`;
        titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: EXCEL_NAVY } };
        titleCell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 12 };
        titleCell.alignment = { vertical: "middle", horizontal: "left" };
        annexures.getRow(currentRow).height = 24;
        currentRow += 1;

        if (!finding.annexureSteps.length) {
          annexures.mergeCells(`A${currentRow}:F${currentRow}`);
          const emptyCell = annexures.getCell(`A${currentRow}`);
          emptyCell.value = "No annexure steps provided.";
          emptyCell.font = { italic: true, color: { argb: "FF64748B" } };
          currentRow += 2;
          return;
        }

        finding.annexureSteps.forEach((step) => {
          annexures.mergeCells(`A${currentRow}:C${currentRow}`);
          const stepCell = annexures.getCell(`A${currentRow}`);
          stepCell.value = `Step - ${step.stepNumber}: ${step.caption || "No caption provided"}`;
          stepCell.alignment = { wrapText: true, vertical: "top", horizontal: "left" };
          stepCell.font = { size: 11 };
          annexures.getRow(currentRow).height = 24;

          const imageTopRow = currentRow + 1;
          const imageHeightRows = 15;
          for (let i = 0; i < imageHeightRows; i += 1) annexures.getRow(imageTopRow + i).height = 20;

          if (step.imageBase64) {
            const imageId = workbook.addImage({
              base64: `data:${step.imageMimeType || "image/jpeg"};base64,${step.imageBase64}`,
              extension: mimeToExcelExt(step.imageMimeType),
            });
            annexures.addImage(imageId, {
              tl: { col: 3, row: imageTopRow - 1 },
              ext: { width: 400, height: 300 },
            });
          } else {
            annexures.mergeCells(`D${imageTopRow}:F${imageTopRow + imageHeightRows - 1}`);
            const noImageCell = annexures.getCell(`D${imageTopRow}`);
            noImageCell.value = "Screenshot not attached";
            noImageCell.alignment = { vertical: "middle", horizontal: "center" };
            noImageCell.font = { italic: true, color: { argb: "FF94A3B8" } };
            noImageCell.border = {
              top: { style: "thin", color: { argb: "FFE2E8F0" } },
              left: { style: "thin", color: { argb: "FFE2E8F0" } },
              bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
              right: { style: "thin", color: { argb: "FFE2E8F0" } },
            };
          }

          currentRow += imageHeightRows + 2;
        });

        currentRow += 1;
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `security-vapt-report-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(err?.message || "Failed to export Excel report.");
    } finally {
      setIsExporting(false);
    }
  };

  const sevCounts = SEVERITIES.reduce((acc, s) => {
    acc[s] = findings.filter((f) => f.severity === s).length;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <div className="bg-[#1F3864] px-8">
        <div className="mx-auto flex h-[58px] max-w-[1400px] items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-[34px] w-[34px] items-center justify-center rounded-lg bg-white/15 text-base">🛡️</div>
            <div>
              <span className="text-base font-extrabold tracking-[-0.02em] text-white">SecReport</span>
              <span className="ml-2 rounded bg-white/10 px-2 py-[1px] text-[11px] font-semibold tracking-[0.05em] text-blue-200">
                VAPT REPORT GENERATOR
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-[13px] text-blue-200">
              {findings.length} finding{findings.length !== 1 ? "s" : ""}
            </span>
            <button
              onClick={handleExportExcel}
              disabled={!findings.length || isExporting}
              title={
                !findings.length
                  ? "Add at least one finding to export"
                  : isExporting
                    ? "Generating Excel..."
                    : "Export Excel report"
              }
              className={`rounded-md border px-[18px] py-[7px] text-[13px] font-semibold ${
                !findings.length || isExporting
                  ? "cursor-not-allowed border-white/20 bg-white/10 text-slate-300 opacity-60"
                  : "border-white/20 bg-white text-[#1F3864]"
              }`}
            >
              {isExporting ? "Generating Excel..." : "⬇ Export Excel"}
            </button>
            <button onClick={openAdd} className="rounded-md bg-white px-5 py-2 text-[13px] font-bold text-[#1F3864]">
              + Add Finding
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-8 py-7">
        {exportError && (
          <div className="mb-3.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] text-red-700">
            {exportError}
          </div>
        )}

        {findings.length > 0 && (
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-semibold text-slate-500">SEVERITY SUMMARY:</span>
            {SEVERITIES.filter((s) => sevCounts[s] > 0).map((s) => (
              <span
                key={s}
                className={`rounded-[3px] px-3 py-[3px] text-xs font-bold ${SEV_BADGE_CLASSES[s] ?? SEV_BADGE_CLASSES.Info}`}
              >
                {s}: {sevCounts[s]}
              </span>
            ))}
          </div>
        )}

        {findings.length === 0 ? (
          <div className="rounded-[10px] border-2 border-dashed border-slate-200 bg-white px-5 py-20 text-center">
            <div className="mb-4 text-5xl opacity-25">🔍</div>
            <p className="mb-1.5 text-[17px] font-bold text-slate-700">No findings yet</p>
            <p className="mb-6 text-sm text-slate-400">
              Add your first vulnerability finding to begin building the report.
            </p>
            <button onClick={openAdd} className="rounded-md bg-[#1F3864] px-7 py-2.5 text-sm font-bold text-white">
              + Add First Finding
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[10px] border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr className="bg-[#1F3864]">
                    {[
                      { label: "SI No", w: 60 },
                      { label: "Issue Name", w: 160 },
                      { label: "Observation", w: 220 },
                      { label: "Risk Impact", w: 200 },
                      { label: "Affected URL", w: 180 },
                      { label: "Severity", w: 100 },
                      { label: "Recommendation", w: 200 },
                      { label: "Test Evidence", w: 130 },
                      { label: "Actions", w: 110 },
                    ].map((col) => (
                      <th
                        key={col.label}
                        style={{ width: col.w }}
                        className="whitespace-nowrap border-r border-white/10 px-3.5 py-[11px] text-left text-xs font-bold tracking-[0.04em] text-white"
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {findings.map((f, i) => (
                    <tr
                      key={f.id}
                      className={`align-top border-b border-slate-100 ${i % 2 === 0 ? "bg-white" : "bg-slate-50"}`}
                    >
                      <td className="px-3.5 py-3 text-center font-bold text-[#1F3864]">{f.siNo}</td>
                      <td className="px-3.5 py-3 font-bold leading-snug text-slate-800">{f.issueName || "—"}</td>
                      <td className="px-3.5 py-3 leading-relaxed text-slate-600">{truncate(f.observation)}</td>
                      <td className="px-3.5 py-3 leading-relaxed text-slate-600">{truncate(f.riskImpact)}</td>
                      <td className="px-3.5 py-3">
                        {f.affectedURL ? (
                          <span className="break-all text-xs leading-snug text-blue-600">{truncate(f.affectedURL, 50)}</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-3.5 py-3">
                        <SeverityBadge severity={f.severity} />
                      </td>
                      <td className="px-3.5 py-3 leading-relaxed text-slate-600">{truncate(f.recommendation)}</td>
                      <td className="px-3.5 py-3 text-slate-600">
                        {f.annexureSteps.length > 0 ? (
                          <span className="text-xs text-blue-600">Annexures ({f.annexureSteps.length})</span>
                        ) : (
                          <span className="text-xs text-slate-400">{f.testEvidence || "—"}</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3.5 py-3">
                        <button
                          onClick={() => openEdit(f)}
                          className="mr-1.5 rounded border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteTarget(f.id)}
                          className="rounded border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-600"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {modal && (
        <FindingForm
          finding={modal}
          allFindings={findings}
          onSave={saveFinding}
          onClose={() => setModal(null)}
          claudeApiKey={claudeApiKey}
        />
      )}
      {deleteTarget && <DeleteConfirm onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}
    </div>
  );
}
*/