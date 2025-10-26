// Test case sensitivity in URL check

const testUrl = 'https://www.google.com/search?ibp=htl;jobs&q=eyJqb2JfdGl0bGUiOiJTb2Z0d2FyZSBEZXZlbG9wZXIgSW50ZXJuIChOZXcgWW9yaykg4oCTIFN1bW1lciAyMDI2IiwiY29tcGFueV9uYW1lIjoiVGhlIEQuIEUuIFNoYXcgR3JvdXAiLCJhZGRyZXNzX2NpdHkiOiJOZXcgWW9yaywgTlkiLCJodGlkb2NpZCI6IjJUZ0xEcnZMUmM5VWpDMFBBQUFBQUE9PSIsImdsIjoidXMiLCJobCI6ImVuIn0=';

const parsed = new URL(testUrl);

console.log('Testing case sensitivity:\n');
console.log('Original search:', parsed.search);
console.log('Lowercase search:', parsed.search.toLowerCase());
console.log();
console.log('Original contains "ibp=htl;jobs":', parsed.search.includes('ibp=htl;jobs'));
console.log('Lowercase contains "ibp=htl;jobs":', parsed.search.toLowerCase().includes('ibp=htl;jobs'));
console.log();

// The issue: semicolon in URL
console.log('Query string:', parsed.search);
console.log('Has semicolon:', parsed.search.includes(';'));

// Let's check the exact character
const chars = parsed.search.split('').slice(0, 20);
console.log('\nFirst 20 characters:');
chars.forEach((char, i) => {
  console.log(`  ${i}: "${char}" (code: ${char.charCodeAt(0)})`);
});
