if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
            document.body.classList.add('touch-device');
        }

var externalScriptCache = {};

function loadScriptOnce(src) {
            if (externalScriptCache[src]) return externalScriptCache[src];

            externalScriptCache[src] = new Promise(function (resolve, reject) {
                var script = document.createElement('script');
                script.src = src;
                script.async = true;
                script.addEventListener('load', resolve, { once: true });
                script.addEventListener('error', reject, { once: true });
                document.head.appendChild(script);
            });

            return externalScriptCache[src];
        }

document.addEventListener('DOMContentLoaded', function () {
            var blobCache = new Map();

            function applyImageSource(img) {
                var source = img.getAttribute('data-src');
                if (!source || img.dataset.blobLoaded === 'true') return Promise.resolve();

                if (blobCache.has(source)) {
                    img.src = blobCache.get(source);
                    img.dataset.blobLoaded = 'true';
                    return Promise.resolve();
                }

                return fetch(source)
                    .then(function (response) {
                        if (!response.ok) throw new Error('Image request failed');
                        return response.blob();
                    })
                    .then(function (blob) {
                        var blobUrl = URL.createObjectURL(blob);
                        blobCache.set(source, blobUrl);
                        img.src = blobUrl;
                        img.dataset.blobLoaded = 'true';
                    })
                    .catch(function () {
                        img.src = source;
                        img.dataset.blobLoaded = 'true';
                    });
            }

            var lazyObserver = 'IntersectionObserver' in window
                ? new IntersectionObserver(function (entries, observer) {
                    entries.forEach(function (entry) {
                        if (!entry.isIntersecting) return;
                        observer.unobserve(entry.target);
                        applyImageSource(entry.target);
                    });
                }, { rootMargin: '200px 0px' })
                : null;

            document.querySelectorAll('img[data-src]').forEach(function (img) {
                if (img.loading === 'lazy' && lazyObserver) {
                    lazyObserver.observe(img);
                    return;
                }
                applyImageSource(img);
            });
        });

(function () {
            var loader    = document.getElementById('page-loader');
            var fill      = document.getElementById('loader-bar-fill');
            var done      = false;
            var startTime = Date.now();
            var MIN_SHOW  = 180; // ms

            var imageSrcs = [
                './source/hero/SS.png',
            ];

            var total  = imageSrcs.length;
            var loaded = 0;

            function setProgress(p) {
                fill.style.width = Math.min(Math.round(p), 99) + '%';
            }

            function onItem() {
                loaded++;
                setProgress((loaded / total) * 100);
                if (loaded >= total) finish();
            }

            function finish() {
                if (done) return;
                done = true;
                var remaining = Math.max(0, MIN_SHOW - (Date.now() - startTime));
                setTimeout(function () {
                    fill.style.transition = 'width 0.18s ease';
                    fill.style.width = '100%';
                    setTimeout(function () {
                        loader.classList.add('done');
                        setTimeout(function () { loader.style.display = 'none'; }, 220);
                    }, 180);
                }, remaining);
            }

            imageSrcs.forEach(function (src) {
                var img = new Image();
                img.onload  = onItem;
                img.onerror = onItem;
                img.src = src;
            });

            setTimeout(finish, 900);
        })();

function initializeThreeHero() {
            var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            var isMobile = window.innerWidth < 768 || ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
            var canvas = document.getElementById('hero-canvas');
            var W = window.innerWidth, H = window.innerHeight;

            if (prefersReduced || !canvas || !window.THREE) {
                if (canvas) canvas.style.display = 'none';
                return;
            }

            var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: !isMobile, alpha: true });
            renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2));
            renderer.setSize(W, H);
            renderer.setClearColor(0x000000, 0);

            var scene = new THREE.Scene();
            var camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 500);
            camera.position.z = 22;

            // ── Central large wireframe icosahedron ──
            var bigGeo = new THREE.IcosahedronGeometry(5.5, 1);
            var bigMat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, opacity: 0.07, transparent: true });
            var bigMesh = new THREE.Mesh(bigGeo, bigMat);
            bigMesh.position.set(8, 0, -2);
            scene.add(bigMesh);

            // Inner solid
            var innerGeo = new THREE.IcosahedronGeometry(3.8, 1);
            var innerMat = new THREE.MeshBasicMaterial({ color: 0xc9a96e, wireframe: true, opacity: 0.05, transparent: true });
            var innerMesh = new THREE.Mesh(innerGeo, innerMat);
            innerMesh.position.set(8, 0, -2);
            scene.add(innerMesh);

            // ── Satellites (desktop only) ──
            var satellites = [];
            if (!isMobile) {
                var satCount = 6;
                var satGeo = new THREE.IcosahedronGeometry(0.35, 0);
                for (var i = 0; i < satCount; i++) {
                    var angle = (i / satCount) * Math.PI * 2;
                    var satMat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, opacity: 0.25, transparent: true });
                    var sat = new THREE.Mesh(satGeo, satMat);
                    sat.userData.angle = angle;
                    sat.userData.radius = 7.5;
                    sat.userData.speed = 0.003 + Math.random() * 0.002;
                    sat.userData.yOff = (Math.random() - 0.5) * 3;
                    scene.add(sat);
                    satellites.push(sat);
                }
            }

            // ── Background particle field (fewer on mobile) ──
            var PARTICLE_COUNT = isMobile ? 18 : 55;
            var particles = [];
            var pGeo = new THREE.IcosahedronGeometry(0.15, 0);
            for (var j = 0; j < PARTICLE_COUNT; j++) {
                var pMat = new THREE.MeshBasicMaterial({
                    color: 0xffffff,
                    wireframe: true,
                    opacity: Math.random() * 0.12 + 0.04,
                    transparent: true
                });
                var p = new THREE.Mesh(pGeo, pMat);
                p.position.set(
                    (Math.random() - 0.5) * 50,
                    (Math.random() - 0.5) * 30,
                    (Math.random() - 0.5) * 15 - 5
                );
                p.scale.setScalar(Math.random() * 1.8 + 0.5);
                p.userData.rx = (Math.random() - 0.5) * 0.007;
                p.userData.ry = (Math.random() - 0.5) * 0.007;
                scene.add(p);
                particles.push(p);
            }

            // ── Connecting lines (desktop only) ──
            var lineGeo, linePairs = [], lineSegments;
            if (!isMobile) {
                lineGeo = new THREE.BufferGeometry();
                var linePositions = [];
                for (var a = 0; a < particles.length; a++) {
                    for (var b = a + 1; b < particles.length; b++) {
                        var dist = particles[a].position.distanceTo(particles[b].position);
                        if (dist < 9 && linePairs.length < 60) linePairs.push([a, b]);
                    }
                }
                for (var k = 0; k < linePairs.length * 2; k++) linePositions.push(0, 0, 0);
                lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
                var lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.04, transparent: true });
                lineSegments = new THREE.LineSegments(lineGeo, lineMat);
                scene.add(lineSegments);
            }

            var mouseX = 0, mouseY = 0, smX = 0, smY = 0;
            if (!isMobile) {
                document.addEventListener('mousemove', function (e) {
                    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
                    mouseY = -(e.clientY / window.innerHeight - 0.5) * 2;
                }, { passive: true });
            }

            var clock = new THREE.Clock();
            var rafId = null;
            var isActive = !document.hidden;

            function renderFrame() {
                var t = clock.getElapsedTime();

                if (!isMobile) {
                    smX += (mouseX - smX) * 0.025;
                    smY += (mouseY - smY) * 0.025;
                    camera.position.x = smX * 2 + Math.sin(t * 0.12) * 1.5;
                    camera.position.y = smY * 1.5 + Math.cos(t * 0.1) * 1;
                } else {
                    camera.position.x = Math.sin(t * 0.12) * 1.5;
                    camera.position.y = Math.cos(t * 0.1) * 1;
                }
                camera.lookAt(scene.position);

                bigMesh.rotation.x += 0.0025;
                bigMesh.rotation.y += 0.004;
                innerMesh.rotation.x -= 0.003;
                innerMesh.rotation.y -= 0.005;

                for (var i = 0; i < satellites.length; i++) {
                    satellites[i].userData.angle += satellites[i].userData.speed;
                    var ang = satellites[i].userData.angle;
                    var r = satellites[i].userData.radius;
                    satellites[i].position.set(
                        8 + Math.cos(ang) * r,
                        satellites[i].userData.yOff + Math.sin(ang * 0.5) * 1.5,
                        -2 + Math.sin(ang) * r * 0.5
                    );
                    satellites[i].rotation.x += 0.01;
                    satellites[i].rotation.y += 0.008;
                }

                for (var j = 0; j < particles.length; j++) {
                    particles[j].rotation.x += particles[j].userData.rx;
                    particles[j].rotation.y += particles[j].userData.ry;
                }

                if (!isMobile && lineGeo && linePairs.length) {
                    var pos = lineGeo.attributes.position.array;
                    for (var k = 0; k < linePairs.length; k++) {
                        var pa = particles[linePairs[k][0]].position;
                        var pb = particles[linePairs[k][1]].position;
                        pos[k*6+0]=pa.x; pos[k*6+1]=pa.y; pos[k*6+2]=pa.z;
                        pos[k*6+3]=pb.x; pos[k*6+4]=pb.y; pos[k*6+5]=pb.z;
                    }
                    lineGeo.attributes.position.needsUpdate = true;
                }

                renderer.render(scene, camera);
            }

            function animate() {
                if (!isActive) return;
                renderFrame();
                rafId = requestAnimationFrame(animate);
            }

            function startAnimation() {
                if (!isActive || rafId !== null) return;
                clock.start();
                animate();
            }

            function stopAnimation() {
                if (rafId !== null) {
                    cancelAnimationFrame(rafId);
                    rafId = null;
                }
                clock.stop();
            }

            document.addEventListener('visibilitychange', function () {
                isActive = !document.hidden;
                if (isActive) startAnimation();
                else stopAnimation();
            });

            startAnimation();

            window.addEventListener('resize', function () {
                W = window.innerWidth; H = window.innerHeight;
                renderer.setSize(W, H);
                camera.aspect = W / H;
                camera.updateProjectionMatrix();
            }, { passive: true });
        }

(function () {
            var slides = document.querySelectorAll('.hero-slide');
            var current = 0;
            var INTERVAL = 7000;

            function goTo(idx) {
                slides[current].classList.remove('active');
                current = idx;
                slides[current].classList.add('active');
            }

            var timer = setInterval(function () {
                goTo((current + 1) % slides.length);
            }, INTERVAL);

            var hero = document.getElementById('hero');
            hero.addEventListener('mouseenter', function () { clearInterval(timer); });
            hero.addEventListener('mouseleave', function () {
                clearInterval(timer);
                timer = setInterval(function () { goTo((current + 1) % slides.length); }, INTERVAL);
            });
        })();

function initializeHeroHeadlineAnimation() {
            if (!window.gsap || !window.ScrollTrigger) return;
            gsap.registerPlugin(ScrollTrigger);
            var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            var heading = document.getElementById('hero-heading');
            if (!heading || heading.dataset.gsapReady === 'true') return;
            heading.dataset.gsapReady = 'true';
            var rawLines = [document.createDocumentFragment()];
            var fragment = document.createDocumentFragment();

            Array.prototype.slice.call(heading.childNodes).forEach(function (node) {
                if (node.nodeName === 'BR') {
                    rawLines.push(document.createDocumentFragment());
                    return;
                }
                rawLines[rawLines.length - 1].appendChild(node.cloneNode(true));
            });

            rawLines.forEach(function (lineNodes) {
                var lineWrap = document.createElement('span');
                var wordWrap = document.createElement('span');

                lineWrap.className = 'hero-line';
                lineWrap.style.display = 'block';
                lineWrap.style.overflow = 'hidden';

                wordWrap.className = 'hero-word';
                wordWrap.style.display = 'inline-block';
                wordWrap.style.willChange = 'transform,opacity';
                if (!prefersReduced) {
                    wordWrap.style.opacity = '0';
                    wordWrap.style.transform = 'translateY(100%)';
                }

                wordWrap.appendChild(lineNodes);
                lineWrap.appendChild(wordWrap);
                fragment.appendChild(lineWrap);
            });

            heading.replaceChildren(fragment);

            if (!prefersReduced) {
                gsap.to('.hero-word', {
                    opacity: 1,
                    y: 0,
                    duration: 0.9,
                    stagger: 0.1,
                    ease: 'power4.out',
                    delay: 0.2
                });
            }
        }

function bootHeavyVisuals() {
            var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            var hero = document.getElementById('hero');

            if (!prefersReduced) {
                loadScriptOnce('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js')
                    .then(function () {
                        return loadScriptOnce('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js');
                    })
                    .then(function () {
                        initializeHeroHeadlineAnimation();
                    })
                    .catch(function () {});
            }

            if (prefersReduced) {
                var canvas = document.getElementById('hero-canvas');
                if (canvas) canvas.style.display = 'none';
                return;
            }

            if (!hero || !('IntersectionObserver' in window)) {
                loadScriptOnce('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js')
                    .then(function () {
                        initializeThreeHero();
                    })
                    .catch(function () {});
                return;
            }

            var started = false;
            var observer = new IntersectionObserver(function (entries) {
                if (started || !entries[0].isIntersecting) return;
                started = true;
                observer.disconnect();
                loadScriptOnce('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js')
                    .then(function () {
                        initializeThreeHero();
                    })
                    .catch(function () {});
            }, { threshold: 0.15 });

            observer.observe(hero);
        }

(function () {
            var obs = new IntersectionObserver(function (entries) {
                entries.forEach(function (e) {
                    if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
                });
            }, { threshold: 0.1 });
            document.querySelectorAll('.reveal').forEach(function (el) { obs.observe(el); });

            // Team stagger
            var tObs = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        var d = parseInt(entry.target.dataset.sd) || 0;
                        setTimeout(function () { entry.target.classList.add('visible'); }, d);
                        tObs.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.08 });
            document.querySelectorAll('.team-card').forEach(function (c, i) {
                c.dataset.sd = i * 70;
                tObs.observe(c);
            });
        })();

(function () {
            var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (prefersReduced) return;

            // Only team cards get tilt; game cards use scroll pop-in instead
            document.querySelectorAll('#team [data-tilt]').forEach(function (card) {
                var tiltX = 0, tiltY = 0, lerpX = 0, lerpY = 0, raf = null;

                function lerp(a, b, t) { return a + (b - a) * t; }

                function tick() {
                    lerpX = lerp(lerpX, tiltX, 0.1);
                    lerpY = lerp(lerpY, tiltY, 0.1);
                    card.style.transform = 'perspective(900px) rotateX(' + lerpX + 'deg) rotateY(' + lerpY + 'deg) translateZ(4px)';
                    raf = requestAnimationFrame(tick);
                }

                card.addEventListener('mouseenter', function () { raf = requestAnimationFrame(tick); });

                card.addEventListener('mousemove', function (e) {
                    var rect = card.getBoundingClientRect();
                    var x = (e.clientX - rect.left) / rect.width - 0.5;
                    var y = (e.clientY - rect.top) / rect.height - 0.5;
                    tiltY = x * 10;
                    tiltX = -y * 8;
                });

                card.addEventListener('mouseleave', function () {
                    tiltX = 0; tiltY = 0;
                    setTimeout(function () {
                        cancelAnimationFrame(raf);
                        card.style.transform = '';
                        lerpX = 0; lerpY = 0;
                    }, 500);
                });
            });
        })();

(function () {
            var navbar = document.getElementById('navbar');
            var links = document.querySelectorAll('.nav-link[data-section]');
            var sections = document.querySelectorAll('section[id]');

            window.addEventListener('scroll', function () {
                navbar.classList.toggle('scrolled', window.scrollY > 60);
            }, { passive: true });

            var sObs = new IntersectionObserver(function (entries) {
                entries.forEach(function (e) {
                    if (e.isIntersecting) {
                        links.forEach(function (l) {
                            l.classList.toggle('active', l.dataset.section === e.target.id);
                        });
                    }
                });
            }, { threshold: 0.35 });
            sections.forEach(function (s) { sObs.observe(s); });
        })();

(function () {
            var dot = document.getElementById('cursor-dot');
            var ring = document.getElementById('cursor-ring');
            var dx = 0, dy = 0, rx = 0, ry = 0;

            function moveCursor(x, y) {
                dx = x; dy = y;
                dot.style.left = dx + 'px';
                dot.style.top = dy + 'px';
            }

            document.addEventListener('mousemove', function (e) {
                moveCursor(e.clientX, e.clientY);
            }, { passive: true });

            document.addEventListener('touchstart', function (e) {
                var t = e.touches[0];
                moveCursor(t.clientX, t.clientY);
            }, { passive: true });

            document.addEventListener('touchmove', function (e) {
                var t = e.touches[0];
                moveCursor(t.clientX, t.clientY);
            }, { passive: true });

            // ring lags behind
            (function animRing() {
                rx += (dx - rx) * 0.14;
                ry += (dy - ry) * 0.14;
                ring.style.left = rx + 'px';
                ring.style.top = ry + 'px';
                requestAnimationFrame(animRing);
            })();

            // hover state
            var hoverEls = document.querySelectorAll('a, button, [data-tilt]');
            hoverEls.forEach(function (el) {
                el.addEventListener('mouseenter', function () { document.body.classList.add('cursor-hover'); });
                el.addEventListener('mouseleave', function () { document.body.classList.remove('cursor-hover'); });
            });
        })();

document.addEventListener('DOMContentLoaded', function () {
            var btn = document.getElementById('mobile-menu-button');
            var overlay = document.getElementById('mobile-overlay');
            var icon = btn.querySelector('i');
            var open = false;

            function toggle() {
                open = !open;
                overlay.classList.toggle('open', open);
                overlay.setAttribute('aria-hidden', String(!open));
                icon.className = open ? 'ri-close-line ri-xl' : 'ri-menu-line ri-xl';
            }

            btn.addEventListener('click', toggle);
            overlay.querySelectorAll('a').forEach(function (a) {
                a.addEventListener('click', function () { if (open) toggle(); });
            });
        });

document.addEventListener('DOMContentLoaded', function () {
            var form = document.querySelector('form');
            var msg = document.getElementById('message');
            var count = document.getElementById('charCount');
            var notice = document.getElementById('formMessage');
            var btn = document.getElementById('submitBtn');
            var spinner = document.getElementById('loadingIcon');

            function flash(text, err) {
                notice.textContent = text;
                notice.classList.remove('hidden', 'bg-green-600', 'bg-red-600', 'text-white');
                notice.classList.add(err ? 'bg-red-600' : 'bg-green-600', 'text-white');
                setTimeout(function () { notice.classList.add('hidden'); }, 5000);
            }

            msg.addEventListener('input', function () {
                var l = this.value.length;
                count.textContent = l > 500 ? (this.value = this.value.slice(0, 500), 500) : l;
            });

            form.addEventListener('submit', async function (e) {
                e.preventDefault();
                if (msg.value.length > 500) { flash('Message cannot exceed 500 characters', true); return; }
                btn.disabled = true;
                spinner.classList.remove('hidden');
                var data = {};
                new FormData(this).forEach(function (v, k) { data[k] = v; });
                try {
                    var res = await fetch(this.action, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: new URLSearchParams(data).toString()
                    });
                    if (res.ok) { flash('Message sent successfully!', false); this.reset(); count.textContent = '0'; }
                    else if (res.status === 503) flash('Servers are busy. You can mail us at contact@holymarmot.com', true);
                    else flash('Failed on verification. Please try again with different message.', true);
                } catch (_) { flash('An error occurred. Please try again later.', true); }
                finally { btn.disabled = false; spinner.classList.add('hidden'); }
            });
        });

(function () {
            var card     = document.getElementById('bc-card');
            var video    = document.getElementById('bc-video');
            var overlay  = document.getElementById('bc-overlay');
            var progress = document.getElementById('bc-progress');
            var fill     = document.getElementById('bc-fill');

            var STEAM_URL    = 'https://store.steampowered.com/app/3799220/Bearstone_Campsite_Demo/';
            var CLIP_PLAY_MS = 2000;
            var TOTAL_CLIPS  = 10;
            var videoSource  = video.getAttribute('data-src');

            var clips      = [];
            var clipIndex  = 0;
            var clipTimer  = null;
            var hoverTimer = null;
            var completed  = false;
            var videoBlobUrl = null;
            var videoReadyPromise = null;
            var pendingStart = 0;

            var isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

            function ensureVideoReady() {
                if (video.readyState >= 1 && video.currentSrc) return Promise.resolve();
                if (videoReadyPromise) return videoReadyPromise;

                videoReadyPromise = fetch(videoSource)
                    .then(function (response) {
                        if (!response.ok) throw new Error('Video request failed');
                        return response.blob();
                    })
                    .then(function (blob) {
                        if (videoBlobUrl) URL.revokeObjectURL(videoBlobUrl);
                        videoBlobUrl = URL.createObjectURL(blob);

                        return new Promise(function (resolve, reject) {
                            function onLoaded() {
                                video.removeEventListener('loadedmetadata', onLoaded);
                                video.removeEventListener('error', onError);
                                resolve();
                            }

                            function onError() {
                                video.removeEventListener('loadedmetadata', onLoaded);
                                video.removeEventListener('error', onError);
                                reject(new Error('Video metadata failed'));
                            }

                            video.addEventListener('loadedmetadata', onLoaded);
                            video.addEventListener('error', onError);
                            video.src = videoBlobUrl;
                            video.load();
                        });
                    })
                    .catch(function (error) {
                        videoReadyPromise = null;
                        throw error;
                    });

                return videoReadyPromise;
            }

            /* ── Build clip start-times spread across the video ── */
            function buildClips(dur) {
                clips = [];
                for (var i = 0; i < TOTAL_CLIPS; i++) {
                    var pct = 0.08 + (i / (TOTAL_CLIPS - 1)) * 0.88;
                    clips.push(parseFloat((pct * dur).toFixed(2)));
                }
            }

            video.addEventListener('loadedmetadata', function () {
                buildClips(video.duration);
            });

            /* ── Update gold progress bar ── */
            function setProgress(pct) {
                fill.style.width = pct + '%';
            }

            /* ── Desktop: segment-based playback ── */
            function playSegment() {
                if (clipIndex >= TOTAL_CLIPS) { onComplete(); return; }
                video.currentTime = clips[clipIndex];
                video.play().catch(function () {});
                setProgress(((clipIndex + 1) / TOTAL_CLIPS) * 100);
                clipTimer = setTimeout(function () {
                    video.pause();
                    clipIndex++;
                    playSegment();
                }, CLIP_PLAY_MS);
            }

            function startTrailerDesktop() {
                if (completed) return;
                var startId = ++pendingStart;
                ensureVideoReady().then(function () {
                    if (completed || startId !== pendingStart) return;
                    clipIndex = 0;
                    video.classList.add('active');
                    progress.classList.add('visible');
                    setProgress(0);
                    playSegment();
                }).catch(function () {});
            }

            /* ── Mobile: linear playback ── */
            function startTrailerMobile() {
                if (completed) return;
                var startId = ++pendingStart;
                ensureVideoReady().then(function () {
                    if (completed || startId !== pendingStart) return;
                    video.currentTime = 0;
                    video.classList.add('active');
                    progress.classList.add('visible');
                    setProgress(0);
                    video.play().catch(function () {});
                }).catch(function () {});
            }

            video.addEventListener('timeupdate', function () {
                if (!isTouch || !video.duration) return;
                setProgress((video.currentTime / video.duration) * 100);
            });

            video.addEventListener('ended', function () {
                if (isTouch) onComplete();
            });

            /* ── Reset everything ── */
            function reset() {
                clearTimeout(clipTimer);
                clearTimeout(hoverTimer);
                pendingStart++;
                video.pause();
                video.classList.remove('active');
                video.style.opacity = '';
                progress.classList.remove('visible');
                setProgress(0);
                overlay.classList.remove('show');
                clipIndex = 0;
                completed = false;
            }

            /* ── All segments/video played → show Steam CTA ── */
            function onComplete() {
                completed = true;
                setProgress(100);
                setTimeout(function () {
                    overlay.classList.add('show');
                }, 280);
            }

            function openExternal(url) {
                var win = window.open(url, '_blank', 'noopener,noreferrer');
                if (win) win.opener = null;
            }

            /* ════ Desktop (mouse) events ════ */
            if (!isTouch) {
                card.addEventListener('mouseenter', function () {
                    if (completed) return;
                    hoverTimer = setTimeout(startTrailerDesktop, 350);
                });

                card.addEventListener('mouseleave', function () {
                    clearTimeout(hoverTimer);
                    if (!completed) { reset(); } else { setTimeout(reset, 200); }
                });

                card.addEventListener('click', function (e) {
                    if (!e.target.closest('a')) openExternal(STEAM_URL);
                });
            }

            /* ════ Mobile (touch) events ════ */
            if (isTouch) {
                var trailerActive = false;
                var touchStartX = 0, touchStartY = 0;

                card.addEventListener('touchstart', function (e) {
                    touchStartX = e.touches[0].clientX;
                    touchStartY = e.touches[0].clientY;
                }, { passive: true });

                card.addEventListener('touchend', function (e) {
                    // Scroll hareketi mi? → yoksay
                    var dx = Math.abs(e.changedTouches[0].clientX - touchStartX);
                    var dy = Math.abs(e.changedTouches[0].clientY - touchStartY);
                    if (dx > 10 || dy > 10) return;

                    if (e.target.closest('a')) return;
                    e.preventDefault();
                    e.stopPropagation();

                    if (!trailerActive) {
                        trailerActive = true;
                        startTrailerMobile();
                    } else {
                        openExternal(STEAM_URL);
                    }
                });

                // Kart dışına tap edilince sıfırla
                document.addEventListener('touchend', function (e) {
                    if (!trailerActive) return;
                    if (card.contains(e.target)) return;
                    var dx = Math.abs(e.changedTouches[0].clientX - touchStartX);
                    var dy = Math.abs(e.changedTouches[0].clientY - touchStartY);
                    if (dx > 10 || dy > 10) return; // scroll ise sıfırlama
                    reset();
                    trailerActive = false;
                }, { passive: true });

                // Kart ekrandan çıkınca sıfırla
                new IntersectionObserver(function (entries) {
                    if (!entries[0].isIntersecting) { reset(); trailerActive = false; }
                }, { threshold: 0.1 }).observe(card);
            }
        })();

document.addEventListener('DOMContentLoaded', function () {
            document.querySelectorAll('a[href^="#"]').forEach(function (a) {
                a.addEventListener('click', function (e) {
                    e.preventDefault();
                    var id = this.getAttribute('href');
                    if (id === '#') return;
                    var el = document.querySelector(id);
                    if (el) window.scrollTo({ top: el.offsetTop - 70, behavior: 'smooth' });
                });
            });
        });

if ('requestIdleCallback' in window) {
            requestIdleCallback(bootHeavyVisuals, { timeout: 1200 });
        } else {
            setTimeout(bootHeavyVisuals, 250);
        }
