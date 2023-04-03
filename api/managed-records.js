import URI from "urijs";

// /records endpoint
window.path = "http://localhost:3000/records";

// Your retrieve function plus any additional functions go here ...

const retrieve = async (options = {}) => {
  const { page = 1, colors = [] } = options;
  const limit = 10;
  const offset = (page - 1) * limit;

  const uri = new URI(window.path)
    .addQuery("limit", limit)
    .addQuery("offset", offset);

  if (colors.length > 0) {
    colors.forEach((color) => {
      uri.addQuery("color[]", color);
    });
  }

  const response = await fetch(uri.toString());
  if (!response.ok) {
    console.log("Failed to retrieve records");
    return;
  }

  const items = await response.json();
  const { ids, open, closedPrimaryCount } = transformData(items);

  const previousPage = page > 1 ? page - 1 : null;

  const nextPage = items.length >= limit ? page + 1 : null;
  if (nextPage === null && items.length > 0) {
    const lastItemId = items[items.length - 1].id;
    const totalItemsResponse = await fetch(
      `${uri}?limit=1&offset=${lastItemId}`
    );
    if (!totalItemsResponse.ok) {
      console.log("Failed to retrieve total number of items");
      return;
    }
    const totalItems = await totalItemsResponse.json();
    const totalPages = Math.ceil(totalItems.length / limit);
    nextPage = page < totalPages ? page + 1 : null;
  }

  return {
    ids,
    open,
    closedPrimaryCount,
    previousPage,
    nextPage,
  };
};
const transformData = (items) => {
  const ids = items.map((item) => item.id);

  const open = items
    .filter((item) => item.disposition === "open")
    .map((item) => {
      const isPrimary = ["red", "blue", "yellow"].includes(item.color);
      return {
        ...item,
        isPrimary,
      };
    });

  const closedPrimaryCount = items.filter(
    (item) =>
      item.disposition === "closed" &&
      ["red", "blue", "yellow"].includes(item.color)
  ).length;

  return {
    ids,
    open,
    closedPrimaryCount,
  };
};
export default retrieve;
