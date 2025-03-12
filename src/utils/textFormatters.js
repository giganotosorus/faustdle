/**
 * Capitalizes the first letter of a text string
 * @param {string} text - The text to format
 * @returns {string} Text with first letter capitalized
 */
export function formatText(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Converts gender code to human-readable text
 * @param {string} gender - Single character gender code ('M', 'F', or other)
 * @returns {string} Human-readable gender text
 */
export function getGenderText(gender) {
  switch(gender) {
    case 'M': return 'Male';
    case 'F': return 'Female';
    default: return 'Other';
  }
}