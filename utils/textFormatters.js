// Text formatting utilities
function formatText(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function getGenderText(gender) {
  switch(gender) {
    case 'M': return 'Male';
    case 'F': return 'Female';
    default: return 'Other';
  }
}