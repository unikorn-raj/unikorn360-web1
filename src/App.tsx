import React, { useEffect, useRef, useState } from 'react';
import { AuthModal } from './components/AuthModal';
import { ClientPortalModal } from './components/ClientPortalModal';
import { getCurrentLocalUser, AuthUserProfile, saveEnquiry } from './lib/supabase';

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUserProfile | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isPortalOpen, setIsPortalOpen] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const preloaderRef = useRef<HTMLDivElement | null>(null);
  const preBarRef = useRef<HTMLElement | null>(null);
  const preNRef = useRef<HTMLSpanElement | null>(null);
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const cursorRingRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const burgerRef = useRef<HTMLButtonElement | null>(null);
  const dashRef = useRef<HTMLDivElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    // Load local auth user if present
    const user = getCurrentLocalUser();
    if (user) setCurrentUser(user);
  }, []);

  useEffect(() => {
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    // Remove no-js class
    document.body.classList.remove('no-js');

    // 1. Text splitting for character-by-character headline reveal
    const splitElements = document.querySelectorAll<HTMLElement>('[data-split]');
    if (!isReducedMotion) {
      splitElements.forEach((el) => {
        const text = el.textContent || '';
        el.textContent = '';
        const frag = document.createDocumentFragment();
        let n = 0;
        text.split(/(\s+)/).forEach((word) => {
          if (/^\s+$/.test(word)) {
            frag.appendChild(document.createTextNode(' '));
            return;
          }
          const wrap = document.createElement('span');
          wrap.style.display = 'inline-block';
          wrap.style.whiteSpace = 'nowrap';
          for (let i = 0; i < word.length; i++) {
            const s = document.createElement('span');
            s.className = 'ch';
            s.textContent = word[i];
            s.style.transitionDelay = `${n * 16}ms`;
            n++;
            wrap.appendChild(s);
          }
          frag.appendChild(wrap);
        });
        el.appendChild(frag);
      });
    }

    // 2. Preloader Animation & Start Page Hand-off
    const startPage = () => {
      const hero = document.querySelector('.hero');
      if (hero) {
        hero.querySelectorAll('.rv').forEach((el, i) => {
          setTimeout(() => {
            el.classList.add('in');
          }, 140 + i * 110);
        });
        const h1 = hero.querySelector('[data-split]');
        if (h1) setTimeout(() => h1.classList.add('in'), 90);
      }
    };

    const pre = preloaderRef.current;
    const preBar = preBarRef.current;
    const preN = preNRef.current;

    if (pre && !isReducedMotion) {
      let p = 0;
      const tick = setInterval(() => {
        p += Math.random() * 16 + 5;
        if (p >= 100) {
          p = 100;
          clearInterval(tick);
          setTimeout(() => {
            pre.classList.add('gone');
            document.body.classList.remove('locked');
            startPage();
          }, 320);
        }
        if (preBar) preBar.style.width = `${p}%`;
        if (preN) preN.textContent = Math.round(p).toString();
      }, 110);

      document.body.classList.add('locked');

      const safetyTimeout = setTimeout(() => {
        clearInterval(tick);
        pre.classList.add('gone');
        document.body.classList.remove('locked');
        startPage();
      }, 3500);

      return () => {
        clearInterval(tick);
        clearTimeout(safetyTimeout);
      };
    } else {
      if (pre) pre.style.display = 'none';
      document.body.classList.remove('locked');
      startPage();
    }
  }, []);

  // Custom Cursor
  useEffect(() => {
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    if (!isFinePointer || isReducedMotion) return;

    const cur = cursorRef.current;
    const curR = cursorRingRef.current;
    if (!cur || !curR) return;

    let cx = 0, cy = 0, rx = 0, ry = 0, seen = false;
    let animId: number;

    const onMouseMove = (e: MouseEvent) => {
      cx = e.clientX;
      cy = e.clientY;
      cur.style.transform = `translate3d(${cx}px,${cy}px,0)`;
      if (!seen) {
        seen = true;
        document.body.classList.add('has-cur');
      }
    };

    const renderRing = () => {
      rx += (cx - rx) * 0.16;
      ry += (cy - ry) * 0.16;
      curR.style.transform = `translate3d(${rx}px,${ry}px,0)`;
      animId = requestAnimationFrame(renderRing);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    animId = requestAnimationFrame(renderRing);

    const onMouseEnterTarget = () => document.body.classList.add('cur-lg');
    const onMouseLeaveTarget = () => document.body.classList.remove('cur-lg');

    const attachHoverTargets = () => {
      document.querySelectorAll('a,button,.card,input,select,textarea,.chip').forEach((el) => {
        el.addEventListener('mouseenter', onMouseEnterTarget);
        el.addEventListener('mouseleave', onMouseLeaveTarget);
      });
    };

    attachHoverTargets();

    const onDocMouseLeave = () => document.body.classList.remove('has-cur');
    const onDocMouseEnter = () => document.body.classList.add('has-cur');

    document.addEventListener('mouseleave', onDocMouseLeave);
    document.addEventListener('mouseenter', onDocMouseEnter);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onDocMouseLeave);
      document.removeEventListener('mouseenter', onDocMouseEnter);
      cancelAnimationFrame(animId);
    };
  }, []);

  // Hero Canvas Network
  useEffect(() => {
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cv = canvasRef.current;
    if (!cv || isReducedMotion) return;

    const ctx = cv.getContext('2d');
    if (!ctx) return;

    let nodes: Array<{ x: number; y: number; vx: number; vy: number; r: number }> = [];
    let W = 0, H = 0, dpr = 1, raf: number | null = null, live = true;
    const mouse = { x: -9999, y: -9999 };

    const size = () => {
      const host = cv.parentElement;
      if (!host) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = host.offsetWidth;
      H = host.offsetHeight;
      cv.width = W * dpr;
      cv.height = H * dpr;
      cv.style.width = `${W}px`;
      cv.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    };

    const build = () => {
      const target = Math.min(64, Math.max(24, Math.round((W * H) / 22000)));
      nodes = [];
      for (let i = 0; i < target; i++) {
        nodes.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.19,
          vy: (Math.random() - 0.5) * 0.19,
          r: Math.random() * 1.5 + 0.7,
        });
      }
    };

    const frame = () => {
      if (!live) {
        raf = null;
        return;
      }
      ctx.clearRect(0, 0, W, H);
      const LINK = 148;

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;

        // Gentle drift away from pointer
        const mdx = n.x - mouse.x;
        const mdy = n.y - mouse.y;
        const md = Math.sqrt(mdx * mdx + mdy * mdy);
        if (md < 110 && md > 0.1) {
          n.x += (mdx / md) * 0.55;
          n.y += (mdy / md) * 0.55;
        }

        for (let j = i + 1; j < nodes.length; j++) {
          const m = nodes[j];
          const dx = n.x - m.x;
          const dy = n.y - m.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < LINK) {
            ctx.strokeStyle = `rgba(201,162,74,${(0.16 * (1 - dist / LINK)).toFixed(3)})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(m.x, m.y);
            ctx.stroke();
          }
        }

        ctx.fillStyle = 'rgba(232,205,142,0.42)';
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    };

    size();
    frame();

    let resizeTimer: any;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(size, 220);
    };

    const onCanvasMouseMove = (e: MouseEvent) => {
      const r = cv.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };

    window.addEventListener('resize', onResize);
    window.addEventListener('mousemove', onCanvasMouseMove, { passive: true });

    let observer: IntersectionObserver | null = null;
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          live = e.isIntersecting && !document.hidden;
          if (live && !raf) frame();
        });
      }, { threshold: 0 });
      observer.observe(cv);
    }

    const onVisibilityChange = () => {
      live = !document.hidden;
      if (live && !raf) frame();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onCanvasMouseMove);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (observer) observer.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Header Scroll & Progress Bar
  useEffect(() => {
    const hdr = headerRef.current;
    const prog = progressBarRef.current;

    const onScroll = () => {
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      if (hdr) hdr.classList.toggle('stuck', y > 40);
      const h = document.documentElement.scrollHeight - window.innerHeight;
      if (prog) prog.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Scroll Reveal & Number Counters & Dashboard animations & Card effects
  useEffect(() => {
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    // Scroll Reveal for .rv, .rv-l
    const items = document.querySelectorAll('.rv, .rv-l, .split');
    let revealObserver: IntersectionObserver | null = null;

    if ('IntersectionObserver' in window) {
      revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            revealObserver?.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -7% 0px' });

      items.forEach((el) => {
        if (el.closest('.hero')) return;
        revealObserver?.observe(el);
      });
    } else {
      items.forEach((el) => el.classList.add('in'));
    }

    // Counters
    const runCount = (el: HTMLElement) => {
      const target = parseInt(el.dataset.count || '0', 10);
      const suf = el.dataset.suffix || '';
      let t0: number | null = null;
      const dur = 1800;
      const step = (ts: number) => {
        if (!t0) t0 = ts;
        const p = Math.min((ts - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased).toLocaleString('en-IN') + suf;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const counters = document.querySelectorAll<HTMLElement>('[data-count]');
    let counterObserver: IntersectionObserver | null = null;
    if ('IntersectionObserver' in window && !isReducedMotion) {
      counterObserver = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            runCount(e.target as HTMLElement);
            counterObserver?.unobserve(e.target);
          }
        });
      }, { threshold: 0.45 });
      counters.forEach((el) => counterObserver?.observe(el));
    } else {
      counters.forEach((el) => {
        el.textContent =
          parseInt(el.dataset.count || '0', 10).toLocaleString('en-IN') +
          (el.dataset.suffix || '');
      });
    }

    // Dashboard Bars
    const dash = dashRef.current;
    let dashObserver: IntersectionObserver | null = null;
    if (dash && 'IntersectionObserver' in window) {
      dashObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          dash.querySelectorAll<HTMLElement>('.bar i').forEach((b, i) => {
            setTimeout(() => {
              b.style.width = (b.dataset.w || '0') + '%';
            }, i * 115);
          });
          dashObserver?.unobserve(dash);
        });
      }, { threshold: 0.3 });
      dashObserver.observe(dash);
    }

    // Card Spotlight & Sweep Angle
    const cards = document.querySelectorAll<HTMLElement>('.card');
    const handleCardPointerMove = (ev: PointerEvent) => {
      const c = ev.currentTarget as HTMLElement;
      const r = c.getBoundingClientRect();
      const px = (ev.clientX - r.left) / r.width;
      const py = (ev.clientY - r.top) / r.height;
      c.style.setProperty('--mx', `${px * 100}%`);
      c.style.setProperty('--my', `${py * 100}%`);
      const ang = (Math.atan2(py - 0.5, px - 0.5) * 180) / Math.PI;
      c.style.setProperty('--sweep', `${ang - 60}deg`);
    };
    cards.forEach((c) => {
      c.addEventListener('pointermove', handleCardPointerMove as any);
    });

    // Magnetic Buttons
    if (isFinePointer && !isReducedMotion) {
      document.querySelectorAll<HTMLElement>('.mag').forEach((b) => {
        b.addEventListener('pointerenter', () => {
          b.style.transition =
            'transform .08s linear, color .5s, border-color .5s, box-shadow .5s';
        });
        b.addEventListener('pointermove', (e) => {
          const r = b.getBoundingClientRect();
          const dx = e.clientX - (r.left + r.width / 2);
          const dy = e.clientY - (r.top + r.height / 2);
          b.style.transform = `translate(${dx * 0.13}px,${dy * 0.18}px)`;
        });
        b.addEventListener('pointerleave', () => {
          b.style.transition = '';
          b.style.transform = '';
        });
      });
    }

    // Smooth Anchor Scroll with Header Offset
    const handleAnchorClick = (ev: MouseEvent) => {
      const a = (ev.target as HTMLElement).closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href');
      if (!id || id.length < 2) return;
      const t = document.querySelector(id);
      if (!t) return;
      ev.preventDefault();
      window.scrollTo({
        top: t.getBoundingClientRect().top + window.scrollY - 76,
        behavior: isReducedMotion ? 'auto' : 'smooth',
      });
    };
    document.addEventListener('click', handleAnchorClick);

    return () => {
      if (revealObserver) revealObserver.disconnect();
      if (counterObserver) counterObserver.disconnect();
      if (dashObserver) dashObserver.disconnect();
      cards.forEach((c) => {
        c.removeEventListener('pointermove', handleCardPointerMove as any);
      });
      document.removeEventListener('click', handleAnchorClick);
    };
  }, []);

  // Mobile Drawer toggling
  const toggleDrawer = () => {
    const drawer = drawerRef.current;
    const burger = burgerRef.current;
    if (!drawer || !burger) return;
    const isOpen = drawer.classList.toggle('open');
    burger.classList.toggle('x', isOpen);
    burger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    burger.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    document.body.style.overflow = isOpen ? 'hidden' : '';
  };

  const closeDrawer = () => {
    const drawer = drawerRef.current;
    const burger = burgerRef.current;
    if (drawer) drawer.classList.remove('open');
    if (burger) {
      burger.classList.remove('x');
      burger.setAttribute('aria-expanded', 'false');
    }
    document.body.style.overflow = '';
  };

  // Form submission handler
  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = formRef.current;
    if (!form) return;

    const fd = new FormData(form);
    const name = (fd.get('name') || '').toString().trim();
    const org = (fd.get('org') || '').toString().trim();
    const email = (fd.get('email') || '').toString().trim();
    const phone = (fd.get('phone') || '').toString().trim();
    const interest = (fd.get('interest') || '').toString().trim();
    const scale = (fd.get('scale') || '').toString().trim();
    const message = (fd.get('message') || '').toString().trim();

    if (!name || !email) {
      alert('Please enter your name and email so we can respond.');
      return;
    }

    // Save to Supabase and Local storage
    await saveEnquiry({
      name,
      org: org || '—',
      email,
      phone: phone || '—',
      interest,
      scale,
      message: message || '—',
      user_id: currentUser?.id,
    });

    setFormSubmitted(true);

    const body = [
      'Name: ' + name,
      'Organisation: ' + (org || '—'),
      'Email: ' + email,
      'Phone: ' + (phone || '—'),
      'Interest: ' + interest,
      'Business Scale: ' + scale,
      '',
      'Situation:',
      message || '—',
    ].join('\n');

    const mailtoUrl =
      'mailto:contact@unikorn360.com?subject=' +
      encodeURIComponent('Enquiry — ' + interest + ' — ' + name) +
      '&body=' +
      encodeURIComponent(body);

    const fok = document.getElementById('fok');
    if (fok) {
      fok.classList.add('on');
      fok.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    setTimeout(() => {
      window.location.href = mailtoUrl;
    }, 400);
  };

  return (
    <>
      {/* ══════════════ ICON SPRITE ══════════════ */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
        <defs>
          {/* modules */}
          <symbol id="i-finance" viewBox="0 0 24 24"><path d="M6 4h9M6 9h9M14 4c2.8 0 4 1.6 4 3.4S16.8 11 14 11H8l7 9"/></symbol>
          <symbol id="i-legal" viewBox="0 0 24 24"><path d="M12 3v18M5 7l7-2 7 2M5 7l-2.5 6a3 3 0 006 0L5 7zM19 7l-2.5 6a3 3 0 006 0L19 7zM8 21h8"/></symbol>
          <symbol id="i-hr" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.2"/><path d="M3.2 20a5.8 5.8 0 0111.6 0M16.5 5.6a3.2 3.2 0 010 5.6M18.5 20a5.6 5.6 0 00-2.2-4.3"/></symbol>
          <symbol id="i-sales" viewBox="0 0 24 24"><path d="M3 20h18M6 20v-5M11 20V9M16 20v-8M21 20V5M14.5 4.5h4.2v4.2"/><path d="M18.7 4.5L12 11.2 8.6 7.8 4 12.4"/></symbol>
          <symbol id="i-factory" viewBox="0 0 24 24"><path d="M3 21h18M4 21V10l5 3.2V10l5 3.2V10l5 3.2V21M4 10l.8-6h2.6l.6 6M9 17h2M14 17h2"/></symbol>
          <symbol id="i-exec" viewBox="0 0 24 24"><rect x="2.5" y="4" width="19" height="13.5" rx="1.4"/><path d="M8 21h8M12 17.5V21M6.5 13.5l3-3.4 2.6 2.4 4.4-4.6"/></symbol>
          <symbol id="i-ai" viewBox="0 0 24 24"><circle cx="12" cy="12" r="2.4"/><circle cx="12" cy="3.6" r="1.5"/><circle cx="12" cy="20.4" r="1.5"/><circle cx="4.4" cy="7.6" r="1.5"/><circle cx="19.6" cy="7.6" r="1.5"/><circle cx="4.4" cy="16.4" r="1.5"/><circle cx="19.6" cy="16.4" r="1.5"/><path d="M12 5.1v4.5M12 14.4v4.5M5.7 8.4l4 2.3M14.3 13.3l4 2.3M5.7 15.6l4-2.3M14.3 10.7l4-2.3"/></symbol>
          <symbol id="i-knowledge" viewBox="0 0 24 24"><path d="M4 5.2a2 2 0 012-2h5v17.6H6a2 2 0 00-2 2V5.2zM20 5.2a2 2 0 00-2-2h-5v17.6h5a2 2 0 012 2V5.2zM11 3.2h2"/></symbol>

          {/* executives */}
          <symbol id="i-ceo" viewBox="0 0 24 24"><path d="M4 18h16M4 18l-1.4-9 5 3.4L12 5l4.4 7.4 5-3.4L20 18"/><circle cx="12" cy="21" r=".6"/></symbol>
          <symbol id="i-cfo" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 6.6v10.8M14.8 9.2c0-1.1-1.3-1.9-2.8-1.9s-2.8.8-2.8 1.9 1.3 1.7 2.8 2.1 2.8 1 2.8 2.1-1.3 1.9-2.8 1.9-2.8-.8-2.8-1.9"/></symbol>
          <symbol id="i-ca" viewBox="0 0 24 24"><rect x="4.5" y="2.6" width="15" height="18.8" rx="1.6"/><path d="M8 7h8M8 11h3M13 11h3M8 15h3M13 15h3M8 18.6h8"/></symbol>
          <symbol id="i-advisor" viewBox="0 0 24 24"><path d="M12 2.6l7.6 3.2v5.4c0 4.6-3.1 8.4-7.6 10.2-4.5-1.8-7.6-5.6-7.6-10.2V5.8L12 2.6z"/><path d="M8.8 12l2.3 2.3 4.3-4.5"/></symbol>
          <symbol id="i-people" viewBox="0 0 24 24"><circle cx="12" cy="7.4" r="3"/><path d="M6.4 20a5.6 5.6 0 0111.2 0M4.6 11.6a2.4 2.4 0 100-4.8M19.4 11.6a2.4 2.4 0 110-4.8"/></symbol>
          <symbol id="i-revenue" viewBox="0 0 24 24"><path d="M3 17.4l5.4-5.6 3.4 3.2 4-4.6 3.6 3.4M3 21h18M20 8V4.4h-3.6"/></symbol>
          <symbol id="i-procure" viewBox="0 0 24 24"><path d="M3 4.4h2.6l2.2 11.2h9.8l2.4-8.2H6.4"/><circle cx="9.4" cy="19.6" r="1.4"/><circle cx="16.8" cy="19.6" r="1.4"/></symbol>
          <symbol id="i-ops" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.1"/><path d="M12 2.6v3M12 18.4v3M21.4 12h-3M5.6 12h-3M18.6 5.4l-2.1 2.1M7.5 16.5l-2.1 2.1M18.6 18.6l-2.1-2.1M7.5 7.5L5.4 5.4"/></symbol>
          <symbol id="i-strategy" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.8"/><circle cx="12" cy="12" r=".9"/><path d="M12 3v2.6M12 18.4V21M21 12h-2.6M5.6 12H3"/></symbol>

          {/* pillars */}
          <symbol id="i-personal" viewBox="0 0 24 24"><circle cx="12" cy="7.2" r="3.4"/><path d="M5.4 20.4a6.6 6.6 0 0113.2 0"/><path d="M18.4 3.4l.8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8.8-1.9z"/></symbol>
          <symbol id="i-family" viewBox="0 0 24 24"><path d="M3 21h18M4.6 21V9.6L12 4l7.4 5.6V21M9.6 21v-5.4h4.8V21"/><path d="M12 9.4v2.6"/></symbol>
          <symbol id="i-business" viewBox="0 0 24 24"><path d="M12 2.4l9.4 9.6-9.4 9.6L2.6 12 12 2.4z"/><path d="M12 7.6L16.4 12 12 16.4 7.6 12 12 7.6z"/></symbol>

          {/* edges */}
          <symbol id="i-shield" viewBox="0 0 24 24"><path d="M12 2.6l7.6 3.2v5.4c0 4.6-3.1 8.4-7.6 10.2-4.5-1.8-7.6-5.6-7.6-10.2V5.8L12 2.6z"/><path d="M12 10.4v3.2"/><circle cx="12" cy="16.4" r=".5"/></symbol>
          <symbol id="i-brain" viewBox="0 0 24 24"><path d="M12 4.4a3.4 3.4 0 00-6.4 1.6 3.2 3.2 0 00-1.4 5.2 3.4 3.4 0 001.9 5.6A3.2 3.2 0 0012 19.8V4.4z"/><path d="M12 4.4a3.4 3.4 0 016.4 1.6 3.2 3.2 0 011.4 5.2 3.4 3.4 0 01-1.9 5.6A3.2 3.2 0 0112 19.8"/></symbol>
          <symbol id="i-link" viewBox="0 0 24 24"><path d="M10 13.6a4 4 0 006 .5l2.6-2.6a4.1 4.1 0 00-5.8-5.8l-1.5 1.5"/><path d="M14 10.4a4 4 0 00-6-.5L5.4 12.5a4.1 4.1 0 005.8 5.8l1.5-1.5"/></symbol>
          <symbol id="i-doc" viewBox="0 0 24 24"><path d="M14 2.8H6.6a1.8 1.8 0 00-1.8 1.8v14.8a1.8 1.8 0 001.8 1.8h10.8a1.8 1.8 0 001.8-1.8V7.8L14 2.8z"/><path d="M14 2.8v5h5.2M8.4 12.6h7.2M8.4 16.2h7.2"/></symbol>
          <symbol id="i-diamond" viewBox="0 0 24 24"><path d="M12 3.2l8.4 6.2-8.4 11.4L3.6 9.4 12 3.2z"/></symbol>

          {/* ui */}
          <symbol id="i-arrow" viewBox="0 0 24 24"><path d="M4.6 12h14.2M13.4 6.4l5.6 5.6-5.6 5.6"/></symbol>
          <symbol id="i-check" viewBox="0 0 24 24"><path d="M20 6.4L9.4 17 4 11.6"/></symbol>
          <symbol id="i-x" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></symbol>
          <symbol id="i-phone" viewBox="0 0 24 24"><path d="M21.4 16.8v2.8a1.9 1.9 0 01-2.1 1.9 18.6 18.6 0 01-8.1-2.9 18.3 18.3 0 01-5.6-5.6A18.6 18.6 0 012.7 4.8 1.9 1.9 0 014.6 2.7h2.8a1.9 1.9 0 011.9 1.6c.12.92.35 1.81.68 2.67a1.9 1.9 0 01-.43 2L8.4 10.2a15 15 0 005.6 5.6l1.2-1.2a1.9 1.9 0 012-.43c.86.33 1.75.56 2.67.68a1.9 1.9 0 011.6 1.95z"/></symbol>
          <symbol id="i-mail" viewBox="0 0 24 24"><rect x="2.6" y="4.8" width="18.8" height="14.4" rx="1.8"/><path d="M2.6 6.6L12 13l9.4-6.4"/></symbol>
          <symbol id="i-pin" viewBox="0 0 24 24"><path d="M20 10.4c0 6-8 12-8 12s-8-6-8-12a8 8 0 1116 0z"/><circle cx="12" cy="10.2" r="2.8"/></symbol>
          <symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.2"/><path d="M12 6.6V12l3.6 2.1"/></symbol>
          <symbol id="i-user" viewBox="0 0 24 24"><circle cx="12" cy="7.6" r="3.6"/><path d="M5 20.4a7 7 0 0114 0"/></symbol>
          <symbol id="i-wa" viewBox="0 0 24 24"><path d="M3 21l1.5-4.4A8.6 8.6 0 1112 20.6a8.5 8.5 0 01-4.3-1.2L3 21z"/><path d="M9 8.4c.2 0 .4 0 .5.3l.7 1.7c.1.2 0 .4-.1.5l-.5.6c-.1.1-.2.3-.1.5a6 6 0 002.5 2.5c.2.1.4 0 .5-.1l.6-.5c.1-.1.3-.2.5-.1l1.7.7c.3.1.3.3.3.5 0 .9-.7 1.6-1.6 1.7a7.6 7.6 0 01-6.6-6.6c.1-.9.8-1.6 1.6-1.7z"/></symbol>
        </defs>
      </svg>

      {/* ══════════════ PRELOADER ══════════════ */}
      <div id="pre" ref={preloaderRef}>
        <div className="pre-mark">U</div>
        <div className="pre-bar"><i id="preBar" ref={preBarRef}></i></div>
        <div className="pre-n"><span id="preN" ref={preNRef}>0</span>&thinsp;—&thinsp;100</div>
      </div>

      {/* ══════════════ CHROME ══════════════ */}
      <div className="cur" id="cur" ref={cursorRef}></div>
      <div className="cur-r" id="curR" ref={cursorRingRef}></div>
      <div className="prog" id="prog" ref={progressBarRef}></div>
      <div className="grain"></div>
      <div className="vig"></div>
      <div className="orb orb-a"></div>
      <div className="orb orb-b"></div>

      {/* ══════════════ NAV ══════════════ */}
      <header id="hdr" ref={headerRef}>
        <div className="wrap nav">
          <a href="#top" className="brand" aria-label="UNIKORN360 home">
            <span className="mark">U</span>
            <span>
              <span className="bname">UNIKORN<span className="gold">360</span></span><br />
              <span className="btag">AI Solutions</span>
            </span>
          </a>
          <nav className="links" aria-label="Primary">
            <a href="#platform">Platform</a>
            <a href="#advisory">Advisory</a>
            <a href="#proof">Proof</a>
            <a href="#industries">Industries</a>
            <a href="#approach">Approach</a>
            <a href="#contact">Contact</a>
          </nav>
          
          <div className="flex items-center gap-3">
            {currentUser ? (
              <button
                onClick={() => setIsPortalOpen(true)}
                className="btn btn-s mag text-[0.655rem] py-2 px-3.5 border-[#c9a24a]/40 text-[#c9a24a]"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#6fd6a4] mr-1 inline-block"></span>
                Portal: {currentUser.name.split(' ')[0]}
              </button>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="btn btn-s mag text-[0.655rem] py-2 px-3.5"
              >
                Client Sign In
              </button>
            )}
            <a href="#contact" className="btn btn-p mag">Book a Consultation</a>
          </div>

          <button
            className="burger"
            id="burger"
            ref={burgerRef}
            onClick={toggleDrawer}
            aria-label="Open menu"
            aria-expanded="false"
          >
            <span></span><span></span><span></span>
          </button>
        </div>
      </header>

      <div className="drawer" id="drawer" ref={drawerRef}>
        <a href="#platform" onClick={closeDrawer}>Platform</a>
        <a href="#advisory" onClick={closeDrawer}>Advisory</a>
        <a href="#proof" onClick={closeDrawer}>Proof</a>
        <a href="#industries" onClick={closeDrawer}>Industries</a>
        <a href="#approach" onClick={closeDrawer}>Approach</a>
        <a href="#contact" onClick={closeDrawer}>Contact</a>
        
        {currentUser ? (
          <button
            onClick={() => {
              closeDrawer();
              setIsPortalOpen(true);
            }}
            className="btn btn-s"
            style={{ marginTop: '0.5rem' }}
          >
            Portal: {currentUser.name}
          </button>
        ) : (
          <button
            onClick={() => {
              closeDrawer();
              setIsAuthOpen(true);
            }}
            className="btn btn-s"
            style={{ marginTop: '0.5rem' }}
          >
            Sign In with Google / Email
          </button>
        )}
        <a href="#contact" onClick={closeDrawer} className="btn btn-g" style={{ marginTop: '0.5rem' }}>
          Book a Consultation
        </a>
      </div>

      {/* ══════════════ HERO ══════════════ */}
      <section className="hero" id="top">
        <div className="hero-grid"></div>
        <canvas id="net" ref={canvasRef} aria-hidden="true"></canvas>
        <div className="wrap">
          <div className="flex items-center gap-3 mb-6 rv">
            <span className="badge" style={{ margin: 0 }}><span className="dot"></span> System Online</span>
            <span className="text-white/40 text-[10px] font-mono tracking-widest hidden sm:inline-block">34.0212° N, 118.2437° W // DEEP-STACK INTEL</span>
          </div>
          <h1 className="display split" data-split>
            UNIKORN <span className="stroke-text">360.ALPHA</span>
          </h1>
          <p className="lede rv">
            Reconstructing the digital frontier with high-fidelity performance architecture. Deep-stack infrastructure meets bespoke editorial intelligence — uniting finance, legal, production, and executive judgement into one continuously learning system.
          </p>
          <div className="hero-cta rv">
            <a href="#platform" className="btn btn-p mag">
              Explore the Platform <svg className="ic ic-sm ar" style={{ stroke: 'currentColor' }}><use href="#i-arrow" /></svg>
            </a>
            <a href="#advisory" className="btn btn-s mag">
              Private Advisory <svg className="ic ic-sm ar" style={{ stroke: 'currentColor' }}><use href="#i-arrow" /></svg>
            </a>
          </div>
          <div className="strip rv">
            <div><div className="s-n" data-count="100" data-suffix="+">0</div><div className="s-l">Enterprise Modules</div></div>
            <div><div className="s-n" data-count="500" data-suffix="+">0</div><div className="s-l">Processes Automated</div></div>
            <div><div className="s-n" data-count="1000" data-suffix="+">0</div><div className="s-l">AI Workflows</div></div>
            <div><div className="s-n" data-count="50" data-suffix="+">0</div><div className="s-l">Business Domains</div></div>
            <div><div className="s-n">24&#8202;&times;&#8202;7</div><div className="s-l">Intelligence Engine</div></div>
          </div>
        </div>
        <div className="hint"><span className="mono">Scroll</span><i></i></div>
      </section>

      {/* ══════════════ MARQUEE ══════════════ */}
      <div className="mq" aria-hidden="true">
        <div className="mq-t">
          <span className="mq-i">MSMEs</span><span className="mq-i">Manufacturers</span><span className="mq-i">Exporters</span><span className="mq-i">Business Families</span><span className="mq-i">Professionals</span><span className="mq-i">Enterprises</span><span className="mq-i">Government Bodies</span><span className="mq-i">NGOs</span><span className="mq-i">Institutions</span><span className="mq-i">Founders</span>
          <span className="mq-i">MSMEs</span><span className="mq-i">Manufacturers</span><span className="mq-i">Exporters</span><span className="mq-i">Business Families</span><span className="mq-i">Professionals</span><span className="mq-i">Enterprises</span><span className="mq-i">Government Bodies</span><span className="mq-i">NGOs</span><span className="mq-i">Institutions</span><span className="mq-i">Founders</span>
        </div>
      </div>

      {/* ══════════════ GATEWAY ══════════════ */}
      <section className="sec" id="tracks">
        <span className="idx">01 — Mandates</span>
        <div className="wrap">
          <div className="sh ctr rv">
            <div className="eyebrow ctr">Two Ways We Work</div>
            <h2 className="display">One firm. <span className="it gold">Two mandates.</span></h2>
            <p className="lede" style={{ marginInline: 'auto' }}>Some clients need infrastructure. Others need judgement. Most eventually need both — and that is precisely the point.</p>
          </div>
          <div className="gates">
            <a href="#platform" className="card gate rv">
              <div className="n">Track 01 — Build</div>
              <h3 className="display">AI Platform</h3>
              <p>Business360 — a connected operating system for the whole enterprise. Eight intelligence modules, an AI executive team, and a single dashboard that finally knows everything your business already knows.</p>
              <ul><li>Finance360</li><li>Legal360</li><li>HR360</li><li>Sales360</li><li>Factory360</li><li>Executive360</li><li>AI360</li></ul>
              <span className="go">Explore the intelligence stack <svg className="ic ic-sm ar"><use href="#i-arrow" /></svg></span>
            </a>
            <a href="#advisory" className="card gate rv">
              <div className="n">Track 02 — Architect</div>
              <h3 className="display">Private Advisory</h3>
              <p>Strategic intelligence for those who build legacies. Personal strategy, family wealth architecture and business intelligence held inside one confidential partnership — because the founder, the family and the firm are never separate problems.</p>
              <ul><li>Personal Strategy</li><li>Family Office</li><li>Succession</li><li>Business Architecture</li><li>Capital Structure</li></ul>
              <span className="go">See advisory mandates <svg className="ic ic-sm ar"><use href="#i-arrow" /></svg></span>
            </a>
          </div>
        </div>
      </section>

      <div className="rule"></div>

      {/* ══════════════ PROBLEM ══════════════ */}
      <section className="sec">
        <span className="idx">02 — The Problem</span>
        <div className="wrap prob">
          <div className="rv-l">
            <div className="eyebrow">The Problem</div>
            <div className="qb">
              <p className="q">Every business has data.<br />Very few have <span className="gold">intelligence.</span></p>
              <p className="lede">Most companies run on disconnected software. Every system knows something; nothing knows everything. The accountant sees numbers without context, the sales head sees pipeline without cash, and the founder sees all of it three weeks late.</p>
            </div>
          </div>
          <div className="silo-box rv">
            <div className="mono" style={{ marginBottom: '1.3rem' }}>Current State — Fragmented</div>
            <div className="silos">
              <span className="silo">Accounting Software</span><span className="silo">HR Software</span><span className="silo">GST Portal</span><span className="silo">CRM</span><span className="silo">Excel</span><span className="silo">Email</span><span className="silo">WhatsApp</span><span className="silo">Paper Files</span><span className="silo">Bank Portals</span><span className="silo">Compliance Sites</span>
            </div>
            <div className="merge">
              <div className="arrows">↓↓↓</div>
              <span className="merge-out">One Business Brain</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ PLATFORM ══════════════ */}
      <section className="sec" id="platform">
        <span className="idx">03 — The Stack</span>
        <div className="wrap">
          <div className="sh-row rv">
            <div>
              <div className="eyebrow">Track 01 · The Intelligence Stack</div>
              <h2 className="display">Business360 — the complete <span className="it gold">business operating system.</span></h2>
            </div>
            <a href="#contact" className="btn btn-s mag">Request a Walkthrough <svg className="ic ic-sm ar" style={{ stroke: 'currentColor' }}><use href="#i-arrow" /></svg></a>
          </div>
          <div className="mods rv">
            <div className="mod"><div className="mod-top"><span className="mod-n">01</span><svg className="ic"><use href="#i-finance" /></svg></div><h3>Finance360</h3><p>Accounting, GST and TDS, invoices and purchase, vendor intelligence, cash-flow forecasting and receivable pressure mapping — reconciled continuously, not quarterly.</p></div>
            <div className="mod"><div className="mod-top"><span className="mod-n">02</span><svg className="ic"><use href="#i-legal" /></svg></div><h3>Legal360</h3><p>Compliance calendars, agreement lifecycle, licence renewals, court and notice tracking, and a legal AI layer that reads your contracts before your counterparty's lawyer does.</p></div>
            <div className="mod"><div className="mod-top"><span className="mod-n">03</span><svg className="ic"><use href="#i-hr" /></svg></div><h3>HR360</h3><p>Recruitment pipelines, payroll, attendance, performance and employee intelligence — attrition risk surfaced while it is still a conversation, not a resignation.</p></div>
            <div className="mod"><div className="mod-top"><span className="mod-n">04</span><svg className="ic"><use href="#i-sales" /></svg></div><h3>Sales360</h3><p>CRM, quotations, order management, pipeline hygiene, revenue forecasting and customer intelligence tied directly to production capacity and collections.</p></div>
            <div className="mod"><div className="mod-top"><span className="mod-n">05</span><svg className="ic"><use href="#i-factory" /></svg></div><h3>Factory360</h3><p>Manufacturing and job-work tracking, production planning, quality control, maintenance schedules and supply-chain visibility built for how Indian plants actually run.</p></div>
            <div className="mod"><div className="mod-top"><span className="mod-n">06</span><svg className="ic"><use href="#i-exec" /></svg></div><h3>Executive360</h3><p>CEO dashboard, board-ready reporting, risk intelligence and a live business health score — the one screen that replaces twenty applications.</p></div>
            <div className="mod"><div className="mod-top"><span className="mod-n">07</span><svg className="ic"><use href="#i-ai" /></svg></div><h3>AI360</h3><p>Enterprise AI agents, decision intelligence, predictive analytics and an automation studio where your team designs workflows without writing code.</p></div>
            <div className="mod"><div className="mod-top"><span className="mod-n">08</span><svg className="ic"><use href="#i-knowledge" /></svg></div><h3>Knowledge360</h3><p>Documentation automation, institutional memory, growth systems and decision support — so the knowledge stays with the company, not only with the people.</p></div>
          </div>
        </div>
      </section>

      {/* ══════════════ EXECUTIVES ══════════════ */}
      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sh rv">
            <div className="eyebrow">AI Executive Team</div>
            <h2 className="display">Not chatbots. <span className="it gold">Executives.</span></h2>
            <p className="lede">Each agent holds a defined mandate, reads live company data, and answers the way a competent department head would — with a recommendation and the reasoning behind it.</p>
          </div>
          <div className="execs rv">
            <div className="card exec"><span className="exec-av"><svg className="ic"><use href="#i-ceo" /></svg></span><div><h4>Chief Executive</h4><div className="role">Strategy</div><p>Strategic recommendations, priority arbitration, cross-department trade-offs.</p></div></div>
            <div className="card exec"><span className="exec-av"><svg className="ic"><use href="#i-cfo" /></svg></span><div><h4>Chief Financial Officer</h4><div className="role">Capital</div><p>Financial intelligence, margin analysis, cash runway and capital structure.</p></div></div>
            <div className="card exec"><span className="exec-av"><svg className="ic"><use href="#i-ca" /></svg></span><div><h4>Chartered Accountant</h4><div className="role">Statutory</div><p>GST, TDS, tax positions, statutory filings and reconciliation discipline.</p></div></div>
            <div className="card exec"><span className="exec-av"><svg className="ic"><use href="#i-advisor" /></svg></span><div><h4>Legal Advisor</h4><div className="role">Risk</div><p>Contract review, clause risk, documentation trails and escalation ladders.</p></div></div>
            <div className="card exec"><span className="exec-av"><svg className="ic"><use href="#i-people" /></svg></span><div><h4>HR Director</h4><div className="role">People</div><p>People intelligence, org design, compensation logic and retention risk.</p></div></div>
            <div className="card exec"><span className="exec-av"><svg className="ic"><use href="#i-revenue" /></svg></span><div><h4>Sales Director</h4><div className="role">Revenue</div><p>Revenue optimisation, pricing discipline, pipeline and territory strategy.</p></div></div>
            <div className="card exec"><span className="exec-av"><svg className="ic"><use href="#i-procure" /></svg></span><div><h4>Procurement Manager</h4><div className="role">Supply</div><p>Vendor intelligence, rate benchmarking, negotiation leverage and lead times.</p></div></div>
            <div className="card exec"><span className="exec-av"><svg className="ic"><use href="#i-ops" /></svg></span><div><h4>Operations Director</h4><div className="role">Throughput</div><p>Operational excellence, bottleneck detection and throughput planning.</p></div></div>
            <div className="card exec"><span className="exec-av"><svg className="ic"><use href="#i-strategy" /></svg></span><div><h4>Strategy Officer</h4><div className="role">Horizon</div><p>Future planning, scenario modelling, market entry and expansion sequencing.</p></div></div>
          </div>
        </div>
      </section>

      {/* ══════════════ DASHBOARD ══════════════ */}
      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sh rv">
            <div className="eyebrow">Executive Morning Brief</div>
            <h2 className="display">Open one dashboard. <span className="it gold">Know everything.</span></h2>
          </div>
          <div className="dash rv" id="dash" ref={dashRef}>
            <div className="dash-bar">
              <span className="tl"><i></i><i></i><i></i></span>
              <span className="dash-t">Executive360 · Morning Brief</span>
              <span className="dash-live"><span className="dot"></span> Live</span>
            </div>
            <div className="tiles">
              <div className="tile"><div className="t-l">Revenue · Yesterday</div><div className="t-v">₹18.4L</div><div className="t-d">▲ 12.4% vs prior day</div><div className="bar"><i data-w="78"></i></div></div>
              <div className="tile"><div className="t-l">Gross Margin Trend</div><div className="t-v">31.8%</div><div className="t-d">▲ 1.6 pts this month</div><div className="bar"><i data-w="64"></i></div></div>
              <div className="tile"><div className="t-l">GST Position</div><div className="t-v">₹2.71L</div><div className="t-d nu">GSTR-3B due in 6 days</div><div className="bar"><i data-w="45"></i></div></div>
              <div className="tile"><div className="t-l">Pending Collections</div><div className="t-v">₹47.2L</div><div className="t-d dn">₹9.1L overdue 60+ days</div><div className="bar"><i data-w="88"></i></div></div>
              <div className="tile"><div className="t-l">Cash Position</div><div className="t-v">₹12.6L</div><div className="t-d">41 days runway</div><div className="bar"><i data-w="52"></i></div></div>
              <div className="tile"><div className="t-l">Vendor Alerts</div><div className="t-v">3</div><div className="t-d nu">1 rate revision pending</div><div className="bar"><i data-w="30"></i></div></div>
              <div className="tile"><div className="t-l">Compliance Deadlines</div><div className="t-v">7</div><div className="t-d nu">2 within 72 hours</div><div className="bar"><i data-w="70"></i></div></div>
              <div className="tile"><div className="t-l">Business Health Score</div><div className="t-v">76<span style={{ fontSize: '.88rem', color: 'var(--ink-4)' }}>/100</span></div><div className="t-d">▲ 4 pts this quarter</div><div className="bar"><i data-w="76"></i></div></div>
            </div>
          </div>
          <p className="sm rv" style={{ marginTop: '1.3rem', textAlign: 'center' }}>Illustrative interface. Figures shown are representative of a live Business360 deployment, not a specific client.</p>
        </div>
      </section>

      <div className="rule"></div>

      {/* ══════════════ PROOF ══════════════ */}
      <section className="sec" id="proof">
        <span className="idx">04 — Proof</span>
        <div className="wrap">
          <div className="sh rv">
            <div className="eyebrow">How The Work Lands</div>
            <h2 className="display">What an engagement <span className="it gold">actually looks like.</span></h2>
            <p className="lede">Three representative patterns, drawn from the kinds of mandates we take. Client names and figures are withheld by policy — discretion is part of what you are buying, and we will not trade one client's confidentiality for another's comfort.</p>
          </div>

          <div className="proof rv">
            <div className="card snap">
              <div className="tag">Pattern 01 · Manufacturing MSME</div>
              <h4>The business was profitable. The bank didn't believe it.</h4>
              <p>A job-work manufacturer with real margins kept getting cut down on working-capital limits. Nothing was wrong with the business — the paperwork simply did not tell its story. Books, GST returns and bank statements each said something slightly different.</p>
              <p>The work was reconciliation before it was strategy: one consistent financial narrative, a documented job-work chain, and a compliance calendar that stopped the small lapses that make a credit officer nervous.</p>
              <div className="out">
                <div className="out-l">What changed</div>
                <div className="out-v">A file the bank could actually underwrite — and a founder who knew his own numbers cold before he walked in.</div>
              </div>
            </div>

            <div className="card snap">
              <div className="tag">Pattern 02 · Business Family</div>
              <h4>Three brothers, one company, no written understanding.</h4>
              <p>A second-generation family business where the operating company, the family's property, and each brother's personal finances had grown into one tangle. Everyone was fair with each other. Nothing was written down. The next generation was about to enter.</p>
              <p>The work was structural: separating what belongs to the business from what belongs to the family, mapping who actually owns what, and writing the governance the family had been carrying in their heads for thirty years.</p>
              <div className="out">
                <div className="out-l">What changed</div>
                <div className="out-v">A succession structure that survives a disagreement — because it was built while everyone still agreed.</div>
              </div>
            </div>

            <div className="card snap">
              <div className="tag">Pattern 03 · Documentation Desk</div>
              <h4>A file that had been "under process" for two years.</h4>
              <p>An individual applicant with a legitimate claim and no paper trail. Every visit to the office started the conversation again from zero, because nothing from the previous visit had been recorded in a form anyone would act on.</p>
              <p>The work was discipline, not influence: the application drafted correctly, the inward acknowledgement obtained, the thirty-day clock tracked, the reminder issued on time, and the escalation prepared before it was needed.</p>
              <div className="out">
                <div className="out-l">What changed</div>
                <div className="out-v">A complete, dated record that stands up at a department, a bank or a court — whatever the eventual outcome.</div>
              </div>
            </div>
          </div>

          <div className="card founder rv" style={{ marginTop: '1.5rem' }}>
            <div className="f-av">R</div>
            <div>
              <p className="f-q">"Most businesses I meet are not badly run. They are badly documented, badly connected, and badly represented on paper. Fixing that is unglamorous work — and it is almost always the thing standing between the business and the next stage of its life."</p>
              <div className="f-n">S. Rajkumar</div>
              <div className="f-r">Founder &amp; Principal Consultant · UNIKORN360</div>
            </div>
          </div>

          <p className="sm rv" style={{ marginTop: '1.6rem', maxWidth: '80ch' }}>The patterns above describe categories of engagement rather than named case studies. No outcome is guaranteed; results depend on the facts, the counterparty and, where a government or financial institution is involved, on decisions that rest entirely with that authority.</p>
        </div>
      </section>

      <div className="rule"></div>

      {/* ══════════════ ADVISORY ══════════════ */}
      <section className="sec" id="advisory">
        <span className="idx">05 — Advisory</span>
        <div className="wrap">
          <div className="sh rv">
            <div className="eyebrow">Track 02 · Private Advisory</div>
            <h2 className="display">Strategic intelligence for those who <span className="it gold">build legacies.</span></h2>
            <p className="lede">From individual clarity to generational wealth to business dominance. Personal, family and business strategy are almost always advised in separate rooms by people who never speak to each other. We refuse to do that — because the founder, the family and the firm are one problem wearing three coats.</p>
          </div>
          <div className="pillars rv">
            <div className="card pillar">
              <div className="p-ic"><svg className="ic ic-lg"><use href="#i-personal" /></svg></div>
              <h3>Personal Advisory</h3>
              <p>Life optimisation for high-achievers who want structured clarity rather than motivation.</p>
              <ul className="plist">
                <li>Career and wealth trajectory design</li>
                <li>Decision architecture systems</li>
                <li>Personal brand and positioning strategy</li>
                <li>Health and lifestyle optimisation</li>
                <li>Productivity engineering</li>
              </ul>
            </div>
            <div className="card pillar">
              <div className="p-ic"><svg className="ic ic-lg"><use href="#i-family" /></svg></div>
              <h3>Family Office</h3>
              <p>Wealth protection and generational continuity for business families.</p>
              <ul className="plist">
                <li>Family wealth structuring</li>
                <li>Succession architecture and governance</li>
                <li>Investment allocation mapping</li>
                <li>Estate and trust coordination</li>
                <li>Next-generation leadership planning</li>
              </ul>
            </div>
            <div className="card pillar">
              <div className="p-ic"><svg className="ic ic-lg"><use href="#i-business" /></svg></div>
              <h3>Business Intelligence</h3>
              <p>AI-powered strategic advisory for MSMEs and growth enterprises.</p>
              <ul className="plist">
                <li>Business model architecture</li>
                <li>Revenue and cash-flow optimisation</li>
                <li>AI integration blueprint</li>
                <li>Scale and expansion roadmap</li>
                <li>Leadership structure design</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ TIERS ══════════════ */}
      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sh rv">
            <div className="eyebrow">Advisory Mandates</div>
            <h2 className="display">Three levels of <span className="it gold">engagement.</span></h2>
            <p className="lede">Each mandate is scoped to the client's actual situation. Engagements are limited by design — we take on only what we can hold to a standard.</p>
          </div>
          <div className="tiers rv">
            <div className="card tier">
              <div className="t-tag">Tier I</div>
              <h3 className="display">Executive Program</h3>
              <div className="term">60–90 day engagement</div>
              <ul>
                <li><svg className="ic"><use href="#i-check" /></svg> Business intelligence audit</li>
                <li><svg className="ic"><use href="#i-check" /></svg> Revenue leak analysis</li>
                <li><svg className="ic"><use href="#i-check" /></svg> Three-year growth roadmap</li>
                <li><svg className="ic"><use href="#i-check" /></svg> AI integration blueprint</li>
                <li><svg className="ic"><use href="#i-check" /></svg> Three to five private advisory sessions</li>
                <li><svg className="ic"><use href="#i-check" /></svg> Strategic playbook deliverable</li>
              </ul>
              <div className="inv">
                <div className="inv-l">Investment</div>
                <div className="inv-v">On application</div>
                <a href="#contact" className="btn btn-s mag" style={{ width: '100%' }}>Enquire <svg className="ic ic-sm ar" style={{ stroke: 'currentColor' }}><use href="#i-arrow" /></svg></a>
              </div>
            </div>

            <div className="card tier feat">
              <span className="ribbon">Most Selected</span>
              <div className="t-tag">Tier II</div>
              <h3 className="display">Elite Transformation</h3>
              <div className="term">6–12 month partnership</div>
              <ul>
                <li><svg className="ic"><use href="#i-check" /></svg> Full business architecture redesign</li>
                <li><svg className="ic"><use href="#i-check" /></svg> Family wealth integration layer</li>
                <li><svg className="ic"><use href="#i-check" /></svg> Quarterly board-style reviews</li>
                <li><svg className="ic"><use href="#i-check" /></svg> Cash-flow and investment mapping</li>
                <li><svg className="ic"><use href="#i-check" /></svg> AI process automation design</li>
                <li><svg className="ic"><use href="#i-check" /></svg> Confidential strategy command deck</li>
              </ul>
              <div className="inv">
                <div className="inv-l">Investment</div>
                <div className="inv-v">On application</div>
                <a href="#contact" className="btn btn-p mag" style={{ width: '100%' }}>Enquire <svg className="ic ic-sm ar" style={{ stroke: 'currentColor' }}><use href="#i-arrow" /></svg></a>
              </div>
            </div>

            <div className="card tier">
              <div className="t-tag">Tier III</div>
              <h3 className="display">Legacy Architect</h3>
              <div className="term">Multi-year strategic alliance</div>
              <ul>
                <li><svg className="ic"><use href="#i-check" /></svg> Generational wealth architecture</li>
                <li><svg className="ic"><use href="#i-check" /></svg> Holding company design</li>
                <li><svg className="ic"><use href="#i-check" /></svg> Twenty-year legacy blueprint</li>
                <li><svg className="ic"><use href="#i-check" /></svg> Succession governance charter</li>
                <li><svg className="ic"><use href="#i-check" /></svg> Business continuity planning</li>
                <li><svg className="ic"><use href="#i-check" /></svg> Estate and risk shield strategy</li>
              </ul>
              <div className="inv">
                <div className="inv-l">Investment</div>
                <div className="inv-v">By private discussion</div>
                <a href="#contact" className="btn btn-s mag" style={{ width: '100%' }}>Enquire <svg className="ic ic-sm ar" style={{ stroke: 'currentColor' }}><use href="#i-arrow" /></svg></a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ WHO ══════════════ */}
      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="wrap split-2">
          <div className="rv-l">
            <div className="eyebrow">Who We Serve</div>
            <h2 className="display" style={{ marginBottom: '1.5rem' }}>Built for people who carry <span className="it gold">real weight.</span></h2>
            <p className="lede">Our clients are not looking for a vendor. They are looking for a second brain that already understands the business, the family, and the risk sitting quietly between them.</p>
          </div>
          <div className="edges rv">
            <div className="edge"><h4><svg className="ic ic-sm"><use href="#i-diamond" /></svg> Business Families</h4><p>₹5 Cr to ₹200 Cr enterprises planning scale, succession or ownership transition.</p></div>
            <div className="edge"><h4><svg className="ic ic-sm"><use href="#i-diamond" /></svg> Startup Founders</h4><p>Growth-stage founders seeking structured capital, governance and expansion architecture.</p></div>
            <div className="edge"><h4><svg className="ic ic-sm"><use href="#i-diamond" /></svg> HNI Families</h4><p>High net worth households protecting and compounding generational assets.</p></div>
            <div className="edge"><h4><svg className="ic ic-sm"><use href="#i-diamond" /></svg> NRI Families</h4><p>Diaspora families managing India-based business, property, compliance and succession from abroad.</p></div>
          </div>
        </div>
      </section>

      <div className="rule"></div>

      {/* ══════════════ APPROACH ══════════════ */}
      <section className="sec" id="approach">
        <span className="idx">06 — Approach</span>
        <div className="wrap">
          <div className="sh ctr rv">
            <div className="eyebrow ctr">The Engagement</div>
            <h2 className="display">How the work <span className="it gold">actually happens.</span></h2>
          </div>
        </div>
        <div className="wrap rv">
          <div className="steps">
            <div className="step"><div className="step-n">01</div><h4>Discovery</h4><p>Confidential diagnostic session. Current-state mapping across business, family and personal dimensions.</p></div>
            <div className="step"><div className="step-n">02</div><h4>Architecture</h4><p>A custom strategy blueprint designed for your specific context — not a template with your name on it.</p></div>
            <div className="step"><div className="step-n">03</div><h4>Implementation</h4><p>Phased execution with AI tooling, documentation systems and hands-on advisory support.</p></div>
            <div className="step"><div className="step-n">04</div><h4>Command Review</h4><p>Quarterly board-style reviews, metric interrogation and strategic recalibration.</p></div>
            <div className="step"><div className="step-n">05</div><h4>Legacy Lock</h4><p>Succession-ready structures and institutional memory built to outlive the founder.</p></div>
          </div>
        </div>
      </section>

      {/* ══════════════ EDGE ══════════════ */}
      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="wrap split-2">
          <div className="rv-l">
            <div className="eyebrow">Why UNIKORN360</div>
            <h2 className="display" style={{ marginBottom: '2rem' }}>We build a digital business brain.</h2>
            <div className="nots">
              <div className="not"><svg className="ic"><use href="#i-x" /></svg> Not another ERP</div>
              <div className="not"><svg className="ic"><use href="#i-x" /></svg> Not another CRM</div>
              <div className="not"><svg className="ic"><use href="#i-x" /></svg> Not another accounting package</div>
              <div className="not"><svg className="ic"><use href="#i-x" /></svg> Not another AI chatbot</div>
            </div>
            <p style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.2rem,2.1vw,1.55rem)', fontStyle: 'italic', color: 'var(--aurum-lt)', lineHeight: 1.5, fontWeight: 300 }}>
              "We don't just advise businesses. We architect the families that own them."
            </p>
          </div>
          <div className="edges rv">
            <div className="edge"><h4><svg className="ic ic-sm"><use href="#i-shield" /></svg> Absolute Discretion</h4><p>Every engagement is governed by strict confidentiality. Your strategy never leaves the room, and it is never used as a case study without written consent.</p></div>
            <div className="edge"><h4><svg className="ic ic-sm"><use href="#i-brain" /></svg> AI-Augmented Judgement</h4><p>Human judgement combined with AI-powered analysis. Decisions backed by data, not intuition alone — and never by automation alone either.</p></div>
            <div className="edge"><h4><svg className="ic ic-sm"><use href="#i-link" /></svg> Integrated, Not Siloed</h4><p>Personal goals, family wealth and business strategy aligned in one architecture, reviewed against one another rather than in isolation.</p></div>
            <div className="edge"><h4><svg className="ic ic-sm"><use href="#i-doc" /></svg> Documentation Discipline</h4><p>Every recommendation lands as a written artefact — playbooks, trackers, blueprints — that survives the meeting and stands up to a bank, a board or a court.</p></div>
          </div>
        </div>
      </section>

      {/* ══════════════ INDUSTRIES ══════════════ */}
      <section className="sec" id="industries" style={{ paddingTop: 0 }}>
        <span className="idx">07 — Industries</span>
        <div className="wrap">
          <div className="sh rv">
            <div className="eyebrow">Industries</div>
            <h2 className="display">Built for how real businesses <span className="it gold">operate.</span></h2>
            <p className="lede">Depth in Indian operating reality — GST cycles, job-work chains, export refunds, licence renewals, district-level compliance, and the paperwork that quietly decides whether a good business gets paid on time.</p>
          </div>
          <div className="chips rv">
            <span className="chip">Manufacturing</span><span className="chip">Leather &amp; Tannery</span><span className="chip">Textiles</span><span className="chip">Export &amp; Import</span><span className="chip">Retail &amp; Distribution</span><span className="chip">Healthcare</span><span className="chip">Education</span><span className="chip">Construction &amp; Real Estate</span><span className="chip">Hospitality</span><span className="chip">Professional Services</span><span className="chip">Logistics</span><span className="chip">FMCG &amp; Food Processing</span><span className="chip">Agri &amp; Agro-Processing</span><span className="chip">Government Bodies</span><span className="chip">NGOs &amp; Trusts</span><span className="chip">Startups</span><span className="chip">Large Enterprises</span>
          </div>
          <div className="counts rv" style={{ marginTop: '3.8rem' }}>
            <div className="count"><div className="c-n shine" data-count="100" data-suffix="+">0</div><div className="c-l">Enterprise Modules</div></div>
            <div className="count"><div className="c-n shine" data-count="500" data-suffix="+">0</div><div className="c-l">Processes Automated</div></div>
            <div className="count"><div className="c-n shine" data-count="1000" data-suffix="+">0</div><div className="c-l">AI Workflows</div></div>
            <div className="count"><div className="c-n shine" data-count="50" data-suffix="+">0</div><div className="c-l">Business Domains</div></div>
            <div className="count"><div className="c-n shine" data-count="156" data-suffix="">0</div><div className="c-l">Configured Playbooks</div></div>
          </div>
        </div>
      </section>

      <div className="rule"></div>

      {/* ══════════════ DESK ══════════════ */}
      <section className="sec">
        <span className="idx">08 — Local Desk</span>
        <div className="wrap">
          <div className="sh rv">
            <div className="eyebrow">Documentation Desk · Vaniyambadi</div>
            <h2 className="display">The ground floor of the same <span className="it gold">discipline.</span></h2>
            <p className="lede">Alongside enterprise and advisory work, our Vaniyambadi office runs a professional documentation desk — RTI applications, petitions, escalation files and compliance paperwork prepared to a standard that holds up at a bank, a department or a court. Walk in, or reach us on WhatsApp.</p>
          </div>
          <div className="desk rv">
            <div className="card desk-c"><div className="lvl">Level 01 · Drafting</div><h4>Drafting Support</h4><p>Petition or RTI drafted in the correct format, documents arranged in order, tracking number issued, and one-time submission guidance.</p></div>
            <div className="card desk-c"><div className="lvl">Level 02 · Follow-Up</div><h4>Follow-Up Pack</h4><p>Full drafting and submission guidance, reminder letter after a 30-day non-response, timeline tracking and status updates on WhatsApp.</p></div>
            <div className="card desk-c"><div className="lvl">Level 03 · Escalation</div><h4>Complete Escalation File</h4><p>RTI through first appeal to the State Information Commission; petition through department, Collector and Secretariat. A complete, court-and-bank-safe paper trail.</p></div>
            <div className="card desk-c"><div className="lvl">Level 04 · Retainer</div><h4>MSME Monthly Retainer</h4><p>Ongoing compliance calendar, GST and licence deadline tracking, vendor and job-work documentation, and a monthly business health note.</p></div>
          </div>
          <p className="sm rv" style={{ marginTop: '1.7rem', maxWidth: '80ch' }}>We are neither government officials nor intermediaries — this is documentation support only. Applications must be submitted by the applicant, and final decisions rest with the concerned authority. Outcomes are not guaranteed.</p>
        </div>
      </section>

      {/* ══════════════ CTA ══════════════ */}
      <section className="sec">
        <div className="wrap">
          <div className="cta rv">
            <div className="eyebrow ctr">The Next Decade</div>
            <h2 className="display">The next generation of businesses will compete on <span className="it gold">better intelligence.</span></h2>
            <p className="lede">Become one of them. Start with a confidential conversation — no deck, no pitch, just an honest read of where your business and your structure actually stand.</p>
            <div className="cta-b">
              <a href="#contact" className="btn btn-p mag">Start Your AI Transformation <svg className="ic ic-sm ar" style={{ stroke: 'currentColor' }}><use href="#i-arrow" /></svg></a>
              <a href="https://wa.me/919884824360" target="_blank" rel="noopener noreferrer" className="btn btn-s mag">Message on WhatsApp <svg className="ic ic-sm ar" style={{ stroke: 'currentColor' }}><use href="#i-arrow" /></svg></a>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ CONTACT ══════════════ */}
      <section className="sec" id="contact" style={{ paddingTop: 0 }}>
        <span className="idx">09 — Contact</span>
        <div className="wrap">
          <div className="sh rv">
            <div className="eyebrow">Contact</div>
            <h2 className="display">Begin a <span className="it gold">conversation.</span></h2>
          </div>
          <div className="contact">
            <div className="cinfo rv-l">
              <div className="ci"><span className="ci-ic"><svg className="ic ic-sm"><use href="#i-phone" /></svg></span><div><div className="ci-l">Direct &amp; WhatsApp</div><div className="ci-v"><a href="tel:+919884824360">+91 98848 24360</a></div></div></div>
              <div className="ci"><span className="ci-ic"><svg className="ic ic-sm"><use href="#i-mail" /></svg></span><div><div className="ci-l">Email</div><div className="ci-v"><a href="mailto:contact@unikorn360.com">contact@unikorn360.com</a></div></div></div>
              <div className="ci"><span className="ci-ic"><svg className="ic ic-sm"><use href="#i-pin" /></svg></span><div><div className="ci-l">Office</div><div className="ci-v">1078/1, VK Complex, 1st Floor, 3rd Shop,<br />PJN Road, Amburpet,<br />Vaniyambadi — 635 751, Tamil Nadu</div></div></div>
              <div className="ci"><span className="ci-ic"><svg className="ic ic-sm"><use href="#i-clock" /></svg></span><div><div className="ci-l">Hours</div><div className="ci-v">Monday – Saturday · 10:00 – 19:00 IST<br /><span className="sm">Advisory sessions by appointment</span></div></div></div>
              <div className="ci"><span className="ci-ic"><svg className="ic ic-sm"><use href="#i-user" /></svg></span><div><div className="ci-l">Founder</div><div className="ci-v">S. Rajkumar<br /><span className="sm">Principal Consultant, UNIKORN360</span></div></div></div>
            </div>

            <form className="rv" id="form" ref={formRef} onSubmit={handleFormSubmit} noValidate>
              <div className={`fok ${formSubmitted ? 'on' : ''}`} id="fok">
                Thank you. Your enquiry has been recorded and your email client will open with the details filled in. If it does not, write to contact@unikorn360.com or message +91 98848 24360 on WhatsApp.
              </div>
              <div className="fr">
                <div className="fld"><label htmlFor="nm">Name</label><input id="nm" name="name" type="text" required placeholder="Your full name" defaultValue={currentUser?.name || ''} /></div>
                <div className="fld"><label htmlFor="org">Organisation</label><input id="org" name="org" type="text" placeholder="Company or family office" defaultValue={currentUser?.company || ''} /></div>
              </div>
              <div className="fr">
                <div className="fld"><label htmlFor="em">Email</label><input id="em" name="email" type="email" required placeholder="you@company.com" defaultValue={currentUser?.email || ''} /></div>
                <div className="fld"><label htmlFor="ph">Phone</label><input id="ph" name="phone" type="tel" placeholder="+91" /></div>
              </div>
              <div className="fr">
                <div className="fld"><label htmlFor="intr">Interest</label>
                  <select id="intr" name="interest" defaultValue="Business360 — AI Platform">
                    <option>Business360 — AI Platform</option>
                    <option>Private Advisory — Executive Program</option>
                    <option>Private Advisory — Elite Transformation</option>
                    <option>Private Advisory — Legacy Architect</option>
                    <option>Documentation Desk — Vaniyambadi</option>
                    <option>MSME Monthly Retainer</option>
                    <option>Partnership or Referral</option>
                    <option>Something else</option>
                  </select>
                </div>
                <div className="fld"><label htmlFor="sz">Business Scale</label>
                  <select id="sz" name="scale" defaultValue="Pre-revenue / Startup">
                    <option>Pre-revenue / Startup</option>
                    <option>Under ₹1 Cr</option>
                    <option>₹1 Cr – ₹5 Cr</option>
                    <option>₹5 Cr – ₹25 Cr</option>
                    <option>₹25 Cr – ₹100 Cr</option>
                    <option>Above ₹100 Cr</option>
                    <option>Individual / Family</option>
                  </select>
                </div>
              </div>
              <div className="fld"><label htmlFor="msg">What are you trying to solve?</label><textarea id="msg" name="message" placeholder="A few lines on the situation — the more specific, the more useful our first conversation will be."></textarea></div>
              <button type="submit" className="btn btn-p mag" style={{ width: '100%' }}>Send Enquiry <svg className="ic ic-sm ar" style={{ stroke: 'currentColor' }}><use href="#i-arrow" /></svg></button>
              <p className="fnote">Submissions are treated as confidential. We respond within one working day. Nothing shared here is used in marketing material without written permission.</p>
            </form>
          </div>
        </div>
      </section>

      {/* ══════════════ FOOTER ══════════════ */}
      <footer>
        <div className="wrap">
          <div className="f-top">
            <div className="f-col f-brand">
              <a href="#top" className="brand"><span className="mark">U</span><span><span className="bname">UNIKORN<span className="gold">360</span></span><br /><span className="btag">AI Solutions</span></span></a>
              <p>Intelligence beyond software. Building the digital brain of every business — and architecting the families that own them.</p>
            </div>
            <div className="f-col">
              <h5>Platform</h5>
              <ul>
                <li><a href="#platform">Finance360</a></li>
                <li><a href="#platform">Legal360</a></li>
                <li><a href="#platform">HR360 &amp; Sales360</a></li>
                <li><a href="#platform">Factory360</a></li>
                <li><a href="#platform">Executive360</a></li>
                <li><a href="#platform">AI360</a></li>
              </ul>
            </div>
            <div className="f-col">
              <h5>Advisory</h5>
              <ul>
                <li><a href="#advisory">Personal Advisory</a></li>
                <li><a href="#advisory">Family Office</a></li>
                <li><a href="#advisory">Business Intelligence</a></li>
                <li><a href="#advisory">Executive Program</a></li>
                <li><a href="#advisory">Elite Transformation</a></li>
                <li><a href="#advisory">Legacy Architect</a></li>
              </ul>
            </div>
            <div className="f-col">
              <h5>Company</h5>
              <ul>
                <li><a href="#proof">Proof</a></li>
                <li><a href="#approach">Our Approach</a></li>
                <li><a href="#industries">Industries</a></li>
                <li><a href="#contact">Contact</a></li>
                <li><a href="https://wa.me/919884824360" target="_blank" rel="noopener noreferrer">WhatsApp</a></li>
                <li><a href="tel:+919884824360">+91 98848 24360</a></li>
              </ul>
            </div>
          </div>

          {/* Telemetry Block */}
          <div className="f-telemetry">
            <div className="f-tel-item">
              <span className="f-tel-label">Node Latency</span>
              <span className="f-tel-val">0.0034ms</span>
            </div>
            <div className="f-tel-item">
              <span className="f-tel-label">Encryption</span>
              <span className="f-tel-val">AES-512</span>
            </div>
            <div className="f-tel-item">
              <span className="f-tel-label">Uptime</span>
              <span className="f-tel-val">99.999%</span>
            </div>
            <div className="f-tel-item">
              <span className="f-tel-label">Auth Status</span>
              <span className="f-tel-val">SECURED</span>
            </div>
          </div>

          <div className="f-bot">
            <p>© 2026 UNIKORN360 AI Solutions · Unikorn360 Consultancy Services. All rights reserved.</p>
            <p className="mono">Vaniyambadi · Tamil Nadu · India</p>
          </div>
          <p className="f-dis">UNIKORN360 provides business intelligence, documentation and strategic advisory services. We are not a government body, financial intermediary, registered investment adviser, chartered accountancy firm or law firm, and nothing on this page constitutes legal, tax, investment or financial advice. Statutory filings, applications and regulated services are executed by the client or by appropriately licensed professionals. Platform metrics and dashboard figures shown are illustrative. Engagement patterns describe categories of work, not named client case studies. Outcomes of applications to government or financial institutions are determined solely by the concerned authority and are not guaranteed.</p>
        </div>
      </footer>

      {/* Floating Action Button */}
      <a href="https://wa.me/919884824360" target="_blank" rel="noopener noreferrer" className="fab" aria-label="Message us on WhatsApp">
        <svg className="ic" style={{ stroke: 'currentColor', strokeWidth: 1.3 }}><use href="#i-wa" /></svg>
      </a>

      {/* Auth Modal & Client Portal Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          setIsPortalOpen(true);
        }}
      />

      {currentUser && (
        <ClientPortalModal
          isOpen={isPortalOpen}
          onClose={() => setIsPortalOpen(false)}
          user={currentUser}
          onSignOut={() => setCurrentUser(null)}
        />
      )}
    </>
  );
}
