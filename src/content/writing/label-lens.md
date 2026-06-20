---
title: "Building Label Lens: Making dietary information accessible"
description: "How do you help someone understand the hidden complexity inside a food label? The interface has to earn trust before it asks for vulnerability."
date: 2026-06-19
tags: ["accessibility", "design", "ai"]
---

I started Label Lens because I kept thinking about how much trust is required to eat safely when you have dietary restrictions.

A person with allergies or dietary preferences has to decode ingredient lists, parse derivative sources (malt vinegar contains gluten, natural flavors can hide animal products), and remember dozens of allergen names they might encounter. Then they have to make a decision—with incomplete information and real stakes.

The interface I was building had to acknowledge that weight.

## The problem space

Food labels aren't designed for clarity. They're designed for regulatory compliance. An ingredient list that technically discloses everything still obscures what matters most to a specific person.

"Natural flavors" is accurate. It's also useless if you're trying to figure out whether something contains insect derivatives (spoiler: sometimes it does).

The question became: how do you take that label and render it legible? Not simplified—legible. There's a difference. Simplification is erasure.

## What the interface needed to do

The first thing was profile. A person had to be able to tell us their restrictions—vegan, gluten-free, halal, keto, and custom allergens like mustard, sesame, lupin. This wasn't just a checklist. It was the person drawing a boundary around what they would eat.

Then: the ability to upload a label or paste ingredients. Quick input paths matter when someone is standing in a grocery aisle.

The analysis had to be transparent. Not just a verdict—Safe, Check These, Avoid—but the reasoning. Per-ingredient cards that explain the functional role and the safety rating. Plain language throughout. No jargon.

The final piece was the verdict. Personalized. Not the food is safe for everyone, but this food is safe for you.

## Why AI fit here

This problem needs reasoning, not just lookup tables. A database of known allergen sources isn't enough when you're trying to untangle what "natural flavors" really means in a specific context.

Claude could read a label, understand the chemistry and derivative chains, reason about cross-contamination risk, and explain the thinking in language that made sense to someone at the store.

What surprised me was how much it mattered that the AI showed its work. People didn't just want a verdict. They wanted to understand why.

## The craft part

Building Label Lens taught me something about how to design for vulnerability. When someone is relying on your interface to make a decision that affects their health, every affordance has to say: we respect the stakes here.

That meant no dark patterns. No friction designed to push people toward a conclusion. No false confidence—if the analysis uncertain, we said so.

It meant responsive design that worked on a phone in bad lighting in a grocery store. It meant asking for information when we needed it, but offering shortcuts when we could.

Most of all, it meant building trust through transparency. A person using this app is already trusting me with something that matters to them. The interface has to earn that.
