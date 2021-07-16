export function toDefinedKeyValue(prop, key) {
  return (typeof prop !== "undefined" && prop !== null) ? { [key]: prop } : {};
}
