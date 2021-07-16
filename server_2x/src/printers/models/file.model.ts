export interface FileModel {
    path: string,
    fullPath: string,
    display: string,
    name: string,
    uploadDate: number,
    fileSize: number,
    thumbnail: string,
    toolUnits: string[],
    toolCosts: string[],
    success: boolean,
    failed: boolean,
    last: any, // TODO
    expectedPrintTime: number,
    printCost: number
}
