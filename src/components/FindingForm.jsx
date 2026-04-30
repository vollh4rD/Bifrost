import { useState } from "react";
import { defaultStep, SEVERITIES } from "../constants/report";
import { generateFindingContent } from "../lib/aiGenerate";
import Modal from "./Modal";
import StepRow from "./StepRow";

const baseInputClass =
  "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-800 outline-none focus:border-slate-400";
const baseTextareaClass = `${baseInputClass} min-h-[90px] resize-y leading-relaxed`;
const baseLabelClass = "mb-1 block text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500";

export default function FindingForm({ finding, allFindings, onSave, onClose, claudeApiKey, systemPromptTemplate }) {
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

  const handleGenerate = async () => {
    setGenerateError("");
    setIsGenerating(true);
    try {
      const generated = await generateFindingContent({
        claudeApiKey,
        issueName: f.issueName,
        severity: f.severity,
        notes: f.notes,
        systemPromptTemplate,
      });
      setF((prev) => ({ ...prev, ...generated }));
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
          <p className="mt-[3px] text-xs text-blue-200">{isEdit ? `Editing: ${f.issueName}` : "Fill in vulnerability details"}</p>
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
            <select value={f.severity} onChange={(e) => set("severity", e.target.value)} className={`${baseInputClass} cursor-pointer`}>
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
              <p className="mt-0.5 text-xs text-slate-500">Add brief notes, then click Generate to auto-fill the fields below.</p>
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
            <button onClick={addStep} className="whitespace-nowrap rounded-md bg-[#1F3864] px-4 py-2 text-[13px] font-semibold text-white">
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
        <button onClick={handleSave} className="rounded-md bg-[#1F3864] px-[26px] py-[9px] text-sm font-bold text-white">
          {isEdit ? "Update Finding" : "Save Finding"}
        </button>
      </div>
    </Modal>
  );
}
