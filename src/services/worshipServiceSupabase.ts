// ---------------------------------------------------------------------------
// Backward-compatibility barrel.
// All logic has been moved to focused service modules under worship/, family/,
// and social/ subdirectories. Pages importing from this file need no changes.
// ---------------------------------------------------------------------------

export * from "./worship/logsService";
export * from "./worship/pointsService";
export * from "./worship/badgesService";

// Family services
export * from "./family/familyService";
export * from "./family/memberService";

// Social services
export * from "./social/rewardService";
