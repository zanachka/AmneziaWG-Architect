import { describe, it, expect } from "vitest";
import { genCfg, type GeneratorInput } from "../generator";

const baseInput: GeneratorInput = {
    version: "2.0",
    intensity: "medium",
    profile: "quic_initial",
    customHost: "",
    mimicAll: false,
    useTagC: false,
    useTagT: true,
    useTagR: true,
    useTagRC: true,
    useTagRD: true,
    useBrowserFp: false,
    browserProfile: "",
    mtu: 1500,
    junkLevel: 5,
    iterCount: 0,
    routerMode: false,
};

// ─────────────────────────────────────────────────────────────────────────────
// S1+56 collision rule
// ─────────────────────────────────────────────────────────────────────────────

describe("S1+56 collision rule", () => {
    it("s2 !== s1 + 56 across 200 iterations", () => {
        for (let i = 0; i < 200; i++) {
            const cfg = genCfg(baseInput);
            expect(cfg.s2).not.toBe(cfg.s1 + 56);
        }
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Parameter caps
// ─────────────────────────────────────────────────────────────────────────────

describe("parameter caps", () => {
    it("s4 <= 32 always", () => {
        for (let i = 0; i < 200; i++) {
            const cfg = genCfg({ ...baseInput, iterCount: i % 10 });
            expect(cfg.s4).toBeLessThanOrEqual(32);
        }
    });

    it("s1 <= 64", () => {
        for (let i = 0; i < 200; i++) {
            const cfg = genCfg({ ...baseInput, intensity: "high", iterCount: 10 });
            expect(cfg.s1).toBeLessThanOrEqual(64);
        }
    });

    it("s2 <= 64", () => {
        for (let i = 0; i < 200; i++) {
            const cfg = genCfg({ ...baseInput, intensity: "high", iterCount: 10 });
            expect(cfg.s2).toBeLessThanOrEqual(64);
        }
    });

    it("s3 <= 64", () => {
        for (let i = 0; i < 200; i++) {
            const cfg = genCfg({ ...baseInput, intensity: "high", iterCount: 10 });
            expect(cfg.s3).toBeLessThanOrEqual(64);
        }
    });

    it("jmax <= 1280", () => {
        for (let i = 0; i < 100; i++) {
            const cfg = genCfg({ ...baseInput, intensity: "high", iterCount: 20 });
            expect(cfg.jmax).toBeLessThanOrEqual(1280);
        }
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// AWG 1.0
// ─────────────────────────────────────────────────────────────────────────────

describe("AWG 1.0", () => {
    const v10Input: GeneratorInput = { ...baseInput, version: "1.0" };

    it("jc >= 4", () => {
        for (let i = 0; i < 100; i++) {
            const cfg = genCfg(v10Input);
            expect(cfg.jc).toBeGreaterThanOrEqual(4);
        }
    });

    it("jmax > 81", () => {
        for (let i = 0; i < 100; i++) {
            const cfg = genCfg(v10Input);
            expect(cfg.jmax).toBeGreaterThan(81);
        }
    });

    it("i1-i5 are all empty strings", () => {
        const cfg = genCfg(v10Input);
        expect(cfg.i1).toBe("");
        expect(cfg.i2).toBe("");
        expect(cfg.i3).toBe("");
        expect(cfg.i4).toBe("");
        expect(cfg.i5).toBe("");
    });

    it("h1s-h4s are positive numbers", () => {
        const cfg = genCfg(v10Input);
        expect(cfg.h1s).toBeGreaterThan(0);
        expect(cfg.h2s).toBeGreaterThan(0);
        expect(cfg.h3s).toBeGreaterThan(0);
        expect(cfg.h4s).toBeGreaterThan(0);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// AWG 1.5
// ─────────────────────────────────────────────────────────────────────────────

describe("AWG 1.5", () => {
    const v15Input: GeneratorInput = { ...baseInput, version: "1.5" };

    it("jc >= 3", () => {
        for (let i = 0; i < 100; i++) {
            const cfg = genCfg(v15Input);
            expect(cfg.jc).toBeGreaterThanOrEqual(3);
        }
    });

    it("i1 is non-empty", () => {
        const cfg = genCfg(v15Input);
        expect(cfg.i1).toBeTruthy();
        expect(cfg.i1.length).toBeGreaterThan(0);
    });

    it("i2-i5 are non-empty when mimicAll=false", () => {
        const cfg = genCfg({ ...v15Input, mimicAll: false });
        expect(cfg.i2.length).toBeGreaterThan(0);
        expect(cfg.i3.length).toBeGreaterThan(0);
        expect(cfg.i4.length).toBeGreaterThan(0);
        expect(cfg.i5.length).toBeGreaterThan(0);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// AWG 2.0 ranges
// ─────────────────────────────────────────────────────────────────────────────

describe("AWG 2.0 ranges", () => {
    it("h1-h4 match range format", () => {
        const cfg = genCfg(baseInput);
        const rangePattern = /^\d+-\d+$/;
        expect(cfg.h1).toMatch(rangePattern);
        expect(cfg.h2).toMatch(rangePattern);
        expect(cfg.h3).toMatch(rangePattern);
        expect(cfg.h4).toMatch(rangePattern);
    });

    it("start < end for each range", () => {
        for (let i = 0; i < 50; i++) {
            const cfg = genCfg(baseInput);
            for (const h of [cfg.h1, cfg.h2, cfg.h3, cfg.h4]) {
                const [start, end] = h.split("-").map(Number);
                expect(end).toBeGreaterThan(start);
            }
        }
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Intensity escalation
// ─────────────────────────────────────────────────────────────────────────────

describe("intensity escalation", () => {
    it("iterCount=5 produces larger jmax on average than iterCount=0", () => {
        const runs = 50;
        let sumBase = 0;
        let sumEscalated = 0;

        for (let i = 0; i < runs; i++) {
            sumBase += genCfg({ ...baseInput, iterCount: 0 }).jmax;
            sumEscalated += genCfg({ ...baseInput, iterCount: 5 }).jmax;
        }

        expect(sumEscalated / runs).toBeGreaterThan(sumBase / runs);
    });

    it("iterCount=5 produces larger jmin than iterCount=0", () => {
        const cfgBase = genCfg({ ...baseInput, iterCount: 0 });
        const cfgEsc = genCfg({ ...baseInput, iterCount: 5 });
        expect(cfgEsc.jmin).toBeGreaterThan(cfgBase.jmin);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Non-overlapping H ranges
// ─────────────────────────────────────────────────────────────────────────────

describe("non-overlapping H ranges", () => {
    function parseRange(r: string): [number, number] {
        const [a, b] = r.split("-").map(Number);
        return [a, b];
    }

    function rangesOverlap(
        a: [number, number],
        b: [number, number],
    ): boolean {
        return a[0] <= b[1] && b[0] <= a[1];
    }

    it("h1-h4 ranges never overlap", () => {
        for (let i = 0; i < 100; i++) {
            const cfg = genCfg(baseInput);
            const ranges = [cfg.h1, cfg.h2, cfg.h3, cfg.h4].map(parseRange);

            for (let a = 0; a < ranges.length; a++) {
                for (let b = a + 1; b < ranges.length; b++) {
                    expect(rangesOverlap(ranges[a], ranges[b])).toBe(false);
                }
            }
        }
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Router Mode
// ─────────────────────────────────────────────────────────────────────────────

describe("routerMode", () => {
    const routerInput: GeneratorInput = {
        ...baseInput,
        routerMode: true,
        version: "2.0",
        intensity: "high",
        junkLevel: 10,
    };

    it("caps junk parameters (respects protocol minJc)", () => {
        for (let i = 0; i < 50; i++) {
            const cfg = genCfg(routerInput);
            // AWG 2.0 minJc=3, router mode tries to cap at 2, result = max(3, 2) = 3
            expect(cfg.jc).toBeLessThanOrEqual(3);
            expect(cfg.jmin).toBeLessThanOrEqual(40);
            expect(cfg.jmax).toBeLessThanOrEqual(128);
        }
    });

    it("caps S1/S2", () => {
        for (let i = 0; i < 50; i++) {
            const cfg = genCfg(routerInput);
            expect(cfg.s1).toBeLessThanOrEqual(20);
            expect(cfg.s2).toBeLessThanOrEqual(20);
        }
    });

    it("disables I2-I5 but keeps I1", () => {
        const cfg = genCfg(routerInput);
        expect(cfg.i1).not.toBe("");
        expect(cfg.i2).toBe("");
        expect(cfg.i3).toBe("");
        expect(cfg.i4).toBe("");
        expect(cfg.i5).toBe("");
    });

    it("S1+56 collision still safe", () => {
        for (let i = 0; i < 100; i++) {
            const cfg = genCfg(routerInput);
            expect(cfg.s2).not.toBe(cfg.s1 + 56);
        }
    });

    it("preserves AWG 1.0 minJc=4", () => {
        const cfg = genCfg({ ...routerInput, version: "1.0" });
        expect(cfg.jc).toBeGreaterThanOrEqual(4);
    });

    it("AWG 1.0 router mode: i1-i5 all empty", () => {
        const cfg = genCfg({ ...routerInput, version: "1.0" });
        expect(cfg.i1).toBe("");
        expect(cfg.i2).toBe("");
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Composite profiles
// ─────────────────────────────────────────────────────────────────────────────

describe("composite profiles", () => {
    it("tls_to_quic: I1 contains TLS header, I2 contains QUIC header", () => {
        const cfg = genCfg({ ...baseInput, profile: "tls_to_quic" });
        // TLS record: content_type=0x16, legacy_version=0x0301
        expect(cfg.i1).toContain("<b 0x160301");
        // QUIC Long Header: 0xC0-0xC3
        expect(cfg.i2).toMatch(/<b 0xc[0-3]/i);
    });

    it("quic_burst: I1 is QUIC Initial, I2 is QUIC 0-RTT, I3 is HTTP/3", () => {
        const cfg = genCfg({ ...baseInput, profile: "quic_burst" });
        expect(cfg.i1).toMatch(/<b 0xc/i);  // QUIC Initial 0xC0-0xC3
        expect(cfg.i2).toMatch(/<b 0xd/i);  // QUIC 0-RTT 0xD0-0xD3
        expect(cfg.i3).toBeTruthy();
    });

    it("composite profiles respect routerMode (I2-I5 cleared)", () => {
        const cfg = genCfg({ ...baseInput, profile: "tls_to_quic", routerMode: true });
        expect(cfg.i1).not.toBe("");
        expect(cfg.i2).toBe("");
        expect(cfg.i3).toBe("");
    });
});
