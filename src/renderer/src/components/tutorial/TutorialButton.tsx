import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Play, CheckCircle2 } from 'lucide-react';
import { useTutorial } from '../../context/TutorialContext';
import { Button } from '../ui/button';

export default function TutorialButton() {
  const {
    availableTutorial,
    isActive,
    startTutorial,
    currentTutorial,
    completedTutorials,
  } = useTutorial();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isActive) {
      setIsOpen(false);
    }
  }, [isActive]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  if (!availableTutorial) return null;

  const tutorialId = availableTutorial.id;
  const progress = completedTutorials[tutorialId];
  const isCompleted = progress?.isCompleted || false;
  const hasProgress = progress && !progress.isCompleted && progress.lastStepIndex > 0;

  return (
    <div ref={dropdownRef} className="relative">
      <Button
        variant="ghost"
        size="xs"
        onClick={() => {
          if (isActive) {
            setIsOpen(!isOpen);
          } else if (hasProgress) {
            setIsOpen(!isOpen);
          } else {
            startTutorial(tutorialId);
          }
        }}
        className="gap-1.5 rounded-full text-muted-foreground/70 hover:text-foreground hover:bg-accent/50 text-[11px] font-medium"
      >
        <GraduationCap className="size-3.5" />
        How to Use
        {(isCompleted || hasProgress) && (
          <span className="size-1.5 rounded-full bg-primary animate-pulse-soft" />
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.28, 0, 0.22, 1] }}
            className="absolute right-0 top-full mt-1.5 w-56 apple-panel shadow-2xl overflow-hidden z-50"
          >
            <div className="p-1.5">
              {hasProgress && (
                <button
                  onClick={() => {
                    startTutorial(tutorialId);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-left text-foreground hover:bg-accent/60 transition-all"
                >
                  <Play className="size-3.5 text-primary" />
                  <div>
                    <span className="font-medium">Resume Tutorial</span>
                    <span className="block text-[10px] text-muted-foreground/70">
                      Step {progress.lastStepIndex + 1}
                    </span>
                  </div>
                </button>
              )}

              {isCompleted && (
                <div className="flex items-center gap-2.5 px-3 py-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="size-3.5 text-green-500" />
                  <span>Tutorial completed</span>
                </div>
              )}

              <button
                onClick={() => {
                  setIsOpen(false);
                  startTutorial(tutorialId);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-left text-foreground hover:bg-accent/60 transition-all"
              >
                <Play className="size-3.5 text-primary" />
                {isCompleted ? 'Replay Tutorial' : 'Start from Beginning'}
              </button>

              {availableTutorial && (
                <div className="px-3 py-2 border-t border-border/30 mt-1">
                  <p className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-wider">
                    {availableTutorial.title}
                  </p>
                  <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                    {availableTutorial.steps.length} steps · ~{availableTutorial.estimatedDuration} min
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
