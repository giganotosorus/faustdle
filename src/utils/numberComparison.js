/**
 * Compares two numbers and returns the direction indicator
 * @param {number} guess - The guessed number
 * @param {number} actual - The actual number to compare against
 * @returns {string} "up" if guess is less than actual, "down" otherwise
 */
export function compareNumbers(guess, actual) {
  return guess < actual ? "up" : "down";
}