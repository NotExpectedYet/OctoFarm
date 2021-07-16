class JobValidationException extends Error {
  constructor(message, taskId) {
    super(message); // (1)
    this.name = `JobValidationError [${taskId || "anonymous"}]`; // (2)
  }
}

module.exports = {
  JobValidationException
};
