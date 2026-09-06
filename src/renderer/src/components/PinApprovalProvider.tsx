// PinApprovalProvider — global §15 approval prompt listener for the Desktop
// renderer. It subscribes to the main-process `approval:prompt` event, renders
// the PinApprovalModal, and routes the typed PIN back to the main process via
// `approval:resolve` / `approval:cancel`. Verification happens in main; a wrong
// PIN surfaces here as an inline error and lets the approver retry.

import React, { useCallback, useEffect, useState } from 'react';
import PinApprovalModal from './PinApprovalModal';

interface PromptState {
  requestId: string;
  title?: string;
  message?: string;
  approverName?: string;
  context: string;
}

const PinApprovalProvider: React.FC = () => {
  const [prompt, setPrompt] = useState<PromptState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (!window.api) return;
    const onPrompt = (payload: any) => {
      if (!payload?.requestId) return;
      setPrompt((prev) => prev && prev.requestId === payload.requestId ? prev : {
        requestId: payload.requestId,
        title: payload.title,
        message: payload.message,
        approverName: payload.approverName,
        context: payload.context,
      });
      setError(null);
      setVerifying(false);
    };
    const onInvalid = (payload: { requestId?: string }) => {
      setPrompt((prev) => (prev && (!payload?.requestId || prev.requestId === payload.requestId)) ? prev : prev);
      setError('PIN is incorrect. Try again.');
      setVerifying(false);
    };
    window.api.onApprovalPrompt(onPrompt);
    window.api.onApprovalPinInvalid(onInvalid);
    return () => {
      // listeners are scoped per-window; no-op cleanup keeps StrictMode safe
    };
  }, []);

  const handleConfirm = useCallback(
    async (pin: string) => {
      if (!prompt) return;
      setVerifying(true);
      setError(null);
      try {
        const ok = await window.api.approveWithPin(prompt.requestId, pin);
        if (ok) {
          setPrompt(null);
          setVerifying(false);
        } else {
          // Wrong PIN: main keeps the prompt open; we show an inline error via
          // the pin-invalid event; nothing further to infer here.
          setVerifying(false);
        }
      } catch {
        setError('Failed to verify PIN. Try again.');
        setVerifying(false);
      }
    },
    [prompt],
  );

  const handleCancel = useCallback(() => {
    if (prompt) window.api.cancelApproval(prompt.requestId);
    setPrompt(null);
    setError(null);
    setVerifying(false);
  }, [prompt]);

  return (
    <PinApprovalModal
      open={!!prompt}
      title={prompt?.title}
      message={prompt?.message}
      approverName={prompt?.approverName}
      error={error}
      verifying={verifying}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );
};

PinApprovalProvider.displayName = 'PinApprovalProvider';

export default PinApprovalProvider;
