---
layout: layouts/page.njk
title: Research
kicker: Programmable morphogenesis
lede: We aim to decode and program morphogenesis by uncovering and rewriting the rules that turn signal inputs into multicellular structure.
permalink: /research/
proseClass: prose-col
---

<div class="callout-question">
  <p class="kicker">Our question</p>
  <p>{{ research.question }}</p>
</div>

Developmental biology *analyzes* how nature builds tissues. Synthetic biology *engineers* biological systems. We work at the intersection of the two. Our fundamental question is: what rules do cells follow to build tissues? We answer it not only by observing natural development but by reconstructing and modifying it, because changing a system is a direct test of whether we understand it. We then use those rules to rebuild natural development, and to model how it goes wrong in disease.

## The morphogen code

We call the mapping between signaling-field dynamics and cell-state transitions the **morphogen code**. Our central hypothesis is that tissue architecture is encoded by a quantitative morphogen code, defined by the combination of signal types, signal geometry, temporal dynamics, and feedback between progenitor state and signaling sources. If this code can be decoded, it can be used to program tissue organization, and to understand how its failure drives disease.

## Three directions

<div class="axes-long">
{% for axis in research.axes %}
<section class="axis-long" id="{{ axis.id }}">
  <div class="axis-long-icon">{% include "partials/axis-icon.njk" %}</div>
  <div>
    <p class="axis-num">{{ axis.number }}</p>
    <h3>{{ axis.title }}: {{ axis.subtitle }}</h3>
    <p>{{ axis.summary }}</p>
    <ul>{% for pt in axis.points %}<li>{{ pt | safe }}</li>{% endfor %}</ul>
  </div>
</section>
{% endfor %}
</div>

## How we work: Analyze & Synthesize

Breaking morphogenesis down into genes, proteins, and pathways explains the parts, but not why cell populations spontaneously generate spatial pattern. Building organoids and watching what happens finds conditions that are sufficient, but not why they work. Neither approach is enough on its own.

We deliberately alternate between the two. We **analyze** by perturbing single circuit elements, then **synthesize** by putting the perturbation back into a self-organizing tissue to test whether our pattern-level prediction holds. Computational models (reaction–diffusion, agent-based, Bayesian inference, deep learning) connect the two halves. They let us predict the whole pattern without losing the mechanism.

## Where we are heading

<ol class="trajectory">
{% for step in research.trajectory %}<li><span>{{ loop.index }}</span>{{ step }}</li>{% endfor %}
</ol>

We start by building a system in which morphogenesis can be measured as a quantitative input–output system. This means multi-reporter stem cell lines, controlled delivery of defined signals from synthetic signaling centers, and time-resolved imaging with lineage tracking. On that foundation we work out the minimal rules that map signal history to fate. Then we use those rules to control pattern formation, and finally to explore which multicellular forms are possible beyond natural development.
