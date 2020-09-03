import FileManager from "./fileManager.js";

export default class FileSorting{
    static saveSort(meta, reverse){
        localStorage.setItem("fileSort", JSON.stringify({meta, reverse}));
    }
    static loadSort(printer){
        const fileSortStorage = JSON.parse(localStorage.getItem("fileSort"));
        if(fileSortStorage !== null){
            const reverse = fileSortStorage.reverse;
            if(fileSortStorage.meta === "file"){
                this.sortFileName(printer, reverse);
            }
            if(fileSortStorage.meta === "date"){
                this.sortUploadDate(printer, reverse);
            }
            if(fileSortStorage.meta === "time"){
                this.sortPrintTime(printer, reverse);
            }
        }
        this.setListeners(printer);
    }
    static setListeners(printer){
        document.getElementById("sortFileNameUp").addEventListener("click", e =>{
            this.sortFileName(printer, true);
        });
        document.getElementById("sortFileNameDown").addEventListener("click", e =>{
            this.sortFileName(printer);
        });
        document.getElementById("sortPrintTimeUp").addEventListener("click", e =>{
            this.sortPrintTime(printer, true);
        });
        document.getElementById("sortPrintTimeDown").addEventListener("click", e =>{
            this.sortPrintTime(printer);
        });
        document.getElementById("sortDateUp").addEventListener("click", e =>{
            this.sortUploadDate(printer);
        });
        document.getElementById("sortDateDown").addEventListener("click", e =>{
            this.sortUploadDate(printer, true);
        });

    }

    static sortFileName(printer, reverse){
        const sortHeader = document.getElementById("fileSortDropdownMenu");
        printer.fileList.fileList = _.sortBy(printer.fileList.fileList, [function(o) { return o.display; }]);
        if(reverse){
            printer.fileList.fileList = printer.fileList.fileList.reverse();
            sortHeader.innerHTML = "<i class=\"fas fa-sort-alpha-up\"></i> File Name";
            this.saveSort("file", true);
        }else{
            sortHeader.innerHTML = "<i class=\"fas fa-sort-alpha-down\"></i> File Name";
            this.saveSort("file", false);
        }
        FileManager.drawFiles(printer);
    }
    static sortUploadDate(printer, reverse){
        const sortHeader = document.getElementById("fileSortDropdownMenu");
        printer.fileList.fileList = _.sortBy(printer.fileList.fileList, [function(o) { return o.uploadDate; }]);
        if(reverse){
            printer.fileList.fileList = printer.fileList.fileList.reverse();
            sortHeader.innerHTML = "<i class=\"fas fa-sort-numeric-up\"></i> Upload Date";
            this.saveSort("date", true);
        }else{
            sortHeader.innerHTML = "<i class=\"fas fa-sort-numeric-down\"></i> Upload Date";
            this.saveSort("date", false);
        }
        FileManager.drawFiles(printer);
    }
    static sortPrintTime(printer, reverse){
        const sortHeader = document.getElementById("fileSortDropdownMenu");
        printer.fileList.fileList = _.sortBy(printer.fileList.fileList, [function(o) { return o.expectedPrintTime; }]);
        if(reverse){
            printer.fileList.fileList = printer.fileList.fileList.reverse();
            sortHeader.innerHTML = "<i class=\"fas fa-sort-numeric-down\"></i> Print Time";
            this.saveSort("time", false);
        }else{
            sortHeader.innerHTML = "<i class=\"fas fa-sort-numeric-up\"></i> Print Time";
            this.saveSort("time", true);
        }
        FileManager.drawFiles(printer);
    }

}