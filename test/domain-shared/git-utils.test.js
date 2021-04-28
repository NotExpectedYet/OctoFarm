describe("GitUtils", () => {
    const scenarioModifiedOutput = {
        modified: [
            "package-lock.json",
            "package.json",
            "server_src/lib/serverCommands.js",
        ],
        ahead: 0,
        behind: 0,
    };

    let wasReset = null;

    jest.mock("simple-git", () => {
        return () => {
            return {
                status: () => Promise.resolve(
                    scenarioModifiedOutput
                ),
                pull: () => Promise.resolve(),
                reset: (input) => {
                    wasReset = true;
                    return Promise.resolve();
                },
            }
        }
    });

    const {
        returnCurrentGitStatus,
        isBranchUpToDate,
        isBranchInfront,
        doesBranchContainModifiedFiles,
        pullLatestRepository
    } = require("../../server_src/utils/git.utils");

    it("should be able to see no commits to be pulled in", async () => {
        const isUpToDate = await isBranchUpToDate(scenarioModifiedOutput);
        expect(isUpToDate).toBe(true);
    });

    it("should be able to see no commit to push", async () => {
        const isAhead = await isBranchInfront(scenarioModifiedOutput);
        expect(isAhead).toBe(false);
    });

    it("should be able to see changes to commit", async () => {
        const modified = await doesBranchContainModifiedFiles(scenarioModifiedOutput);
        expect(modified).toBe(true);
    });

    it("should be able to see modified files", async () => {
        const gitResponse = await returnCurrentGitStatus();
        expect(gitResponse).toBeTruthy();
        expect(gitResponse.modified).toHaveLength(3);
    });

    it("should be able to reset changes when force is true", async () => {
        await pullLatestRepository({forcePull: false});
        expect(wasReset).toBe(true);
        wasReset = null;
        await pullLatestRepository({forcePull: true});
        expect(wasReset).toBe(null);
    });
});
