// Clear onboarding cache from localStorage
// This script should be run once to clear old cached data
(function() {
    console.log('Clearing onboarding cache...');
    
    // Clear onboarding state cache
    localStorage.removeItem('onboarding_state_cache');
    localStorage.removeItem('onboarding_state_cache_timestamp');
    
    console.log('Onboarding cache cleared. Please refresh the page.');
})();
