import { useEffect, useRef, useState } from "react";
import { DEFAULT_SYSTEM_PROMPT } from "../constants/prompt";
import { defaultFinding, SEV_BADGE_CLASSES, SEVERITIES, truncate } from "../constants/report";
import { exportToExcel } from "../lib/excelExport";
import DeleteConfirm from "./DeleteConfirm";
import FindingForm from "./FindingForm";
import PromptSettingsModal from "./PromptSettingsModal";
import SeverityBadge from "./SeverityBadge";

export default function ReportApp() {
  const [findings, setFindings] = useState([]);
  const [reportMeta, setReportMeta] = useState({ clientName: "", assessmentType: "", monthYear: "", typeOfAssessment: "" });
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [showDescriptions, setShowDescriptions] = useState(false);
  const [templateBuffer, setTemplateBuffer] = useState(null);
  const [templateName, setTemplateName] = useState("");
  const [loadError, setLoadError] = useState("");
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const fileInputRef = useRef(null);
  const templateInputRef = useRef(null);
  const claudeApiKey = import.meta.env.VITE_CLAUDE_API_KEY || "";
  const AUTOSAVE_KEY = "vapt-autosave";
  const META_SAVE_KEY = "vapt-meta-autosave";
  const REQUIRED_FINDING_FIELDS = ["id", "siNo", "issueName", "severity"];

  useEffect(() => {
    try {
      const saved = localStorage.getItem(AUTOSAVE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setFindings(parsed);
      }
    } catch {
      // Ignore corrupted autosave data.
    }
    try {
      const savedMeta = localStorage.getItem(META_SAVE_KEY);
      if (savedMeta) {
        const parsed = JSON.parse(savedMeta);
        if (parsed && typeof parsed === "object") setReportMeta(parsed);
      }
    } catch {
      // Ignore corrupted meta autosave.
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(findings));
  }, [findings]);

  useEffect(() => {
    localStorage.setItem(META_SAVE_KEY, JSON.stringify(reportMeta));
  }, [reportMeta]);

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
      await exportToExcel(findings, templateBuffer, reportMeta, { showDescriptions });
    } catch (err) {
      setExportError(err?.message || "Failed to export Excel report.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleTemplateChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".xlsx")) {
      setExportError("Only .xlsx templates are supported.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (!(result instanceof ArrayBuffer)) {
        setExportError("Failed to read template file.");
        return;
      }
      setTemplateBuffer(result);
      setTemplateName(file.name);
      setExportError("");
    };
    reader.onerror = () => {
      setExportError("Failed to read template file.");
    };
    reader.readAsArrayBuffer(file);
    event.target.value = "";
  };

  const saveToJSON = () => {
    const payload = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      reportMeta,
      findings,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `vapt-report-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const parseProjectFile = (file, onSuccess, onError) => {
    if (!file) return;

    if (!file.name.endsWith(".json") && file.type !== "application/json") {
      onError("Only .json files are supported.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result);
        if (!parsed.findings || !Array.isArray(parsed.findings)) {
          onError("Invalid file: missing findings array.");
          return;
        }

        for (const finding of parsed.findings) {
          for (const key of REQUIRED_FINDING_FIELDS) {
            if (finding[key] === undefined) {
              onError(`Invalid file: finding is missing field "${key}".`);
              return;
            }
          }
        }

        if (parsed.reportMeta && typeof parsed.reportMeta === "object") {
          setReportMeta(parsed.reportMeta);
        }
        onSuccess(parsed.findings);
      } catch {
        onError("Failed to parse JSON file. It may be corrupted.");
      }
    };

    reader.onerror = () => onError("Failed to read file.");
    reader.readAsText(file);
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    setLoadError("");

    parseProjectFile(
      file,
      (loadedFindings) => {
        if (findings.length > 0) {
          const replaceAll = window.confirm(
            "You have existing findings.\n\nOK = Replace all\nCancel = Merge (append)"
          );

          if (replaceAll) {
            setFindings(loadedFindings);
          } else {
            const maxSiNo = Math.max(...findings.map((f) => f.siNo || 0), 0);
            const merged = loadedFindings.map((finding, index) => ({
              ...finding,
              id: `f-${Date.now()}-${index}`,
              siNo: maxSiNo + index + 1,
            }));
            setFindings((prev) => [...prev, ...merged]);
          }
        } else {
          setFindings(loadedFindings);
        }

        event.target.value = "";
      },
      (errorMessage) => {
        setLoadError(errorMessage);
        event.target.value = "";
      }
    );
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
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
            />
            <input
              ref={templateInputRef}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={handleTemplateChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="rounded-md border border-white/20 bg-white/10 px-[14px] py-[7px] text-[13px] font-semibold text-white hover:bg-white/15"
            >
              Load Project
            </button>
            <button
              onClick={() => templateInputRef.current?.click()}
              className="rounded-md border border-white/20 bg-white/10 px-[14px] py-[7px] text-[13px] font-semibold text-white hover:bg-white/15"
            >
              {templateName ? "Template Loaded" : "Load Template"}
            </button>
            <button
              onClick={saveToJSON}
              className="rounded-md border border-white/20 bg-white/10 px-[14px] py-[7px] text-[13px] font-semibold text-white hover:bg-white/15"
            >
              Save Project
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="rounded-md border border-white/20 bg-white/10 px-[14px] py-[7px] text-[13px] font-semibold text-white hover:bg-white/15"
            >
              ⚙ AI Settings
            </button>
            <label className="flex cursor-pointer items-center gap-1.5 text-[13px] font-semibold text-white select-none">
              <input
                type="checkbox"
                checked={showDescriptions}
                onChange={(e) => setShowDescriptions(e.target.checked)}
                className="h-3.5 w-3.5 accent-white"
              />
              Include descriptions
            </label>
            <button
              onClick={handleExportExcel}
              disabled={!findings.length || isExporting || !templateBuffer}
              title={
                !templateBuffer
                  ? "Load an .xlsx template to export"
                  : !findings.length
                  ? "Add at least one finding to export"
                  : isExporting
                    ? "Generating Excel..."
                    : "Export Excel report"
              }
              className={`rounded-md border px-[18px] py-[7px] text-[13px] font-semibold ${
                !findings.length || isExporting || !templateBuffer
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
        {loadError && (
          <div className="mb-3.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] text-red-700">
            {loadError}
          </div>
        )}

        <div className="mb-5 rounded-[10px] border border-slate-200 bg-white px-5 py-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.06em] text-[#1F3864]">Report Information</p>
          <div className="grid grid-cols-4 gap-4">
            {[
              { key: "clientName", label: "Client Name", placeholder: "e.g. Acme Corp" },
              { key: "assessmentType", label: "Assessment Type", placeholder: "e.g. Web Application PT" },
              { key: "monthYear", label: "Month & Year", placeholder: "e.g. April 2026" },
              { key: "typeOfAssessment", label: "Type of Assessment", placeholder: "e.g. Black Box" },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.04em] text-slate-400">
                  {label}
                </label>
                <input
                  value={reportMeta[key]}
                  onChange={(e) => setReportMeta((prev) => ({ ...prev, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full rounded border border-slate-200 px-3 py-1.5 text-sm text-slate-700 placeholder-slate-300 focus:border-[#1F3864] focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>

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
          systemPromptTemplate={systemPrompt}
        />
      )}
      {showSettings && (
        <PromptSettingsModal
          systemPrompt={systemPrompt}
          onChange={setSystemPrompt}
          onClose={() => setShowSettings(false)}
        />
      )}
      {deleteTarget && <DeleteConfirm onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}
    </div>
  );
}
