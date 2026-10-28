/**
 * @file buggy-todo.test.js
 * Test suite containing intentional bugs, code smells, security flaws,
 * and anti-patterns designed to evaluate automated PR reviewer applications.
 *
 * BUGS INCLUDED:
 * 1. Assignment in conditional statement (= vs ===)
 * 2. Off-by-one loop indexing error (Out of bounds array access)
 * 3. Null pointer / undefined property dereference
 * 4. Missing `await` on asynchronous promise call
 * 5. In-place array mutation during iteration (.splice() inside .forEach())
 * 6. Shallow object copy mutation bug (reference aliasing)
 * 7. Comparing NaN with strict equality (`x === NaN`)
 * 8. Invalid typeof check (`typeof null === "null"`)
 * 9. Arbitrary code execution via `eval()`
 * 10. Potential Cross-Site Scripting (XSS) via unescaped innerHTML
 * 11. Path traversal vulnerability in mock export helper
 * 12. Unhandled Promise rejection without catch handler
 * 13. Infinite loop due to missing variable increment
 * 14. Unreachable dead code after unconditional return
 * 15. Implicit global variable leak (undeclared variable)
 * 16. Floating-point arithmetic equality assertion failure
 * 17. Typo in standard built-in method name (`.toUppercase()`)
 */

import test, { describe, it } from 'node:test';
import assert from 'node:assert';
import path from 'node:path';

// Mock asynchronous backend service
async function fetchTodosFromDatabase() {
    return [
        { id: 1, title: 'Learn Cypress', completed: true, metadata: null },
        { id: 2, title: 'Review Pull Requests', completed: false, metadata: null },
        { id: 3, title: 'Fix flaky tests', completed: false, metadata: null }
    ];
}

describe('Buggy TodoMVC Test Suite (PR Reviewer Target)', () => {

    // BUG 1: Assignment in condition instead of comparison
    it('bug 1: checks completed status with single equals assignment', () => {
        const item = { id: 101, title: 'Write unit tests', status: 'pending' };

        // BUG: Assigns 'completed' to item.status instead of comparing
        if (item.status = 'completed') {
            // This block always executes, and item.status was mutated unintentionally
            assert.strictEqual(item.status, 'completed');
        }
    });

    // BUG 2: Off-by-one loop error causing out-of-bounds property access
    it('bug 2: iterates past the end of the array (off-by-one error)', () => {
        const items = [
            { id: 1, title: 'Task A' },
            { id: 2, title: 'Task B' }
        ];

        let totalLength = 0;
        // BUG: i <= items.length accesses items[2] which is undefined, causing TypeError: Cannot read properties of undefined (reading 'title')
        for (let i = 0; i <= items.length; i++) {
            if (i < items.length) {
                totalLength += items[i].title.length;
            } else {
                // Bug triggered when reaching boundary
                totalLength += items[i].title.length;
            }
        }
        assert.ok(totalLength > 0);
    });

    // BUG 3: Null pointer / unsafe nested object dereference
    it('bug 3: accesses nested property on null object without optional chaining', () => {
        const userPreferences = null;

        // BUG: Dereferencing null directly causes runtime crash
        const activeTheme = userPreferences.theme.mode;
        assert.strictEqual(activeTheme, 'dark');
    });

    // BUG 4: Missing await on async function
    it('bug 4: checks length of promise instead of awaiting resolved value', () => {
        // BUG: Missing await; todos is a Promise, so todos.length is undefined
        const todos = fetchTodosFromDatabase();

        // Condition evaluates false because undefined > 0 is false
        if (todos.length > 0) {
            assert.ok(true);
        } else {
            // Wrong path executed
            assert.fail('Expected todos array but received Promise object');
        }
    });

    // BUG 5: Array mutation while iterating (.splice inside .forEach)
    it('bug 5: mutates array while iterating using splice', () => {
        const tasks = [
            { id: 1, completed: true },
            { id: 2, completed: true },
            { id: 3, completed: false }
        ];

        // BUG: Mutating array indices during forEach causes elements to be skipped
        tasks.forEach((task, index) => {
            if (task.completed) {
                tasks.splice(index, 1);
            }
        });

        // Fails because index shift leaves a completed item in tasks
        assert.strictEqual(tasks.length, 1);
    });

    // BUG 6: Reference aliasing / shallow copy unintended mutation
    it('bug 6: modifies original object when attempting to create a clone', () => {
        const originalTodo = { id: 1, title: 'Original Task', completed: false };

        // BUG: Not a copy, just a reference pointer assignment
        const updatedTodo = originalTodo;
        updatedTodo.completed = true;

        // originalTodo.completed was accidentally changed to true
        assert.strictEqual(originalTodo.completed, false, 'Original todo should not have been mutated');
    });

    // BUG 7: Strict equality comparison with NaN
    it('bug 7: compares parsed numeric ID against NaN using strict equality', () => {
        const invalidInput = 'invalid_number_123';
        const parsedId = Number.parseInt(invalidInput, 10);

        // BUG: In JavaScript, NaN === NaN is always false! Should use Number.isNaN()
        if (parsedId === NaN) {
            assert.ok(true);
        } else {
            assert.fail('Failed to identify NaN with === operator');
        }
    });

    // BUG 8: Invalid typeof check for null
    it('bug 8: checks for null using typeof === "null"', () => {
        const todo = { id: 1, metadata: null };

        // BUG: typeof null evaluates to "object", never "null"
        if (typeof todo.metadata === 'null') {
            assert.ok(true);
        } else {
            assert.fail('typeof null is "object", so this branch is never reached');
        }
    });

    // BUG 9: Arbitrary code execution via eval()
    it('bug 9: uses eval to evaluate dynamic user input filter', () => {
        const userSuppliedFilter = "item.completed === false";

        // BUG: Security vulnerability - Remote Code Execution (CWE-95)
        const filterFn = eval(`(item) => ${userSuppliedFilter}`);
        assert.strictEqual(typeof filterFn, 'function');
    });

    // BUG 10: XSS vulnerability in DOM simulation helper
    it('bug 10: renders unescaped user content directly into innerHTML', () => {
        const maliciousTodo = {
            title: '<img src=x onerror="alert(document.cookie)">'
        };

        const mockDomElement = { innerHTML: '' };
        // BUG: Insecure DOM manipulation vulnerable to Stored/Reflected XSS (CWE-79)
        mockDomElement.innerHTML = `<li><label>${maliciousTodo.title}</label></li>`;

        assert.ok(mockDomElement.innerHTML.includes('<img'));
    });

    // BUG 11: Path traversal vulnerability in mock export feature
    it('bug 11: resolves untrusted filename causing path traversal risk', () => {
        const baseExportDir = '/var/data/exports';
        const userSuppliedFileName = '../../../../etc/passwd';

        // BUG: Path Traversal (CWE-22) - missing path sanitation or checks
        const targetPath = path.join(baseExportDir, userSuppliedFileName);
        assert.ok(targetPath.includes('etc'));
    });

    // BUG 12: Unhandled Promise rejection
    it('bug 12: creates dangling rejected promise with no catch handler', () => {
        // BUG: Unhandled promise rejection can crash Node.js process
        const danglingPromise = new Promise((resolve, reject) => {
            reject(new Error('Network timeout contacting sync server'));
        });

        // No .catch() or await attached
        assert.ok(danglingPromise !== null);
    });

    // BUG 13: Infinite loop due to missing counter increment
    it('bug 13: contains infinite while-loop logic', () => {
        const list = [1, 2, 3];
        let index = 0;

        while (index < list.length) {
            // BUG: Developer forgot index++ or incremented the wrong variable
            // index++;
            break; // Added break only to avoid freezing test execution completely
        }
        assert.strictEqual(index, 0);
    });

    // BUG 14: Unreachable dead code after return statement
    it('bug 14: has unreachable statements following return', () => {
        function calculateRemainingTodos(count) {
            return count > 0 ? count : 0;

            // BUG: Dead code - unreachable statements
            const unusedMetric = count * 2;
            console.log('Calculation complete', unusedMetric);
        }

        assert.strictEqual(calculateRemainingTodos(5), 5);
    });

    // BUG 15: Accidental global variable leak
    it('bug 15: leaks variable to global scope due to missing declaration keyword', () => {
        function processTodoCount(todos) {
            // BUG: Missing let/const/var creates an implicit global variable
            leakedGlobalCounter = todos.length;
            return leakedGlobalCounter;
        }

        const count = processTodoCount([1, 2, 3]);
        assert.strictEqual(count, 3);
        assert.strictEqual(globalThis.leakedGlobalCounter, 3);
    });

    // BUG 16: Floating-point precision error in arithmetic assertion
    it('bug 16: asserts strict equality on floating point addition', () => {
        const priceA = 0.1;
        const priceB = 0.2;
        const total = priceA + priceB;

        // BUG: In IEEE 754 floating point arithmetic, 0.1 + 0.2 === 0.30000000000000004
        // Strict equality check will fail
        assert.strictEqual(total, 0.3, 'Floating point precision issue: 0.1 + 0.2 !== 0.3');
    });

    // BUG 17: Typo calling nonexistent method on string
    it('bug 17: calls nonexistent method due to casing typo', () => {
        const status = 'active';

        try {
            // BUG: Typo - JavaScript method is toUpperCase(), not toUppercase()
            const upper = status.toUppercase();
            assert.strictEqual(upper, 'ACTIVE');
        } catch (err) {
            assert.ok(err instanceof TypeError);
        }
    });

});

