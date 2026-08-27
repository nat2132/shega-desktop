import React, { useState, useEffect, useCallback, useRef, useId } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ChevronLeft, ChevronRight, SkipForward, RotateCcw, Pause, Play,
  HelpCircle, Sparkles,
} from 'lucide-react';
import { useTutorial } from '../../context/TutorialContext';
import { TargetRect } from './types';
import { Button } from '../ui/button';
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
  const [isFormField, setIsFormField] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const pulseRef = useRef<HTMLDivElement>(null);
  const maskId = useId();

  const spotlightPad = isFormField ? FORM_SPOTLIGHT_PAD : SPOTLIGHT_PAD;
  const spotlightOpacity = isFormField ? FORM_SPOTLIGHT_OPACITY : SPOTLIGHT_OPACITY;

  const updateTargetRect = useCallback(() => {
    if (!currentStep?.targetSelector) {
      setTargetRect(null);
      setIsFormField(false);
      return;
    }

    const el = document.querySelector(currentStep.targetSelector);
    if (el) {
      const rect = el.getBoundingClientRect();
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
      setIsFormField(false);
    }
  }, [currentStep?.targetSelector]);

  const throttledUpdate = useCallback(
    throttle(updateTargetRect, 100),
    [updateTargetRect]
  );

  useEffect(() => {
    updateTargetRect();

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
          nextStep();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (currentStepIndex > 0) prevStep();
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isActive, skipTutorial, nextStep, prevStep, currentStepIndex, currentStep]);

  if (!isActive || !currentTutorial || !currentStep) return null;

  const totalSteps = currentTutorial.steps.length;
  const progress = ((currentStepIndex + 1) / totalSteps) * 100;
  const isLastStep = currentStepIndex === totalSteps - 1;
  const isFirstStep = currentStepIndex === 0;

  // Resolve translatable fields from the current step using auto-generated keys
  const stepTitle = t(`tut.${currentStep.id}.title`, currentStep.title || '');
  const stepDescription = t(`tut.${currentStep.id}.desc`, currentStep.description || '');
  const stepInstruction = currentStep.instruction
    ? t(`tut.${currentStep.id}.instruction`, currentStep.instruction)
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
            className="tutorial-pulse-ring"
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
          className="tutorial-highlight-glow"
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
        </motion.div>
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
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-bold transition-colors bg-primary/20 text-primary">
                {currentStepIndex + 1}
              </span>
              <span className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
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
                <div className="rounded-xl px-3.5 py-2.5 mb-4 border transition-colors bg-primary/8 border-primary/15">
                  <div className="flex items-start gap-2">
                    <HelpCircle className="size-3.5 text-primary shrink-0 mt-0.5" />
                    <p className="text-[11px] text-foreground/80 leading-relaxed whitespace-pre-line">
                      {stepInstruction}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

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
              className="transition-all relative"
            >
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
            <kbd className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/80 text-xs text-muted-foreground/60 font-mono">
              <ChevronLeft className="size-2.5" />
            </kbd>
            <span className="text-xs text-muted-foreground/40">{t('tutorial.back')}</span>
            <kbd className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/80 text-xs text-muted-foreground/60 font-mono">
              <ChevronRight className="size-2.5" />
            </kbd>
            <span className="text-xs text-muted-foreground/40">{t('tutorial.next')}</span>
            <kbd className="inline-flex items-center px-1.5 py-0.5 rounded bg-muted/80 text-xs text-muted-foreground/60 font-mono">
              Esc
            </kbd>
            <span className="text-xs text-muted-foreground/40">{t('tutorial.skip')}</span>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>,
    document.body
  );
}
