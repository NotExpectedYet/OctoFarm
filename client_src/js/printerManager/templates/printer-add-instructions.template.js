export function createPrinterAddInstructions() {
  return `<div class="row">
        <div class="col-lg-12">
            <h4><u>OctoPrint / OctoFarm Setup Instructions</u></h4><br>
            <p>Octoprint will require some setting's changes applying and an OctoPrint service restart actioning before
                a connection can be established. </p><p>Click the buttons below to display instructions if required.
            Otherwise close and continue. </p>
        </div>
    </div>
    <div class="row">
        <div class="col-md-6">
            <button class="btn btn-primary" type="button" data-toggle="collapse" data-target="#octoprintCollapse"
                    aria-expanded="false" aria-controls="octoprintCollapse">
                OctoPrint Setup
            </button>
        </div>
        <div class="col-md-6">
            <button class="btn btn-primary" type="button" data-toggle="collapse" data-target="#octofarmCollapse"
                    aria-expanded="false" aria-controls="octofarmCollapse">
                OctoFarm Instructions
            </button>
        </div>
    </div>
    <div class="collapse" id="octofarmCollapse">
        <div class="card card-body">
            <div class="row pb-1">
                <div class="col">
                    <label htmlFor="psPrinterName">Name:</label>
                    <input id="psPrinterName" type="text" class="form-control" placeholder="Printer Name" disabled>
                        <small class="form-text text-muted">Custom name for your OctoPrint instance, leave this
                            blank to grab from OctoPrint -> Settings -> Appearance Name.</small>
                        <small class="form-text text-muted">If this is blank and no name is found then it will
                            default to the Printer URL.</small>
                        <small>Example: <code>My Awesome Printer Name</code></small>
                </div>
                <div class="col">
                    <label htmlFor="psPrinterURL">Printer URL:</label>
                    <input id="psPrinterURL" type="text" class="form-control" placeholder="Printer URL" disabled>
                        <small class="form-text text-muted">URL of OctoPrint Host inc. port. Defaults to "http://"
                            if not specified.</small>
                        <small>Example: <code>http://192.168.1.5:81</code></small>
                </div>
                <div class="col">
                    <label htmlFor="psCamURL">Camera URL:</label>
                    <input id="psCamURL" type="text" class="form-control" placeholder="Camera URL" disabled>
                        <small class="form-text text-muted">URL of mjpeg camera stream. Defaults to "http://" if not
                            specified.</small>
                        <small class="form-text text-muted">You may also leave this blank to be automatically
                            detected from OctoPrint.</small>
                        <small>Example: <code>http://192.168.1.5/webcam/?action=stream</code></small>
                </div>
            </div>
            <div class="row pb-2">
                <div class="col">
                    <label htmlFor="psPrinterGroup">Group:</label>
                    <input id="psPrinterGroup" type="text" class="form-control" placeholder="Printer Group"
                           disabled>
                        <small class="form-text text-muted">OctoFarm allows for groups </small>
                        <small>Example: <code>http://192.168.1.5:81</code></small>
                </div>
                <div class="col">
                    <label htmlFor="psAPIKEY">API Key:</label>
                    <input id="psAPIKEY" type="text" class="form-control" placeholder="API Key" disabled>
                        <small class="form-text text-muted">OctoPrints API Key. It's required to use the
                            User/Application API Key for OctoPrint version 1.4.1+.</small>
                        <small class="form-text text-muted">If you do not use authentication on your OctoPrint
                            instance just use the global API Key which should work across all OctoPrint
                            versions.</small>
                </div>

            </div>
        </div>
    </div>
    <div class="collapse" id="octoprintCollapse">
        <div class="card card-body">
            <div class="row">
                <div class="col-md-3">
                    <p>1. Make sure CORS is switched on and OctoPrint has been restarted...</p>
                </div>
                <div class="col-md-9">
                    <img width="100%" src="/images/userCORSOctoPrint.png">
                </div>
            </div>
            <div class="row">
                <div class="col-md-9">
                    <p>2. Grab your OctoPrint instances API Key.<br> This can be generated in the User Settings dialog.
                    </p>
                    <code>Note: since OctoPrint version 1.4.1 it is recommended to connect using the Application Key /
                        User Key detailed below. Versions before that are fine using the Global API Key generated by
                        OctoPrint.</code>
                </div>
                <div class="col-md-3">
                    <img src="/images/userSettingsOctoPrint.png">
                </div>
            </div>
            <div class="row">
                <div class="col-md-5">
                    <p>2.1 You can generate a API Key from your current user.</p>
                    <code>Please note, this user currently requires Admin permission rights. If in doubt, it's usually
                        the first user you have created.</code>
                </div>
                <div class="col-md-7">
                    <img src="/images/userAPIKEYOctoPrint.png">
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-md-5">
                <p>2.1 You can generate a API Key for a specific application.</p>
                <code>Please note, this user currently requires Admin permission rights. If in doubt, it's usually the
                    first user you have created.</code>
            </div>
            <div class="col-md-7">
                <img src="/images/userApplicationKeyOctoPrint.png">
            </div>
        </div>
    </div>
`;
}
