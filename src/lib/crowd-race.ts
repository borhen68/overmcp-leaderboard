export const CROWD_RACE_DURATION_MS = 24 * 60 * 60 * 1000;

export function crowdRaceWindow(value = new Date()) {
  const startsAtMs = Date.UTC(
    value.getUTCFullYear(),
    value.getUTCMonth(),
    value.getUTCDate(),
  );
  const startsAt = new Date(startsAtMs);
  const endsAt = new Date(startsAtMs + CROWD_RACE_DURATION_MS);

  return {
    day: startsAt.toISOString().slice(0, 10),
    startsAt,
    endsAt,
  };
}
