<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import {
    Menu,
    X,
    Github,
    Layers,
    Info,
    Download,
    ExternalLink,
    ChevronRight,
} from "lucide-vue-next";

interface NavLink {
    name: string;
    to: string;
    icon: any;
}

const route = useRoute();
const isMenuOpen = ref(false);
const isScrolled = ref(false);

const faviconUrl = `${import.meta.env.BASE_URL}assets/favicon.svg`;

const navLinks: NavLink[] = [
    { name: "Генератор", to: "/", icon: Layers },
    { name: "MergeKeys", to: "/mergekeys", icon: Download },
    { name: "Установка", to: "/iaa", icon: ExternalLink },
    { name: "О проекте", to: "/about", icon: Info },
];

const isActive = (linkTo: string): boolean => {
    if (linkTo === "/") return route.path === "/";
    return route.path.startsWith(linkTo);
};

const toggleMenu = () => {
    isMenuOpen.value = !isMenuOpen.value;
    if (isMenuOpen.value) {
        document.body.style.overflow = "hidden";
    } else {
        document.body.style.overflow = "";
    }
};

const handleScroll = () => {
    isScrolled.value = window.scrollY > 10;
};

onMounted(() => {
    window.addEventListener("scroll", handleScroll);
});

onUnmounted(() => {
    window.removeEventListener("scroll", handleScroll);
});
</script>

<template>
    <header class="header" :class="{ 'is-scrolled': isScrolled }">
        <div class="header-inner container">
            <!-- Brand Logo -->
            <router-link to="/" class="brand" @click="isMenuOpen = false">
                <div class="brand-logo">
                    <img :src="faviconUrl" alt="AWG Logo" />
                </div>
                <div class="brand-info">
                    <span class="brand-title">AmneziaWG</span>
                    <span class="brand-subtitle">Architect</span>
                </div>
            </router-link>

            <!-- Desktop Nav -->
            <nav class="nav-desktop">
                <div class="nav-list">
                    <router-link
                        v-for="link in navLinks"
                        :key="link.to"
                        :to="link.to"
                        class="nav-link"
                        :class="{ 'router-link-active': isActive(link.to) }"
                    >
                        <span>{{ link.name }}</span>
                    </router-link>
                </div>
                <div class="nav-sep"></div>
                <a
                    href="https://github.com/Vadim-Khristenko/AmneziaWG-Architect"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="gh-link"
                    title="GitHub Repository"
                >
                    <Github :size="20" />
                </a>
            </nav>

            <!-- Mobile Toggle -->
            <button
                class="menu-toggle"
                @click="toggleMenu"
                aria-label="Toggle navigation"
            >
                <Menu v-if="!isMenuOpen" :size="24" />
                <X v-else :size="24" />
            </button>
        </div>

        <!-- Mobile Menu Overlay -->
        <transition name="fade">
            <div
                v-if="isMenuOpen"
                class="mobile-overlay"
                @click="toggleMenu"
            ></div>
        </transition>

        <!-- Mobile Slide Panel -->
        <transition name="slide">
            <div v-if="isMenuOpen" class="mobile-panel">
                <div class="mobile-head">
                    <span class="mobile-title">Меню</span>
                </div>
                <div class="mobile-links">
                    <router-link
                        v-for="link in navLinks"
                        :key="link.to"
                        :to="link.to"
                        class="mobile-item"
                        :class="{ active: isActive(link.to) }"
                        @click="toggleMenu"
                    >
                        <component :is="link.icon" :size="20" class="m-icon" />
                        <span class="m-text">{{ link.name }}</span>
                        <ChevronRight :size="16" class="m-arrow" />
                    </router-link>
                </div>

                <div class="mobile-footer">
                    <a
                        href="https://github.com/Vadim-Khristenko/AmneziaWG-Architect"
                        target="_blank"
                        class="mobile-gh"
                    >
                        <Github :size="18" />
                        <span>GitHub Repository</span>
                    </a>
                </div>
            </div>
        </transition>
    </header>
</template>

<style scoped>
/* ── Header Container ─────────────────────────────────────────────────── */
.header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 72px;
    z-index: 1000;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    border-bottom: 1px solid transparent;
}

.header.is-scrolled {
    height: 64px;
    background: rgba(14, 11, 7, 0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom-color: rgba(232, 168, 64, 0.1);
}

.header-inner {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

/* ── Brand ────────────────────────────────────────────────────────────── */
.brand {
    display: flex;
    align-items: center;
    gap: 12px;
    text-decoration: none;
    user-select: none;
    z-index: 1002;
}

.brand-logo {
    width: 38px;
    height: 38px;
    background: linear-gradient(
        135deg,
        rgba(232, 168, 64, 0.1) 0%,
        rgba(232, 168, 64, 0.05) 100%
    );
    border: 1px solid rgba(232, 168, 64, 0.2);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.brand-logo img {
    width: 36px;
    height: 36px;
    object-fit: contain;
}

.brand-info {
    display: flex;
    flex-direction: column;
}

.brand-title {
    font-family: var(--fu);
    font-weight: 800;
    font-size: 1.05rem;
    color: var(--text);
    line-height: 1;
    letter-spacing: -0.02em;
}

.brand-subtitle {
    font-family: var(--fm);
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    color: var(--text3);
    margin-top: 3px;
}

/* ── Desktop Nav ──────────────────────────────────────────────────────── */
.nav-desktop {
    display: none;
    align-items: center;
    gap: 24px;
}

@media (min-width: 860px) {
    .nav-desktop {
        display: flex;
    }
}

.nav-list {
    display: flex;
    gap: 6px;
}

.nav-link {
    display: flex;
    align-items: center;
    padding: 8px 16px;
    border-radius: 100px;
    color: var(--text2);
    font-size: 0.85rem;
    font-weight: 600;
    transition: all 0.2s;
    position: relative;
}

.nav-link:hover {
    color: var(--accent);
    background: rgba(232, 168, 64, 0.04);
}

.nav-link.router-link-active {
    color: var(--text);
    background: rgba(232, 168, 64, 0.08);
}

.nav-link.router-link-active::before {
    content: "";
    position: absolute;
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%);
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: var(--accent);
    opacity: 0;
}

.nav-sep {
    width: 1px;
    height: 18px;
    background: var(--border);
}

.gh-link {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    color: var(--text2);
    transition: all 0.2s;
    border: 1px solid transparent;
}

.gh-link:hover {
    color: var(--accent);
    background: var(--bg2);
    border-color: var(--border);
}

/* ── Mobile Toggle ────────────────────────────────────────────────────── */
.menu-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: transparent;
    border: none;
    color: var(--text);
    cursor: pointer;
    z-index: 1002;
}

@media (min-width: 860px) {
    .menu-toggle {
        display: none;
    }
}

/* ── Mobile Panel ─────────────────────────────────────────────────────── */
.mobile-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    z-index: 1001;
}

.mobile-panel {
    position: fixed;
    top: 0;
    right: 0;
    width: 280px;
    height: 100vh;
    background: var(--bg2);
    border-left: 1px solid var(--border);
    z-index: 1002;
    padding: 80px 20px 20px;
    display: flex;
    flex-direction: column;
    box-shadow: -10px 0 40px rgba(0, 0, 0, 0.5);
}

.mobile-head {
    margin-bottom: 20px;
    padding-left: 12px;
}

.mobile-title {
    font-family: var(--fu);
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text3);
}

.mobile-links {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
}

.mobile-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px 16px;
    border-radius: 12px;
    color: var(--text2);
    text-decoration: none;
    font-weight: 600;
    transition: all 0.2s;
    background: rgba(255, 255, 255, 0.02);
}

.mobile-item:hover,
.mobile-item.active {
    background: rgba(232, 168, 64, 0.08);
    color: var(--accent);
}

.m-icon {
    opacity: 0.7;
}

.mobile-item.active .m-icon {
    opacity: 1;
    color: var(--accent);
}

.m-arrow {
    margin-left: auto;
    opacity: 0.3;
}

.mobile-footer {
    margin-top: auto;
    border-top: 1px solid var(--border2);
    padding-top: 20px;
}

.mobile-gh {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    padding: 12px;
    border-radius: 12px;
    background: var(--bg);
    border: 1px solid var(--border);
    color: var(--text);
    font-size: 0.9rem;
    font-weight: 600;
}

/* ── Transitions ──────────────────────────────────────────────────────── */
.slide-enter-active,
.slide-leave-active {
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-enter-from,
.slide-leave-to {
    transform: translateX(100%);
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
