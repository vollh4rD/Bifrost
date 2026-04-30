import { useRef } from "react";

const baseInputClass =
  "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-800 outline-none focus:border-slate-400";

export default function StepRow({ step, onUpdate, onRemove }) {
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
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
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
