---
title: "The day JavaScript finally made sense"
description: "It took two years and one specific moment to understand what JavaScript was actually for."
date: 2017-06-22
tags: ["craft", "javascript"]
image: "https://picsum.photos/seed/the-day-javascript-made-sense/800/420?grayscale"
---

I spent two years being scared of JavaScript.

I could write it. I could copy it. I could make things sort of work. But I didn't understand it — not really. Every time something broke, I didn't know why. Every time something worked, I wasn't entirely sure why either.

Then one afternoon, everything shifted.

## What changed

I was building a form. A simple one: a multi-step wizard where each section faded out and the next one faded in. I had been doing it with CSS class toggles, fighting the DOM, writing `document.getElementById` everywhere.

A colleague looked over my shoulder and said: "Think of it as state, not steps."

He was talking about React, which I hadn't learned yet. But the idea unlocked something. The UI isn't the truth. The truth is the data. The UI is just what you render from it.

Once I understood that, I could read JavaScript differently. The language stopped being a collection of tricks and started being a way to model things.

## The slower insight

The faster you can build a mental model of a tool, the faster you can use it well. I had been learning JavaScript by memorizing incantations. What I actually needed was to understand the model.

This is probably true of every tool. But JavaScript makes it unusually obvious, because the gap between "can make it work" and "understands what's happening" is so wide.

I try to remember that gap now when I'm picking up something new. Slow down long enough to build the model. The speed comes later.
