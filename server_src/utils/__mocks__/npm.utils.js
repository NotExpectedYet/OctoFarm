const npmUtils = jest.createMockFromModule("../npm.utils");

let hasMissingPackages = ["random"];
let targetedStateAfterPull = true; // Default: pulling will successfully change state to up-to-date

npmUtils.returnListOfMissingPackages = async () => hasMissingPackages;
npmUtils.installNpmDependencies = async () => {
  hasMissingPackages = targetedStateAfterPull;
};

// Test helper
npmUtils.setHasMissingPackages = (missingPackages) => (hasMissingPackages = missingPackages);
npmUtils.setTargetState = (targetState) => (targetedStateAfterPull = targetState);

module.exports = npmUtils;
