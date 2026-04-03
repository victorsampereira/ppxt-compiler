import { DesignedSlide, SlideContent, SlideLayout } from "./types.js";

export function buildLayouts(
  contents: SlideContent[],
  designs: DesignedSlide[],
): SlideLayout[] {
  return contents.map((content, index) => {
    const design = designs[index];

    return {
      slideId: content.slideId,
      size: "wide",
      elements: [
        {
          id: "title",
          type: "text",
          x: 0.7,
          y: 0.55,
          w: 8.0,
          h: 0.8,
          styleRef: `title.${design.backgroundStyle}`,
        },
        {
          id: "body",
          type: "text",
          x: 0.75,
          y: 1.65,
          w: 5.9,
          h: 3.2,
          styleRef: "body.primary",
        },
      ],
    };
  });
}

