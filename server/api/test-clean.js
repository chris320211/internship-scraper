function cleanDescription(html) {
  if (!html) return 'No description available';

  // First, decode HTML entities
  let text = html
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#x60;/g, '`')
    .replace(/&#x3D;/g, '=');

  // Now strip HTML tags
  text = text.replace(/<[^>]*>/g, '');

  // Remove extra whitespace
  text = text.replace(/\s+/g, ' ').trim();

  // Limit to 300 chars
  if (text.length > 300) {
    text = text.substring(0, 300) + '...';
  }

  return text || 'No description available';
}

const testInput = '&lt;h2&gt;&lt;strong&gt;Who we are&lt;/strong&gt;&lt;/h2&gt;&lt;p&gt;Stripe is a platform&lt;/p&gt;';
console.log('Input:', testInput);
console.log('Output:', cleanDescription(testInput));
