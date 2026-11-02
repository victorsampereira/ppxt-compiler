export type PresentationAudience =
  | "executive"
  | "sales"
  | "investor"
  | "training"
  | "academic";

export type PresentationTone =
  | "premium"
  | "formal"
  | "bold"
  | "minimal";

export type SlidePurpose =
  | "title"
  | "section"
  | "argument"
  | "data"
  | "comparison"
  | "closing";

export type SlideArchetype =
  | "hero_statement"
  | "agenda"
  | "section_break"
  | "2_col_argument"
  | "metric_highlight"
  | "comparison_matrix"
  | "recommendation"
  | "closing_cta";

export interface PresentationInput {
  project_id: string;
  presentation: {
    title: string;
    goal: string;
    audience: PresentationAudience;
    tone: PresentationTone;
    language: string;
    duration_minutes: number;
  };
  briefing: {
    script: string;
    design_direction: string;
    must_include: string[];
    must_avoid: string[];
  };
  brand_kit: {
    brand_name: string;
    logo_path: string;
    colors: string[];
    fonts: {
      headline: string;
      body: string;
    };
  };
  data_sources: string[];
  assets: string[];
}

export interface NormalizedBrief {
  projectId: string;
  title: string;
  goal: string;
  audience: PresentationAudience;
  tone: PresentationTone;
  language: string;
  durationMinutes: number;
  presentationIntent: "persuasion" | "explanation" | "update";
  designKeywords: string[];
  contentPriority: string[];
  forbiddenPatterns: string[];
  sourceScript: string;
  brandKit: PresentationInput["brand_kit"];
}

export interface PlannedSlide {
  slideId: string;
  section: string;
  purpose: SlidePurpose;
  /** Short label of what the slide is about; optional because models may omit it. */
  topic?: string;
  keyMessage: string;
  speakerIntent: string;
  recommendedArchetype: SlideArchetype;
}

export interface PresentationPlan {
  title: string;
  openingStrategy: string;
  flowLogic: string;
  closingStrategy: string;
  slides: PlannedSlide[];
}

export interface SlideContent {
  slideId: string;
  title: string;
  subtitle?: string;
  bullets: string[];
  callout?: string;
  speakerNote: string;
}

export interface DesignedSlide {
  slideId: string;
  archetype: SlideArchetype;
  visualPriority: "text-first" | "number-first" | "balanced";
  backgroundStyle: "light" | "dark" | "accent";
  accentColor: string;
}

export type LayoutRole =
  | "title"
  | "subtitle"
  | "bullets"
  | "callout"
  | "meta"
  | "panel"
  | "rule";

/** Positions and sizes are in inches on a 13.333 x 7.5 widescreen slide. */
export interface LayoutElement {
  id: string;
  type: "text" | "shape" | "metric";
  role: LayoutRole;
  x: number;
  y: number;
  w: number;
  h: number;
  styleRef: string;
  fontPt?: number;
  bold?: boolean;
  numbered?: boolean;
  /** "panel" means the element sits on the light card, not on the slide background. */
  surface?: "slide" | "panel";
  /** Slice of the slide bullets drawn by this element: [start, end). */
  bulletRange?: [number, number];
}

export interface SlideLayout {
  slideId: string;
  size: "wide";
  elements: LayoutElement[];
}

export interface QualityIssue {
  code: string;
  severity: "low" | "medium" | "high";
  message: string;
}

export interface SlideQualityResult {
  slideId: string;
  status: "pass" | "warn" | "fail";
  score: number;
  issues: QualityIssue[];
}

export interface QualityReport {
  generatedAt: string;
  averageScore: number;
  slideResults: SlideQualityResult[];
  /** Problems that only show up across slides, such as a repeated layout. */
  deckIssues: QualityIssue[];
  verdict: "ready" | "needs_work";
}

export interface PromptTrace {
  promptId: string;
  version: string;
  model: string;
  usedAi: boolean;
  /** Why the deterministic fallback was used instead of the model output. */
  fallbackReason?: "api_error" | "invalid_output";
  latencyMs?: number;
}

export interface PipelineArtifacts {
  input: PresentationInput;
  normalizedBrief: NormalizedBrief;
  plan: PresentationPlan;
  slideContents: SlideContent[];
  designedSlides: DesignedSlide[];
  layouts: SlideLayout[];
  qualityReport: QualityReport;
  promptTraces: PromptTrace[];
  generationMode: "deterministic" | "hybrid-ai";
}
