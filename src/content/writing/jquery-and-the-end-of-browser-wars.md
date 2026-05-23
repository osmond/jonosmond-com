---
title: "jQuery and the end of browser wars"
description: "One library made cross-browser JavaScript sane. Here's what that felt like before we took it for granted."
date: 2008-07-31
tags: ["craft", "javascript"]
---

If you learned JavaScript before jQuery, you remember what it cost.

You maintained two code paths for almost everything. `getElementById` worked, mostly. `addEventListener` didn't exist in IE — you used `attachEvent`. `XMLHttpRequest` was created differently depending on the browser. CSS properties you set in JavaScript had different names. The behavior of events bubbled, captured, or didn't, inconsistently.

Writing JavaScript in 2005 meant writing feature detection and browser sniffing before you could write any actual logic. The ceremony was exhausting.

## What jQuery changed

jQuery landed in 2006 and within two years it was everywhere. The API was beautiful: a consistent, chainable interface that smoothed over every browser difference and made DOM manipulation feel intentional rather than adversarial.

`$('.nav a').on('click', function() { ... })` worked in every browser. You didn't need to think about which one.

This sounds like a small thing. It wasn't. It was the difference between JavaScript being a minefield and JavaScript being a tool. A generation of developers learned to think in jQuery before they thought in JavaScript, which created its own problems later — but the initial effect was liberating.

## What I actually learned

jQuery taught me the value of a consistent, well-designed API. Not just for users of a library, but as a principle for anything you build that someone else will use. The abstraction was thin enough to see through, but solid enough to rely on.

I also learned that waiting for browsers to agree on a standard was not a viable strategy. The web needed someone to normalize it from above. jQuery did that for JavaScript. Eventually, the browsers caught up and we stopped needing jQuery for most of what we used it for.

But for about ten years, it was the most important piece of software on the web.
