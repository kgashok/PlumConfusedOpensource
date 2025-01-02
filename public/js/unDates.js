
async function fetchUNDates() {
  try {
    const response = await fetch('/api/un-dates');
    const dates = await response.json();
    return dates;
  } catch (error) {
    console.error('Error fetching UN dates:', error);
    return [];
  }
}

// Export for use in main.js
window.fetchUNDates = fetchUNDates;
