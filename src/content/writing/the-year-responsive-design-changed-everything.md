---
title: "The year responsive design changed everything"
description: "Ethan Marcotte's 2010 article gave a name to something I'd been trying to do badly for years."
date: 2012-04-03
tags: ["craft", "css", "design"]
image: "https://picsum.photos/seed/the-year-responsive-design-changed-everything/800/420?grayscale"
---

In May 2010, Ethan Marcotte published an article in A List Apart called "Responsive Web Design."

The core idea — fluid grids, flexible images, media queries — wasn't entirely new. The pieces existed. But naming the approach, and demonstrating it coherently, changed how the whole industry talked about the problem.

I remember reading it and feeling the specific relief of finally having language for something I'd been fumbling toward.

## The problem I'd been fumbling toward

By 2010, mobile web traffic was growing fast enough that ignoring it was becoming untenable. The approach at the time was usually to build a separate mobile site — a stripped-down version at `m.domain.com` that you maintained in parallel and inevitably let fall behind the main site.

This was bad and everyone knew it was bad. But the alternative wasn't clear.

Responsive design made the alternative clear. One codebase, one URL, designed to work at any size. The viewport was a variable, not a target.

## What the transition actually looked like

The first few responsive sites I built were rough. I didn't fully understand how to design for a fluid system — I kept trying to design fixed layouts and then making them stretch, which is the wrong approach. You design for flexibility first, not as an afterthought.

The hardest thing was unlearning the assumption that a pixel was a pixel. On a high-density screen, a CSS pixel doesn't correspond to a device pixel. Images that looked crisp on desktop looked blurry on a retina iPhone. Understanding device-pixel-ratio, `srcset`, and eventually resolution-independent graphics took another couple of years to really land.

## The bigger shift

Responsive design forced me to think about design as a system, not a set of fixed compositions. That shift has been the most lasting effect. A design that works at every size is a design built from constraints, not pixels. You define the rules and let the viewport apply them.

That's still how I think about UI.
