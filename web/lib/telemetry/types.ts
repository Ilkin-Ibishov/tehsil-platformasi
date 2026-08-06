// docs/TELEMETRY.md — hadisə sxemi. Adlar dəyişməz taksonomiyadır (error_code kimi).
export type TelemetryEvent = {
  event_id: string;
  device_id: string;
  session_id: string;
  attempt_id?: string;
  name: string;
  ts_client: string;
  props: Record<string, unknown>;
  app_version: string;
  schema_version: number;
};
