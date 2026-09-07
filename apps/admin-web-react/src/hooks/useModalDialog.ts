import { useCallback, useEffect, useId, useRef, type RefObject } from 'react';

const dialogStack: symbol[] = [];
let previousBodyOverflow = '';
let previousRootAriaHidden: string | null = null;
let previousRootInert = false;

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function useModalDialog({
  isOpen,
  onClose,
  closeDisabled = false,
  initialFocusRef,
}: {
  isOpen: boolean;
  onClose: () => void;
  closeDisabled?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const tokenRef = useRef(Symbol('modal-dialog'));
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const generatedId = useId().replace(/:/g, '');
  const titleId = `dialog-title-${generatedId}`;
  const descriptionId = `dialog-description-${generatedId}`;

  const requestClose = useCallback(() => {
    if (!closeDisabled) onClose();
  }, [closeDisabled, onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const token = tokenRef.current;
    const root = document.getElementById('root');
    previousFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    dialogStack.push(token);

    if (dialogStack.length === 1) {
      previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      if (root) {
        previousRootInert = root.inert;
        previousRootAriaHidden = root.getAttribute('aria-hidden');
        root.inert = true;
        root.setAttribute('aria-hidden', 'true');
      }
    }

    const focusFrame = window.requestAnimationFrame(() => {
      const preferred = initialFocusRef?.current
        || dialogRef.current?.querySelector<HTMLElement>('[data-autofocus]')
        || dialogRef.current?.querySelector<HTMLElement>(focusableSelector)
        || dialogRef.current;
      preferred?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (dialogStack.at(-1) !== token) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        requestClose();
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector))
        .filter((element) => !element.hidden && element.getClientRects().length > 0);

      if (focusable.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', handleKeyDown);
      const position = dialogStack.lastIndexOf(token);
      if (position >= 0) dialogStack.splice(position, 1);

      if (dialogStack.length === 0) {
        document.body.style.overflow = previousBodyOverflow;
        if (root) {
          root.inert = previousRootInert;
          if (previousRootAriaHidden === null) root.removeAttribute('aria-hidden');
          else root.setAttribute('aria-hidden', previousRootAriaHidden);
        }
      }

      window.requestAnimationFrame(() => previousFocusRef.current?.focus());
    };
  }, [initialFocusRef, isOpen, requestClose]);

  return { dialogRef, titleId, descriptionId, requestClose };
}
