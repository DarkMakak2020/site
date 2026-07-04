// path-atmosphere.js — живые импульсы по глифам (хаб / КОД МЕСТА / Обо мне / Стратег / Коуч)
(function () {
  'use strict';

  var GOLD = [198, 167, 108];
  var CHAMP = [232, 221, 200];
  var EMERALD = [47, 122, 104];
  var CENTER = 0;

  function prefersReduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  function isMobile() {
    return window.matchMedia('(max-width: 900px)').matches;
  }

  function rgba(rgb, a) {
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
  }

  function easeFlow(t) {
    t = Math.max(0, Math.min(1, t));
    return t * t * (3 - 2 * t);
  }

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = (Math.random() * (i + 1)) | 0;
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function ringIndex(ring, node) {
    for (var i = 0; i < ring.length; i++) {
      if (ring[i] === node) return i;
    }
    return -1;
  }

  function walkRing(ring, from, steps, dir) {
    var idx = ringIndex(ring, from);
    if (idx === -1) return [from];
    var path = [from];
    for (var s = 0; s < steps; s++) {
      idx = (idx + dir + ring.length) % ring.length;
      path.push(ring[idx]);
    }
    return path;
  }

  function joinPaths(prefix, tail) {
    if (!tail.length) return prefix.slice();
    if (prefix[prefix.length - 1] === tail[0]) return prefix.concat(tail.slice(1));
    return prefix.concat(tail);
  }

  function buildAdjacency(edges, nodeCount) {
    var adj = [];
    for (var i = 0; i < nodeCount; i++) adj.push([]);
    edges.forEach(function (pair) {
      var a = pair[0];
      var b = pair[1];
      if (adj[a].indexOf(b) === -1) adj[a].push(b);
      if (adj[b].indexOf(a) === -1) adj[b].push(a);
    });
    return adj;
  }

  function buildSpawnPool(nodes) {
    var pool = [];
    nodes.forEach(function (n, i) {
      if (i === CENTER) return;
      var w = n.tier === 1 ? 3 : n.tier === 2 ? 2 : 1;
      for (var k = 0; k < w; k++) pool.push(i);
    });
    return pool;
  }

  function makeOrbitNodes(outerR, innerR, count, cx, cy) {
    var nodes = [{ x: cx, y: cy, tier: 0, r: 5.5 }];
    var i;
    for (i = 0; i < count; i++) {
      var ang = -Math.PI / 2 + (i / count) * Math.PI * 2;
      nodes.push({
        x: cx + outerR * Math.cos(ang),
        y: cy + outerR * Math.sin(ang),
        tier: 1,
        r: 3.1
      });
    }
    for (i = 0; i < count; i++) {
      var ang2 = -Math.PI / 2 + (i / count) * Math.PI * 2;
      nodes.push({
        x: cx + innerR * Math.cos(ang2),
        y: cy + innerR * Math.sin(ang2),
        tier: 2,
        r: 2.3
      });
    }
    return nodes;
  }

  function makeOrbitEdges(count) {
    var edges = [];
    var i;
    for (i = 1; i <= count; i++) {
      edges.push([CENTER, i]);
      edges.push([CENTER, count + i]);
      edges.push([i, count + i]);
    }
    for (i = 1; i < count; i++) {
      edges.push([i, i + 1]);
      edges.push([count + i, count + i + 1]);
    }
    edges.push([count, 1]);
    edges.push([count + count, count + 1]);
    return edges;
  }

  var GRAPHS = {
    diamond: {
      id: 'diamond',
      glow: 0.38,
      nodes: [
        { x: 150, y: 150, tier: 0, r: 5.5 },
        { x: 150, y: 20, tier: 1, r: 3.4 },
        { x: 280, y: 150, tier: 1, r: 3.4 },
        { x: 150, y: 280, tier: 1, r: 3.4 },
        { x: 20, y: 150, tier: 1, r: 3.4 },
        { x: 244, y: 56, tier: 1, r: 2.8 },
        { x: 56, y: 56, tier: 1, r: 2.8 },
        { x: 244, y: 244, tier: 1, r: 2.8 },
        { x: 56, y: 244, tier: 1, r: 2.8 },
        { x: 150, y: 55, tier: 2, r: 2.3 },
        { x: 245, y: 150, tier: 2, r: 2.3 },
        { x: 150, y: 245, tier: 2, r: 2.3 },
        { x: 55, y: 150, tier: 2, r: 2.3 },
        { x: 150, y: 90, tier: 3, r: 1.9 },
        { x: 210, y: 150, tier: 3, r: 1.9 },
        { x: 150, y: 210, tier: 3, r: 1.9 },
        { x: 90, y: 150, tier: 3, r: 1.9 }
      ],
      edges: [
        [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7], [0, 8],
        [1, 5], [5, 2], [2, 7], [7, 3], [3, 8], [8, 4], [4, 6], [6, 1],
        [9, 10], [10, 11], [11, 12], [12, 9],
        [0, 9], [0, 10], [0, 11], [0, 12], [0, 13], [0, 14], [0, 15], [0, 16]
      ],
      outerRing: [1, 5, 2, 7, 3, 8, 4, 6],
      innerRing: [9, 10, 11, 12],
      mode: 'diamond'
    },
    'diamond-simple': {
      id: 'diamond-simple',
      glow: 0.36,
      nodes: [
        { x: 150, y: 150, tier: 0, r: 5.5 },
        { x: 150, y: 20, tier: 1, r: 3.4 },
        { x: 280, y: 150, tier: 1, r: 3.4 },
        { x: 150, y: 280, tier: 1, r: 3.4 },
        { x: 20, y: 150, tier: 1, r: 3.4 },
        { x: 150, y: 90, tier: 2, r: 2.5 },
        { x: 210, y: 150, tier: 2, r: 2.5 },
        { x: 150, y: 210, tier: 2, r: 2.5 },
        { x: 90, y: 150, tier: 2, r: 2.5 }
      ],
      edges: [
        [0, 1], [0, 2], [0, 3], [0, 4],
        [0, 5], [0, 6], [0, 7], [0, 8],
        [1, 2], [2, 3], [3, 4], [4, 1],
        [5, 6], [6, 7], [7, 8], [8, 5],
        [1, 5], [2, 6], [3, 7], [4, 8]
      ],
      outerRing: [1, 2, 3, 4],
      innerRing: [5, 6, 7, 8],
      mode: 'diamond'
    },
    orbit: (function () {
      var count = 8;
      var nodes = makeOrbitNodes(110, 70, count, 150, 150);
      return {
        id: 'orbit',
        glow: 0.42,
        nodes: nodes,
        edges: makeOrbitEdges(count),
        outerRing: [1, 2, 3, 4, 5, 6, 7, 8],
        innerRing: [9, 10, 11, 12, 13, 14, 15, 16],
        orbitCount: count,
        mode: 'orbit'
      };
    })(),
    'systems-code': {
      id: 'systems-code',
      glow: 0.36,
      nodes: [
        { x: 150, y: 150, tier: 0, r: 5.5 },
        { x: 150, y: 38, tier: 1, r: 3.2 },
        { x: 262, y: 150, tier: 1, r: 3.2 },
        { x: 150, y: 262, tier: 1, r: 3.2 },
        { x: 38, y: 150, tier: 1, r: 3.2 },
        { x: 150, y: 88, tier: 2, r: 2.3 },
        { x: 212, y: 150, tier: 2, r: 2.3 },
        { x: 150, y: 212, tier: 2, r: 2.3 },
        { x: 88, y: 150, tier: 2, r: 2.3 }
      ],
      edges: [
        [1, 2], [2, 3], [3, 4], [4, 1],
        [5, 6], [6, 7], [7, 8], [8, 5],
        [1, 5], [2, 6], [3, 7], [4, 8],
        [0, 5], [0, 6], [0, 7], [0, 8]
      ],
      outerRing: [1, 2, 3, 4],
      innerRing: [5, 6, 7, 8],
      mode: 'diamond',
      hideCenterEdges: true
    },
    'place-layers': (function () {
      var count = 5;
      var nodes = makeOrbitNodes(118, 78, count, 150, 150);
      return {
        id: 'place-layers',
        glow: 0.4,
        nodes: nodes,
        edges: makeOrbitEdges(count),
        outerRing: [1, 2, 3, 4, 5],
        innerRing: [6, 7, 8, 9, 10],
        orbitCount: count,
        mode: 'orbit',
        hideCenterEdges: true
      };
    })(),
    'roles-six': (function () {
      var count = 6;
      var nodes = makeOrbitNodes(118, 78, count, 150, 150);
      return {
        id: 'roles-six',
        glow: 0.38,
        nodes: nodes,
        edges: makeOrbitEdges(count),
        outerRing: [1, 2, 3, 4, 5, 6],
        innerRing: [7, 8, 9, 10, 11, 12],
        orbitCount: count,
        mode: 'orbit',
        hideCenterEdges: true
      };
    })()
  };

  Object.keys(GRAPHS).forEach(function (key) {
    var g = GRAPHS[key];
    g.adj = buildAdjacency(g.edges, g.nodes.length);
    g.spawnPool = buildSpawnPool(g.nodes);
  });

  function pathToCenter(from, g) {
    if (from === CENTER) return [CENTER];
    var q = [[from]];
    var seen = Object.create(null);
    seen[from] = true;
    while (q.length) {
      var path = q.shift();
      var node = path[path.length - 1];
      var nbs = g.adj[node].slice();
      shuffle(nbs);
      for (var i = 0; i < nbs.length; i++) {
        var nb = nbs[i];
        if (seen[nb]) continue;
        seen[nb] = true;
        var next = path.concat(nb);
        if (nb === CENTER) return next;
        q.push(next);
      }
    }
    return [from, CENTER];
  }

  function pathTailToCenter(from, g) {
    if (from === CENTER) return [CENTER];
    var viaInner = g.adj[from].filter(function (n) {
      return n !== CENTER && ringIndex(g.innerRing, n) !== -1;
    });
    if (viaInner.length && Math.random() > 0.2) {
      var mid = viaInner[(Math.random() * viaInner.length) | 0];
      return [from, mid, CENTER];
    }
    return pathToCenter(from, g);
  }

  function pairedInner(outerNode, g) {
    if (g.mode !== 'orbit' || outerNode < 1 || outerNode > g.orbitCount) return null;
    return outerNode + g.orbitCount;
  }

  function buildPulsePath(start, g) {
    var scenic = Math.random() < 0.7;
    if (!scenic) {
      if (g.mode === 'orbit' && start >= 1 && start <= g.orbitCount) {
        var inner = pairedInner(start, g);
        if (inner && Math.random() > 0.35) return [start, inner, CENTER];
      }
      return pathToCenter(start, g);
    }

    var outerIdx = ringIndex(g.outerRing, start);
    if (outerIdx !== -1) {
      var steps = 1 + ((Math.random() * 3) | 0);
      var dir = Math.random() > 0.5 ? 1 : -1;
      var prefix = walkRing(g.outerRing, start, steps, dir);
      var end = prefix[prefix.length - 1];
      if (g.mode === 'orbit') {
        var innerNode = pairedInner(end, g);
        return joinPaths(prefix, [end, innerNode, CENTER]);
      }
      return joinPaths(prefix, pathTailToCenter(end, g));
    }

    var innerIdx = ringIndex(g.innerRing, start);
    if (innerIdx !== -1) {
      var iSteps = 1 + ((Math.random() * 2) | 0);
      var iDir = Math.random() > 0.5 ? 1 : -1;
      var iPrefix = walkRing(g.innerRing, start, iSteps, iDir);
      return joinPaths(iPrefix, [iPrefix[iPrefix.length - 1], CENTER]);
    }

    return pathToCenter(start, g);
  }

  function edgeMatch(a, b, x, y) {
    return (a === x && b === y) || (a === y && b === x);
  }

  function PathCanvas(canvas, graph) {
    this.canvas = canvas;
    this.graph = graph;
    this.ctx = canvas.getContext('2d', { alpha: true });
    this.running = false;
    this.visible = false;
    this.dpr = 1;
    this.w = 0;
    this.h = 0;
    this.t0 = performance.now();
    this.lastNow = 0;
    this.pulses = [];
    this.nextPulse = 0;
    this._onResize = this.resize.bind(this);
    this._loop = this.loop.bind(this);

    this.resize();
    window.addEventListener('resize', this._onResize, { passive: true });

    var self = this;
    this.io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        self.visible = e.isIntersecting;
        if (self.visible) self.start();
        else self.stop();
      });
    }, { threshold: 0.08, rootMargin: '40px 0px' });
    this.io.observe(canvas);

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) self.stop();
      else if (self.visible) self.start();
    });
  }

  PathCanvas.prototype.resize = function () {
    var rect = this.canvas.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = rect.width;
    this.h = rect.height;
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  };

  PathCanvas.prototype.start = function () {
    if (this.running) return;
    this.running = true;
    this.t0 = performance.now();
    this.lastNow = this.t0;
    requestAnimationFrame(this._loop);
  };

  PathCanvas.prototype.stop = function () {
    this.running = false;
    this.lastNow = 0;
  };

  PathCanvas.prototype.spawnPulse = function () {
    var g = this.graph;
    var start = g.spawnPool[(Math.random() * g.spawnPool.length) | 0];
    var path = buildPulsePath(start, g);
    if (path.length < 2) return;
    this.pulses.push({
      path: path,
      seg: 0,
      t: 0,
      speed: 0.00017 + Math.random() * 0.00009,
      phase: null
    });
    if (this.pulses.length > 5) this.pulses.shift();
  };

  PathCanvas.prototype.advancePulse = function (p) {
    var toNode = p.path[p.seg + 1];
    if (toNode === CENTER) {
      p.phase = { kind: 'arrive', node: CENTER, t: 0 };
      p.t = 1;
      return;
    }
    if (p.seg + 2 < p.path.length && Math.random() < 0.38) {
      p.phase = { kind: 'stop', node: toNode, t: 0 };
      p.t = 1;
      return;
    }
    p.seg += 1;
    p.t = 0;
  };

  PathCanvas.prototype.pulseBoostOnEdge = function (p, nA, nB) {
    if (p.phase) return 0;
    var from = p.path[p.seg];
    var to = p.path[p.seg + 1];
    if (!edgeMatch(from, to, nA, nB)) return 0;
    return 1 - Math.abs(easeFlow(Math.min(1, p.t)) - 0.5) * 2;
  };

  PathCanvas.prototype.drawPulseGlow = function (x, y, alpha, radius) {
    var g = this.ctx.createRadialGradient(x, y, 0, x, y, radius);
    g.addColorStop(0, rgba(CHAMP, 0.55 * alpha));
    g.addColorStop(0.35, rgba(GOLD, 0.22 * alpha));
    g.addColorStop(1, 'rgba(0,0,0,0)');
    this.ctx.fillStyle = g;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = rgba(CHAMP, 0.9 * alpha);
    this.ctx.beginPath();
    this.ctx.arc(x, y, 1.8, 0, Math.PI * 2);
    this.ctx.fill();
  };

  PathCanvas.prototype.loop = function (now) {
    if (!this.running) return;
    if (!this.lastNow) this.lastNow = now;
    var dt = Math.min(48, now - this.lastNow);
    this.lastNow = now;
    var t = (now - this.t0) * 0.001;
    this.ctx.clearRect(0, 0, this.w, this.h);

    if (now > this.nextPulse) {
      this.spawnPulse();
      this.nextPulse = now + 3000 + Math.random() * 3200;
    }

    this.pulses = this.pulses.filter(function (p) {
      if (p.phase) {
        p.phase.t += dt;
        if (p.phase.kind === 'stop' && p.phase.t > 560) return false;
        if (p.phase.kind === 'arrive' && p.phase.t > 420) return false;
        return true;
      }
      p.t += p.speed * dt;
      if (p.t >= 1) this.advancePulse(p);
      return true;
    }, this);

    this.drawGlyph(t);
    requestAnimationFrame(this._loop);
  };

  PathCanvas.prototype.drawGlyph = function (t) {
    var g = this.graph;
    var size = Math.min(this.w, this.h);
    var scale = size / 300;
    var ox = (this.w - 300 * scale) * 0.5;
    var oy = (this.h - 300 * scale) * 0.5;
    var cx = ox + 150 * scale;
    var cy = oy + 150 * scale;

    var grd = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, size * g.glow);
    grd.addColorStop(0, rgba(EMERALD, 0.07));
    grd.addColorStop(0.55, rgba(EMERALD, 0.02));
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    this.ctx.fillStyle = grd;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, size * g.glow, 0, Math.PI * 2);
    this.ctx.fill();

    var pts = g.nodes.map(function (n) {
      return {
        x: ox + n.x * scale,
        y: oy + n.y * scale,
        tier: n.tier,
        r: n.r * scale * 0.85,
        phase: n.x * 0.017 + n.y * 0.013
      };
    });

    this.ctx.lineCap = 'round';
    g.edges.forEach(function (pair) {
      if (g.hideCenterEdges && (pair[0] === CENTER || pair[1] === CENTER)) return;
      if (g.hideRingEdges && pair[0] !== CENTER && pair[1] !== CENTER) return;
      var a = pts[pair[0]];
      var b = pts[pair[1]];
      var pulseBoost = 0;
      for (var i = 0; i < this.pulses.length; i++) {
        pulseBoost = Math.max(pulseBoost, this.pulseBoostOnEdge(this.pulses[i], pair[0], pair[1]));
      }
      var alpha = 0.08 + pulseBoost * 0.16;
      this.ctx.strokeStyle = rgba(GOLD, alpha);
      this.ctx.lineWidth = 0.65 + pulseBoost * 0.55;
      this.ctx.beginPath();
      this.ctx.moveTo(a.x, a.y);
      this.ctx.lineTo(b.x, b.y);
      this.ctx.stroke();
    }, this);

    this.pulses.forEach(function (p) {
      if (p.phase) {
        var node = pts[p.phase.node];
        if (p.phase.kind === 'stop') {
          var fade = 1 - p.phase.t / 560;
          this.drawPulseGlow(node.x, node.y, fade * 0.85, 11);
        } else {
          var burst = p.phase.t < 120 ? p.phase.t / 120 : 1 - (p.phase.t - 120) / 300;
          this.drawPulseGlow(node.x, node.y, Math.max(0, burst), 10 + burst * 8);
        }
        return;
      }
      var from = pts[p.path[p.seg]];
      var to = pts[p.path[p.seg + 1]];
      var tt = easeFlow(Math.min(1, p.t));
      var x = from.x + (to.x - from.x) * tt;
      var y = from.y + (to.y - from.y) * tt;
      this.drawPulseGlow(x, y, 1, 14);
    }, this);

    pts.forEach(function (p, idx) {
      if (g.hidePeripheralNodes && idx !== CENTER) return;
      var pulse = 0.5 + 0.5 * Math.sin(t * (p.tier === 0 ? 1.1 : 1.7) + p.phase);
      var baseR = p.r * (p.tier === 0 ? 1 + pulse * 0.18 : 1 + pulse * 0.12);
      var alpha = p.tier === 0 ? 0.85 : p.tier === 1 ? 0.65 : p.tier === 2 ? 0.5 : 0.38;
      var rgb = p.tier === 0 ? CHAMP : GOLD;

      var glow = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, baseR * 4.2);
      glow.addColorStop(0, rgba(rgb, alpha * 0.55));
      glow.addColorStop(0.4, rgba(GOLD, alpha * 0.15));
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      this.ctx.fillStyle = glow;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, baseR * 4.2, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = rgba(rgb, alpha);
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, baseR, 0, Math.PI * 2);
      this.ctx.fill();
    }, this);
  };

  function initPathAtmosphere() {
    if (prefersReduced() || isMobile()) return;
    document.querySelectorAll('.path-atmosphere--glyph').forEach(function (el) {
      if (el.dataset.pathReady) return;
      var graphId = el.getAttribute('data-path-graph') || 'diamond';
      var graph = GRAPHS[graphId];
      if (!graph) return;
      el.dataset.pathReady = '1';
      new PathCanvas(el, graph);
    });
  }

  window.initPathAtmosphere = initPathAtmosphere;
})();
