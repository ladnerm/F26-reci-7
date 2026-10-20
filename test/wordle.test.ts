import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { matchGuess } from '../src/wordle';

// Recitation Part 1: follow along with your TA, filling in the todos below.
// Problem set Task 1: keep adding properties until `npm run mutants:wordle`
// kills every mutant. Read the spec in src/wordle/matchGuess.ts.
//
// Label every property with its pattern, on the line above its `it(`:
//   // Pattern: invariant. The result always has exactly five colors.
// (invariant, algebraic, metamorphic, differential, or conditional)

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Step 1: a generator for five-letter uppercase words.
const wordFrom = (letters: string) =>
fc.array(fc.constantFrom(...letters.split('')), { minLength: 5, maxLength: 5 });
const word = wordFrom(ALPHABET);

describe('matchGuess', () => {
    // Pattern: invariant
    it('returns exactly five colors', () => {
        fc.assert(
            fc.property(word, word, (secret, guess) => {
                const result = matchGuess(secret.join(''), guess.join(''));
                expect(result).toHaveLength(5);
            })
        );
    });

// Pattern: invariant
    it('only uses the colors G, Y, B', () => {
        fc.assert(
            fc.property(word, word, (secret, guess) => {
                for (const c of matchGuess(secret.join(''), guess.join(''))) expect(['G', 'Y', 'B']).toContain(c);
            })
        );
    });

    // Pattern: conditional
    it('guessing the secret gives all greens', () => {
        fc.assert(
            fc.property(word, (secret) => {
                const result = matchGuess(secret.join(''), secret.join(''));
                expect(result).toEqual(['G', 'G', 'G', 'G', 'G']);
            })
        );
    }); 

    // Pattern: invariant
    it('never credits a letter more times than the secret contains it', () => {
        fc.assert(
            fc.property(word, word, (secret, guess) => {
                const result = matchGuess(secret.join(''), guess.join(''));
                for (const letter of new Set(guess)) {
                    const credited = [...guess].filter((c, i) => c === letter && result[i] !== 'B').length;
                    const inSecret = [...secret].filter((c) => c === letter).length;
                    expect(credited).toBeLessThanOrEqual(inSecret);
                }
            })
        );
    }); 

    // Pattern: metamorphic
    it('rotating distinct letters gives all yellows', () => {
        fc.assert(
            fc.property(
                fc.shuffledSubarray(ALPHABET.split(''), { minLength: 5, maxLength: 5 }),
                secret => {
                    const guess = [...secret.slice(1), secret[0]];

                    const result = matchGuess(secret.join(''), guess.join(''));
                    expect(result).toEqual(['Y', 'Y', 'Y', 'Y', 'Y']);
                }
            )
        );
    });

    
    // Pattern: conditional
    it('greens take priority over yellows', () => {
        fc.assert(
            fc.property(
                fc.constantFrom(...ALPHABET.split('')),
                fc.integer({ min: 1, max: 4 }),
                (letter, position) => {
                    const other = letter === 'A' ? 'B' : 'A';
                    const secret = [letter, other, other, other, other];
                    const guess = [letter, other, other, other, other];

                    guess[position] = letter;

                    const result = matchGuess(secret.join(''), guess.join(''));

                    expect(result[0]).toBe('G');
                    expect(result[position]).toBe('B');
                }
            )
        );
    });
    
    // Pattern: conditional. Later greens take priority over earlier yellows.
    it('reserves later green matches before assigning yellows', () => {
        fc.assert(
            fc.property(
                fc.constantFrom(...ALPHABET.split('')),
                letter => {
                    const other = letter === 'A' ? 'B' : 'A';
                    const secret = [other, letter, other, other, other];
                    const guess = [letter, letter, other, other, other];

                    const result = matchGuess(
                        secret.join(''),
                        guess.join('')
                    );

                    expect(result).toEqual(['B', 'G', 'G', 'G', 'G']);
                }
            )
        );
    });



});
