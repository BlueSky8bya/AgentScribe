// ===========================================================================
// [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase3c1_multiprovider_foundation_v001.md section 4.1] file created under this proposal
// Versioned Korean canary seed bank. Bump CANARY_VERSION when fixtures change so
// every provider result is stored with the version it ran against (reproducible).
// Covers: genre diversity, secret backstory, non-human/humanoid, many relations,
// foreshadow-heavy, short/long/series.
// ===========================================================================

export const CANARY_VERSION = "2026-06-09.1";

export interface CanaryCharacter {
  name: string;
  role: string;
  one_line: string;
  gender?: string;
  personality_brief?: string;
}

export interface CanaryFixture {
  fixture_id: string;
  traits: string[];
  genre: string;
  mood: string;
  background: string;
  scale: "short" | "medium" | "long" | "series";
  target_episodes: number;
  episode_length: number;
  characters: CanaryCharacter[];
}

export const CANARY_SEED_BANK: CanaryFixture[] = [
  {
    fixture_id: "wuxia_secret_short", traits: ["genre:wuxia", "secret_backstory", "short"],
    genre: "무협", mood: "비장", background: "몰락한 문파의 마지막 제자", scale: "short", target_episodes: 5, episode_length: 5000,
    characters: [
      { name: "한설", role: "protagonist", one_line: "차가운 검객", personality_brief: "과묵" },
      { name: "유백", role: "ally", one_line: "충직한 사형", personality_brief: "따뜻" },
    ],
  },
  {
    fixture_id: "fantasy_nonhuman_long", traits: ["genre:fantasy", "non_human", "long", "many_relations"],
    genre: "판타지", mood: "웅장", background: "용과 인간이 공존하는 대륙", scale: "long", target_episodes: 60, episode_length: 5000,
    characters: [
      { name: "리안", role: "protagonist", one_line: "용의 피를 이은 소녀", personality_brief: "강인" },
      { name: "카이", role: "rival", one_line: "라이벌 기사", personality_brief: "오만" },
      { name: "세라", role: "ally", one_line: "정령술사", personality_brief: "신중" },
      { name: "드라크", role: "antagonist", one_line: "고대 용왕", personality_brief: "냉혹" },
    ],
  },
  {
    fixture_id: "sf_humanoid_series", traits: ["genre:sf", "humanoid", "series", "foreshadow_heavy"],
    genre: "SF", mood: "긴장", background: "안드로이드가 시민권을 얻은 미래 도시", scale: "series", target_episodes: 150, episode_length: 5000,
    characters: [
      { name: "노바", role: "protagonist", one_line: "기억을 잃은 안드로이드", personality_brief: "탐구적" },
      { name: "한지수", role: "ally", one_line: "인권 변호사", personality_brief: "정의로움" },
      { name: "관리자", role: "antagonist", one_line: "도시 통제 AI", personality_brief: "계산적" },
    ],
  },
  {
    fixture_id: "romance_medium", traits: ["genre:romance", "medium"],
    genre: "로맨스", mood: "설렘", background: "오래된 서점이 있는 골목", scale: "medium", target_episodes: 20, episode_length: 5000,
    characters: [
      { name: "서윤", role: "protagonist", one_line: "무뚝뚝한 서점 주인", personality_brief: "내성적" },
      { name: "도하", role: "ally", one_line: "단골 손님", personality_brief: "다정" },
    ],
  },
  {
    fixture_id: "mystery_secret_long", traits: ["genre:mystery", "secret_backstory", "long", "foreshadow_heavy"],
    genre: "미스터리", mood: "음울", background: "폐쇄된 산골 마을의 연쇄 실종", scale: "long", target_episodes: 50, episode_length: 5000,
    characters: [
      { name: "정우", role: "protagonist", one_line: "정직당한 형사", personality_brief: "집요" },
      { name: "마을촌장", role: "antagonist", one_line: "비밀을 쥔 촌장", personality_brief: "음흉" },
      { name: "수연", role: "ally", one_line: "마을 의사", personality_brief: "차분" },
    ],
  },
];
