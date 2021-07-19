/**
 * Find key equality in array and return first element
 * @param nameProp
 * @param array
 * @returns {*}
 */
function checkNested(nameProp, array) {
  if (!nameProp || !array?.length) {
    return;
  }
  return array.find((kv) => kv?.name === nameProp);
}

/**
 * Find key equality in array returning index
 * @param nameProp
 * @param array
 */
function checkNestedIndex(nameProp, array) {
  if (!nameProp || !array?.length) {
    return;
  }
  return array.findIndex((kv) => kv?.name === nameProp);
}

/**
 * Count distinct occurrences of elements within an array input, returning the distinct elements followed by the element counts.
 * @param arr
 * @returns {[][]}
 */
function arrayCounts(arr) {
  const a = [];
  const b = [];
  let prev;

  arr.sort();
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] !== prev) {
      a.push(arr[i]);
      b.push(1);
    } else {
      b[b.length - 1]++;
    }
    prev = arr[i];
  }

  return [a, b];
}

module.exports = {
  checkNested,
  checkNestedIndex,
  arrayCounts
};
