export const campaignReducer = (
  state: any[],
  action: { type: string; payload: any }
) => {
  switch (action.type) {
    case "ADD_CAMPAIGN":
      return [...state, action.payload];
    default:
      return state;
  }
};
