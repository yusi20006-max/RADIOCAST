export type PodcastFormat = 'dual' | 'solo' | 'interview' | 'briefing';
export type PodcastTone = 'friendly' | 'serious' | 'energetic' | 'dramatic' | 'humorous';
export type PlaybackSpeed = 'slow' | 'normal' | 'fast' | 'veryFast';

export type BgmStyle = 'lofi' | 'ambient' | 'acoustic' | 'cinematic' | 'iranian-fusion' | 'none';
export type SfxType = 'intro' | 'transition' | 'ding' | 'laugh' | 'applause' | 'outro' | 'none';

export type AiProviderType = 'google' | 'external';

export interface ExternalProviderConfig {
  enabled: boolean;
  name: string; // 'OpenAI' | 'OpenRouter' | 'Groq' | 'Custom'
  baseUrl: string;
  apiKey: string;
  model: string;
  lastHealthCheck?: {
    healthy: boolean;
    timestamp: number;
    latencyMs?: number;
    message?: string;
  };
}

export type ParagraphTone =
  | 'auto'
  | 'curious'
  | 'excited'
  | 'reflective'
  | 'friendly'
  | 'serious'
  | 'humorous'
  | 'dramatic';

export interface DialogueTurn {
  id: string;
  speaker: 'host1' | 'host2' | 'narrator';
  speakerName: string;
  text: string;
  speechStyle?: string;
  turnTone?: ParagraphTone;
  sfxCue?: SfxType;
  audioBase64?: string;
  duration?: number; // estimated or exact seconds
}

export interface PodcastChapter {
  title: string;
  startTurnIndex: number;
}

export interface PodcastEpisode {
  id: string;
  createdAt: number;
  title: string;
  episodeSummary: string;
  genre: string;
  format: PodcastFormat;
  tone: PodcastTone;
  dynamicToneEnabled?: boolean;
  speed: PlaybackSpeed;
  host1Name: string;
  host2Name: string;
  host1Voice: string; // e.g. 'Puck', 'Fenrir'
  host2Voice: string; // e.g. 'Kore', 'Zephyr'
  suggestedBgm: BgmStyle;
  bgmVolume: number; // 0 to 1
  tags: string[];
  chapters: PodcastChapter[];
  script: DialogueTurn[];
  durationSeconds?: number;
  mp3BlobUrl?: string;
  coverArtUrl?: string;
  coverGradient?: string;
  episodeNumber?: number;
}

export interface PodcastChannelInfo {
  title: string;
  description: string;
  author: string;
  email: string;
  category: string;
  website: string;
  language: string;
  coverImageUrl?: string;
}

export interface BgmPreset {
  id: BgmStyle;
  nameFa: string;
  descriptionFa: string;
  icon: string;
  tempo: string;
}

export interface VoiceOption {
  id: string;
  nameFa: string;
  genderFa: string;
  descFa: string;
}
