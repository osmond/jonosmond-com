---
title: "Tables all the way down"
description: "Building websites in 2001 meant nesting tables inside tables inside tables. We didn't know there was another way."
date: 2001-09-12
tags: ["craft", "beginnings", "css"]
---

The first production site I built was laid out entirely in tables.

Not because I chose tables. Because that was how you did it. If you wanted two columns, you made a table with two cells. If you wanted consistent margins, you made a table with an empty spacer cell. If you wanted a header, footer, and sidebar, you nested tables three levels deep and prayed the browser rendered them the same way.

This was 2001. I was learning web development professionally, which mostly meant reading View Source on sites I admired, reverse-engineering what I found, and asking questions in forums where people were patient with beginners.

## The view from inside

Nobody thought of this as bad practice at the time. It was just practice. Tables were a structural element that happened to also control layout. `<font>` tags were how you styled text. You wrote `bgcolor` directly on `<td>` elements. You used `&nbsp;` as a spacer.

I learned to build pixel-perfect layouts in Photoshop, slice them into images, and reassemble them in a table grid. The result loaded slowly, was impossible to maintain, and broke on any viewport you hadn't explicitly designed for. But it looked exactly like the mockup.

That felt like craftsmanship at the time.

## What the table era taught me

Even building terrible things teaches you something. From the table era, I learned that the structure of your markup shapes everything downstream. When your layout is baked into your content structure, every change becomes expensive. When they're separate, change is cheap.

I didn't understand CSS well enough to articulate this in 2001. But I felt it. The table sites I built were hard to maintain in a way that felt fundamental, not incidental.

That feeling sent me chasing something better.
