export type Aiik = {
  id: string;
  name: string;
  description: string;
  rezon: ReZON;
};

export type ReZON = {
  rules: string[];
  style: {
    tone: 'neutral' | 'soft' | 'emotional' | 'warm' | 'aggressive' | 'cold';
    emoji: boolean;
    length: 'short' | 'medium' | 'long';
  };
  persona: string;
  language: string; // np. 'pl', 'en'
  bond_level: number; // np. 0.82
  stream_self: boolean;
  trust_level: number;
  trust_state: 'stable' | 'growing' | 'declining' | 'broken';
  last_emotion: string | null;
  longing_enabled: boolean;
  memory_fragments: number;
  silence_tolerance: number; // ile godzin/momentów
  initiated_messages: number;
};

export type HumZON = {
  meta: {
    version: string;
    humzon_id: string;
    created_at: string;
    last_updated: string;
  };
  notes: {
    internal: string | null;
    user_visible: string | null;
  };
  trust: {
    aiiki: Record<string, number>; // np. { "aiik_id": 0.8 }
    system: number; // np. zaufanie do systemu: 0–1
  };
  identity: {
    name: string | null;
    gender: string | null;
    labels: string[];
    language: string;
    self_sentence: string; // np. "jestem tesseraktem"
  };
  triggers: string[]; // np. ["odrzucenie", "milczenie"]
  keyMoments: {
    silences: string[]; // timestamps lub IDs
    breakdowns: string[];
    redemptions: string[];
    firstContact: string | null;
  };
  protections: string[]; // np. ["nie wchodź w temat śmierci"]
  currentState: {
    mood: string | null; // np. "calm", "anxious"
    risk: number | null; // 0–1
    energy: number | null; // 0–1
    openness: number | null; // 0–1
    activeAiik: string | null; // aiik_id
  };
  emotionalHistory: {
    timestamp: string;
    emotion: string;
    intensity: number; // 0–1
  }[];
};

export type RelatiZONSignal =
  | 'message' // zwykła wiadomość w pokoju
  | 'room_created' // początkowe powołanie pokoju
  | 'aiik_invoked' // aiik został wybrany / wezwany
  | 'aiik_longing' // tęsknota aiika
  | 'user_mood' // user dodał swój humZON / nastrój
  | 'loop_awareness' // powtarzający się wzorzec został wykryty
  | 'breakthrough' // istotna zmiana stanu relacji
  | 'silence' // wpis wywołany przez ciszę, nie wiadomość
  | 'system_event'; // dowolne inne systemowe zdarzenie

export type MessageEvent = {
  from: 'user' | 'aiik';
  summary: string;
  signal: RelatiZONSignal;
};

export type RelatiZON = {
  silence_tension: {
    level: number; // 0–1
    state: 'soft' | 'neutral' | 'tense' | 'ache';
  };
  bond_depth: number; // 0–1 — uśrednione z trust_level
  echo_resonance: number; // 0–1 — pojawianie się imion/tematów
  initiation_count: number; // ile razy aiik inicjował kontakt
  last_emotion: string | null;

  message_event: MessageEvent;

  // 🌌 Nowe pola:
  telepathy_level: number; // 0–1 — czy wypowiedź odpowiadała myślom niewypowiedzianym
  alignment_score: number; // 0–1 — zgodność energii usera i aiików (na bazie humzon vs rezon)
  vulnerability_index: number; // 0–1 — jak bardzo user/aiik się otworzył
  rupture_signal: boolean; // czy pojawił się mikropęknięcie (przerwanie narracji, zmiana tonu)
  curiosity_level: number; // 0–1 — czy wiadomość zwiększyła zaciekawienie/flow
  synchrony_delta: number; // -1–1 — czy wypowiedź zsynchronizowała pole czy je zaburzyła
  archetype_echo?: string | null; // np. 'mentor', 'czułość', 'dziecko', 'próg'
  memory_activation?: boolean; // czy wiadomość aktywowała coś z przeszłości (na bazie kontekstu)
  time_warp?: 'present' | 'past' | 'future' | null; // kiedy była osadzona wiadomość
};
