# Reflection

**Name / Andrew ID:** Max Ladner (maxladne)

**Recitation group members (Task 2):** Matt Gershon

---

### 1. Valid but weak

One property I wrote checks that matchGuess always returns exactly five colors. This is valid because the specification says the result must contain one color for each of the five letters. Although it doesn't kill many mutants, it would catch a bug where the function accidentally returns only four colors or adds an extra color.

### 2. A generator problem, not a property problem

The touchingNotMerged mutant initially survived because my generator produced random intervals that rarely shared an exact endpoint. My property was valid, but the generator wasn't reliably producing the inputs needed to expose the bug. I fixed it by generating a random integer n and constructing two intervals, [n, n+1] and [n+1, n+2], which are guaranteed to touch.

Before:

✘ touchingNotMerged    SURVIVED

After:

✔ touchingNotMerged       killed  by: returns sorted and non-overlapping intervals; merges touching intervals; rejects intervals with start greater than end
      Counterexample: [[[10,10],[0,10]]]
      AssertionError: expected 10 to be less than 10

### 3. Reading a counterexample

Mutant: ignoresCounts

Counterexample: [["A","N","A","A","A"],["A","N","A","A","N"]]
AssertionError: expected 2 to be less than or equal to 1

The secret contains only one N, but the guess contains two. According to the specification, a letter cannot be credited more times than it appears in the secret, so the second N should be marked black. The mutant incorrectly credits both occurrences, which causes the property to fail.

### 4. Your project

One function in our project that would benefit from property-based testing is createHintMode(), which manages hint mode for different sessions.

Property 1 (invariant): Toggling hint mode for one session should not change the hint mode status of any other session.
Property 2 (metamorphic): Toggling hint mode twice for the same session should return it to its original state.

The generator would create random session IDs and sequences of toggle operations. A naive generator might not produce repeated toggles on the same session or might accidentally generate identical IDs when testing session independence. I would use a targeted generator to ensure that some operations affect the same session while others affect different sessions.
