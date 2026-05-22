---
title: "The physics of UI"
description: "How spring simulations and physical metaphors make interfaces feel alive."
date: 2026-04-10
tags: ["animation", "interaction"]
---

There's a quality to good interface animation that's hard to describe. It doesn't just look smooth — it feels *right*. Like you're touching something real.

That quality almost always comes from physics.

## Why easing curves aren't enough

Cubic bezier curves are great. They give you control over timing with four numbers, and they're cheap to compute. But they have a fundamental limitation: they're predetermined. The animation plays out the same way every time, regardless of what interrupted it mid-flight or how fast it was already moving.

Real objects don't work like that. When you flick something and it bounces off a wall, the speed matters. The angle matters. Momentum is preserved.

## Springs

A spring simulation is surprisingly simple. Every frame, you compute the force pulling a value toward its target — proportional to the distance — and update velocity accordingly. Then you apply a small damping factor so the oscillation decays.

```js
function tickSpring(state, target, stiffness = 0.1, damping = 0.8) {
  state.velocity += (target - state.value) * stiffness;
  state.velocity *= damping;
  state.value    += state.velocity;
}
```

That's it. Four lines. But from this you get something that responds to interruption naturally: if the target changes while the animation is running, the spring seamlessly redirects toward the new target, carrying its momentum.

## Where it matters most

Spring physics shines in two places:

1. **Drag and release** — when something follows the cursor and then snaps back, a spring makes the release feel satisfying in a way a cubic bezier never can.
2. **Interrupted animations** — modals, drawers, sheets that can be dismissed mid-open. A spring maintains momentum; an easing curve restarts from zero and looks jarring.

The rest of my /lab experiments are direct explorations of this. They're not useful. But they're honest about what makes interfaces feel alive.
