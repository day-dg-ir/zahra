/* ============================================
   GIRLS' DAY LANDING PAGE - MAIN JAVASCRIPT
   Advanced Animations with GSAP + ScrollTrigger
   ============================================ */

document.addEventListener('DOMContentLoaded', async () => {

    // Load editable page copy before starting animations that use the text.
    try {
        const response = await fetch('./content.json');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const content = await response.json();
        const getContentValue = (path) => {
            const parts = path.split('.');
            let value = content;
            if (parts[0] === 'flowerCard' && parts[1] === 'selected') {
                value = content.flowerCard?.options?.[content.flowerCard.selected];
                parts.splice(0, 2);
            }
            return parts.reduce((current, key) => current?.[key], value);
        };

        document.querySelectorAll('[data-content]').forEach((element) => {
            const value = getContentValue(element.dataset.content);
            if (value !== undefined && value !== null) element.textContent = value;
        });

        document.querySelectorAll('[data-content-attr]').forEach((element) => {
            element.dataset.contentAttr.split(';').forEach((binding) => {
                const [attribute, path] = binding.split(':').map(part => part.trim());
                const value = getContentValue(path);
                if (attribute && value !== undefined && value !== null) {
                    element.setAttribute(attribute, String(value));
                }
            });
        });
    } catch (error) {
        console.warn('Could not load content.json; using the default HTML copy.', error);
    }

    const themeStyles = getComputedStyle(document.documentElement);
    const primaryRgb = themeStyles.getPropertyValue('--primary-rgb').trim();
    const secondaryRgb = themeStyles.getPropertyValue('--secondary-rgb').trim();
    const accentRgb = themeStyles.getPropertyValue('--accent-rgb').trim();
    const themeColor = (property) => themeStyles.getPropertyValue(property).trim();

    // Register GSAP plugins
    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

    /* ============================================
       PRELOADER
       ============================================ */
    const preloader = document.getElementById('preloader');
    
    window.addEventListener('load', () => {
        gsap.to(preloader, {
            opacity: 0,
            duration: 0.8,
            delay: 2.2,
            ease: 'power2.inOut',
            onComplete: () => {
                preloader.classList.add('hidden');
                preloader.style.display = 'none';
                initHeroAnimations();
                initFallingPetals();
            }
        });
    });

    // Fallback if load takes too long
    setTimeout(() => {
        if (!preloader.classList.contains('hidden')) {
            preloader.classList.add('hidden');
            preloader.style.display = 'none';
            initHeroAnimations();
            initFallingPetals();
        }
    }, 5000);

    /* ============================================
       CUSTOM CURSOR
       ============================================ */
    const cursor = document.querySelector('.custom-cursor');
    const cursorFollower = document.querySelector('.custom-cursor-follower');
    let mouseX = 0, mouseY = 0;
    let followerX = 0, followerY = 0;

    // Only enable on non-touch
    if (window.matchMedia('(pointer: fine)').matches) {
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            gsap.to(cursor, { x: mouseX - 6, y: mouseY - 6, duration: 0.1 });
        });

        function animateFollower() {
            followerX += (mouseX - followerX) * 0.12;
            followerY += (mouseY - followerY) * 0.12;
            gsap.set(cursorFollower, { x: followerX - 20, y: followerY - 20 });
            requestAnimationFrame(animateFollower);
        }
        animateFollower();

        // Hover effects
        document.querySelectorAll('a, button, .gallery-item, .wish-card').forEach(el => {
            el.addEventListener('mouseenter', () => {
                gsap.to(cursorFollower, { width: 60, height: 60, borderColor: `rgba(${primaryRgb}, 0.6)`, duration: 0.3 });
                gsap.to(cursor, { scale: 0.5, duration: 0.3 });
            });
            el.addEventListener('mouseleave', () => {
                gsap.to(cursorFollower, { width: 40, height: 40, borderColor: themeColor('--primary-light'), duration: 0.3 });
                gsap.to(cursor, { scale: 1, duration: 0.3 });
            });
        });
    } else {
        cursor.style.display = 'none';
        cursorFollower.style.display = 'none';
    }

    /* ============================================
       PARTICLE SYSTEM
       ============================================ */
    const canvas = document.getElementById('particles-canvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationId;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    class Particle {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 3 + 1;
            this.speedX = (Math.random() - 0.5) * 0.5;
            this.speedY = (Math.random() - 0.5) * 0.5;
            this.opacity = Math.random() * 0.5 + 0.1;
            this.color = [
                `rgba(${primaryRgb},`,
                `rgba(${secondaryRgb},`,
                `rgba(${accentRgb},`,
                `rgba(${primaryRgb},`,
                `rgba(${secondaryRgb},`,
            ][Math.floor(Math.random() * 5)];
            this.pulseSpeed = Math.random() * 0.02 + 0.005;
            this.pulsePhase = Math.random() * Math.PI * 2;
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            this.pulsePhase += this.pulseSpeed;

            if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
            if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
        }

        draw() {
            const pulse = Math.sin(this.pulsePhase) * 0.3 + 0.7;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * pulse, 0, Math.PI * 2);
            ctx.fillStyle = this.color + (this.opacity * pulse) + ')';
            ctx.fill();
        }
    }

    // Create particles
    const particleCount = Math.min(80, Math.floor(window.innerWidth / 20));
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    function connectParticles() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 120) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(${primaryRgb}, ${0.1 * (1 - distance / 120)})`;
                    ctx.lineWidth = 0.5;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
    }

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        connectParticles();
        animationId = requestAnimationFrame(animateParticles);
    }

    animateParticles();

    /* ============================================
       FALLING PETALS
       ============================================ */
    function initFallingPetals() {
        const petalsContainer = document.getElementById('fallingPetals');
        const petalColors = [themeColor('--primary-light'), themeColor('--secondary'), themeColor('--primary'), themeColor('--accent'), themeColor('--primary-dark'), themeColor('--accent-gold')];

        for (let i = 0; i < 20; i++) {
            const petal = document.createElement('div');
            petal.classList.add('petal-fall');
            petal.style.left = Math.random() * 100 + '%';
            petal.style.width = Math.random() * 10 + 8 + 'px';
            petal.style.height = Math.random() * 10 + 8 + 'px';
            petal.style.background = petalColors[Math.floor(Math.random() * petalColors.length)];
            petal.style.animationDuration = Math.random() * 8 + 6 + 's';
            petal.style.animationDelay = Math.random() * 10 + 's';
            petal.style.opacity = Math.random() * 0.4 + 0.2;
            petalsContainer.appendChild(petal);
        }
    }

    /* ============================================
       HERO ANIMATIONS (GSAP Timeline)
       ============================================ */
    function initHeroAnimations() {
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

        tl.to('.hero-badge', {
            opacity: 1,
            y: 0,
            duration: 0.8,
        })
        .to('.title-line-1 .word', {
            opacity: 1,
            y: 0,
            duration: 1,
            stagger: 0.15,
            ease: 'power4.out',
        }, '-=0.3')
        .to('.title-line-2 .word', {
            opacity: 1,
            y: 0,
            duration: 1.2,
            ease: 'elastic.out(1, 0.5)',
        }, '-=0.5')
        .to('.hero-subtitle', {
            opacity: 1,
            y: 0,
            duration: 0.8,
        }, '-=0.6');

        // Parallax effect for hero orbs
        gsap.to('.orb-1', {
            scrollTrigger: {
                trigger: '.hero',
                start: 'top top',
                end: 'bottom top',
                scrub: 1,
            },
            y: -150,
            x: 50,
            scale: 0.8,
        });

        gsap.to('.orb-2', {
            scrollTrigger: {
                trigger: '.hero',
                start: 'top top',
                end: 'bottom top',
                scrub: 1,
            },
            y: -100,
            x: -50,
            scale: 1.2,
        });

        gsap.to('.hero-content', {
            scrollTrigger: {
                trigger: '.hero',
                start: 'top top',
                end: 'center top',
                scrub: 1,
            },
            y: -100,
            opacity: 0,
            scale: 0.95,
        });
    }

    // Smooth scroll for any remaining in-page links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                gsap.to(window, {
                    scrollTo: { y: target, offsetY: 80 },
                    duration: 1.2,
                    ease: 'power3.inOut',
                });
            }
        });
    });

    /* ============================================
       SECTION ANIMATIONS WITH SCROLLTRIGGER
       ============================================ */

    // Reveal text animation
    gsap.utils.toArray('.reveal-text').forEach(text => {
        gsap.to(text, {
            scrollTrigger: {
                trigger: text,
                start: 'top 85%',
                toggleActions: 'play none none none',
            },
            opacity: 1,
            y: 0,
            duration: 1,
            ease: 'power3.out',
        });
    });

    // Section tags
    gsap.utils.toArray('.section-tag').forEach(tag => {
        gsap.from(tag, {
            scrollTrigger: {
                trigger: tag,
                start: 'top 85%',
                toggleActions: 'play none none none',
            },
            opacity: 0,
            y: 20,
            scale: 0.9,
            duration: 0.6,
            ease: 'back.out(2)',
        });
    });

    /* ============================================
       ABOUT CARDS ANIMATION
       ============================================ */
    gsap.utils.toArray('.about-card').forEach((card, i) => {
        gsap.to(card, {
            scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                toggleActions: 'play none none none',
            },
            opacity: 1,
            y: 0,
            duration: 0.8,
            delay: i * 0.15,
            ease: 'power3.out',
        });
    });

    // Card tilt effect on hover
    document.querySelectorAll('.about-card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / 15;
            const rotateY = (centerX - x) / 15;
            
            gsap.to(card, {
                rotateX: rotateX,
                rotateY: rotateY,
                duration: 0.5,
                ease: 'power2.out',
                transformPerspective: 800,
            });
        });

        card.addEventListener('mouseleave', () => {
            gsap.to(card, {
                rotateX: 0,
                rotateY: 0,
                duration: 0.5,
                ease: 'power2.out',
            });
        });
    });

    /* ============================================
       WISH CARDS FLIP ANIMATION
       ============================================ */
    const wishCards = document.querySelectorAll('.wish-card');

    gsap.utils.toArray('.wish-card').forEach((card, i) => {
        gsap.to(card, {
            scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                toggleActions: 'play none none none',
            },
            opacity: 1,
            y: 0,
            duration: 0.8,
            delay: i * 0.15,
            ease: 'power3.out',
        });
    });

    wishCards.forEach(card => {
        card.addEventListener('click', () => {
            card.classList.toggle('flipped');
        });
    });

    /* ============================================
       PARALLAX QUOTE
       ============================================ */
    gsap.to('.parallax-quote', {
        scrollTrigger: {
            trigger: '.parallax-divider',
            start: 'top 80%',
            end: 'bottom 20%',
            scrub: false,
            toggleActions: 'play none none none',
        },
        opacity: 1,
        scale: 1,
        duration: 1.2,
        ease: 'power3.out',
    });

    // Parallax movement
    gsap.to('.parallax-content', {
        scrollTrigger: {
            trigger: '.parallax-divider',
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1,
        },
        y: -50,
    });

    /* ============================================
       COUNTER ANIMATION
       ============================================ */
    gsap.utils.toArray('.counter-item').forEach((item, i) => {
        gsap.to(item, {
            scrollTrigger: {
                trigger: item,
                start: 'top 85%',
                toggleActions: 'play none none none',
            },
            opacity: 1,
            y: 0,
            duration: 0.6,
            delay: i * 0.1,
            ease: 'power3.out',
        });
    });

    const counterNumbers = document.querySelectorAll('.counter-number');
    let countersAnimated = false;

    ScrollTrigger.create({
        trigger: '.counter-section',
        start: 'top 75%',
        onEnter: () => {
            if (!countersAnimated) {
                countersAnimated = true;
                counterNumbers.forEach(num => {
                    const target = parseInt(num.dataset.target);
                    gsap.to(num, {
                        innerText: target,
                        duration: 2.5,
                        snap: { innerText: 1 },
                        ease: 'power2.out',
                        onUpdate: function () {
                            num.textContent = Math.floor(this.targets()[0].innerText || 0);
                        },
                        onComplete: () => {
                            num.textContent = target;
                        }
                    });
                });
            }
        }
    });

    /* ============================================
       FINAL MESSAGE ANIMATION
       ============================================ */
    gsap.to('.final-content', {
        scrollTrigger: {
            trigger: '.final-message',
            start: 'top 70%',
            toggleActions: 'play none none none',
        },
        opacity: 1,
        y: 0,
        duration: 1.2,
        ease: 'power3.out',
    });

    // Stagger hearts
    gsap.from('.final-hearts span', {
        scrollTrigger: {
            trigger: '.final-hearts',
            start: 'top 85%',
            toggleActions: 'play none none none',
        },
        scale: 0,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: 'back.out(3)',
    });

    /* ============================================
       MUSIC PLAYER
       ============================================ */
    const musicToggle = document.getElementById('musicToggle');
    const musicPlayer = document.getElementById('musicPlayer');
    const bgMusic = document.getElementById('bgMusic');
    let isPlaying = false;

    function updateMusicState() {
        isPlaying = !bgMusic.paused;
        musicPlayer.classList.toggle('playing', isPlaying);
        musicToggle.setAttribute('aria-label', isPlaying ? 'توقف موسیقی' : 'پخش موسیقی');
    }

    function removePlaybackFallbacks() {
        document.removeEventListener('pointerdown', resumeMusicAfterInteraction);
        document.removeEventListener('keydown', resumeMusicAfterInteraction);
    }

    async function startMusic() {
        try {
            await bgMusic.play();
            updateMusicState();
            removePlaybackFallbacks();
        } catch {
            updateMusicState();
        }
    }

    function resumeMusicAfterInteraction(event) {
        if (event.target.closest?.('#musicToggle')) return;
        startMusic();
    }

    bgMusic.addEventListener('play', updateMusicState);
    bgMusic.addEventListener('pause', updateMusicState);
    bgMusic.volume = 0.5;

    // Try audible autoplay; if Chrome blocks it, start after the first user gesture.
    document.addEventListener('pointerdown', resumeMusicAfterInteraction);
    document.addEventListener('keydown', resumeMusicAfterInteraction);
    startMusic();

    musicToggle.addEventListener('click', async () => {
        if (isPlaying) {
            bgMusic.pause();
            removePlaybackFallbacks();
        } else {
            await startMusic();
        }
    });

    /* ============================================
       MAGNETIC HOVER EFFECT FOR BUTTONS
       ============================================ */
    if (window.matchMedia('(pointer: fine)').matches) {
        document.querySelectorAll('.btn, .music-toggle').forEach(btn => {
            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;

                gsap.to(btn, {
                    x: x * 0.3,
                    y: y * 0.3,
                    duration: 0.3,
                    ease: 'power2.out',
                });
            });

            btn.addEventListener('mouseleave', () => {
                gsap.to(btn, {
                    x: 0,
                    y: 0,
                    duration: 0.5,
                    ease: 'elastic.out(1, 0.3)',
                });
            });
        });
    }

    /* ============================================
       SMOOTH REVEAL ON SCROLL (IntersectionObserver)
       ============================================ */
    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px',
    };

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-in-up').forEach(el => {
        revealObserver.observe(el);
    });

    /* ============================================
       MARQUEE DIRECTION ON SCROLL
       ============================================ */
    const marqueeTrack = document.querySelector('.marquee-track');
    if (marqueeTrack) {
        ScrollTrigger.create({
            trigger: '.marquee-section',
            start: 'top bottom',
            end: 'bottom top',
            onUpdate: (self) => {
                const direction = self.direction === 1 ? 'normal' : 'reverse';
                marqueeTrack.style.animationDirection = direction;
            }
        });
    }

    /* ============================================
       TEXT SCRAMBLE EFFECT FOR SECTION TITLES
       ============================================ */
    class TextScramble {
        constructor(el) {
            this.el = el;
            this.chars = '!<>-_\\/[]{}—=+*^?#________';
            this.update = this.update.bind(this);
        }

        setText(newText) {
            const oldText = this.el.innerText;
            const length = Math.max(oldText.length, newText.length);
            const promise = new Promise((resolve) => this.resolve = resolve);
            this.queue = [];

            for (let i = 0; i < length; i++) {
                const from = oldText[i] || '';
                const to = newText[i] || '';
                const start = Math.floor(Math.random() * 40);
                const end = start + Math.floor(Math.random() * 40);
                this.queue.push({ from, to, start, end });
            }

            cancelAnimationFrame(this.frameRequest);
            this.frame = 0;
            this.update();
            return promise;
        }

        update() {
            let output = '';
            let complete = 0;

            for (let i = 0, n = this.queue.length; i < n; i++) {
                let { from, to, start, end, char } = this.queue[i];

                if (this.frame >= end) {
                    complete++;
                    output += to;
                } else if (this.frame >= start) {
                    if (!char || Math.random() < 0.28) {
                        char = this.chars[Math.floor(Math.random() * this.chars.length)];
                        this.queue[i].char = char;
                    }
                    output += char;
                } else {
                    output += from;
                }
            }

            this.el.innerText = output;

            if (complete === this.queue.length) {
                this.resolve();
            } else {
                this.frameRequest = requestAnimationFrame(this.update);
                this.frame++;
            }
        }
    }

    /* ============================================
       CONFETTI EFFECT (triggered on final section)
       ============================================ */
    function createConfetti() {
        const confettiCount = 60;
        const colors = [themeColor('--primary'), themeColor('--primary-light'), themeColor('--secondary'), themeColor('--accent-gold'), themeColor('--accent'), themeColor('--primary-dark')];

        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: fixed;
                width: ${Math.random() * 10 + 5}px;
                height: ${Math.random() * 10 + 5}px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                top: -10px;
                left: ${Math.random() * 100}%;
                border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
                pointer-events: none;
                z-index: 99998;
                opacity: ${Math.random() * 0.6 + 0.4};
            `;
            document.body.appendChild(confetti);

            gsap.to(confetti, {
                y: window.innerHeight + 50,
                x: (Math.random() - 0.5) * 200,
                rotation: Math.random() * 720,
                duration: Math.random() * 3 + 2,
                ease: 'power1.out',
                delay: Math.random() * 0.5,
                onComplete: () => confetti.remove(),
            });
        }
    }

    let confettiTriggered = false;
    ScrollTrigger.create({
        trigger: '.final-message',
        start: 'top 60%',
        onEnter: () => {
            if (!confettiTriggered) {
                confettiTriggered = true;
                createConfetti();
            }
        }
    });

    /* ============================================
       PERFORMANCE OPTIMIZATION
       ============================================ */
    // Pause particle animation when not visible
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cancelAnimationFrame(animationId);
        } else {
            animateParticles();
        }
    });

    // Reduce animations on prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        cancelAnimationFrame(animationId);
        document.querySelectorAll('.petal-fall').forEach(p => p.remove());
        gsap.globalTimeline.timeScale(3); // Speed up animations
    }

    /* ============================================
       SMOOTH SCROLL PROGRESS
       ============================================ */
    // Optional: show scroll progress
    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
        position: fixed;
        top: 0;
        right: 0;
        height: 3px;
        background: ${themeColor('--gradient-2')};
        z-index: 99999;
        transition: width 0.1s;
        width: 0%;
    `;
    document.body.appendChild(progressBar);

    ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: (self) => {
            progressBar.style.width = (self.progress * 100) + '%';
        }
    });

});
