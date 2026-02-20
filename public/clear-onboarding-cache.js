// Clear onboarding cache from localStorage
// This script should be run once to clear old cached data
(function() {
    
    // Clear onboarding state cache
    localStorage.removeItem('onboarding_state_cache');
    localStorage.removeItem('onboarding_state_cache_timestamp');
    
})();
