import {
  TechniqueObservation,
} from "./learning";

import {
  submitTechniqueFeedback,
  TechniqueFeedback,
} from "./feedback";

import {
  getActiveModel,
} from "./modelRegistry";

export interface AnalysisSession {
  id: string;

  startedAt: string;

  endedAt?: string;

  modelVersion: string;

  observations: TechniqueObservation[];

  feedback: TechniqueFeedback[];
}

let currentSession:
  | AnalysisSession
  | null = null;

function createId(): string {
  return (
    `session_${Date.now()}_` +
    Math.random()
      .toString(36)
      .slice(2, 10)
  );
}

export function startAnalysisSession():
  AnalysisSession {
  const model =
    getActiveModel();

  currentSession = {
    id: createId(),

    startedAt:
      new Date().toISOString(),

    modelVersion:
      model.version,

    observations: [],

    feedback: [],
  };

  return getCurrentAnalysisSession()!;
}

export function getCurrentAnalysisSession():
  AnalysisSession | null {
  if (!currentSession) {
    return null;
  }

  return {
    ...currentSession,

    observations:
      currentSession.observations.map(
        (observation) => ({
          ...observation,

          metrics: {
            ...observation.metrics,
          },
        })
      ),

    feedback:
      [...currentSession.feedback],
  };
}

export function addObservation(
  observation: TechniqueObservation
): void {
  if (!currentSession) {
    throw new Error(
      "No active analysis session."
    );
  }

  currentSession.observations.push({
    ...observation,

    metrics: {
      ...observation.metrics,
    },
  });
}

export function submitSessionFeedback(
  input: {
    observation: TechniqueObservation;

    outcome:
      | "correct"
      | "incorrect"
      | "partially_correct"
      | "unknown";

    correction?: string;

    feedback?: string;
  }
): TechniqueFeedback {
  if (!currentSession) {
    throw new Error(
      "No active analysis session."
    );
  }

  const record =
    submitTechniqueFeedback({
      modelVersion:
        currentSession.modelVersion,

      observation:
        input.observation,

      outcome:
        input.outcome,

      correction:
        input.correction,

      feedback:
        input.feedback,

      submittedBy: "user",
    });

  currentSession.feedback.push(
    record
  );

  return record;
}

export function endAnalysisSession():
  AnalysisSession | null {
  if (!currentSession) {
    return null;
  }

  currentSession.endedAt =
    new Date().toISOString();

  const completed =
    getCurrentAnalysisSession();

  currentSession = null;

  return completed;
}

export function discardAnalysisSession():
  void {
  currentSession = null;
}
