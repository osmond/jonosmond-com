---
title: "Why I delete code"
description: "The best code I've written this year is the code I removed. On the practice of subtraction."
date: 2022-07-11
tags: ["craft", "javascript"]
---

Every quarter I try to delete something.

Not refactor. Not replace with a better abstraction. Just delete — remove a feature, a dependency, a component that nobody was using, a utility function that had accumulated because it seemed useful at the time.

This started as a reaction to a specific project that had become genuinely hard to work in. Not because the code was bad. Because there was too much of it. Every file had imports from a dozen others. Every change required understanding a web of side effects. The software was technically correct and practically exhausting.

## The accumulation problem

Code accumulates by default. You add a feature, you add the code for it. You deprecate a feature, you usually leave the code because removing it feels risky. Over time, the codebase becomes a stratigraphy of all the decisions you've ever made, including the ones you've long since reversed.

This is normal. It's also a problem.

Dead code isn't neutral. It occupies mental space. It suggests that things are in use that aren't. It makes it harder to understand the shape of a system because the shape includes things that no longer exist in any meaningful sense.

## What deletion teaches you

When you delete code, you have to understand it first. You have to trace its dependencies, figure out what calls it, check whether any of those callers still exist. That process teaches you things about your system that you didn't know.

I've found more bugs by deleting code than by reading it. Because reading is passive. Deletion is a forcing function.

## The practice

Once a quarter, I pick something I suspect isn't needed. I comment it out, deploy to staging, watch for breakage. Usually nothing breaks. Then I delete it.

It's a small habit with an outsized effect on how a codebase feels to work in. Codebases that feel lightweight are usually not just well-written — they're actively maintained.
