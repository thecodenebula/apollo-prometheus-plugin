export const extractTopLevelQueriesOrMutations = (requestContext) => {
  if (!requestContext.operation) {
    return [];
  }
  return requestContext.operation.selectionSet.selections.map((q) => q.name.value);
};
