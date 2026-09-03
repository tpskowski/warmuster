import { expect, test } from "@playwright/test";

// Layout tests for the printed unit cards. The ?gallery=cards route renders
// every card in the game (every army's units and spells plus all magic
// items) as front/back page pairs. These tests verify, against real browser
// rendering, the invariants the char-count fit model in
// src/domain/unitCard.ts only estimates:
//
//  1. every card is exactly 63 x 88mm - the finished size of a Magic: the
//     Gathering card, which is only what comes out of the printer if the
//     sheet is not scaled (see the paper-size test at the bottom);
//  2. no card's content overflows its box (nothing gets clipped);
//  3. no two text sections of a card overlap each other;
//  4. cards abut edge to edge, so one cut separates two of them;
//  5. back pages mirror front pages column-wise, so double-sided printing
//     with "flip on long edge" lines every back up with its front.

interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

interface CardReport {
  id: string;
  face: string;
  widthMm: number;
  heightMm: number;
  overflowPx: number;
  escapes: string[];
  overlaps: string[];
}

interface DuplexReport {
  page: number;
  slot: number;
  dx: number;
  dy: number;
}

test.beforeEach(async ({ page }) => {
  await page.goto("/?gallery=cards");
  await page.waitForSelector(".unit-card");
  // Fonts change metrics; wait for them so measurements match print output.
  await page.evaluate(() => document.fonts.ready);
});

test("every card is 63 x 88mm with no overflowing or overlapping text", async ({ page }) => {
  const reports = await page.evaluate<CardReport[]>(() => {
    const MM = 96 / 25.4; // CSS px per mm
    const TOL = 0.5; // px; adjacent lines can touch, not cross

    function lineRects(el: Element): Box[] {
      const rects: Box[] = [];
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const range = document.createRange();
        range.selectNodeContents(walker.currentNode);
        for (const r of range.getClientRects()) {
          if (r.width > 0 && r.height > 0) {
            rects.push({ left: r.left, top: r.top, right: r.right, bottom: r.bottom });
          }
        }
      }
      return rects;
    }

    const intersects = (a: Box, b: Box) =>
      a.left < b.right - TOL && b.left < a.right - TOL && a.top < b.bottom - TOL && b.top < a.bottom - TOL;

    const reports: CardReport[] = [];
    for (const card of document.querySelectorAll<HTMLElement>(".unit-card")) {
      const rect = card.getBoundingClientRect();
      const sections = [
        ...card.querySelectorAll(".card-head, .card-stats, .card-rule, .card-continued, .card-back-logo"),
      ].map((s) => ({ cls: s.className, rects: lineRects(s) }));

      const escapes: string[] = [];
      for (const s of sections) {
        for (const r of s.rects) {
          if (
            r.right > rect.right + TOL ||
            r.bottom > rect.bottom + TOL ||
            r.left < rect.left - TOL ||
            r.top < rect.top - TOL
          ) {
            escapes.push(s.cls);
            break;
          }
        }
      }

      const overlaps: string[] = [];
      for (let i = 0; i < sections.length; i++) {
        for (let j = i + 1; j < sections.length; j++) {
          if (sections[i].rects.some((a) => sections[j].rects.some((b) => intersects(a, b)))) {
            overlaps.push(`${sections[i].cls} x ${sections[j].cls}`);
          }
        }
      }

      reports.push({
        id: card.dataset.card ?? "?",
        face: card.dataset.face ?? "?",
        widthMm: rect.width / MM,
        heightMm: rect.height / MM,
        overflowPx: card.scrollHeight - card.clientHeight,
        escapes,
        overlaps,
      });
    }
    return reports;
  });

  expect(reports.length).toBeGreaterThan(900); // fronts + backs of every card

  const badSize = reports.filter(
    (r) => Math.abs(r.widthMm - 63) > 0.2 || Math.abs(r.heightMm - 88) > 0.2,
  );
  expect(badSize.map((r) => `${r.id}/${r.face}: ${r.widthMm} x ${r.heightMm}mm`)).toEqual([]);

  const overflowing = reports.filter((r) => r.overflowPx > 1);
  expect(overflowing.map((r) => `${r.id}/${r.face}: +${r.overflowPx}px`)).toEqual([]);

  const escaping = reports.filter((r) => r.escapes.length > 0);
  expect(escaping.map((r) => `${r.id}/${r.face}: ${r.escapes.join(", ")}`)).toEqual([]);

  const overlapping = reports.filter((r) => r.overlaps.length > 0);
  expect(overlapping.map((r) => `${r.id}/${r.face}: ${r.overlaps.join("; ")}`)).toEqual([]);
});

test("cards on a page abut without overlapping each other", async ({ page }) => {
  // Cards share edges so one cut separates two of them, so touching is the
  // expected result here and only a real overlap - one card's content sitting
  // on top of another's - is a failure. Sub-pixel rounding of the mm-based
  // grid track positions means "touching" is never exactly 0, hence TOUCH.
  const collisions = await page.evaluate<string[]>(() => {
    const TOUCH = 0.5; // px
    const collisions: string[] = [];
    for (const sheet of document.querySelectorAll(".card-page")) {
      const cards = [...sheet.querySelectorAll(".unit-card")];
      const rects = cards.map((c) => c.getBoundingClientRect());
      for (let i = 0; i < rects.length; i++) {
        for (let j = i + 1; j < rects.length; j++) {
          const a = rects[i];
          const b = rects[j];
          const overlapX = Math.min(a.right, b.right) - Math.max(a.left, b.left);
          const overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
          if (overlapX > TOUCH && overlapY > TOUCH) {
            collisions.push(
              `${(cards[i] as HTMLElement).dataset.card} x ${(cards[j] as HTMLElement).dataset.card}` +
                ` (${overlapX.toFixed(2)} x ${overlapY.toFixed(2)}px)`,
            );
          }
        }
      }
    }
    return collisions;
  });
  expect(collisions).toEqual([]);
});

test("the 3 x 3 grid is 189 x 264mm of edge-to-edge cards", async ({ page }) => {
  // The block has to stay this size: it is what fits three 88mm rows on US
  // Letter (279.4mm) once PAPER_SIZES' 6mm margins are taken off.
  const grid = await page.evaluate(() => {
    const MM = 96 / 25.4;
    const page1 = document.querySelector<HTMLElement>('[data-page="front-0"]')!;
    const cards = [...page1.querySelectorAll<HTMLElement>(".unit-card")];
    const rects = cards.map((c) => c.getBoundingClientRect());
    const left = Math.min(...rects.map((r) => r.left));
    const right = Math.max(...rects.map((r) => r.right));
    const top = Math.min(...rects.map((r) => r.top));
    const bottom = Math.max(...rects.map((r) => r.bottom));
    // Gutters between neighbours in the 3-wide grid: card 1 sits beside card
    // 0, card 3 sits below it.
    const gapX = rects[1].left - rects[0].right;
    const gapY = rects[3].top - rects[0].bottom;
    return {
      cards: cards.length,
      widthMm: (right - left) / MM,
      heightMm: (bottom - top) / MM,
      gapXmm: gapX / MM,
      gapYmm: gapY / MM,
    };
  });
  expect(grid.cards).toBe(9);
  expect(grid.widthMm).toBeCloseTo(189, 1);
  expect(grid.heightMm).toBeCloseTo(264, 1);
  expect(grid.gapXmm).toBeCloseTo(0, 1);
  expect(grid.gapYmm).toBeCloseTo(0, 1);
});

test("back pages mirror front pages for long-edge duplex printing", async ({ page }) => {
  const errors = await page.evaluate<DuplexReport[]>(() => {
    const errors: DuplexReport[] = [];
    const pairs = [...document.querySelectorAll(".card-page-pair")];
    pairs.forEach((pair, pageIndex) => {
      const front = pair.querySelector('[data-page^="front"]')!;
      const back = pair.querySelector('[data-page^="back"]')!;
      const fr = front.getBoundingClientRect();
      const br = back.getBoundingClientRect();
      const frontCards = [...front.querySelectorAll(".unit-card")];
      const backCards = [...back.querySelectorAll(".unit-card")];
      if (frontCards.length !== backCards.length) {
        errors.push({ page: pageIndex, slot: -1, dx: NaN, dy: NaN });
        return;
      }
      frontCards.forEach((fc, k) => {
        const f = fc.getBoundingClientRect();
        const b = backCards[k].getBoundingClientRect();
        // When the sheet is flipped on its long edge the back face of the
        // card at x lands at (pageWidth - x); rows keep their vertical spot.
        const frontCx = (f.left + f.right) / 2 - fr.left;
        const backCxMirrored = fr.width - ((b.left + b.right) / 2 - br.left);
        const dx = frontCx - backCxMirrored;
        const dy = f.top - fr.top - (b.top - br.top);
        if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
          errors.push({ page: pageIndex, slot: k, dx, dy });
        }
      });
    });
    return errors;
  });
  expect(errors).toEqual([]);
});

test("long rules continue on the back; short cards get the logo back", async ({ page }) => {
  // The Orcs Giant has the longest special rules in the game — its text must
  // flow onto the back face and still fit there.
  const giant = await page.evaluate(() => {
    const front = document.querySelector<HTMLElement>('[data-card="orcs:giant"][data-face="front"]');
    const back = document.querySelector<HTMLElement>('[data-card="orcs:giant"][data-face="back"]');
    return {
      frontExists: front != null,
      backHasRules: back != null && !back.classList.contains("card-back-logo") && back.querySelectorAll(".card-rule").length > 0,
      frontMarksContinuation: front?.querySelector(".card-continued") != null,
    };
  });
  expect(giant).toEqual({ frontExists: true, backHasRules: true, frontMarksContinuation: true });

  // A short-rules unit gets the Warmuster logo back.
  const logoBack = page.locator('[data-card="chaos:chaos-warriors"][data-face="back"]');
  await expect(logoBack).toHaveClass(/card-back-logo/);
  await expect(logoBack).toHaveText("Warmuster");
});

test("printing from the app produces exactly one sheet per card page, no blanks", async ({ page }) => {
  // Drive the real print flow: seeded list -> export dialog -> card preview.
  // Printing once produced 7 pages for a 2-pair sheet because the hidden app
  // behind the overlay kept its layout height (blank leading pages) and the
  // 3 x 88mm rows only just fit the printable height - still true on Letter,
  // which the paper-size test below covers.
  const list = {
    id: "print-test",
    schemaVersion: 1,
    ruleSet: "warmaster-revolution",
    ruleVersion: "2.2.6",
    army: "empire",
    name: "Print Test",
    pointsLimit: 2000,
    notes: null,
    updatedAt: new Date().toISOString(),
    characters: [
      { id: "c1", unitId: "empire:general", upgrades: ["empire:griffon"], magicItems: [] },
      { id: "c2", unitId: "empire:wizard", upgrades: [], magicItems: [] },
    ],
    units: [
      { unitId: "empire:halberdiers", quantity: 4, upgrades: [], magicItems: [] },
      { unitId: "empire:crossbowmen", quantity: 2, upgrades: [], magicItems: [] },
      { unitId: "empire:knights", quantity: 2, upgrades: [], magicItems: [] },
      { unitId: "empire:cannon", quantity: 1, upgrades: [], magicItems: [] },
      { unitId: "empire:helblaster", quantity: 1, upgrades: [], magicItems: [] },
      { unitId: "empire:skirmishers", quantity: 1, upgrades: [], magicItems: [] },
      { unitId: "empire:pistoliers", quantity: 1, upgrades: [], magicItems: [] },
      { unitId: "empire:flagellants", quantity: 1, upgrades: [], magicItems: [] },
    ],
  };
  await page.addInitScript((l) => {
    localStorage.setItem("warmuster.lists.v1", JSON.stringify([l]));
  }, list);
  await page.goto("/");
  await page.getByText("Print Test").click();
  await page.getByRole("button", { name: /export/i }).click();
  await page.getByRole("button", { name: /cards/i }).click();
  await page.waitForSelector(".card-page");
  await page.evaluate(() => document.fonts.ready);

  const pairs = await page.locator(".card-page-pair").count();
  expect(pairs).toBeGreaterThan(1); // the scenario must span multiple sheets

  const pdf = await page.pdf({ preferCSSPageSize: true });
  const pdfPages = pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g)?.length ?? 0;
  expect(pdfPages).toBe(pairs * 2); // front sheet + back sheet per pair

  // Duplex calibration: changing the back-side offset shifts every back page
  // horizontally by exactly the delta (3mm here), fronts stay put.
  const offsetField = page.getByLabel(/back-side offset/i);
  await offsetField.fill("0");
  const before = await page.locator(".card-page-back").first().boundingBox();
  await offsetField.fill("3");
  const after = await page.locator(".card-page-back").first().boundingBox();
  const mmPx = 96 / 25.4;
  expect(after!.x - before!.x).toBeCloseTo(3 * mmPx, 0);
});

test("each paper size prints its own sheet, so cards are never scaled down", async ({ page }) => {
  // The bug this guards: the sheet was always declared A4, so printing it on
  // US Letter made the browser shrink everything to 279.4/297 = 94% and the
  // 63 x 88mm cards came out 59 x 83mm. Picking the paper in the toolbar has
  // to change the @page size, and 3 x 3 cards must still fit each sheet.
  const list = {
    id: "paper-test",
    schemaVersion: 1,
    ruleSet: "warmaster-revolution",
    ruleVersion: "2.2.6",
    army: "empire",
    name: "Paper Test",
    pointsLimit: 2000,
    notes: null,
    updatedAt: new Date().toISOString(),
    characters: [],
    units: [
      { unitId: "empire:halberdiers", quantity: 4, upgrades: [], magicItems: [] },
      { unitId: "empire:crossbowmen", quantity: 3, upgrades: [], magicItems: [] },
      { unitId: "empire:knights", quantity: 2, upgrades: [], magicItems: [] },
    ],
  };
  await page.addInitScript((l) => {
    localStorage.setItem("warmuster.lists.v1", JSON.stringify([l]));
  }, list);
  await page.goto("/");
  await page.getByText("Paper Test").click();
  await page.getByRole("button", { name: /export/i }).click();
  await page.getByRole("button", { name: /cards/i }).click();
  await page.waitForSelector(".card-page");
  await page.evaluate(() => document.fonts.ready);

  // PDF MediaBox is in points (1/72in); 1mm = 72/25.4pt.
  const PT = 72 / 25.4;
  const paperMm = { A4: [210, 297], "US Letter": [215.9, 279.4] };
  for (const [label, [wMm, hMm]] of Object.entries(paperMm)) {
    await page.getByLabel(/paper size/i).selectOption({ label });
    const pdf = await page.pdf({ preferCSSPageSize: true });
    const box = pdf.toString("latin1").match(/\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)/);
    expect(box, `${label}: no MediaBox in the PDF`).not.toBeNull();
    expect(Number(box![1]), `${label} width`).toBeCloseTo(wMm * PT, 0);
    expect(Number(box![2]), `${label} height`).toBeCloseTo(hMm * PT, 0);
    // 264mm of card rows plus the margins must still leave one sheet per page
    // pair - if the rows spilled, the PDF would gain pages.
    const pairs = await page.locator(".card-page-pair").count();
    const pdfPages = pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g)?.length ?? 0;
    expect(pdfPages, `${label}: rows must not spill onto extra sheets`).toBe(pairs * 2);
  }
});

test("the card gap opens a gutter, clamped to what the paper still fits", async ({ page }) => {
  const list = {
    id: "gutter-test",
    schemaVersion: 1,
    ruleSet: "warmaster-revolution",
    ruleVersion: "2.2.6",
    army: "empire",
    name: "Gutter Test",
    pointsLimit: 2000,
    notes: null,
    updatedAt: new Date().toISOString(),
    characters: [
      { id: "c1", unitId: "empire:general", upgrades: [], magicItems: [] },
      { id: "c2", unitId: "empire:wizard", upgrades: [], magicItems: [] },
    ],
    units: [
      { unitId: "empire:halberdiers", quantity: 4, upgrades: [], magicItems: [] },
      { unitId: "empire:crossbowmen", quantity: 3, upgrades: [], magicItems: [] },
      { unitId: "empire:knights", quantity: 2, upgrades: [], magicItems: [] },
      { unitId: "empire:cannon", quantity: 1, upgrades: [], magicItems: [] },
      { unitId: "empire:helblaster", quantity: 1, upgrades: [], magicItems: [] },
      { unitId: "empire:pistoliers", quantity: 1, upgrades: [], magicItems: [] },
      { unitId: "empire:flagellants", quantity: 1, upgrades: [], magicItems: [] },
    ],
  };
  await page.addInitScript((l) => {
    localStorage.setItem("warmuster.lists.v1", JSON.stringify([l]));
  }, list);
  await page.goto("/");
  await page.getByText("Gutter Test").click();
  await page.getByRole("button", { name: /export/i }).click();
  await page.getByRole("button", { name: /cards/i }).click();
  await page.waitForSelector(".card-page");
  await page.evaluate(() => document.fonts.ready);

  const gutters = () =>
    page.evaluate(() => {
      const MM = 96 / 25.4;
      const cards = [
        ...document.querySelector('[data-page="front-0"]')!.querySelectorAll(".unit-card"),
      ].map((c) => c.getBoundingClientRect());
      return {
        x: +((cards[1].left - cards[0].right) / MM).toFixed(2),
        y: +((cards[3].top - cards[0].bottom) / MM).toFixed(2),
      };
    });
  const sheets = async () => {
    const pdf = await page.pdf({ preferCSSPageSize: true });
    return pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g)?.length ?? 0;
  };

  const paper = page.getByLabel(/paper size/i);
  const gap = page.getByLabel(/card gap/i);
  const pairs = await page.locator(".card-page-pair").count();

  // Default is edge to edge.
  expect(await gutters()).toEqual({ x: 0, y: 0 });

  // A4 takes the widest gutter without gaining a sheet.
  await paper.selectOption({ label: "A4" });
  await gap.fill("4.5");
  await gap.blur();
  expect(await gutters()).toEqual({ x: 4.5, y: 4.5 });
  expect(await sheets(), "A4 at its max gutter must still be one sheet per page").toBe(pairs * 2);

  // Letter has 1.7mm of slack for 3 rows, so it pulls the gutter back to 1.5
  // rather than pushing a row onto a fourth page.
  await paper.selectOption({ label: "US Letter" });
  expect(await gutters()).toEqual({ x: 1.5, y: 1.5 });
  expect(await sheets(), "Letter at its max gutter must still be one sheet per page").toBe(
    pairs * 2,
  );

  // The field cannot be pushed past that maximum by typing either.
  await gap.fill("9");
  await gap.blur();
  expect(await gutters()).toEqual({ x: 1.5, y: 1.5 });
});
