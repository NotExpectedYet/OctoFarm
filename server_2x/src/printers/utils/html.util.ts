/**
 * Static function to convert a state and reason string to HTML state
 * @param printSuccess
 * @param failureReason
 * @returns {string}
 */
export function stateToHtml(printSuccess, failureReason) {
  if (printSuccess) {
    return "<p class=\"d-none state\">Success</p><i class=\"fas fa-thumbs-up text-success fa-3x\"></i>";
  } else {
    if (failureReason === "cancelled") {
      return "<p class=\"d-none state\">Cancelled</p><i class=\"fas fa-thumbs-down text-warning fa-3x\"></i>";
    } else {
      return "<p class=\"d-none state\">Failure</p><i class=\"fas fa-exclamation text-danger fa-3x\"></i>";
    }
  }
}
