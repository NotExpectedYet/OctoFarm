import {FileModel} from "./file.model";

export interface FileAnalysisModel {
    fileList: FileModel[],
    filecount: number,
    folderList: string[],
    folderCount: number
}
