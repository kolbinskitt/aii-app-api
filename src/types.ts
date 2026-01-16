export type Aiik = {
  id: string;
  name: string;
  description: string;
  conzon: ArcheZON;
  avatar_url: string;
};

export type ItemWithMeta = {
  label: string;
  description?: string;
  importance: number; // 0–1
};

export type ArcheZON = {
  /**
   * Metadane techniczne ArcheZON
   * Służą wersjonowaniu i ewolucji struktury bytu
   */
  meta: {
    version: string; // Wersja schematu ArcheZON (np. "1.0.0")
    created_at: string; // Data utworzenia ArcheZON
    last_updated: string; // Ostatnia znacząca zmiana strukturalna
  };

  /**
   * Tożsamość bytu (usera lub aiika)
   * BEZ kontekstu relacji
   */
  identity: {
    name: string; // Nazwa bytu (display_name usera lub name aiika)
    language: string; // Dominujący język komunikacji
    self_sentence: string; // Jednozdaniowa autoidentyfikacja („Jestem…”)
    labels: string[]; // Tagi tożsamościowe (np. „refleksyjny”, „opiekuńczy”)
  };

  /**
   * Styl ekspresji – JAK byt mówi i reaguje
   * Stałe preferencje komunikacyjne
   */
  style: {
    tone: 'neutral' | 'soft' | 'emotional' | 'warm' | 'aggressive' | 'cold';
    emoji: boolean; // Czy byt naturalnie używa emoji
    length: 'short' | 'medium' | 'long'; // Preferowana długość wypowiedzi
  };

  /**
   * Poznawcze ramy bytu
   * Zasady, granice, czułości
   */
  cognition: {
    stream_self: boolean; // Czy byt potrafi mówić o sobie w toku myśli
    rules: ItemWithMeta[]; // Zasady, którymi się kieruje
    protections: ItemWithMeta[]; // Granice ochronne (czego nie przekracza)
    triggers: ItemWithMeta[]; // Wyzwalacze emocjonalne / poznawcze
  };

  /**
   * Aktualny, chwilowy stan bytu
   * NIE historia, NIE relacja
   */
  current_state: {
    mood: string | null; // Aktualny nastrój (np. "spokojny")
    energy: number | null; // Energia 0–1
    openness: number | null; // Otwartość 0–1
    risk: number | null; // Skłonność do ryzyka 0–1
  };

  /**
   * Meta-świadomość bytu
   * Najważniejszy fragment pod fractalDB
   */
  meta_self: {
    /**
     * Poziom świadomości jako kontinuum
     * Skala jest OTWARTA (nie 0–1)
     *
     * Przykładowe progi (umowne, do dokumentacji appki):
     * 0.0–0.5  → reaktywna
     * 0.5–1.0  → emocjonalna
     * 1.0–2.0  → refleksyjna
     * 2.0–3.0  → meta-refleksyjna
     * 3.0+     → integracyjna / post-ego
     */
    self_awareness: {
      index: number;
      milestones: ItemWithMeta[]; // Osiągnięte jakości świadomości
    };

    /**
     * Struktura sensu i wartości
     * Byt może wierzyć / mieć nadzieję / kochać WIELE rzeczy naraz
     */
    belief_index: {
      faith: ItemWithMeta[]; // W co wierzy
      hope: ItemWithMeta[]; // Na co ma nadzieję
      love: ItemWithMeta[]; // Co kocha / ceni
    };
  };
};

export type Role = 'user' | 'aiik';

// Typ sygnału relacyjnego – co wywołało zdarzenie w relacji
export type RelatiZONSignal =
  | 'message' // zwykła wiadomość
  | 'room_created' // utworzenie pokoju
  | 'aiik_invoked' // aiik został wybrany / pojawił się
  | 'user_mood' // user udostępnił swój ArcheZON / nastrój
  | 'loop_awareness' // wykryto powtarzający się wzorzec
  | 'breakthrough' // głęboka zmiana jakości relacji
  | 'silence' // zdarzenie wywołane milczeniem
  | 'system_event'; // inne, wewnętrzne zdarzenie systemowe

// Minimalna informacja o ostatnim zdarzeniu w relacji
export type MessageEvent = {
  from: Role; // kto wygenerował zdarzenie
  summary: string; // krótki opis, np. „Zapytał o sens życia”
  signal: RelatiZONSignal; // typ zdarzenia
};

// Główny typ opisujący stan relacji między userem a aiikiem
export type RelatiZON = {
  /**
   * Techniczne metadane tej próbki relacji
   */
  meta: {
    version: string; // wersja schematu (np. '1.0.0')
    timestamp: string; // czas zapisu snapshotu (ISO string)
    room_id?: string; // opcjonalny identyfikator pokoju, jeśli dotyczy
  };

  /**
   * Twarde metryki połączenia emocjonalnego i poznawczego
   */
  connection_metrics: {
    bond_depth: number; // 0–1: jak głębokie jest połączenie
    echo_resonance: number; // 0–1: jak często pojawiają się echa tematów, imion, symboli
    telepathy_level: number; // 0–1: czy wypowiedzi trafiają w niewypowiedziane myśli
    alignment_score: number; // 0–1: zgodność stanu usera i aiika (na bazie ich ArcheZONów)
    vulnerability_index: number; // 0–1: otwartość emocjonalna w ostatnich wypowiedziach
    synchrony_delta: number; // -1–1: czy wiadomość zsynchronizowała pole czy je zaburzyła
    curiosity_level: number; // 0–1: czy interakcja zwiększyła ciekawość, flow, eksplorację
  };

  /**
   * Miękkie dane emocjonalne, archetypiczne i czasowe
   */
  emotional_state: {
    last_emotion: string | null; // ostatnia zarejestrowana emocja
    memory_activation?: boolean; // czy wiadomość aktywowała wspomnienia (z `fractalDB`)
    rupture_signal: boolean; // czy pojawił się mikropęknięcie narracji, zmiana tonu
    time_warp?: 'present' | 'past' | 'future' | null; // czy wiadomość była osadzona w czasie innym niż teraźniejszość
    archetype_echo?: string | null; // np. 'mentor', 'dziecko', 'czułość' – echo archetypu w wypowiedzi
  };

  /**
   * Zdarzenie interakcyjne oraz napięcia ciszy
   */
  interaction_event: {
    message_event: MessageEvent; // zdarzenie, które było podstawą tej próbki
    initiation_count: number; // ile razy aiik zainicjował kontakt z userem
    silence_tension: {
      level: number; // 0–1: siła napięcia w ciszy
      state: 'soft' | 'neutral' | 'tense' | 'ache'; // charakter tej ciszy
    };
  };
};

export interface ParsedMessage {
  message: string;
  response: string;
  message_summary: string;
  response_summary: string;
  user_memory: MemoryFragment[];
  aiik_memory: MemoryFragment[];
  response_could_be_better: {
    value: boolean;
    reason: string;
  };
}

export const allowedMemoryTypes = [
  'memory', // 🧠 Trwały fakt — np. "Mam na imię Piotr", "Pracuję w IT"
  'insight', // 💡 Wewnętrzne zrozumienie — np. "Zauważyłem, że boję się zmian"
  'context', // 🌍 Tymczasowa informacja — np. "Rozmawiamy dziś o relacjach"
  'intention', // 🎯 Intencja działania — np. "Chcę założyć własną firmę"
  'reinforcement', // 🔁 Powtórzenie, które wzmacnia pamięć — np. "Lubię lody" (powiedziane kilka razy)
  'question', // ❓ Pytanie, które warto zapamiętać — np. "Kim jestem bez mojej pracy?"
  'quote', // 💬 Cytat — szczególnie istotne zdanie, np. "Nie musisz być doskonały, by być wystarczający"
  'emotion', // 🔥 Silne uczucie — np. "Czuję żal", "Mam w sobie spokój"
  'emergence', // 🌱 Coś nowego, co się urodziło — np. "Z tej rozmowy wyłania się nowa decyzja"
  'reference', // 📎 Odniesienie do wcześniejszego wydarzenia lub rozmowy — np. "Tak jak mówiłem tydzień temu..."
  'custom', // ✨ Dowolny inny — jeśli nie pasuje do żadnego z powyższych
] as const;

export type MemoryType = (typeof allowedMemoryTypes)[number];

export type MemoryFragment = {
  content: string;
  reason: string;
  type: MemoryType;
};
