/** Shared domain types for the YebAI production workflow. */

export type ProjectStatus = "draft" | "in_progress" | "completed";
export type AssetKind = "character" | "scene" | "prop" | "costume";
export type GenerationStatus = "queued" | "running" | "succeeded" | "failed";

export interface Project {
  id: string;
  title: string;
  sourceNovel?: string;
  synopsis?: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Character {
  id: string;
  projectId: string;
  name: string;
  role: "protagonist" | "supporting" | "antagonist";
  description: string;
  visualPrompt?: string;
  referenceImageUrl?: string;
}

export interface ProductionAsset {
  id: string;
  projectId: string;
  kind: AssetKind;
  name: string;
  description: string;
  prompt?: string;
  imageUrl?: string;
}

export interface ScriptEpisode {
  id: string;
  projectId: string;
  episodeNumber: number;
  title: string;
  logline: string;
  scenes: ScriptScene[];
}

export interface ScriptScene {
  id: string;
  heading: string;
  location: string;
  timeOfDay: "day" | "night" | "dawn" | "unspecified";
  action: string;
  dialogue: DialogueLine[];
}

export interface DialogueLine {
  characterId?: string;
  characterName: string;
  line: string;
  direction?: string;
}

export interface StoryboardShot {
  id: string;
  sceneId: string;
  shotNumber: number;
  shotSize: "ECU" | "CU" | "MCU" | "MS" | "WS" | "EWS";
  cameraMovement: string;
  durationSeconds: number;
  visualDescription: string;
  dialogueOrAudio?: string;
  assetIds: string[];
  status: GenerationStatus;
}

export interface GenerationTask {
  id: string;
  projectId: string;
  kind: "image" | "video";
  status: GenerationStatus;
  progress: number;
  prompt: string;
  outputUrl?: string;
  errorMessage?: string;
  createdAt: string;
}
