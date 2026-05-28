const grid = document.querySelector("#member-grid");

if (grid && Array.isArray(window.LOOM_MEMBERS)) {
  grid.innerHTML = window.LOOM_MEMBERS.map(([code, name, word, identity]) => {
    return `
      <article class="member-card">
        <div class="member-card__code">${code}</div>
        <div class="member-card__name">${name}</div>
        <div class="member-card__signal">${word} · ${identity}</div>
        <p class="member-card__role">Click-ready teaser zone for signature pose, profile, and Harne thread vote.</p>
      </article>
    `;
  }).join("");
}
