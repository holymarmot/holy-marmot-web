// Holy Marmot — small progressive enhancements. Every block checks that its
// elements exist, so the same file works on the home page and /privacy/.
(function () {
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var saveData = !!(navigator.connection && navigator.connection.saveData);

    /* ─── Header: hairline once the page scrolls ─── */
    var header = document.querySelector('.site-header');
    if (header) {
        var onScroll = function () { header.toggleAttribute('data-scrolled', window.scrollY > 8); };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    /* ─── Mobile menu ─── */
    var nav = document.querySelector('.site-nav');
    var toggle = nav && nav.querySelector('.menu-toggle');
    if (toggle) {
        var setOpen = function (open) {
            nav.toggleAttribute('data-open', open);
            toggle.setAttribute('aria-expanded', String(open));
            toggle.textContent = open ? 'Close' : 'Menu';
        };
        toggle.addEventListener('click', function () { setOpen(!nav.hasAttribute('data-open')); });
        nav.querySelectorAll('.menu a').forEach(function (a) {
            a.addEventListener('click', function () { setOpen(false); });
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && nav.hasAttribute('data-open')) { setOpen(false); toggle.focus(); }
        });
    }

    /* ─── Hero loop: plays muted while visible; the button pauses it ─── */
    var loop = document.getElementById('hero-loop');
    var loopBtn = document.querySelector('.loop-toggle');
    if (loop && loopBtn) {
        var userPaused = reduceMotion || saveData;
        var ICON_PAUSE = '<svg viewBox="0 0 10 10" aria-hidden="true"><rect x="1.5" y="1" width="2.5" height="8"/><rect x="6" y="1" width="2.5" height="8"/></svg>';
        var ICON_PLAY = '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2 1l7 4-7 4z"/></svg>';
        var sync = function () {
            var playing = !loop.paused;
            loopBtn.innerHTML = playing ? ICON_PAUSE : ICON_PLAY;
            loopBtn.setAttribute('aria-label', playing ? 'Pause background video' : 'Play background video');
        };
        var play = function () { var p = loop.play(); if (p && p.catch) p.catch(sync); };
        loop.addEventListener('play', sync);
        loop.addEventListener('pause', sync);
        loopBtn.addEventListener('click', function () {
            if (loop.paused) { userPaused = false; play(); } else { userPaused = true; loop.pause(); }
        });
        loopBtn.hidden = false;
        sync();
        if ('IntersectionObserver' in window) {
            new IntersectionObserver(function (entries) {
                if (entries[0].isIntersecting) { if (!userPaused) play(); } else { loop.pause(); }
            }, { threshold: 0.2 }).observe(loop);
        } else if (!userPaused) {
            play();
        }
    }

    /* ─── Game media: short muted preview on hover (mouse only) ─── */
    var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (canHover && !reduceMotion && !saveData) {
        document.querySelectorAll('.game-media[data-preview]').forEach(function (box) {
            var base = box.getAttribute('data-preview');
            var video = box.querySelector('.preview');
            var ready = false;
            box.addEventListener('mouseenter', function () {
                if (!ready) {
                    video.innerHTML = '<source src="' + base + '.webm" type="video/webm"><source src="' + base + '.mp4" type="video/mp4">';
                    video.load();
                    ready = true;
                }
                var p = video.play();
                if (p && p.catch) p.catch(function () {});
                box.setAttribute('data-playing', '');
            });
            box.addEventListener('mouseleave', function () {
                box.removeAttribute('data-playing');
                video.pause();
            });
        });
    }

    /* ─── Trailer: opens in a dialog; the 50 MB file loads only then ─── */
    var dialog = document.getElementById('trailer');
    if (dialog && typeof dialog.showModal === 'function') {
        var tv = dialog.querySelector('video');
        document.querySelectorAll('[data-trailer]').forEach(function (link) {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                if (!tv.poster && tv.dataset.poster) tv.poster = tv.dataset.poster;
                tv.src = link.getAttribute('href');
                dialog.showModal();
                var p = tv.play();
                if (p && p.catch) p.catch(function () {});
            });
        });
        dialog.querySelector('[data-close]').addEventListener('click', function () { dialog.close(); });
        dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });
        dialog.addEventListener('close', function () {
            tv.pause();
            tv.removeAttribute('src');
            tv.load();
        });
    }

    /* ─── Contact form: character count and background submit ─── */
    var form = document.getElementById('contact-form');
    if (form) {
        var msg = document.getElementById('message');
        var count = document.getElementById('char-count');
        var status = document.getElementById('form-status');
        var submit = document.getElementById('submit-btn');
        var MAX = 500;
        var EMAIL = 'contact@holymarmot.com';

        var say = function (text, state) {
            status.textContent = text;
            status.setAttribute('data-state', state);
        };
        msg.addEventListener('input', function () {
            if (msg.value.length > MAX) msg.value = msg.value.slice(0, MAX);
            count.textContent = msg.value.length + '/' + MAX;
        });
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var data = new URLSearchParams();
            new FormData(form).forEach(function (v, k) { data.append(k, v); });
            submit.disabled = true;
            submit.textContent = 'Sending…';
            say('', '');
            fetch(form.action, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: data.toString()
            }).then(function (res) {
                if (res.ok) {
                    say('Message sent.', 'ok');
                    form.reset();
                    count.textContent = '0/' + MAX;
                } else if (res.status === 503) {
                    say('The server is busy right now. Try again in a few minutes, or email ' + EMAIL + '.', 'error');
                } else {
                    say('The message couldn\'t be sent. Check the fields and try again, or email ' + EMAIL + '.', 'error');
                }
            }).catch(function () {
                say('Couldn\'t reach the server. Check your connection, or email ' + EMAIL + '.', 'error');
            }).then(function () {
                submit.disabled = false;
                submit.textContent = 'Send message';
            });
        });
    }
})();
