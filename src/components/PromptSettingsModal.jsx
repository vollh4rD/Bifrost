import { DEFAULT_SYSTEM_PROMPT, SYSTEM_PROMPT_PRESETS } from "../constants/prompt";
import Modal from "./Modal";

export default function PromptSettingsModal({ systemPrompt, onChange, onClose }) {
  return (
    <Modal onClose={onClose}>
      <div className="flex items-center justify-between rounded-t-[10px] bg-[#1F3864] px-6 py-[18px]">
        <div>
          <h2 className="m-0 text-[17px] font-bold text-white">AI Settings</h2>
          <p className="mt-[3px] text-xs text-blue-200">Customize tone, phrasing, and output behavior for Claude generation.</p>
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-md bg-white/10 text-xl text-white hover:bg-white/20"
        >
          ×
        </button>
      </div>

      <div className="px-6 py-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {SYSTEM_PROMPT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onChange(preset.prompt)}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              {preset.label}
            </button>
          ))}
          <button
            onClick={() => onChange(DEFAULT_SYSTEM_PROMPT)}
            className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
          >
            Reset default
          </button>
        </div>

        <p className="mb-2 text-xs text-slate-500">
          Available placeholders: <code>{"{issueName}"}</code>, <code>{"{severity}"}</code>, <code>{"{notes}"}</code>
        </p>

        <textarea
          value={systemPrompt}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[320px] w-full resize-y rounded-md border border-slate-200 bg-white px-3 py-2 text-[13px] leading-relaxed text-slate-800 outline-none focus:border-slate-400"
        />
      </div>

      <div className="flex justify-end rounded-b-[10px] border-t border-slate-200 bg-slate-50 px-6 py-3.5">
        <button onClick={onClose} className="rounded-md bg-[#1F3864] px-[26px] py-[9px] text-sm font-bold text-white">
          Done
        </button>
      </div>
    </Modal>
  );
}
