import {
  DiagnosticReport,
} from "./diagnosticReport";

export type DiagnosisConfidence =
  | "low"
  | "medium"
  | "high";

export type RepairRisk =
  | "low"
  | "medium"
  | "high"
  | "critical";

export interface DiagnosticDiagnosis {
  problem: string;

  category:
    | "camera"
    | "model"
    | "media"
    | "network"
    | "runtime"
    | "deployment"
    | "unknown";

  likelyCause: string;

  evidence: string[];

  confidence: DiagnosisConfidence;

  recommendedFixes: string[];

  repairRisk: RepairRisk;

  requiresHumanApproval: boolean;
}

export interface RepairProposal {
  diagnosis: DiagnosticDiagnosis;

  filesToInspect: string[];

  filesToModify: string[];

  changes: string[];

  testsToRun: string[];

  expectedResult: string;

  rollbackPlan: string;
}

export interface AIRepairRequest {
  requestId: string;

  createdAt: string;

  report: DiagnosticReport;

  instructions: {
    doNotModifyProductionDirectly: true;

    requireValidationBeforeDeployment: true;

    requireHumanApprovalForHighRiskChanges: true;
  };
}

export function createAIRepairRequest(
  report: DiagnosticReport
): AIRepairRequest {
  return {
    requestId:
      `repair_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 10)}`,

    createdAt:
      new Date().toISOString(),

    report,

    instructions: {
      doNotModifyProductionDirectly: true,

      requireValidationBeforeDeployment:
        true,

      requireHumanApprovalForHighRiskChanges:
        true,
    },
  };
}

export function validateRepairProposal(
  proposal: RepairProposal
): {
  valid: boolean;
  problems: string[];
} {
  const problems: string[] = [];

  if (!proposal.diagnosis.problem.trim()) {
    problems.push(
      "Diagnosis does not describe a problem."
    );
  }

  if (
    !proposal.diagnosis.likelyCause.trim()
  ) {
    problems.push(
      "Diagnosis does not identify a likely cause."
    );
  }

  if (
    proposal.filesToModify.length === 0
  ) {
    problems.push(
      "Repair proposal does not identify files to modify."
    );
  }

  if (
    proposal.testsToRun.length === 0
  ) {
    problems.push(
      "Repair proposal does not specify validation tests."
    );
  }

  if (
    !proposal.expectedResult.trim()
  ) {
    problems.push(
      "Repair proposal does not define an expected result."
    );
  }

  if (
    !proposal.rollbackPlan.trim()
  ) {
    problems.push(
      "Repair proposal does not define a rollback plan."
    );
  }

  if (
    proposal.repairRisk === "high" ||
    proposal.repairRisk === "critical"
  ) {
    if (
      !proposal.diagnosis
        .requiresHumanApproval
    ) {
      problems.push(
        "High-risk repairs require human approval."
      );
    }
  }

  return {
    valid: problems.length === 0,
    problems,
  };
}
