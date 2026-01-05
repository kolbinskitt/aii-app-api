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
    level: number;
    state: string;
  };
  bond_depth: number;
  echo_resonance: number;
  initiation_count: number;
  last_emotion: string | null;
  message_event: MessageEvent;
};
