import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { ScreenTutorial, TutorialStep, TutorialProgress, TutorialContextType } from '../components/tutorial/types';
import { getTutorialForPath, getTutorialById, getAllTutorials } from '../components/tutorial/tutorial-data';

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export const TutorialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTutorial, setCurrentTutorial] = useState<ScreenTutorial | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedTutorials, setCompletedTutorials] = useState<Record<string, TutorialProgress>>({});
  const [availableTutorial, setAvailableTutorial] = useState<ScreenTutorial | null>(null);
  const loadedRef = useRef(false);
  const currentStepIndexRef = useRef(0);
  const currentTutorialRef = useRef<ScreenTutorial | null>(null);

  useEffect(() => {
    currentStepIndexRef.current = currentStepIndex;
  }, [currentStepIndex]);

  useEffect(() => {
    currentTutorialRef.current = currentTutorial;
  }, [currentTutorial]);

  useEffect(() => {
    const loadProgress = async () => {
      try {
        const saved = await window.api.getSetting('tutorial_progress');
        if (saved && typeof saved === 'object') {
          setCompletedTutorials(saved);
        }
      } catch (err) {
        console.error('Failed to load tutorial progress:', err);
      }
      loadedRef.current = true;
    };
    loadProgress();
  }, []);

  const saveProgress = useCallback(async (progress: Record<string, TutorialProgress>) => {
    try {
      await window.api.setSetting('tutorial_progress', progress);
    } catch (err) {
      console.error('Failed to save tutorial progress:', err);
    }
  }, []);

  const updateProgress = useCallback((tutorialId: string, stepIndex: number, completed: boolean, completedStepIndex?: number) => {
    setCompletedTutorials(prev => {
      const existing = prev[tutorialId];
      const existingCompleted = existing?.completedSteps || [];
      const updatedSteps = completedStepIndex !== undefined && !existingCompleted.includes(completedStepIndex)
        ? [...existingCompleted, completedStepIndex]
        : existingCompleted;

      const updated = {
        ...prev,
        [tutorialId]: {
          tutorialId,
          lastStepIndex: stepIndex,
          completedSteps: updatedSteps,
          isCompleted: completed,
          lastUpdated: Date.now(),
        } as TutorialProgress,
      };
      saveProgress(updated);
      return updated;
    });
  }, [saveProgress]);

  useEffect(() => {
    const tutorial = getTutorialForPath(location.pathname);
    setAvailableTutorial(tutorial || null);
  }, [location.pathname]);

  const startTutorial = useCallback((tutorialId?: string) => {
    const tutorial = tutorialId
      ? getTutorialById(tutorialId) || getTutorialForPath(location.pathname)
      : getTutorialForPath(location.pathname);

    if (!tutorial) return;

    setCompletedTutorials(prev => {
      const progress = prev[tutorial.id];
      const startIndex = progress && !progress.isCompleted ? progress.lastStepIndex : 0;

      setCurrentTutorial(tutorial);
      currentTutorialRef.current = tutorial;
      setCurrentStepIndex(startIndex);
      currentStepIndexRef.current = startIndex;
      setIsActive(true);
      setIsPaused(false);
      return prev;
    });
  }, [location.pathname]);

  const nextStep = useCallback(() => {
    const tutorial = currentTutorialRef.current;
    const stepIndex = currentStepIndexRef.current;
    if (!tutorial) return;

    const nextIndex = stepIndex + 1;
    if (nextIndex >= tutorial.steps.length) {
      updateProgress(tutorial.id, stepIndex, true);
      setIsActive(false);
      setCurrentTutorial(null);
      currentTutorialRef.current = null;
      setCurrentStepIndex(0);
      currentStepIndexRef.current = 0;
      return;
    }

    setCurrentStepIndex(nextIndex);
    currentStepIndexRef.current = nextIndex;
    updateProgress(tutorial.id, nextIndex, false, stepIndex);
  }, [updateProgress]);

  const prevStep = useCallback(() => {
    if (currentStepIndexRef.current > 0) {
      const prev = currentStepIndexRef.current - 1;
      setCurrentStepIndex(prev);
      currentStepIndexRef.current = prev;
    }
  }, []);

  const skipTutorial = useCallback(() => {
    const tutorial = currentTutorialRef.current;
    if (tutorial) {
      updateProgress(tutorial.id, currentStepIndexRef.current, true);
    }
    setIsActive(false);
    setCurrentTutorial(null);
    currentTutorialRef.current = null;
    setCurrentStepIndex(0);
    currentStepIndexRef.current = 0;
  }, [updateProgress]);

  const pauseTutorial = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resumeTutorial = useCallback(() => {
    setIsPaused(false);
  }, []);

  const restartTutorial = useCallback(() => {
    const tutorial = currentTutorialRef.current;
    if (tutorial) {
      setCurrentStepIndex(0);
      currentStepIndexRef.current = 0;
      updateProgress(tutorial.id, 0, false);
    }
  }, [updateProgress]);

  const replayStep = useCallback((stepIndex: number) => {
    const tutorial = currentTutorialRef.current;
    if (tutorial && stepIndex >= 0 && stepIndex < tutorial.steps.length) {
      setCurrentStepIndex(stepIndex);
      currentStepIndexRef.current = stepIndex;
    }
  }, []);

  const value: TutorialContextType = {
    isActive,
    isPaused,
    currentTutorial,
    currentStepIndex,
    currentStep: currentTutorial?.steps[currentStepIndex] || null,
    completedTutorials,
    availableTutorial,
    startTutorial,
    nextStep,
    prevStep,
    skipTutorial,
    pauseTutorial,
    resumeTutorial,
    restartTutorial,
    replayStep,
    isCompleted: currentTutorial ? completedTutorials[currentTutorial.id]?.isCompleted || false : false,
  };

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
};

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
};
