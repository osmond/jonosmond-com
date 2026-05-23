---
title: "Color and control"
description: "Why I sample album art for ambient color and what I learned about CSS transitions."
date: 2026-03-15
tags: ["css", "design", "color"]
---

The `/ambient` page on this site samples the album art of whatever I'm currently listening to and uses it to tint the background gradient. It's a small thing, but it changes the whole feeling of the page.

## The problem with CSS color transitions

CSS can transition almost anything. But gradients are not one of them — or weren't, until `@property`.

The reason is that a gradient like `linear-gradient(135deg, #c46b4b, #0f0f0f)` is a string to CSS. It has no structure the browser can interpolate between. You'd think you could just change the color mid-animation and watch it crossfade. You can't.

## `@property` to the rescue

`@property` lets you register a CSS custom property with a type. When the type is `<color>`, the browser understands how to interpolate it.

```css
@property --album-color {
  syntax: '<color>';
  inherits: false;
  initial-value: #888884;
}
```

Now `--album-color` transitions smoothly when you change it, and you can use it inside a gradient:

```css
background: radial-gradient(ellipse at 40% 30%, var(--album-color), var(--color-bg));
```

Change `--album-color` via JS when a new track loads, and the background fades gracefully between the two palettes. No opacity tricks, no two overlapping elements, no JavaScript animation loop.

## Sampling color from an image

To get a dominant color from album art, you draw the image onto a tiny canvas (say 4×4px), read the pixel data, and average the RGB values — biased toward saturated pixels that aren't too dark or too light. Desaturated or very dark images produce boring colors, so I clamp the result toward the site's accent by blending.

It's not perfect. But perfection is the wrong goal here. The imperfection is the point.
