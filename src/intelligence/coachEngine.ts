import { BiomechanicsMetrics } from "../biomechanics/metrics";
import { PunchResult } from "../boxing/punchEngine";

export class CoachEngine {
  analyzePunch(
    punch: PunchResult,
    metrics: BiomechanicsMetrics
  ): string {
    if (punch.confidence < 0.35) {
      return "Movement detected, but confidence is still too low for a strong coaching call.";
    }

    if (metrics.balanceScore < 0.45) {
      return "Coach: your punch is developing, but your balance is breaking down. Keep your base underneath you.";
    }

    if (metrics.postureScore < 0.45) {
      return "Coach: stay connected through your torso. Avoid letting your upper body collapse during the punch.";
    }

    if (punch.extension > 2.2) {
      return "Coach: good extension, but avoid reaching. Let the punch travel from your stance rather than chasing the target.";
    }

    switch (punch.type) {
      case "jab":
        return "Jab detected. Keep the lead shoulder relaxed and return the hand efficiently to guard.";

      case "cross":
        return "Cross detected. Keep the rear side connected through the floor, hip, torso, and shoulder.";

      case "hook":
        return "Hook detected. Keep the rotation compact and avoid swinging the arm independently of the body.";

      case "uppercut":
        return "Uppercut detected. Drive from the legs and hips rather than lifting only with the arm.";

      default:
        return "Movement detected. Maintain your stance and stay ready for the next action.";
    }
  }
}
