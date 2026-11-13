/*
 * Budgetly demo kit — timeline helpers shared by every scene.
 *
 * Everything here is a pure function of timeline time: no timers, no clock,
 * no unseeded randomness. Helpers add tweens to the timeline you pass in and
 * return the time at which their action ends, so calls can be chained.
 */
(function () {
  var W = 1600;
  var H = 1000;

  /* Currency: the one place demos decide how money is written.
     Mirrors DEFAULT_CURRENCY in lib/currency.ts. */
  var CURRENCY = { symbol: '£', locale: 'en-GB' };

  function money(value, opts) {
    opts = opts || {};
    var abs = Math.abs(value);
    var whole = Math.round(abs * 100) % 100 === 0;
    var digits = opts.decimals === 'never' || (opts.decimals === 'auto' && whole) ? 0 : 2;
    var sign = value < 0 ? '-' : opts.signed && value > 0 ? '+' : '';
    return (
      sign +
      CURRENCY.symbol +
      abs.toLocaleString(CURRENCY.locale, {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      })
    );
  }

  /* Seeded PRNG so "human" timing is identical on every render. */
  function prng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function $(sel, scope) {
    return typeof sel === 'string' ? (scope || document).querySelector(sel) : sel;
  }

  /* Layout position of an element inside `cam`, ignoring transforms.
     Measured once, before any tween is built. */
  function box(el, cam) {
    el = $(el);
    cam = $(cam);
    var x = 0;
    var y = 0;
    var node = el;
    while (node && node !== cam) {
      x += node.offsetLeft;
      y += node.offsetTop;
      node = node.offsetParent;
    }
    return { x: x, y: y, w: el.offsetWidth, h: el.offsetHeight, cx: x + el.offsetWidth / 2, cy: y + el.offsetHeight / 2 };
  }

  /* Point inside an element: ax/ay are 0–1 anchors (default centre). */
  function point(el, cam, ax, ay) {
    var b = box(el, cam);
    return { x: b.x + b.w * (ax == null ? 0.5 : ax), y: b.y + b.h * (ay == null ? 0.5 : ay) };
  }

  /* ── Cursor ──────────────────────────────────────────────────────────────── */

  /* The arrow's tip is at (9, 6) of its 44px box. */
  var TIP_X = 9;
  var TIP_Y = 6;

  /* Where the cursor rests when the scene opens. */
  function cursorSet(cursor, pt) {
    gsap.set(cursor, { x: pt.x - TIP_X, y: pt.y - TIP_Y });
  }

  /* Things that start hidden. Immediate, so frame 0 is already correct. */
  function hidden(targets) {
    gsap.set(targets, { opacity: 0 });
  }

  /* Move the cursor tip to a point. x and y ease slightly differently so the
     path bends like a hand rather than tracing a ruler line. */
  function cursorTo(tl, cursor, pt, at, dur) {
    dur = dur || 0.7;
    tl.to(cursor, { x: pt.x - TIP_X, duration: dur, ease: 'power2.inOut' }, at);
    tl.to(cursor, { y: pt.y - TIP_Y, duration: dur, ease: 'power3.inOut' }, at);
    return at + dur;
  }

  /* Click: the arrow dips, the target gives a little. No rings. */
  function press(tl, cursor, target, at) {
    var arrow = $(cursor).querySelector('svg');
    tl.to(arrow, { scale: 0.82, duration: 0.08, ease: 'power2.in' }, at);
    tl.to(arrow, { scale: 1, duration: 0.22, ease: 'power3.out' }, at + 0.08);
    if (target) {
      tl.to(target, { scale: 0.965, duration: 0.08, ease: 'power2.in' }, at);
      tl.to(target, { scale: 1, duration: 0.26, ease: 'power3.out' }, at + 0.08);
    }
    return at + 0.12;
  }

  /* ── Text ────────────────────────────────────────────────────────────────── */

  /* Type text into an element with an uneven, human rhythm. */
  function type(tl, el, text, at, opts) {
    el = $(el);
    opts = opts || {};
    var dur = text.length / (opts.cps || 9);
    var rnd = prng(opts.seed || text.length * 7919 + 13);
    var marks = [];
    var acc = 0;
    for (var i = 0; i < text.length; i++) {
      acc += 0.55 + rnd() * 0.9;
      marks.push(acc);
    }
    for (var j = 0; j < marks.length; j++) marks[j] /= acc;
    var state = { p: 0 };
    var prefix = opts.prefix || '';
    tl.fromTo(
      state,
      { p: 0 },
      {
        p: 1,
        duration: dur,
        ease: 'none',
        onUpdate: function () {
          var n = 0;
          while (n < marks.length && state.p >= marks[n] - 1e-6) n++;
          el.textContent = prefix + text.slice(0, n);
        },
      },
      at,
    );
    return at + dur;
  }

  /* Replace an element's text at a moment in time (seek-safe both ways). */
  function swapText(tl, el, before, after, at) {
    el = $(el);
    var state = { p: 0 };
    tl.fromTo(
      state,
      { p: 0 },
      {
        p: 1,
        duration: 0.001,
        ease: 'none',
        onUpdate: function () {
          el.textContent = state.p >= 1 ? after : before;
        },
      },
      at,
    );
  }

  /* Count a number from one value to another, formatted on every frame. */
  function count(tl, el, from, to, at, dur, format) {
    el = $(el);
    format = format || money;
    var state = { v: from };
    tl.fromTo(
      state,
      { v: from },
      {
        v: to,
        duration: dur || 0.9,
        ease: 'expo.out',
        onUpdate: function () {
          el.textContent = format(state.v);
        },
      },
      at,
    );
    return at + (dur || 0.9);
  }

  /* Blinking caret for a stretch of time. */
  function caret(tl, el, at, until) {
    var cycles = Math.max(1, Math.floor((until - at) / 0.5));
    tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.001 }, at);
    tl.fromTo(
      el,
      { opacity: 1 },
      { opacity: 0, duration: 0.5, ease: 'steps(1)', repeat: cycles - 1, yoyo: true, immediateRender: false },
      at + 0.5,
    );
    tl.set(el, { opacity: 0 }, until);
  }

  /* Focus ring fades in on a field. */
  function focus(tl, ring, at) {
    tl.fromTo(ring, { opacity: 0 }, { opacity: 1, duration: 0.16, ease: 'power2.out' }, at);
    return at + 0.16;
  }
  function blur(tl, ring, at) {
    tl.to(ring, { opacity: 0, duration: 0.12, ease: 'power2.out' }, at);
  }

  /* ── Surfaces ────────────────────────────────────────────────────────────── */

  function show(tl, el, at, opts) {
    opts = opts || {};
    tl.fromTo(
      el,
      { opacity: 0, scale: opts.scale == null ? 0.96 : opts.scale, y: opts.y == null ? 14 : opts.y },
      { opacity: 1, scale: 1, y: 0, duration: opts.dur || 0.34, ease: 'expo.out' },
      at,
    );
    return at + (opts.dur || 0.34);
  }
  function hide(tl, el, at, opts) {
    opts = opts || {};
    tl.to(el, { opacity: 0, scale: opts.scale == null ? 0.98 : opts.scale, y: opts.y == null ? 6 : opts.y, duration: opts.dur || 0.16, ease: 'power2.in' }, at);
    return at + (opts.dur || 0.16);
  }
  function fade(tl, el, from, to, at, dur) {
    tl.fromTo(el, { opacity: from }, { opacity: to, duration: dur || 0.2, ease: 'power2.out' }, at);
    return at + (dur || 0.2);
  }

  /* Progress bar fill as a fraction 0–1. The fill keeps its rounded end. */
  function bar(tl, fill, from, to, at, dur) {
    fill = $(fill);
    var state = { v: from };
    function apply() {
      fill.style.clipPath = 'inset(0 ' + (100 - state.v * 100).toFixed(3) + '% 0 0 round 5px)';
    }
    apply();
    tl.fromTo(state, { v: from }, { v: to, duration: dur || 0.9, ease: 'expo.out', onUpdate: apply }, at);
    return at + (dur || 0.9);
  }

  /* ── Camera ──────────────────────────────────────────────────────────────── */

  /* Frame a point at a scale without ever showing past the edge of the UI. */
  function frame(pt, scale) {
    var x = W / 2 - pt.x * scale;
    var y = H / 2 - pt.y * scale;
    x = Math.min(0, Math.max(W - W * scale, x));
    y = Math.min(0, Math.max(H - H * scale, y));
    return { x: x, y: y, scale: scale };
  }
  function camTo(tl, cam, pt, scale, at, dur) {
    var f = frame(pt, scale);
    tl.to(cam, { x: f.x, y: f.y, scale: f.scale, duration: dur || 0.9, ease: 'power2.inOut' }, at);
    return at + (dur || 0.9);
  }
  function camReset(tl, cam, at, dur) {
    tl.to(cam, { x: 0, y: 0, scale: 1, duration: dur || 0.9, ease: 'power2.inOut' }, at);
    return at + (dur || 0.9);
  }

  /* Scene open and close: the loop passes through the plain page colour. */
  function open(tl, cam, dur) {
    gsap.set(cam, { x: 0, y: 0, scale: 1 });
    tl.fromTo(cam, { opacity: 0 }, { opacity: 1, duration: dur || 0.35, ease: 'power2.out' }, 0);
  }
  function close(tl, cam, end, dur) {
    dur = dur || 0.28;
    tl.to(cam, { opacity: 0, duration: dur, ease: 'power2.in' }, end - dur - 0.04);
  }

  window.Kit = {
    W: W,
    H: H,
    CURRENCY: CURRENCY,
    money: money,
    prng: prng,
    box: box,
    point: point,
    cursorSet: cursorSet,
    hidden: hidden,
    cursorTo: cursorTo,
    press: press,
    type: type,
    swapText: swapText,
    count: count,
    caret: caret,
    focus: focus,
    blur: blur,
    show: show,
    hide: hide,
    fade: fade,
    bar: bar,
    frame: frame,
    camTo: camTo,
    camReset: camReset,
    open: open,
    close: close,
  };
})();
