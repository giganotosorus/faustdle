import { haki, arcs } from '../data/characters.js';
import { formatText, getGenderText } from './textFormatters.js';
import { compareNumbers } from './numberComparison.js';

/**
 * Compares traits between a guessed character and the chosen character
 * @param {Array} guessTraits - Array of traits for the guessed character
 * @param {Array} chosenTraits - Array of traits for the chosen character
 * @returns {Array} Array of result objects containing match status and formatted text
 */
export function compareTraits(guessTraits, chosenTraits) {
  const results = [];
  
  for (let i = 0; i < guessTraits.length; i++) {
    // Skip difficulty trait (last trait)
    if (i === 9) continue;
    
    // Special handling for bounty comparison (index 4)
    if (i === 4) {
      const guessBounty = parseInt(guessTraits[i]);
      const chosenBounty = parseInt(chosenTraits[i]);

      if (guessBounty === chosenBounty) {
        // Bounties match exactly (including both being unknown)
        results.push({
          match: true,
          text: guessBounty === 1 ? "Unknown Bounty" : guessBounty.toString()
        });
      } else {
        // Different bounties - show direction (higher/lower)
        results.push({
          match: false,
          direction: compareNumbers(guessBounty, chosenBounty),
          text: guessBounty === 1 ? "Unknown Bounty" : guessBounty.toString()
        });
      }
      continue;
    }
    
    // Compare other traits
    if (guessTraits[i] === chosenTraits[i]) {
      results.push(createMatchResult(guessTraits[i], i));
    } else {
      results.push(createNonMatchResult(guessTraits[i], chosenTraits[i], i));
    }
  }
  
  return results;
}

/**
 * Creates a result object for matching traits
 * @param {string} trait - The matching trait value
 * @param {number} index - Index of the trait in the array
 * @returns {Object} Result object with match status and formatted text
 */
function createMatchResult(trait, index) {
  return {
    match: true,
    text: formatTraitText(trait, index)
  };
}

/**
 * Creates a result object for non-matching traits
 * @param {string} guessTrait - The guessed trait value
 * @param {string} chosenTrait - The correct trait value
 * @param {number} index - Index of the trait in the array
 * @returns {Object} Result object with match status, direction (if applicable), and formatted text
 */
function createNonMatchResult(guessTrait, chosenTrait, index) {
  if (guessTrait.match(/^\d+$/)) {
    return createNumberComparisonResult(guessTrait, chosenTrait, index);
  }
  return createTextComparisonResult(guessTrait, index);
}

/**
 * Formats trait text based on the trait type
 * @param {string} trait - The trait value to format
 * @param {number} index - Index indicating the type of trait
 * @returns {string} Formatted trait text
 */
function formatTraitText(trait, index) {
  switch(index) {
    case 0: return getGenderText(trait);
    case 3: return formatText(haki[parseInt(trait)]);
    case 7: return formatText(arcs[parseInt(trait)]);
    default: return formatText(trait);
  }
}

/**
 * Creates a result object for numerical trait comparisons
 * @param {string} guessTrait - The guessed numerical trait
 * @param {string} chosenTrait - The correct numerical trait
 * @param {number} index - Index of the trait in the array
 * @returns {Object} Result object with comparison details
 */
function createNumberComparisonResult(guessTrait, chosenTrait, index) {
  if (index === 3) {
    return {
      match: false,
      text: formatText(haki[parseInt(guessTrait)])
    };
  }
  
  if (index === 7) {
    return {
      match: false,
      direction: compareNumbers(parseInt(guessTrait), parseInt(chosenTrait)),
      text: formatText(arcs[parseInt(guessTrait)])
    };
  }
  
  return {
    match: false,
    direction: compareNumbers(parseInt(guessTrait), parseInt(chosenTrait)),
    text: guessTrait
  };
}

/**
 * Creates a result object for text-based trait comparisons
 * @param {string} trait - The trait value to compare
 * @param {number} index - Index of the trait in the array
 * @returns {Object} Result object with comparison details
 */
function createTextComparisonResult(trait, index) {
  if (index === 0) {
    return {
      match: false,
      text: getGenderText(trait)
    };
  }
  
  if (index === 5) {
    return {
      match: false,
      text: "Unknown Height"
    };
  }
  
  return {
    match: false,
    text: formatText(trait)
  };
}