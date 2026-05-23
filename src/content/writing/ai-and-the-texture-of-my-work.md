---
title: "AI and the texture of my work"
description: "A year into working with AI coding tools, here's what has changed and what hasn't."
date: 2024-11-04
tags: ["craft", "javascript"]
image: "https://picsum.photos/seed/ai-and-the-texture-of-my-work/800/420?grayscale"
---

I've been using AI tools in my workflow for about a year. Not occasionally — daily. Long enough to have some opinions that aren't just first impressions.

## What it's good for

Writing boilerplate is genuinely faster. Not because I couldn't write it — I could — but because the cognitive overhead of writing something rote was a small tax I paid many times a day. That tax is mostly gone.

I use it to explore APIs I don't know well. Not to replace reading the docs, but to get oriented before I read them. "What does this package do and what are the most common patterns?" is a question it answers well.

I use it for first drafts of things I expect to rewrite. That's a useful framing: it's a drafting tool, not a finishing tool.

## What it's bad for

It's bad at understanding the specific context of my project. It knows a lot about general patterns. It doesn't know why I made the particular tradeoffs I made in this codebase, and it can't infer them reliably from context.

The confident-but-wrong failure mode is real. For unfamiliar domains especially, I've had it generate code that looked completely plausible and was subtly wrong in ways that took real debugging to find. The output needs to be reviewed with the same rigor you'd apply to code from a junior developer who's competent but new to the domain.

## What's unchanged

The interesting problems are still interesting for the same reasons. Figuring out the right abstraction, designing the right interface, debugging something genuinely mysterious — AI doesn't change the shape of those problems. It might help you get to them faster by handling more of the surrounding machinery.

I expected the work to feel different in a bigger way than it does. The texture has changed. The nature hasn't.
