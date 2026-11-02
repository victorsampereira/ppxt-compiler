import { createRequire } from "node:module";
import path from "node:path";

import { normalizeHex } from "./color.js";
import { ensureDir } from "./fs.js";
import { BULLET_SPACING, textFor } from "./layout.js";
import { ruleColor, slideBackground, textColor } from "./style.js";
import { ThemeTokens, buildThemeTokens } from "./theme.js";
import {
  DesignedSlide,
  LayoutElement,
  NormalizedBrief,
  PresentationPlan,
  SlideContent,
  SlideLayout,
} from "./types.js";

const require = createRequire(import.meta.url);
const PptxGenJS = require("pptxgenjs") as new () => {
  ShapeType: Record<string, string>;
  layout: string;
  author: string;
  company: string;
  subject: string;
  title: string;
  theme: Record<string, unknown>;
  addSlide: () => PptxSlide;
  writeFile: (options: { fileName: string }) => Promise<string>;
};

type PptxSlide = {
  background: { color: string };
  addText: (text: unknown, options?: Record<string, unknown>) => void;
  addShape: (shapeName: string, options?: Record<string, unknown>) => void;
  addNotes: (notes: string) => void;
};

interface RenderOptions {
  brief: NormalizedBrief;
  plan: PresentationPlan;
  contents: SlideContent[];
  designedSlides: DesignedSlide[];
  layouts: SlideLayout[];
  outputDir: string;
}

function drawShape(
  slide: PptxSlide,
  shapeType: Record<string, string>,
  element: LayoutElement,
  design: DesignedSlide,
  theme: ThemeTokens,
): void {
  const box = { x: element.x, y: element.y, w: element.w, h: element.h };

  if (element.role === "panel") {
    slide.addShape(shapeType.rect, {
      ...box,
      fill: { color: normalizeHex(theme.background.light) },
      line: { color: normalizeHex(design.accentColor), pt: 1.2 },
    });
    return;
  }

  const color = normalizeHex(ruleColor(design, theme));
  slide.addShape(shapeType.rect, {
    ...box,
    fill: { color },
    line: { color, pt: 0 },
  });
}

function drawText(
  slide: PptxSlide,
  element: LayoutElement,
  content: SlideContent,
  design: DesignedSlide,
  theme: ThemeTokens,
): void {
  const paragraphs = textFor(element, content);
  if (paragraphs.length === 0) {
    return;
  }

  const base = {
    x: element.x,
    y: element.y,
    w: element.w,
    h: element.h,
    fontSize: element.fontPt,
    color: normalizeHex(textColor(element, design, theme)),
    margin: 0,
    valign: element.type === "metric" ? "middle" : "top",
  };

  if (element.role === "bullets") {
    // Numbers are written into the text: a numbered bullet takes its color from
    // the viewer, and on a dark slide some viewers draw it black.
    slide.addText(
      paragraphs.map((text, index) => ({
        text: element.numbered ? `${index + 1}.  ${text}` : text,
        options: element.numbered
          ? { breakLine: true }
          : { bullet: { indent: BULLET_SPACING.indentPt }, breakLine: true },
      })),
      {
        ...base,
        fontFace: theme.fontFace.body,
        paraSpaceAfterPt: BULLET_SPACING.gapPt,
      },
    );
    return;
  }

  const isHeadline =
    element.role === "title" ||
    element.role === "callout" ||
    element.type === "metric";

  slide.addText(paragraphs.join("\n"), {
    ...base,
    fontFace: isHeadline ? theme.fontFace.headline : theme.fontFace.body,
    bold: element.bold ?? false,
  });
}

export async function renderPresentation({
  brief,
  plan,
  contents,
  designedSlides,
  layouts,
  outputDir,
}: RenderOptions): Promise<string> {
  await ensureDir(outputDir);

  const pptx = new PptxGenJS();
  const theme = buildThemeTokens(brief.brandKit.colors, brief.brandKit.fonts);
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = brief.brandKit.brand_name || "ppxt-compiler";
  pptx.company = brief.brandKit.brand_name || "ppxt-compiler";
  pptx.subject = brief.goal;
  pptx.title = plan.title;
  pptx.theme = {
    headFontFace: theme.fontFace.headline,
    bodyFontFace: theme.fontFace.body,
    lang: brief.language,
  };

  contents.forEach((content, index) => {
    const design = designedSlides[index];
    const layout = layouts[index];
    const slide = pptx.addSlide();

    slide.background = {
      color: normalizeHex(slideBackground(design, theme)),
    };

    for (const element of layout.elements) {
      if (element.type === "shape") {
        drawShape(slide, pptx.ShapeType, element, design, theme);
      } else {
        drawText(slide, element, content, design, theme);
      }
    }

    if (content.speakerNote) {
      slide.addNotes(content.speakerNote);
    }
  });

  const pptxPath = path.join(outputDir, `${brief.projectId}.pptx`);
  await pptx.writeFile({ fileName: pptxPath });
  return pptxPath;
}
