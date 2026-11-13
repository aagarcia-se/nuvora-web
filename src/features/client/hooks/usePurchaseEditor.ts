import { useEffect, useRef, useState } from 'react';
import {
  errorStatus,
  isRequestCanceled,
} from '@/shared/api/authenticatedRequest';
import type { usePurchaseDocuments } from '../api/usePurchaseDocuments';
import { purchaseDocumentMessage } from '../api/purchaseDocumentsApi';
import type {
  PurchaseDocument,
  PurchaseDocumentInput,
} from '../types/purchaseDocument.types';
import {
  emptyPurchase,
  normalizePurchase,
  purchaseInput,
  samePurchase,
  validatePurchase,
} from '../utils/purchasePresentation';

export function usePurchaseEditor(
  entityName: string,
  initialDocument: PurchaseDocument | undefined,
  writer: ReturnType<typeof usePurchaseDocuments>['mutate'],
) {
  const [baseline, setBaseline] = useState(() =>
    initialDocument
      ? purchaseInput(initialDocument)
      : emptyPurchase(entityName),
  );
  const [form, setForm] = useState(baseline);
  const [saved, setSaved] = useState(initialDocument);
  const [completed, setCompleted] = useState<PurchaseDocument>();
  const [errors, setErrors] = useState<ReturnType<typeof validatePurchase>>({});
  const [validationAttempt, setValidationAttempt] = useState(0);
  const [failureStatus, setFailureStatus] = useState(0);
  const [phase, setPhase] = useState<
    'idle' | 'saving' | 'sending' | 'checking'
  >('idle');
  const [feedback, setFeedback] = useState<{
    kind: 'success' | 'error';
    message: string;
  }>();
  const [sendNeedsCheck, setSendNeedsCheck] = useState(false);
  const [recoveryRequired, setRecoveryRequired] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const active = useRef(false);
  const busy = useRef(false);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  const dirty = !samePurchase(form, baseline);
  function change<K extends keyof PurchaseDocumentInput>(
    key: K,
    value: PurchaseDocumentInput[K],
  ) {
    setForm((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: undefined }));
    setFeedback(undefined);
  }
  function reset() {
    const blank = emptyPurchase(entityName);
    setForm(blank);
    setBaseline(blank);
    setSaved(undefined);
    setCompleted(undefined);
    setErrors({});
    setFeedback(undefined);
    setSendNeedsCheck(false);
    setRecoveryRequired(false);
    setUnavailable(false);
    setFailureStatus(0);
  }
  async function save(sendReview: boolean) {
    if (busy.current || recoveryRequired || unavailable) return;
    const next = validatePurchase(form);
    setErrors(next);
    if (Object.keys(next).length) {
      setValidationAttempt((previous) => previous + 1);
      return;
    }
    busy.current = true;
    setFeedback(undefined);
    let step: 'save' | 'send' | 'check' = 'save';
    let document = saved;
    try {
      // An explicit retry first checks the same saved ID. It never creates a second document.
      if (sendNeedsCheck && document) {
        step = 'check';
        setPhase('checking');
        document = await writer.mutateAsync({ kind: 'check', id: document.id });
        if (!active.current) return;
        if (document.status === 'pending_review') {
          setFeedback({
            kind: 'success',
            message: `El comprobante ya estaba pendiente de revisión; no se repitió el envío.${dirty ? ' Los cambios posteriores no se guardaron.' : ''}`,
          });
          setCompleted(document);
          setSaved(document);
          setBaseline(form);
          return;
        }
      }
      if (!document || dirty) {
        step = 'save';
        setPhase('saving');
        const input = normalizePurchase(form);
        document = await writer.mutateAsync(
          document
            ? { kind: 'patch', id: document.id, input }
            : { kind: 'create', input },
        );
        if (!active.current) return;
        setSaved(document);
        const snapshot = purchaseInput(document);
        setForm(snapshot);
        setBaseline(snapshot);
      }
      if (sendReview && document.status === 'draft') {
        step = 'send';
        setPhase('sending');
        document = await writer.mutateAsync({
          kind: 'submit',
          id: document.id,
        });
        if (!active.current) return;
      }
      if (document.status === 'pending_review') {
        setCompleted(document);
        setSaved(document);
        setBaseline(purchaseInput(document));
      } else {
        setFeedback({
          kind: 'success',
          message:
            'Borrador guardado. Puedes continuar después o enviarlo a revisión.',
        });
      }
      setSendNeedsCheck(false);
    } catch (error) {
      if (!active.current || isRequestCanceled(error)) return;
      const status = errorStatus(error);
      setFailureStatus(status);
      setUnavailable([401, 403, 404].includes(status));
      if (step === 'send' || step === 'check') {
        setSendNeedsCheck(true);
        setFeedback({
          kind: 'error',
          message: `Tu borrador está guardado. ${step === 'send' ? 'No pudimos confirmar el envío a revisión.' : 'No pudimos comprobar su estado; no se ha repetido el envío.'} ${purchaseDocumentMessage(error, 'write')}`,
        });
      } else {
        const uncertain = status === 0 || status >= 500;
        setRecoveryRequired(uncertain);
        setFeedback({
          kind: 'error',
          message: uncertain
            ? 'No pudimos confirmar el guardado. Revisa y actualiza los comprobantes antes de repetirlo.'
            : purchaseDocumentMessage(error, 'write'),
        });
      }
    } finally {
      busy.current = false;
      if (active.current) setPhase('idle');
    }
  }
  return {
    form,
    saved,
    completed,
    errors,
    validationAttempt,
    failureStatus,
    phase,
    feedback,
    dirty,
    sendNeedsCheck,
    recoveryRequired,
    unavailable,
    change,
    reset,
    save,
  };
}
