export default function DeleteConfirm({ onConfirm, onCancel }) {
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
