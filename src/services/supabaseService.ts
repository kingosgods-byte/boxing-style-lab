import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_dScnZfbCW_jPc9ZDZbhyWA_Scn62j8F';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

export interface WorkoutTelemetryPayload {
  fighterArchetype: string;
  durationSeconds: number;
  jabsCount: number;
  crossesCount: number;
  combosCount: number;
  avgVelocity: number;
  formScore: number;
  landmarksHistory?: any[];
}

export async function uploadWorkoutSession(
  videoBlob: Blob,
  telemetry: WorkoutTelemetryPayload
) {
  try {
    const fileName = `workout_${Date.now()}.webm`;
    const { error: storageError } = await supabase.storage
      .from('workout-videos')
      .upload(fileName, videoBlob, {
        contentType: 'video/webm',
        cacheControl: '3600'
      });

    if (storageError) throw storageError;

    const { data: urlData } = supabase.storage
      .from('workout-videos')
      .getPublicUrl(fileName);

    const videoUrl = urlData.publicUrl;

    const { data: dbData, error: dbError } = await supabase
      .from('workouts')
      .insert([
        {
          fighter_archetype: telemetry.fighterArchetype,
          duration_seconds: telemetry.durationSeconds,
          jabs_count: telemetry.jabsCount,
          crosses_count: telemetry.crossesCount,
          combos_count: telemetry.combosCount,
          avg_velocity: telemetry.avgVelocity,
          form_score: telemetry.formScore,
          video_url: videoUrl,
          telemetry_data: telemetry.landmarksHistory || []
        }
      ])
      .select();

    if (dbError) throw dbError;

    return { success: true, workoutRecord: dbData[0] };
  } catch (error) {
    console.error('Error syncing workout to cloud:', error);
    return { success: false, error };
  }
}
