import { createRequire } from "node:module";
import path from "node:path";

import { ensureDir } from "./fs.js";
import {
  DesignedSlide,
  NormalizedBrief,
  PresentationPlan,
  SlideContent,
} from "./types.js";
import { ThemeTokens, buildThemeTokens } from "./theme.js";

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
};

interface RenderOptions {
  brief: NormalizedBrief;
  plan: PresentationPlan;
  contents: SlideContent[];
  designedSlides: DesignedSlide[];
  outputDir: string;
}

function applyBackground(
  slide: PptxSlide,
  design: DesignedSlide,
  theme: ThemeTokens,
): void {
  const color =
    design.backgroundStyle === "dark"
      ? theme.background.dark
      : design.backgroundStyle === "accent"
        ? design.accentColor
        : theme.background.light;

  slide.background = { color };
}

function addTitleBlock(
  slide: PptxSlide,
  content: SlideContent,
  design: DesignedSlide,
  theme: ThemeTokens,
): void {
  const titleColor =
    design.backgroundStyle === "light"
      ? theme.text.primary
      : theme.text.inverted;

  slide.addText(content.title, {
    x: 0.7,
    y: 0.6,
    w: 7.5,
    h: 0.8,
    fontFace: theme.fontFace.headline,
    fontSize: design.archetype === "hero_statement" ? 24 : 22,
    bold: true,
    color: titleColor,
    margin: 0,
    breakLine: false,
  });

  if (content.subtitle) {
    slide.addText(content.subtitle, {
      x: 0.72,
      y: 1.3,
      w: 6.6,
      h: 0.5,
      fontFace: theme.fontFace.body,
      fontSize: 10,
      color: titleColor,
      margin: 0,
      opacity: 0.85,
    });
  }
}

function addBulletColumn(
  slide: PptxSlide,
  content: SlideContent,
  design: DesignedSlide,
  theme: ThemeTokens,
): void {
  const bodyColor =
    design.backgroundStyle === "light"
      ? theme.text.primary
      : theme.text.inverted;

  slide.addText(
    content.bullets.map((bullet) => ({ text: bullet, options: { bullet: { indent: 14 } } })),
    {
      x: 0.8,
      y: 2.0,
      w: 5.3,
      h: 3.2,
      fontFace: theme.fontFace.body,
      fontSize: 16,
      color: bodyColor,
      breakLine: true,
      paraSpaceAfterPt: 12,
      valign: "top",
      margin: 0,
    },
  );
}

function addAccentPanel(
  slide: PptxSlide,
  content: SlideContent,
  design: DesignedSlide,
  theme: ThemeTokens,
  shapeType: Record<string, string>,
): void {
  slide.addShape(shapeType.rect, {
    x: 8.2,
    y: 0.55,
    w: 4.4,
    h: 6.0,
    fill: { color: theme.background.light, transparency: design.backgroundStyle === "light" ? 0 : 5 },
    line: { color: design.accentColor, pt: 1.2 },
    radius: 0.12,
  });

  const text = content.callout ?? content.speakerNote;
  slide.addText(text, {
    x: 8.55,
    y: 1.1,
    w: 3.7,
    h: 1.6,
    fontFace: theme.fontFace.headline,
    fontSize: 18,
    bold: true,
    color: theme.text.primary,
    margin: 0,
    valign: "middle",
  });

  slide.addShape(shapeType.line, {
    x: 8.55,
    y: 3.0,
    w: 2.1,
    h: 0,
    line: { color: design.accentColor, pt: 2 },
  });

  slide.addText("Pipeline local, rastreavel e orientado a qualidade visual.", {
    x: 8.55,
    y: 3.35,
    w: 3.5,
    h: 1.8,
    fontFace: theme.fontFace.body,
    fontSize: 11,
    color: theme.text.muted,
    margin: 0,
  });
}

export async function renderPresentation({
  brief,
  plan,
  contents,
  designedSlides,
  outputDir,
}: RenderOptions): Promise<string> {
  await ensureDir(outputDir);

  const pptx = new PptxGenJS();
  const theme = buildThemeTokens(brief.brandKit.colors, brief.brandKit.fonts);
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = brief.brandKit.brand_name || "AutomacaoSlides";
  pptx.company = brief.brandKit.brand_name || "AutomacaoSlides";
  pptx.subject = brief.goal;
  pptx.title = plan.title;
  pptx.theme = {
    headFontFace: theme.fontFace.headline,
    bodyFontFace: theme.fontFace.body,
    lang: brief.language,
  };

  contents.forEach((content, index) => {
    const design = designedSlides[index];
    const slide = pptx.addSlide();

    applyBackground(slide, design, theme);
    addTitleBlock(slide, content, design, theme);
    addBulletColumn(slide, content, design, theme);
    addAccentPanel(slide, content, design, theme, pptx.ShapeType);
  });

  const pptxPath = path.join(outputDir, `${brief.projectId}.pptx`);
  await pptx.writeFile({ fileName: pptxPath });
  return pptxPath;
}
