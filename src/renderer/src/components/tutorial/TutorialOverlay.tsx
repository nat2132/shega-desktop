import React, { useState, useEffect, useCallback, useRef, useId } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ChevronLeft, ChevronRight, SkipForward, RotateCcw, Pause, Play,
  HelpCircle, Target, MousePointerClick, CheckCircle2, Sparkles, Lightbulb,
} from 'lucide-react';
import { useTutorial } from '../../context/TutorialContext';
import { TargetRect } from './types';
import { Button } from '../ui/button';
import { cn } from '../../utils/shadcn';
import { useSettings } from '../../context/SettingsContext';

const TOOLTIP_WIDTH = 380;
const GAP = 16;
const FORM_GAP = 20;
const PADDING = 16;
const SPOTLIGHT_PAD = 8;
const FORM_SPOTLIGHT_PAD = 16;
const SPOTLIGHT_OPACITY = 0.55;
const FORM_SPOTLIGHT_OPACITY = 0.25;
const BADGE_HEIGHT = 26;

function throttle<T extends (...args: unknown[]) => void>(fn: T, ms: number): (...args: Parameters<T>) => void {
  let last = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - last >= ms) {
      last = now;
      fn(...args);
    }
  };
}

function getPointerPosition(rect: TargetRect): { x: number; y: number } {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

function isFormElement(el: Element): boolean {
  const tag = el.tagName.toLowerCase();
  const type = (el as HTMLInputElement).type?.toLowerCase();
  const role = el.getAttribute('role');
  const dataSlot = el.getAttribute('data-slot');
  return (
    tag === 'input' || tag === 'textarea' || tag === 'select' ||
    dataSlot === 'input' || dataSlot === 'select-trigger' || dataSlot === 'switch' ||
    type === 'checkbox' || type === 'radio' ||
    role === 'switch' || role === 'combobox'
  );
}

function isTextInput(el: Element): boolean {
  const tag = el.tagName.toLowerCase();
  const type = (el as HTMLInputElement).type?.toLowerCase();
  return (
    tag === 'textarea' ||
    (tag === 'input' && ['text', 'search', 'email', 'tel', 'url', 'password', 'number', 'date', 'time', 'datetime-local', 'month', 'week'].includes(type ?? ''))
  );
}

function isSelectTrigger(el: Element): boolean {
  return (
    el.tagName.toLowerCase() === 'select' ||
    el.getAttribute('data-slot') === 'select-trigger' ||
    el.getAttribute('role') === 'combobox'
  );
}

function calcTooltipPosition(
  targetRect: TargetRect,
  tipW: number,
  tipH: number,
  preferred: string,
  isFormField: boolean
): { top: number; left: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const gap = isFormField ? FORM_GAP : GAP;

  const positions = isFormField
    ? ['right', 'left', ...(preferred === 'bottom' ? [] : [preferred]), 'bottom', 'top']
    : [preferred, 'bottom', 'top', 'left', 'right'];

  for (const pos of new Set(positions)) {
    let top = 0, left = 0;
    switch (pos) {
      case 'top':
        top = targetRect.top - tipH - gap;
        left = targetRect.left + targetRect.width / 2 - tipW / 2;
        break;
      case 'bottom':
        top = targetRect.bottom + gap;
        left = targetRect.left + targetRect.width / 2 - tipW / 2;
        break;
      case 'left':
        top = targetRect.top + targetRect.height / 2 - tipH / 2;
        left = targetRect.left - tipW - gap;
        break;
      case 'right':
        top = targetRect.top + targetRect.height / 2 - tipH / 2;
        left = targetRect.right + gap;
        break;
      default:
        top = vh / 2 - tipH / 2;
        left = vw / 2 - tipW / 2;
    }

    top = Math.max(PADDING, Math.min(top, vh - tipH - PADDING));
    left = Math.max(PADDING, Math.min(left, vw - tipW - PADDING));

    const visibleW = Math.min(tipW, vw - left) - Math.max(0, PADDING - left);
    const visibleH = Math.min(tipH, vh - top) - Math.max(0, PADDING - top);
    if (pos === 'center' || (visibleW >= tipW * 0.7 && visibleH >= tipH * 0.7)) {
      return { top, left };
    }
  }

  return {
    top: Math.max(PADDING, Math.min(vh / 2 - tipH / 2, vh - tipH - PADDING)),
    left: Math.max(PADDING, Math.min(vw / 2 - tipW / 2, vw - tipW - PADDING)),
  };
}

export default function TutorialOverlay() {
  const { t } = useSettings();
  const {
    isActive,
    isPaused,
    currentTutorial,
    currentStepIndex,
    currentStep,
    nextStep,
    prevStep,
    skipTutorial,
    pauseTutorial,
    resumeTutorial,
    restartTutorial,
  } = useTutorial();

  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const [interactionDone, setInteractionDone] = useState(false);
  const [elementVisible, setElementVisible] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isFormField, setIsFormField] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const pulseRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<HTMLDivElement>(null);
  const maskId = useId();
  const interactionCheckInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const originalInputsRef = useRef<Map<string, { placeholder: string; value: string }>>(new Map());

  const spotlightPad = isFormField ? FORM_SPOTLIGHT_PAD : SPOTLIGHT_PAD;
  const spotlightOpacity = isFormField ? FORM_SPOTLIGHT_OPACITY : SPOTLIGHT_OPACITY;

  const updateTargetRect = useCallback(() => {
    if (!currentStep?.targetSelector) {
      setTargetRect(null);
      setElementVisible(true);
      setIsFormField(false);
      return;
    }

    const el = document.querySelector(currentStep.targetSelector);
    if (el) {
      const rect = el.getBoundingClientRect();
      const isOffscreen = rect.bottom < 0 || rect.top > window.innerHeight ||
                          rect.right < 0 || rect.left > window.innerWidth;
      setElementVisible(!isOffscreen);
      setIsFormField(isFormElement(el));
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        bottom: rect.bottom,
        right: rect.right,
      });
    } else {
      setTargetRect(null);
      setElementVisible(false);
      setIsFormField(false);
    }
  }, [currentStep?.targetSelector]);

  const throttledUpdate = useCallback(
    throttle(updateTargetRect, 100),
    [updateTargetRect]
  );

  useEffect(() => {
    updateTargetRect();
    setInteractionDone(false);
    setShowSuccess(false);

    if (!currentStep?.targetSelector) return;

    const el = document.querySelector(currentStep.targetSelector);
    if (!el) return;

    el.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const observer = new ResizeObserver(throttledUpdate);
    observer.observe(el);
    window.addEventListener('scroll', throttledUpdate, true);
    window.addEventListener('resize', throttledUpdate);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', throttledUpdate, true);
      window.removeEventListener('resize', throttledUpdate);
    };
  }, [currentStep, updateTargetRect, throttledUpdate]);

  useEffect(() => {
    if (!currentStep?.waitForInteraction || !currentStep.targetSelector || isPaused) return;

    const el = document.querySelector(currentStep.targetSelector);
    if (!el) return;

    const complete = () => {
      setInteractionDone(true);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        nextStep();
      }, 800);
    };

    if (isTextInput(el)) {
      let debounceTimer: ReturnType<typeof setTimeout> | null = null;

      const onInput = () => {
        const input = el as HTMLInputElement;
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          if (input.value.trim().length > 0) {
            complete();
          }
        }, 800);
      };

      const onChange = () => {
        const input = el as HTMLInputElement;
        if (input.value.trim().length > 0) {
          if (debounceTimer) clearTimeout(debounceTimer);
          complete();
        }
      };

      const onBlur = () => {
        const input = el as HTMLInputElement;
        if (input.value.trim().length > 0) {
          if (debounceTimer) clearTimeout(debounceTimer);
          complete();
        }
      };

      el.addEventListener('input', onInput);
      el.addEventListener('change', onChange);
      el.addEventListener('blur', onBlur);

      if (interactionCheckInterval.current) clearInterval(interactionCheckInterval.current);
      interactionCheckInterval.current = setInterval(() => {
        const inputEl = document.querySelector(currentStep.targetSelector!) as HTMLInputElement | null;
        if (inputEl && inputEl.value && inputEl.value.trim().length > 0 && document.activeElement !== inputEl) {
          if (debounceTimer) clearTimeout(debounceTimer);
          complete();
        }
      }, 500);

      return () => {
        el.removeEventListener('input', onInput);
        el.removeEventListener('change', onChange);
        el.removeEventListener('blur', onBlur);
        if (debounceTimer) clearTimeout(debounceTimer);
        if (interactionCheckInterval.current) {
          clearInterval(interactionCheckInterval.current);
          interactionCheckInterval.current = null;
        }
      };
    }

    if (isSelectTrigger(el)) {
      if (el.tagName.toLowerCase() === 'select') {
        const onChange = () => {
          const select = el as HTMLSelectElement;
          if (select.value && select.selectedIndex > 0) {
            complete();
          }
        };
        el.addEventListener('change', onChange);
        return () => el.removeEventListener('change', onChange);
      }

      const initialText = el.textContent || '';
      const observer = new MutationObserver(() => {
        const currentText = el.textContent || '';
        if (currentText !== initialText && currentText.trim().length > 0) {
          observer.disconnect();
          complete();
        }
      });
      observer.observe(el, { childList: true, subtree: true, characterData: true });

      if (interactionCheckInterval.current) clearInterval(interactionCheckInterval.current);
      interactionCheckInterval.current = setInterval(() => {
        const currentText = el.textContent || '';
        if (currentText !== initialText && currentText.trim().length > 0) {
          observer.disconnect();
          if (interactionCheckInterval.current) {
            clearInterval(interactionCheckInterval.current);
            interactionCheckInterval.current = null;
          }
          complete();
        }
      }, 300);

      return () => {
        observer.disconnect();
        if (interactionCheckInterval.current) {
          clearInterval(interactionCheckInterval.current);
          interactionCheckInterval.current = null;
        }
      };
    }

    const onClick = () => complete();
    el.addEventListener('click', onClick, { once: true });
    return () => el.removeEventListener('click', onClick);
  }, [currentStep, nextStep, isPaused]);

  useEffect(() => {
    originalInputsRef.current.forEach((orig, selector) => {
      const el = document.querySelector(selector) as HTMLInputElement | null;
      if (el) {
        if (orig.placeholder !== undefined) el.placeholder = orig.placeholder;
        if (orig.value !== undefined) el.value = orig.value;
      }
    });
    originalInputsRef.current.clear();

    if (!currentStep?.targetSelector) return;
    if (!stepPlaceholder && !currentStep.exampleValue) return;

    const el = document.querySelector(currentStep.targetSelector) as HTMLInputElement | null;
    if (!el) return;

    const orig: { placeholder: string; value: string } = { placeholder: '', value: '' };

    if (stepPlaceholder) {
      orig.placeholder = el.placeholder;
      el.placeholder = stepPlaceholder;
    }

    if (currentStep.exampleValue) {
      orig.value = el.value;
      el.value = currentStep.exampleValue;
    }

    originalInputsRef.current.set(currentStep.targetSelector, orig);

    return () => {
      const saved = originalInputsRef.current.get(currentStep.targetSelector!);
      if (saved) {
        const savedEl = document.querySelector(currentStep.targetSelector!) as HTMLInputElement | null;
        if (savedEl) {
          if (saved.placeholder !== undefined) savedEl.placeholder = saved.placeholder;
          if (saved.value !== undefined) savedEl.value = saved.value;
        }
        originalInputsRef.current.delete(currentStep.targetSelector!);
      }
    };
  }, [currentStep]);

  useEffect(() => {
    if (!currentStep?.autoAdvance || !currentStep.autoAdvanceDelay || isPaused) return;
    const timer = setTimeout(() => nextStep(), currentStep.autoAdvanceDelay);
    return () => clearTimeout(timer);
  }, [currentStep, nextStep, isPaused]);

  useEffect(() => {
    if (!tooltipRef.current || !targetRect) return;

    const tip = tooltipRef.current.getBoundingClientRect();
    const position = currentStep?.tooltipPosition || 'bottom';
    const { top, left } = calcTooltipPosition(targetRect, tip.width, tip.height, position, isFormField);
    setTooltipPos({ top, left });
  }, [targetRect, currentStep?.tooltipPosition, currentStepIndex, isFormField]);

  useEffect(() => {
    if (!isActive) return;

    const handler = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          skipTutorial();
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (!currentStep?.waitForInteraction || interactionDone) {
            nextStep();
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (currentStepIndex > 0) prevStep();
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isActive, skipTutorial, nextStep, prevStep, currentStepIndex, currentStep, interactionDone]);

  if (!isActive || !currentTutorial || !currentStep) return null;

  const totalSteps = currentTutorial.steps.length;
  const progress = ((currentStepIndex + 1) / totalSteps) * 100;
  const isLastStep = currentStepIndex === totalSteps - 1;
  const isFirstStep = currentStepIndex === 0;
  const needsInteraction = !!currentStep.waitForInteraction;
  const canProceed = !needsInteraction || interactionDone;
  const pointer = targetRect ? getPointerPosition(targetRect) : null;

  // Resolve translatable fields from the current step using auto-generated keys
  const stepTitle = t(`tut.${currentStep.id}.title`, currentStep.title || '');
  const stepDescription = t(`tut.${currentStep.id}.desc`, currentStep.description || '');
  const stepInstruction = currentStep.instruction
    ? t(`tut.${currentStep.id}.instruction`, currentStep.instruction)
    : undefined;
  const stepPlaceholder = currentStep.placeholderText
    ? t(`tut.${currentStep.id}.placeholder`, currentStep.placeholderText)
    : undefined;

  return createPortal(
    <div ref={overlayRef} className="fixed inset-0 z-[9999]" style={{ pointerEvents: 'none' }}>
      {/* Spotlight mask */}
      <AnimatePresence>
        {targetRect && (
          <motion.svg
            key={`spotlight-${currentStep.id}`}
            className="absolute inset-0 w-full h-full"
            style={{ pointerEvents: 'none' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.28, 0, 0.22, 1] }}
          >
            <defs>
              <mask id={maskId}>
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                <motion.rect
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4, ease: [0.28, 0, 0.22, 1] }}
                  x={targetRect.left - spotlightPad}
                  y={targetRect.top - spotlightPad}
                  width={targetRect.width + spotlightPad * 2}
                  height={targetRect.height + spotlightPad * 2}
                  rx={14}
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              x="0" y="0" width="100%" height="100%"
              fill={`rgba(0,0,0,${spotlightOpacity})`}
              mask={`url(#${maskId})`}
              style={{ pointerEvents: 'none' }}
            />
          </motion.svg>
        )}
      </AnimatePresence>

      {!targetRect && (
        <motion.div
          key="full-overlay"
          className="absolute inset-0 bg-black/55"
          style={{ pointerEvents: 'none' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}

      {/* Click-blocker zones around spotlight */}
      <div className="absolute inset-0" style={{ pointerEvents: 'none' }}>
        {targetRect && (
          <>
            <div
              style={{
                position: 'fixed',
                top: 0, left: 0, right: 0,
                height: targetRect.top - spotlightPad,
                pointerEvents: 'auto',
              }}
              className="cursor-default"
              onClick={(e) => { e.stopPropagation(); skipTutorial(); }}
            />
            <div
              style={{
                position: 'fixed',
                top: targetRect.bottom + spotlightPad, left: 0, right: 0, bottom: 0,
                pointerEvents: 'auto',
              }}
              className="cursor-default"
              onClick={(e) => { e.stopPropagation(); skipTutorial(); }}
            />
            <div
              style={{
                position: 'fixed',
                top: targetRect.top - spotlightPad, left: 0,
                width: targetRect.left - spotlightPad,
                height: targetRect.height + spotlightPad * 2,
                pointerEvents: 'auto',
              }}
              className="cursor-default"
              onClick={(e) => { e.stopPropagation(); skipTutorial(); }}
            />
            <div
              style={{
                position: 'fixed',
                top: targetRect.top - spotlightPad,
                right: 0,
                width: `calc(100vw - ${targetRect.right + spotlightPad}px)`,
                height: targetRect.height + spotlightPad * 2,
                pointerEvents: 'auto',
              }}
              className="cursor-default"
              onClick={(e) => { e.stopPropagation(); skipTutorial(); }}
            />
          </>
        )}
      </div>

      {/* Pulse ring */}
      <AnimatePresence>
        {targetRect && (
          <motion.div
            key={`pulse-${currentStep.id}`}
            ref={pulseRef}
            className={cn(
              'tutorial-pulse-ring',
              needsInteraction && !interactionDone && 'tutorial-pulse-ring--interactive'
            )}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.35, ease: [0.28, 0, 0.22, 1] }}
            style={{
              position: 'fixed',
              left: targetRect.left - 4,
              top: targetRect.top - 4,
              width: targetRect.width + 8,
              height: targetRect.height + 8,
              borderRadius: 16,
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />
        )}
      </AnimatePresence>

      {/* Glow highlight on target */}
      {targetRect && (
        <motion.div
          key={`glow-${currentStep.id}`}
          className={cn(
            'tutorial-highlight-glow',
            needsInteraction && !interactionDone && 'tutorial-highlight-glow--interactive'
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'fixed',
            left: targetRect.left - 2,
            top: targetRect.top - 2,
            width: targetRect.width + 4,
            height: targetRect.height + 4,
            borderRadius: 16,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      )}

      {/* Step number badge on target */}
      {targetRect && (
        <motion.div
          key={`badge-${currentStep.id}`}
          className="tutorial-step-badge"
          initial={{ opacity: 0, scale: 0.5, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: -4 }}
          transition={{ duration: 0.35, delay: 0.1, ease: [0.28, 0, 0.22, 1] }}
          style={{
            position: 'fixed',
            left: targetRect.left + 8,
            top: targetRect.top - BADGE_HEIGHT / 2 - 2,
            pointerEvents: 'none',
            zIndex: 2,
          }}
        >
          <span className="tutorial-step-badge-number">{currentStepIndex + 1}</span>
          <span className="tutorial-step-badge-label">{stepTitle}</span>
          {needsInteraction && !interactionDone && (
            <span className="tutorial-step-badge-dot" />
          )}
          {interactionDone && (
            <CheckCircle2 className="size-3 text-green-400 shrink-0" />
          )}
        </motion.div>
      )}

      {/* Click pointer indicator for interaction steps */}
      {targetRect && needsInteraction && !interactionDone && (
        <motion.div
          key={`pointer-${currentStep.id}`}
          ref={pointerRef}
          className="tutorial-pointer"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.4, delay: 0.2, ease: [0.28, 0, 0.22, 1] }}
          style={{
            position: 'fixed',
            left: pointer!.x,
            top: pointer!.y,
            pointerEvents: 'none',
            zIndex: 3,
          }}
        >
          <div className="tutorial-pointer-arrow">
            <MousePointerClick className="size-5 text-primary" />
          </div>
          <div className="tutorial-pointer-label">
            {t('tutorial.click_element')}
          </div>
        </motion.div>
      )}

      {/* Example data badge */}
      {targetRect && currentStep.exampleValue && (
        <motion.div
          key={`example-${currentStep.id}`}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.35, delay: 0.15, ease: [0.28, 0, 0.22, 1] }}
          style={{
            position: 'fixed',
            left: targetRect.left + 8,
            top: targetRect.bottom + 4,
            pointerEvents: 'none',
            zIndex: 3,
          }}
        >
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/25 text-[9px] font-medium text-amber-600 dark:text-amber-400 whitespace-nowrap">
            <Lightbulb className="size-2.5" />
            {t('tutorial.example')} — {currentStep.exampleValue}
          </span>
        </motion.div>
      )}

      {/* Success burst on interaction complete */}
      {targetRect && showSuccess && (
        <motion.div
          key={`success-${currentStep.id}`}
          className="tutorial-success-burst"
          initial={{ opacity: 0, scale: 0.3 }}
          animate={{ opacity: [0, 1, 1, 0], scale: [0.3, 1.2, 1, 1.5] }}
          transition={{ duration: 0.8, ease: [0.28, 0, 0.22, 1] }}
          style={{
            position: 'fixed',
            left: targetRect.left + targetRect.width / 2 - 24,
            top: targetRect.top + targetRect.height / 2 - 24,
            width: 48,
            height: 48,
            pointerEvents: 'none',
            zIndex: 4,
          }}
        >
          <div className="tutorial-success-burst-inner">
            <CheckCircle2 className="size-8 text-green-400" strokeWidth={2.5} />
          </div>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="tutorial-success-particle"
              initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              animate={{
                opacity: 0,
                x: Math.cos((i / 3) * Math.PI * 2) * 40,
                y: Math.sin((i / 3) * Math.PI * 2) * 40,
                scale: 0,
              }}
              transition={{ duration: 0.6, delay: 0.05 * i }}
            />
          ))}
        </motion.div>
      )}

      {/* "Scroll to find" hint */}
      {!elementVisible && targetRect === null && currentStep.targetSelector && (
        <div className="fixed inset-0 flex items-center justify-center z-10" style={{ pointerEvents: 'none' }}>
          <motion.div
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/80 backdrop-blur-md border border-border/50 text-xs text-muted-foreground shadow-lg"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Target className="size-3.5 text-primary" />
            {t('tutorial.scroll_find')}
          </motion.div>
        </div>
      )}

      {/* Tooltip card */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={`tooltip-${currentStep.id}`}
          ref={tooltipRef}
          layout
          initial={{ opacity: 0, y: 16, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.94 }}
          transition={{ duration: 0.4, ease: [0.28, 0, 0.22, 1] }}
          className="tutorial-tooltip apple-panel"
          style={{
            position: 'fixed',
            left: tooltipPos.left,
            top: tooltipPos.top,
            width: TOOLTIP_WIDTH,
            maxWidth: 'calc(100vw - 32px)',
            pointerEvents: 'auto',
            zIndex: 2,
          }}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <span className={cn(
                'inline-flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-bold transition-colors',
                needsInteraction && !interactionDone
                  ? 'bg-primary/20 text-primary'
                  : 'bg-green-500/20 text-green-500'
              )}>
                {interactionDone ? <CheckCircle2 className="size-3.5" /> : currentStepIndex + 1}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider">
                {t('tutorial.step_of').replace('{{current}}', String(currentStepIndex + 1)).replace('{{total}}', String(totalSteps))}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => restartTutorial()}
                className="size-7 flex items-center justify-center rounded-full text-muted-foreground/50 hover:text-foreground hover:bg-accent/60 transition-all"
                title={t('tutorial.restart')}
              >
                <RotateCcw className="size-3.5" />
              </button>
              {isPaused ? (
                <button
                  onClick={resumeTutorial}
                  className="size-7 flex items-center justify-center rounded-full text-muted-foreground/50 hover:text-foreground hover:bg-accent/60 transition-all"
                  title={t('tutorial.resume')}
                >
                  <Play className="size-3.5" />
                </button>
              ) : (
                <button
                  onClick={pauseTutorial}
                  className="size-7 flex items-center justify-center rounded-full text-muted-foreground/50 hover:text-foreground hover:bg-accent/60 transition-all"
                  title={t('tutorial.pause')}
                >
                  <Pause className="size-3.5" />
                </button>
              )}
              <button
                onClick={skipTutorial}
                className="size-7 flex items-center justify-center rounded-full text-muted-foreground/50 hover:text-foreground hover:bg-accent/60 transition-all"
                title={t('tutorial.skip_tutorial')}
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`content-${currentStep.id}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.28, 0, 0.22, 1] }}
            >
              <h3 className="text-sm font-semibold text-foreground mb-1.5 leading-snug">
                {stepTitle}
              </h3>
              <p className="text-xs text-muted-foreground/90 leading-relaxed mb-3">
                {stepDescription}
              </p>

              {stepInstruction && (
                <div className={cn(
                  'rounded-xl px-3.5 py-2.5 mb-4 border transition-colors',
                  needsInteraction && !interactionDone
                    ? 'bg-primary/10 border-primary/25'
                    : 'bg-primary/8 border-primary/15'
                )}>
                  <div className="flex items-start gap-2">
                    {needsInteraction && !interactionDone ? (
                      <MousePointerClick className="size-3.5 text-primary shrink-0 mt-0.5 animate-bounce-subtle" />
                    ) : (
                      <HelpCircle className="size-3.5 text-primary shrink-0 mt-0.5" />
                    )}
                    <p className="text-[11px] text-foreground/80 leading-relaxed whitespace-pre-line">
                      {stepInstruction}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Interaction status */}
          {needsInteraction && (
            <motion.div
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-xl mb-3 text-[11px] font-medium transition-all',
                interactionDone
                  ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                  : 'bg-primary/8 text-primary border border-primary/15'
              )}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {interactionDone ? (
                <>
                  <CheckCircle2 className="size-3.5 shrink-0" />
                  <span>{t('tutorial.done_next')}</span>
                  <motion.div
                    className="ml-auto flex gap-0.5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="size-1 rounded-full bg-green-400"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </motion.div>
                </>
              ) : (
                <>
                  <MousePointerClick className="size-3.5 shrink-0 animate-bounce-subtle" />
                  <span>{t('tutorial.interact_continue')}</span>
                </>
              )}
            </motion.div>
          )}

          {/* Progress bar */}
          <div className="mb-3">
            <div className="h-1 bg-muted/60 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: `${((currentStepIndex) / totalSteps) * 100}%` }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: [0.28, 0, 0.22, 1] }}
              />
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {!isFirstStep && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={prevStep}
                  className="text-muted-foreground/70 hover:text-foreground"
                >
                  <ChevronLeft className="size-3.5 mr-1" />
                  {t('tutorial.back')}
                </Button>
              )}
              <Button
                variant="ghost"
                size="xs"
                onClick={skipTutorial}
                className="text-muted-foreground/50 hover:text-muted-foreground"
              >
                <SkipForward className="size-3 mr-1" />
                {t('tutorial.skip')}
              </Button>
            </div>

            <Button
              size="xs"
              onClick={nextStep}
              className={cn(
                'transition-all relative',
                !canProceed ? 'opacity-60 cursor-not-allowed' : 'opacity-100'
              )}
              disabled={!canProceed}
            >
              {needsInteraction && !interactionDone && (
                <span className="absolute -top-1 -right-1 size-2">
                  <span className="absolute inset-0 rounded-full bg-muted-foreground/30 animate-ping" />
                  <span className="absolute inset-0 rounded-full bg-muted-foreground/50" />
                </span>
              )}
              {isLastStep ? (
                <span className="flex items-center gap-1.5">
                  <Sparkles className="size-3" />
                  {t('tutorial.complete')}
                </span>
              ) : (
                <>
                  {t('tutorial.next')}
                  <ChevronRight className="size-3.5 ml-1" />
                </>
              )}
            </Button>
          </div>

          {/* Keyboard shortcuts */}
          <div className="mt-3 pt-2.5 border-t border-border/20 flex items-center justify-center gap-3">
            <kbd className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/80 text-[9px] text-muted-foreground/60 font-mono">
              <ChevronLeft className="size-2.5" />
            </kbd>
            <span className="text-[9px] text-muted-foreground/40">{t('tutorial.back')}</span>
            <kbd className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/80 text-[9px] text-muted-foreground/60 font-mono">
              <ChevronRight className="size-2.5" />
            </kbd>
            <span className="text-[9px] text-muted-foreground/40">{t('tutorial.next')}</span>
            <kbd className="inline-flex items-center px-1.5 py-0.5 rounded bg-muted/80 text-[9px] text-muted-foreground/60 font-mono">
              Esc
            </kbd>
            <span className="text-[9px] text-muted-foreground/40">{t('tutorial.skip')}</span>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>,
    document.body
  );
}
