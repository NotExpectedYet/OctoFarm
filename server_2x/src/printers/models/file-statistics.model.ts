export interface FileStatisticsModel {
    storageUsed: number;
    storageTotal: number;
    storageRemain: number;
    storagePercent: number;
    fileCount: number;
    folderCount: number;
    biggestFile: number;
    smallestFile: number;
    averageFile: number;
    biggestLength: number;
    smallestLength: number;
    averageLength: number;
}
