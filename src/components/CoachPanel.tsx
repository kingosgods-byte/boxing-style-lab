import { Lightbulb } from "lucide-react";
import { StyleProfile } from "../types";

type CoachPanelProps = {
  style: StyleProfile;
  message: string;
};

export default function CoachPanel({
  style,
  message,
}: CoachPanelProps) {
  return (
    <section className="coach-panel">
      <div className="coach-header">
        <div className="coach-icon">
          <Lightbulb size={18} />
        </div>

        <div>
          <div className="eyebrow">
            COACHING ENGINE
          </div>

          <h2>{style.name}</h2>
        </div>
      </div>

      <div className="coach-message">
        <span className="coach-quote">“</span>

        <p>{message}</p>

        <span className="coach-quote closing">
          ”
        </span>
      </div>

      <div className="coach-priorities">
        <div className="coach-priorities-title">
          CURRENT PRIORITIES
        </div>

        <div className="coach-grid">
          {style.priorities.map((priority) => (
            <span key={priority}>
              {priority}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
