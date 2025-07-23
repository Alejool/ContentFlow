export const campaignReducer = (state, action) => {
    switch (action.type) {
        case 'ADD_CAMPAIGN':
            return [...state, action.payload];
        default:
            return state;
    }
};