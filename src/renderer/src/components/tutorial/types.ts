export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  instruction?: string;
  targetSelector?: string;
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  waitForInteraction?: boolean;
  autoAdvance?: boolean;
  autoAdvanceDelay?: number;
  media?: string;
}

export interface ScreenTutorial {
  id: string;
  screenPath: string;
  screenName: string;
  title: string;
  description: string;
  steps: TutorialStep[];
  estimatedDuration: number;
}

export interface TutorialProgress {
  tutorialId: string;
  completedSteps: number[];
  lastStepIndex: number;
  isCompleted: boolean;
  lastUpdated: number;
}

export interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
}

export interface TutorialContextType {
  isActive: boolean;
  isPaused: boolean;
  currentTutorial: ScreenTutorial | null;
  currentStepIndex: number;
  currentStep: TutorialStep | null;
  completedTutorials: Record<string, TutorialProgress>;
  availableTutorial: ScreenTutorial | null;
  startTutorial: (tutorialId?: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTutorial: () => void;
  pauseTutorial: () => void;
  resumeTutorial: () => void;
  restartTutorial: () => void;
  replayStep: (stepIndex: number) => void;
  isCompleted: boolean;
}
