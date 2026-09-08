import { useEffect, useRef, type ReactNode } from "react";
export function TomeDialog({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current!;
    dialog.showModal();
    return () => {
      dialog.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="tome-dialog"
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        e.stopPropagation();
        close();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="tome-dialog-header">
        <h2>{title}</h2>
        <button autoFocus aria-label={`Close ${title}`} onClick={close}>
          ×
        </button>
      </div>
      {children}
    </dialog>
  );
}
