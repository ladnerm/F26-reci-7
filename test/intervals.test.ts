import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { mergeIntervals, type Interval } from '../src/intervals';

// Recitation Part 2 (groups) and problem set Task 2.
// Read the spec in src/intervals/mergeIntervals.ts, then check your progress
// with `npm run mutants:intervals`.
//
// Label every property with its pattern, on the line above its `it(`:
//   // Pattern: invariant. The output is sorted.
// (invariant, algebraic, metamorphic, differential, or conditional)

// A first attempt at a generator. It has a problem: run the tests and read
// the counterexample.
const interval: fc.Arbitrary<Interval> = 
    fc.tuple(fc.integer(), fc.integer()).map(([a, b]) => (a <= b ? [a, b] : [b, a]));
const intervalList = fc.array(interval);

// Targeted generator: sorted, non-touching intervals.
const disjointIntervals = fc.array(
    fc.tuple(
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 0, max: 10 })
    ),
    { maxLength: 20 }
).map(pairs => {
    let end = 0;

    return pairs.map(([gap, length]): Interval => {
        const start = end + gap;
        end = start + length;
        return [start, end];
    });
});

function covers(xs: Interval[], p: number): boolean {
  return xs.some(([a, b]) => a <= p && p <= b);
}

describe('mergeIntervals', () => {
    // Pattern: invariant. Every input interval lies inside some output interval.
    it('every input interval lies inside some output interval', () => {
        fc.assert(
            fc.property(intervalList, xs => {
                const out = mergeIntervals(xs);
                const uncovered = xs.filter(([s, e]) => !out.some(([a, b]) => a <= s && e <= b));
                expect(uncovered).toEqual([]);
            }),
        );
    });

    // Add your properties here. Aim for at least one of each pattern:
    // invariant, algebraic, metamorphic, differential, conditional.

    // Pattern: invariant. Output intervals are sorted and do not touch.
    it('returns sorted and non-overlapping intervals', () => {
        fc.assert(
            fc.property(intervalList, xs => {
                const out = mergeIntervals(xs);

                for (let i = 0; i < out.length - 1; i++) {
                    expect(out[i][1]).toBeLessThan(out[i + 1][0]);
                }
            })
        );
    });

    // Pattern: algebraic. Merging twice gives the same result.
    it('is idempotent', () => {
        fc.assert(
            fc.property(intervalList, xs => {
                const once = mergeIntervals(xs);
                const twice = mergeIntervals(once);

                expect(twice).toEqual(once);
            })
        );
    });

    // Pattern: metamorphic. Reversing input does not change the result.
    it('is independent of input order', () => {
        fc.assert(
            fc.property(intervalList, xs => {
                const original = mergeIntervals(xs);
                const reversed = mergeIntervals([...xs].reverse());

                expect(reversed).toEqual(original);
            })
        );
    });

    // Pattern: differential. Input and output cover the same points.
    it('preserves point coverage', () => {
        fc.assert(
            fc.property(intervalList, fc.integer(), (xs, p) => {
                const out = mergeIntervals(xs);

                expect(covers(out, p)).toBe(covers(xs, p));
            })
        );
    });

    // Pattern: conditional. Already-disjoint intervals keep their values.
    it('preserves already-disjoint intervals', () => {
        fc.assert(
            fc.property(disjointIntervals, xs => {
                expect(mergeIntervals(xs)).toEqual(xs);
            })
        );
    });

    // Pattern: algebraic. Intervals sharing an endpoint merge.
    it('merges touching intervals', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: -1000, max: 1000 }),
                n => {
                    const xs: Interval[] = [
                        [n, n + 1],
                        [n + 1, n + 2]
                    ];

                    expect(mergeIntervals(xs)).toEqual([[n, n + 2]]);
                }
            )
        );
    });

    // Pattern: conditional. Integer neighbors remain separate.
    it('does not merge integer neighbors', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: -1000, max: 1000 }),
                n => {
                    const xs: Interval[] = [
                        [n, n],
                        [n + 1, n + 1]
                    ];

                    expect(mergeIntervals(xs)).toEqual(xs);
                }
            )
        );
    });

    // Pattern: invariant. Input intervals are not modified.
    it('does not modify the input', () => {
        fc.assert(
            fc.property(intervalList, xs => {
                const original = xs.map(
                    ([a, b]): Interval => [a, b]
                );

                mergeIntervals(xs);

                expect(xs).toEqual(original);
            })
        );
    });

    // Pattern: conditional. A single output interval is a new array.
    it('does not alias input intervals', () => {
        fc.assert(
            fc.property(interval, x => {
                const out = mergeIntervals([x]);

                expect(out[0]).toEqual(x);
                expect(out[0]).not.toBe(x);
            })
        );
    });

    // Pattern: conditional. Invalid intervals are rejected.
    it('rejects intervals with start greater than end', () => {
        fc.assert(
            fc.property(fc.integer({ min: -1000, max: 1000 }), n => {
                expect(() => mergeIntervals([[n + 1, n]]))
                .toThrow(RangeError);
            })
        );
    });
});

