// [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md §10] Phase 1 golden fixtures
export const seedValid = {
  work_id: "demo_50",
  title: "demo",
  genre: "wuxia",
  mood: "tragic",
  background: "A war-torn martial world.",
  pov: "third_observer",
  scale: "long",
  target_episodes: 50,
  episode_length: 2000,
};

// invalid: target_episodes must be positive int, pov out of enum
export const seedInvalid = {
  work_id: "bad",
  genre: "wuxia",
  mood: "tragic",
  background: "x",
  pov: "second_person",
  scale: "long",
  target_episodes: 0,
  episode_length: 2000,
};
