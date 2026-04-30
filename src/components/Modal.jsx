export default function Modal({ children, onClose }) {
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
