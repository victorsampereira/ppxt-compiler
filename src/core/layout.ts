import { fitFontPt } from "./text-fit.js";
import {
  DesignedSlide,
  LayoutElement,
  SlideArchetype,
  SlideContent,
  SlideLayout,
} from "./types.js";

/** Widescreen slide in inches. */
export const SLIDE = { w: 13.333, h: 7.5 } as const;

const LEFT = 0.8;
const CONTENT_W = 11.7;
const CONTENT_BOTTOM = 6.9;

/** Body area below the header; it starts higher when the slide has no subtitle. */
function body(content: SlideContent): { y: number; h: number } {
  const y = content.subtitle ? 2.4 : 1.95;
  return { y, h: CONTENT_BOTTOM - y };
}

/** Font-size ladders: the layout picks the largest size that still fits. */
const LADDER = {
  heroTitle: [44, 40, 36, 32, 28],
  sectionTitle: [40, 36, 32, 28, 24],
  title: [30, 28, 26, 24, 22],
  subtitle: [22, 20, 18, 16, 14],
  bullets: [20, 18, 16, 14, 12],
  largeBullets: [24, 22, 20, 18, 16, 14],
  callout: [26, 24, 22, 20, 18, 16],
  statement: [30, 28, 26, 24, 22, 20],
  metric: [54, 48, 44, 40, 36, 32, 28],
  band: [18, 16, 14],
  meta: [14, 13, 12],
} as const;

const BULLET_INDENT_IN = 0.25;
/** Room taken by the "1.  " prefix of a numbered item. */
const NUMBER_PREFIX_IN = 0.4;
const BULLET_GAP_PT = 10;

type Box = { x: number; y: number; w: number; h: number };

/** Paragraphs of text an element draws; shared by the renderer and the QA rules. */
export function textFor(element: LayoutElement, content: SlideContent): string[] {
  switch (element.role) {
    case "title":
      return [content.title];
    case "subtitle":
      return content.subtitle ? [content.subtitle] : [];
    case "callout":
      return content.callout ? [content.callout] : [];
    case "meta":
      return content.bullets.length > 0 ? [content.bullets.join("  ·  ")] : [];
    case "bullets": {
      const [start, end] = element.bulletRange ?? [0, content.bullets.length];
      return content.bullets.slice(start, end);
    }
    default:
      return [];
  }
}

/** Spacing the renderer must use so the fit estimate matches what is drawn. */
export function fitOptionsFor(element: LayoutElement) {
  return {
    bold: element.bold ?? false,
    indentIn:
      element.role !== "bullets"
        ? 0
        : element.numbered
          ? NUMBER_PREFIX_IN
          : BULLET_INDENT_IN,
    paragraphGapPt: element.role === "bullets" ? BULLET_GAP_PT : 0,
  };
}

export const BULLET_SPACING = {
  indentPt: BULLET_INDENT_IN * 72,
  gapPt: BULLET_GAP_PT,
} as const;

function textElement(
  id: string,
  role: LayoutElement["role"],
  box: Box,
  content: SlideContent,
  ladder: readonly number[],
  extra: Partial<LayoutElement> = {},
): LayoutElement | null {
  const element: LayoutElement = {
    id,
    type: "text",
    role,
    ...box,
    styleRef: `${role}.${id}`,
    ...extra,
  };

  const paragraphs = textFor(element, content);
  if (paragraphs.length === 0) {
    return null;
  }

  element.fontPt = fitFontPt(paragraphs, box, ladder, fitOptionsFor(element)).fontPt;
  return element;
}

function shape(id: string, role: "panel" | "rule", box: Box): LayoutElement {
  return { id, type: "shape", role, ...box, styleRef: `${role}.${id}` };
}

function compact(elements: Array<LayoutElement | null>): LayoutElement[] {
  return elements.filter((element): element is LayoutElement => element !== null);
}

function header(content: SlideContent): LayoutElement[] {
  return compact([
    textElement("title", "title", { x: LEFT, y: 0.55, w: CONTENT_W, h: 1.15 }, content, LADDER.title, { bold: true }),
    textElement("subtitle", "subtitle", { x: LEFT, y: 1.75, w: CONTENT_W, h: 0.5 }, content, [16, 14, 12]),
  ]);
}

function fullWidthBullets(content: SlideContent, y?: number, h?: number) {
  const area = body(content);
  return textElement(
    "bullets",
    "bullets",
    { x: LEFT, y: y ?? area.y, w: CONTENT_W, h: h ?? area.h },
    content,
    LADDER.bullets,
  );
}

function calloutBand(content: SlideContent, y: number, h: number) {
  return textElement("callout", "callout", { x: LEFT, y, w: CONTENT_W, h }, content, LADDER.band, { bold: true });
}

function hero(content: SlideContent): LayoutElement[] {
  return compact([
    shape("rule", "rule", { x: LEFT, y: 1.9, w: 1.2, h: 0.08 }),
    textElement("title", "title", { x: LEFT, y: 2.2, w: 9.8, h: 2.2 }, content, LADDER.heroTitle, { bold: true }),
    textElement("subtitle", "subtitle", { x: LEFT, y: 4.55, w: 9.8, h: 1.1 }, content, LADDER.subtitle),
    textElement("meta", "meta", { x: LEFT, y: 6.3, w: CONTENT_W, h: 0.6 }, content, LADDER.meta),
  ]);
}

function sectionBreak(content: SlideContent): LayoutElement[] {
  return compact([
    shape("rule", "rule", { x: LEFT, y: 2.0, w: 1.2, h: 0.08 }),
    textElement("title", "title", { x: LEFT, y: 2.4, w: 10.5, h: 2.0 }, content, LADDER.sectionTitle, { bold: true }),
    textElement("subtitle", "subtitle", { x: LEFT, y: 4.6, w: 10.5, h: 1.0 }, content, LADDER.subtitle),
    textElement("meta", "meta", { x: LEFT, y: 6.3, w: CONTENT_W, h: 0.6 }, content, LADDER.meta),
  ]);
}

function agenda(content: SlideContent): LayoutElement[] {
  const hasCallout = Boolean(content.callout);
  const area = body(content);
  return [
    ...header(content),
    ...compact([
      textElement("bullets", "bullets", { x: LEFT, y: area.y, w: 9.0, h: hasCallout ? 6.0 - area.y : area.h }, content, LADDER.largeBullets, { numbered: true }),
      hasCallout ? calloutBand(content, 6.2, 0.7) : null,
    ]),
  ];
}

function twoColArgument(content: SlideContent): LayoutElement[] {
  if (!content.callout) {
    return [...header(content), ...compact([fullWidthBullets(content)])];
  }

  const area = body(content);
  return [
    ...header(content),
    ...compact([
      textElement("bullets", "bullets", { x: LEFT, y: area.y, w: 6.0, h: area.h }, content, LADDER.bullets),
      shape("panel", "panel", { x: 7.4, y: area.y, w: 5.1, h: area.h }),
      textElement("callout", "callout", { x: 7.7, y: area.y + 0.3, w: 4.5, h: area.h - 0.6 }, content, LADDER.callout, { bold: true, surface: "panel" }),
    ]),
  ];
}

function metricHighlight(content: SlideContent): LayoutElement[] {
  if (!content.callout) {
    return [...header(content), ...compact([fullWidthBullets(content)])];
  }

  const area = body(content);
  const metric = textElement("callout", "callout", { x: LEFT, y: area.y, w: 6.0, h: area.h }, content, LADDER.metric, { bold: true });
  if (metric) {
    metric.type = "metric";
  }

  return [
    ...header(content),
    ...compact([
      metric,
      textElement("bullets", "bullets", { x: 7.4, y: area.y, w: 5.1, h: area.h }, content, LADDER.bullets),
    ]),
  ];
}

function comparisonMatrix(content: SlideContent): LayoutElement[] {
  const count = content.bullets.length;
  const hasCallout = Boolean(content.callout);
  const area = body(content);
  const columnsH = hasCallout ? 6.0 - area.y : area.h;

  if (count < 2) {
    return [
      ...header(content),
      ...compact([
        fullWidthBullets(content, area.y, columnsH),
        hasCallout ? calloutBand(content, 6.2, 0.7) : null,
      ]),
    ];
  }

  const split = Math.ceil(count / 2);
  return [
    ...header(content),
    ...compact([
      textElement("bullets-a", "bullets", { x: LEFT, y: area.y, w: 5.6, h: columnsH }, content, LADDER.bullets, { bulletRange: [0, split] }),
      shape("divider", "rule", { x: 6.65, y: area.y + 0.1, w: 0.03, h: columnsH - 0.2 }),
      textElement("bullets-b", "bullets", { x: 7.0, y: area.y, w: 5.5, h: columnsH }, content, LADDER.bullets, { bulletRange: [split, count] }),
      hasCallout ? calloutBand(content, 6.2, 0.7) : null,
    ]),
  ];
}

function recommendation(content: SlideContent): LayoutElement[] {
  if (!content.callout) {
    return [...header(content), ...compact([fullWidthBullets(content)])];
  }

  const area = body(content);
  return [
    ...header(content),
    ...compact([
      textElement("callout", "callout", { x: LEFT, y: area.y, w: CONTENT_W, h: 1.6 }, content, LADDER.statement, { bold: true }),
      fullWidthBullets(content, area.y + 1.9, area.h - 1.9),
    ]),
  ];
}

function closingCta(content: SlideContent): LayoutElement[] {
  return compact([
    textElement("title", "title", { x: LEFT, y: 1.0, w: CONTENT_W, h: 1.5 }, content, LADDER.sectionTitle, { bold: true }),
    shape("rule", "rule", { x: LEFT, y: 2.7, w: 1.2, h: 0.08 }),
    textElement("bullets", "bullets", { x: LEFT, y: 3.1, w: CONTENT_W, h: 2.9 }, content, LADDER.bullets, { numbered: true }),
    calloutBand(content, 6.2, 0.8),
  ]);
}

const BUILDERS: Record<SlideArchetype, (content: SlideContent) => LayoutElement[]> = {
  hero_statement: hero,
  section_break: sectionBreak,
  agenda,
  "2_col_argument": twoColArgument,
  metric_highlight: metricHighlight,
  comparison_matrix: comparisonMatrix,
  recommendation,
  closing_cta: closingCta,
};

export function buildSlideLayout(
  content: SlideContent,
  design: DesignedSlide,
): SlideLayout {
  return {
    slideId: content.slideId,
    size: "wide",
    elements: BUILDERS[design.archetype](content),
  };
}

export function buildLayouts(
  contents: SlideContent[],
  designs: DesignedSlide[],
): SlideLayout[] {
  return contents.map((content, index) => buildSlideLayout(content, designs[index]));
}
