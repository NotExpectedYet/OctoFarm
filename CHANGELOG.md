# Changelog

All notable changes to this project will be documented in this file.

## [v1.2-rc2]

### Added
    - Task scheduler: runs periodic tasks for OctoFarm in a controllable, periodic manner.
    - Added line counter to ticker log
    - Refactored task manager so it becomes easier to use

### Changed
    - File manager: gave printer titles a badge. Gave selected printer a yellow border. Reduced file list minimum height (for smaller screens). 
    - Refactor of History Runner with new OctoPrint Client service and added test coverage.
    - Refactor of Printer Manager client view templates. All Manager functions under seperate dropdowns, wider connection log.
    - Refactor of Printer Manager client code bringing a little speed boost (avg 40fps -> 50fps) and better fault tolerance. 
    - Refactor of SSE client into re-usable file. 
    - Moved the "API Errors" button, now appears on the start of a printer row and clicking will take you straight into Printer Settings.
    - Refactor monitoring pages (panel, list, camera) with latest SSE client reusability.
    - Refine the printer map layout with borders and printer quick actions (page not public yet).
    - Reduced logging (we will bring it back later in different shape with an Exception handler)

### Removed

### Fixed
    - Fixed #665: If Global API check fails due to intial time out, never recovered and tried again increasing timeout.
    - Fixed #670: File manager initial and subsequent scans we're not recursive. 
    - Fixed #669: File manager scroll wouldnt reset after switching printer.
    - Fixed #590: The Back button now disables when there's no folder to go back to.
    - Fixed #679: OctoFarm would stall on air gapped farms due to checking for OP updates.
    - Added Filament Clean back to start up so filament manager and spools list load.
    - Fixed #605: Tool total would show "null" if no spool selected. 
    - Issue with totals not been counted with/without a spool selected on Printer Control.

## [v1.2-rc1]

### Added
    - Added #546: Node 13 or lower issue webpage with instructions, doesnt restart server anymore 
    - Added #509: HTTP/HTTPS support for websocket connections
    - #628 Split client package.json and published package @octofarm/client to NPM 

### Changed
    - Completely reworked history cache, prepared and tested for OctoFarm V2
    - Slightly reworked file cache, prepared for V2 and made it robust
    - Made API tests less prone to unnecessary failure
    - Reworked the Settings modal to be more resiliant to failure and cleaned up code
    - Slightly reworked job cache, prepared for V2
    - Added the ability to override the automatic wss:// select for HTTPS in printer settings modal. 
    - Added the ability for settings dialog to return to "Printer Online" view when printer comes online in background / from settings changes.
    - Amended the functions for Global OctoPrint update and Global OctoPrint plugin update
    - The core `state` of OctoFarm is split off of OctoPrint and added possibilities to test it fully 
    - Rewrote imports and entrypoint of frontend javascript for webpack
    - Added Webpack to replace Gulp frontend bundler
    - Rewrote dashboard page and completely refactored javascript code in browser
    - Moved filament cleaner startup to app-core
    - Made NODE_ENV to be production by default causing the @octofarm/client bundle to be loaded and console logging to be filtered with level INFO/ERROR

### Removed
    - Gulp packages and gulp as bundler

### Fixed
    - Fixed #531 - Updated settings are not grabbed when opening settings modal
    - Fixed #532 - Actual save port is not checked against live ports on OctoPrint on settings Modal
    - Fixed #567: heatmap error (race condition) in PrinterClean for any newly created database
    - Fixed #576, #577: correct some function calls in PrinterClean
    - Fixed #542, #381: ensureIndex mongoose warning and circular Runner import resolved 
    - Fixed #598: printer settingsAppearance missing will not cause failure anymore
    - Fixed #596: changed OctoPrint plugin manager repository to new route with backwards compatibility version check 
    - Fixed #608: Global update button was not appearing
    - Fixed #555: Offline after error not caught by OctoFarm. 1.6.0+
    - Fixed #609: Bulk printer functions wouldn't load due to small regression bug
    - Fixed #587: Changing printer URL doesn't rescan for changes when using settings modal
    - Fixed #592: Printer host is marked Online when URL is not correct / fake
    - Fixed #574: Reworked the statejs OctoPrint client and added tests
    - Fixed #630: System Info calls took huge amount of event-loop time (>2000ms) on Windows with a 2500ms interval period. Disabled for huge performance loss.
    - Fixed #641: Opening the console on the Printers Page with offline printers would crash the browser due to spam.
    - Fixed #638: Fixed login not working anymore after refactor
    - Fixed `snapshots` instead of `snapshot` bug on client system Javascript bundle
    - Fixed #655: Server-sent events were failing due to breaking import path of the flatted package. Fixed that path server-side.
    - Fixed #625 - Incorrect html tags on Printer Manager
    - Fixed #548 - Smaller screen action buttons wrapped incorrectly on Printer Manager

## [v1.1.13-hotfix]

### Added
    - Ability to use the AUTO option for baudrate
    - Ability to click update button to go to system page

### Changed
    - Completely re-worked the auto updater mechanism
    - Completely re-worked the npm check and installation mechanism for the auto updater 

### Removed

### Fixed
    - Fixed #500: Connection to printer would fail when both baudrate and port are set to "AUTO"
    - Fixed #501: Restart command fired too fast which resulted in no confirmation/error notification on client.
    - Fixed #495: Check for update would result in double notifications for airgapped farms
    - Fixed #498: Fix package version not always preset and synced correctly when not running npm commands, f.e. pm2


## [v1.1.13]

### Added
    - Added #361: OctoFarm release check and notification sets ground work for automatic updates
    - Added #373: Migrated MongoUri in config/db.js to new .env file format as MONGO=...
    - Added #374: Migrated server port to .env file as OCTOFARM_PORT=...
    - Added #351: Background image now ignored and copied from default if not present at start.
    - Added #382: Add in ability for OctoFarm to update itself with the current pm2/git implementation
        - This is actioned by two new section inside Server -> System. Two new buttons "Force Check", "Update".
    - Added #421: OctoFarm data dump. Generates a bundled zip file for download that includes all system logs and a service_information.txt file
    - Added #296: Ability to define your own page title with an Environment Variable

### Changed
    - Disabled Restart button when not using pm2 process manager
    - Node 12 now not supported. Node 14 is a minimum requirement

### Removed
    - Ability to change the port in the UI. This is now managed by environment variables. UI option will be back soon.

### Fixed
    - Fixed #240: Commands sent from the Printer Control Terminal would double wrap array.
    - Fixed #358: Spool Manager not allowing input of decimal places.
    - Fixed #398: Added back in power reset buttons.
    - Fixed #353: Filament Manager Spools list is not ignoring Spools Modal pagination.
    - Fixed #386: Server update notification would show to all users, not just Administrator group.
    - Fixed #430: Replace user and group check with middleware.
    - Fixed #396: History cleaner wouldn't run after print capture.
    - Fixed #397: Thumbnails wouldn't capture on history, even with setting on.
    - Fixed #414: History failing to generate due to missing default settings.
    - Fixed #438: File manager fails to load due to toFixed error.
    - Fixed #442: Re-Input catch statements for "git" commands on updater logic.
    - Fixed #444: Add in npm functions for updater command to keep packages up to date.
    - Fixed #439: Views not updating due to offline printer in first instance.
    - Fixed #414: History would fail to capture due to missing settings. 
    - Fixed #475: Loading system page would cause error in console due to missing settings.
    - Fixed #459: Duplicate Id's on printer manager page. 
    - Fixed #472: System page would crash if release check didn't find a release. 
    - Fixed #460: Update and Restart commands not correctly erroring and returning to client.
    - Fixed #468: Disable update notification and buttons to docker installs. 
    - Fixed #452: Docker documnetation was missing path for /images.
    - Fixed #478: Abort with a friendly message if Node version less than 14 is detected.
    - Fixed #429 and #378: Memory/CPU graphs in system page now tolerant to missing values so it can show no matter what. 
    
# [Released]

## [v1.1.12]

### Added
   - Added a button to System page to restart OctoFarm server.

### Changed
   - Added logging around system information as there was none originally, also a warning message when failing to generate.
   - Pre-start script now uses 'npm ci' to make sure packages are on the latest version inside package-lock.json. 
   - Server restart commands will no longer silently fail... It will alert you if you haven't set up OctoFarm correctly under the pm2 named service.

### Fixed
    - #342: Quotes causing issue for Windows 10 systems in package.json start up scripts.
    - #341: System information was failing to generate on some ubuntu systems due to an outdated package. Package has been updated.
            - The new systeminformation changed some key value pairs. Please run npm 
    - #337: Fixed issue with file manager not loading files due to recursion issue.  

### Security

# [v1.1.11]

### Added
   - #274: Added full file path to file display card.
   - Gcode Scripts are now editable.
   - Reset Fields Button to power settings to enable a reset of them...
   - Individual Printer Statistics: New option under the Manage section for viewing statistics about your printer.
   - Added check against global API Key usage. Will now throw an error warning the user it is incorrect... and to generate a User or Application Key inside OctoPrint.
   - Added the ability to export any of the database collections into a .json file to bolster any issue reports.

### Changed
   - Improved the power status error logs.
   - #272: Improvements to the alpine image, now runs as none-root and went from around 1Gb to 268Mb in size! Big thank you to user @torresmvl for those PR's. Don't forget to email about your free t-shirt.
   - Gcode scripts no longer require a description.
   - Made gcode scripts wider for comments and better data input.
   - Printer Manager Table has been updated to include Printer, OctoPrint designations:
         - Printer: Shows current printer firmware version, model and name.
         - OctoPrint: Shows current OctoPrint version and if on OctoPi, the version and Pi model.
   - Printer Hourly Temperature Graph on Dashboard now only reacts when target is set. Will skip any room temperature readings.  

### Fixed
   - #223: Shutting down printers unexpectedly would keep printer in last state. - Big thanks to Chrismettal for helping me with this one.
   - #226: Failing to fire commands to enclosure plugin using the Power Settings.
   - Attempted fix for air gapped farms. Awaiting feedback. 
   - #236: File Manager would fail to return to non-recursive search on blank input.
   - Fixed the slider not showing the 10/300% changes for feedrate. 
   - Fixed enclosure plugin commands not firing with a GET request. 
   - Fixed: #273 Recursive search doesn't return to root folder...  
   - #277: Fixed issue when person re-edited final slash back in... 
   - Fixed: WOL packets been undefined.
   - Fixed: Update cost match in history would fail.
   - #276 - Patched issue were a user couldn't send blank fields to clear Custom Power Settings. 
   - Fixed: Issue with autodetection of PSU control plugin causing wol settings to be destroyed.
   - Fixed: Issue with Weekly Utilisation chart showing incorrect colours on a Float value.
   - Fixed: #236 - Colours on Weekly Utilisation chart we're loading too dark.
   - Fixed: #279 - API connection checked too early after powering up.
   - Fixed: #292 - Printer Settings would fail due to missing wol settings.
   - Fixed: #326 - Job doesn't reset when OctoPrint goes offline.
   - Fixed: Printer Settings modal opening would throw error when OctoPrint has never been connected to farm.
   - Fixed: Error grabbing octoprint plugin list/system/updates wouldn't correctly log an error.
   - Fixed: Bubbling server check interval causing client to massively hang and break CPU's...
   - Fixed: Issue with history card not loading spools tables
   - Fixed: #297 - Issue with temperature not been applied from spool at start of a print.  
   - Fixed: #327 - Issue with not been able to change a spool mid print/paused when not using Filament Manager Plugin.
   - Fixed: #309 - Regression with toggle button to check filament spool is loaded before print start. 


### Removed
   - Printer Settings drop down, was buggy and half implemented causing issues and is less used than the Printer Control one.



# [v1.1.10]

### Added
     - Last values from environmental data are displayed in the navigation bar when available. This will update every 5 seconds.  
     - Gave gmccauley (and possibly others) the new Filament and History graphs. Big Thanks for your data basically... I'm a dodo at times XD
     - New Client Settings - Control Panel File Top: Checking this as true will put the file section at the top of printer control. Print Status and Tools underneigth.
     - Added #252 - OctoPrint feed rate settings now allows for 10% to 300% inline with OctoPrint.
     - Added - New button in Printer manager called "Gcode Scripts". Allows for creating pre-defined gcode scripts that can be used from Printer Contol under the terminal + Bulk Gcode button. Thanks to @MTrab Discussion #250 + Issue #253 
         - NOTE: Editing of the scripts is not available yet. Wanted to get this release pushed with the bug fixes. Delete and re-create for now, will sort edit for next release. 

### Changed
    - Changed the ability to fire custom api power commands without command object to octoprints api.
    - Gcode scripts modal has been enlarged to accomodate possible button configurations for new feature above.
    - Printer Manager will now warn of a specific issue and tell you to log me a bug!

### Fixed
    - Fixed #234 - Adding Power commands would be overwritten on save. (also affected appearance name on OctoPrint & wakeonlan settings and grabbing default power settings from OctoPrint on a new printer.)
    - Fixed - Graph for filament daily usage would not stack values by day 
    - Fixed - Auto grab of OctoPrint camera URL would incorrectly add :8080 to the url.
    - Fixed - Date range and conversion issue with filament graphs 
    - Fixed #235 - Filament / History graphs failing to generate data...
    - Fixed - Port preference undefined, would happen on printer management when offline printer was added.
    - Fixed - Fixed server start on some systems not correctly attaching to ipv4 interface. 
    - Fixed - Issue with quick connect button sending the port as a string causing a 500 response. 
    - Fixed - Spool manager not loading without spools. (only affected ancient data, pre COVID XD)
    - Fixed - Spool manager loading graphs and table without spools. (only affected ancient data, pre COVID XD)
    - Fixed error with file length/weight not getting parsed from text on Printer Control. 
    - Fixed error with terminal erroring on enter command with no text.
    - Fixed #245 - File manager recursive again
    - Fixed Printer Control completely failing when 1 component didn't have data. (related to change above)


## Removed
    - Removed system settings dashboard control. Uneeded overhead.

# [v1.1.8]

### Added
     - Added improved filament manager loggin for history capture. 
     - Improved the layout of the Filament Manager:
         - Spools and Profile managers are now under modals. 
         - Filament Statistics UI tweaks.
         - No more content editable fields... firefox should now be able to edit values.
         - New spool overview table. Display only.
         - New Usage By Day chart - will show stacked values totaled by day of filament usage.
         - New Usage Over Time chart - will show incrementing total filemant usage by day. 
         - Moved Re-Sync Filament Manager button to show with others (manage profile/spools).
     - New History Chart - Will show daily totals of success / cancelled and failed prints.
     - Dashboard has the 3 new charts detailed above available. 
      
### Changed
     - Fixed #228: Quick connect button will only activate once you have setup preferred connection preferences. 
     - Printer Logs Modal for OctoPrint logs now includes line number 
     - Re-organised the System dashboard settings page to include new graph options
     - History statistics now only take into account successful prints.

### Fixed
     - Fixed #226: Couldn't update OctoPrint instances, restart would get in the way. 
     - Fixed #223: Shutting down printers would incorrectly count towards last printer state on Dashboard Utilisation heat map.
     - Fixed issue with incorrect object on history error. 
     - Fixed issue when changing spool filter not updating all dropdowns until refresh.
     - Fixed issue with File Name not been sent through Alerts.

## Removed
     - Disable Printer Assignment on Filament Manager screen, buggy... needs re-configuring.

# [v1.1.7]

### Added
    - #221: New Bulk Printer Actions on Printer Manager: (big thanks to Scott Presbrey for sponsoring this one!)
       - Pre-Heat: Select your printers and send target temps to your tool/bed/chamber. 
       - Control: Select your printers and action Home/Jog commands, as well as Start, Cancel, Pause, Resume and Restart commands.
       - Gcode: Select your printers and send multiple gcode commands to multiple printers at once.
   
### Changed
   - OctoFarm now detects any trailing forward slashes in the printer URL and removes them...
   - #220: Improved the terminal function. Multi-lined commands will now be parsed and split, OctoPrint should run through these sequentially now. 

### Fixed
   - #197: Editing a printer after typing an incorrect connection string would cause a double listener to be created.
   - Fixed issue with plugin installation crashing on successful completion when restart is required.
   - #198: Fixed new system settings not generating defaults on upgrade/start up.
   - #201: Fixed issue with double listener getting generated and not clearing on Re-Sync.
   - #215: Fixed blank camera field not grabbing OctoPrint camera URL. (Please log an issue if this still doesn't work thanks!)
   - #220: Fixed issue with terminal commands capitalising Klipper commands.

## Removed

## [v1.1.6]

### Added
    - Added new Printer Manager section called Bulk Controls. This allows for Connect/Disconnect/Delete/Power commands to be sent to your farm.
    - Q.O.L improvement with modal describing required OctoPrint steps to add a printer. Assumes you already know what your doing if you have printers in your farm...
    - API issues now show a big red badge under Printer State in Printer Management. This will only show if you Host is online to avoid in correctly alerting you if OctoPrint is shutdown. You can investigate these on the printer settings modal.
    - Current OctoPrint user is now displayed in "Printer Settings"
    - Printer Control now lists AUTO in printer Port options.
    - System -> Client Settings -> Dashboard has a new Dashboard Control, will allow for on the fly moving and resizing of your dashboard panels.
    - New Printer Manager buttons:
        - Printer Logs: Will show a full log of connections/errors/temperature relating to your OctoPrint instance.
            - OctoFarm: Shows OctoFarm connection attempts
            - OctoPrint Errors: Shows OctoPrint usb terminal errors
            - OctoPrint Logs: Shows a tabled list of OctoPrinters octoprint.logs file
            - OctoPrint Plugin Logs: Shows the output received from OctoPrints events for plugins. Only what is written to stout, call, message and sterr.
            - Printer Temperature: Historical view of printer temperature - Keeps a max of 100,000 records and then will drop the previous in the database.
    - "Save All" & "Delete All" button has been added to Printer Manager.
    - Quick connect button to Printer Action button.
    - New Printer Manager Section: Plugins!
        -   Install, Uninstall, Enable, Disable a bulk set of plugins on a bulk set of printers.
    - PSU Control settings are now grabbed from OctoPrint if they don't already exist in OctoFarm. To edit these going forware you will need to edit inside of OctoFarm as it won't pick up any changes made on OctoPrint after the initial scan.
    - OctoFarm now detects the OctoPi verion and Pi model you are using and displays this information in the "Printer Manager" section.
    - OctoFarm now checks for OctoPrint/Plugin updates on a initial scan and re-scan. 
        - New UI buttons for these. 
            1. Printers Manager on the list view, individual buttons for updating 1 instance. 
            2. Global buttons added to the 
    - History will now capture an image from the mjpeg stream you input into camera url can be turned off in the new History section in System.
    - History now has the ability to capture a timelapse generated by OctoPrint. This currently only works with the mp4 output due to browser limitations. 
        - There are 3 settings now on System -> History for this. OnCompletion, OnFailure and Delete After.
    - Added initial support for OctoPrint 1.5.0 Resend statistics. Currently is captured on history and shown in the printer control view.
    - Added back in the view filters for Panel,List, Control.
    - Alerts can now send through OctoFarms History ID on capture of a Failed,Error,Successful print trigger.
    - InfluxDB Export: You can find setup instructions/information in System -> Server -> InfluxDB Export.  
         - exports the following information:
               - Printers Information - All farm printer information, generated every 2000ms.
               - History Information - Every log to history is pushed to the database (not back dated), sent on history capture.
               - Filament Information - Same as history.
     - Changes to folder display in file manager:
         - Folders when created will stay ordered by creation date. Folders when sorted will be organised first at the top of the list, then files afterwards. There's only folder name information available to sorting for those so for now will stick to name based for all folders. This will be actioned when a page load happens, or the sorting is updated. New folders will not be sorted until that trigger. It follows the A->Z, Z->A ordering of the sorting options now too.

### Changed
    - Added additional CSS classes to buttons for theming. Applies to actions buttons only, status colours the same. 
    - Removed Printer URL/Camera URL/API Key from displaying on Printer Manager and moved onto "Printer Settings" modal. 
    - Allowed Printer Settings Modal to be opened whilst offline. Disables any settings relevant/requiring OctoPrint connection.
    - Export printer json now in human readable format
    - History now captures printer ID. Any matches going forward will attempt the ID match and then fallback to name as before.
    - Printer scanning client display greatly improved. Now displays updated host state whilst stuff is going on in the background on the server.
    - Combined the Views settings into one tab. All views react now to the same settings for displaying Current Operations, Offline/Disconnected Printer. Note: More customise options coming in a later version.
    - Updated Printer Manager functions: 
        - Delete, now brings a selection box with printer status.
        - Edit, Brings a inline edit box up. Will only update changed printers as before.
    - Split the Actions header in Printer Manager to "Manage", "Actions"
        - Actions will all be available on views and will contain "Printer Control", "OctoPrint Web", "Resync" and "Power" if setup.
        - Manage will contain "Printer Settings" and some new options detailed in #Added.
    - Made tweaks to the client side SSE implementation. Should help lockouts and button presses on less powerful client devices. (tested and seen improvements to my own small tablet)
        - UI alert when SSE fails. 
        - Retry the connection if error/closed unexpectedly.    
    - Changed the Power button poll rate to 5 seconds.
    - Changed server check poll rate to 2.5 seconds.   
    - pm2 logs are now flushed before starting application, now only captures errors as my logs cover the rest.
    - File Manager link no longer hidden on mobile views.
    - Changed the time displays for all views, now follows unified format. Applied currently on Panel/List/Camera. 
    - Camera view now hides print information (times / tools) until hovering over. 
    - History page now displays an image slider when loading the "edit/view" box. You can cycle through the thumbnails from your slicer if you use that plugin, or the captured image of the finished print taken from your webcam.
    - Added the option for websockets to follow 301 redirects. Should help with 301 errors. 
    - Camera view now opens overlay with fullscreen. 
    - Tweaks have been made to the websocket connection system. Should better recover from errors and state if user action required.

### Fixed
    - Fixed issue with File Manager not loading if printer in index 0 was offline.
    - Fixed issue with editing printers throwing error trying to update old printer status.
    - Correctly named "Remember Me" setting
    - Stopped OctoFarm creating and displaying duplicate terminal information.
    - Issue with server requiring a restart to pull in setting information.
    - Docker error when booting regarding cd directory not existing. 
    - Weird issue with client server check locking up screen.
    - Fixed some audit issues, rest are development dependancies and can be ignored
    - Fixed error logs not saving correctly...
    - Printer Control now correctly allows port/baud/profile selections when printer is in "Error!" state.
    - Printer Control no longer throws an error and locks the screen if a bad connection attempt is made.
    - Fixed Panel and List views not displaying time remaining correctly.
    - Fixed issue with Printers Nuke not working.
    - Fixed multiple client connections causing doubling of data sent to client.
    - Fixed bubbling caused by user navigating away from client screen. Client now checks if screen is active, closes the server connection if not.
    - Fixed Re-Sync notification only appearing after actioned.. now persists whilst farm re-sync is going on.
    - Various client issues, full re-factor or Panel/List/Camera. Should be snappier!
    - Fixed issue with history deleting record regardless of yes/no answer. 
    - Fixed issue with environmental data graph loading categories that don't exist.
    - Fixed the camera fullscreen issue not respecting rotation.
    - Fixed an issue with Error Alerts failing to trigger.

## Removed
    - Removed the annoying content editable fields on "Printer Settings" and "Printer Management" and replaced with standard input boxes. 
    - Removed support for the old import scheme. Now requires to be in human readable format. Please create a new export if you used the older one previously.

## [v1.1.5.7]

### Added
    - Formalised the data json layout for Environmental Data collection same POST endpoint as before. Must send null values for anything not used: 
            {
                temperature: value (°C),
                humidity: value (%),
                iaq: value (KOhms),
                pressure: value (Pa)
                date: value
            }.
    - Configurable dashboard. Allows the elements to be hidden/removed in System -> Client Settings -> Dashboard. You can also re-arrange your elements as well as re-size them to suit your needs.
    - Initial very basic support for Klipper Plugin, OctoFarm will now grab Klippers version information and display it under OctoPrints on the printer management.
    - Added server side check for CORS activation. UI on printer manager will react...
    - New Dashboard settings in System -> Client. Shows saved grid, and allows for adding/removing elements and clearing positions/sizes.
    - Added new printer manager section called "Connection Log". Just a ticker with recent API calls for now, errors will show up here and you can investigate in the printer settings.
    - New file manager sorting library. All previous defaults will no longer work, defaults to lastest files first. 
    - If available last Indoor Air Quality value will be displayed. 
    - Indoor Air Quality value updated to follow bosch range. 0 - 500 from Excellent air quality to Extremely Polluted.
    - Ability to upload a file to replace the background. System -> Client.
    - Remember me select box on login page, currently will remember your session for 30 days. Does not persist an OctoFarm reboot. More configuration options to be added.
    - Updated custom NPM commands for OctoFarm: 
        - "npm start" - Runs OctoFarm service, will now automatically run npm install so this step is no longer required.
        - "npm stop" - Stops OctoFarm service.
        - "npm startup" - Generates system startup script so OctoFarm is persistent. You will need to copy and paste the output command into your terminal to activate this. Then use the below script to save the configuration. Same as "pm2 startup"
        - "npm saveStartup" - Saves the current configuration generated from "npm startup". Same as "pm2 save" 
    - New section in "System Settings" called "Database". Currently displays the db URL and also allows some basic deleting (tactical nuke) of a database.
    - New Printer selection modal, this is currently for Multi-Upload in files manager but will eventually be used in the rest of the UI.
   
### Changed
    - OctoFarm now reacts to the enabled camera setting on OctoPrint. If you don't use camera's it is best to disable them here. 
    - OctoFarm will now only respond to a max screen size of 2000px. Anything above this will be limited from stretching to the full horizontal width.
    - Fixed issue #102 - UI Redraw causing missed clicks. 
    - Moved Logs above About on System Side bar. 
    - Files no longer "a" element, can't be clicked anymore. Was confusing, suggested an action.
    - Implemented new file sorting function. Settings default to name, and will save per client in local storage.
    - File path now shows on hover if available in History table.
    - Tweaks to SSE browser cache, should force re-update of data rather than blasting the client with a lot of data as it caught up... (Testing and feedback would be awesome)
    - Client side images/javascript/css is now minified and generates a source map properly for all dependancies. This should improve load times, and increase browser support going forward. These are pre-built for the client, so no action required on a users part. 

### Fixed
    - Fixed file path showing on file selection instead of file name
    - Fixed Paused print not allowing cancel on Panel view.
    - Issue with session not been read when accessing site. Should save uneccassary logins. NOTE: These do not persist a OctoFarm restart.
    - Fixed issue with Printer Name filter not working with special characters on history
    - Fixed issue with file name filter not working with special characters on history
    - Fixed issue with file manager sorting not allowing update within folders.
    - Fixed issue with new files not showing above folder. Sorting/re-loading page will re-organise. 
    - Fixed issue with filament manager failing system file import on server start
    - Fixed issue # 108 reliance on storage key was causing UI to lock up, and system wasn't re-scanning if didn't exist.
    - Fixed issue with file manager not removing file.
    
## Removed
    - Client side sorting library for printers - Not added back yet due to been a little more complex than first anticipated. 
    - Client side sorting library for files.
    - Ability to set a URL as background. See Added section.
    

## [v1.1.5.6]

### Added
    - File Manager now displays the success/failure/last stats from OctoPrint
    - New API Endpoint for collecting enviromental data. Expected the following JSON format: {temperature: value (°C), humidity:value (%), gas_resistance: value (KOhms), date: value}. Null values are required when no data present. (MongoDB is NOT a time series database, this is capped at 90000 records... )
    - Dashboard will now show envriomental history... currently shows hard coded last 4000 records. From your data you will get a Temperature and Humidity Graph and also an IAQ Score (if you supply gas_resistance, not all sensors read this data.). If you use the BME680 find out more here: https://ae-bst.resource.bosch.com/media/_tech/media/datasheets/BST-BME680-DS001.pdf 


### Changed
    - history will now update the file after it's generated. History is generated 10 seconds after a print. 
 

### Fixed
    - Printer Settings Dropdown not working.
    - Printer Control Dropdown selecting old value.
    - Fix Retract not working in Printer Control.
    - File loaded undefined and didn't really show what was going on... 
    - File re-resync button actually refreshes a single file information now not the whole lot. 
   

## [v1.1.5.6 - RC2]

### Added
    - Added version output to console log.
    - WOL Support: Wake on Lan for clients now supported. In your Printers power settings you will have a new option to enable Wake on lan. Enabling puts a new "Wake Host" Option in the normal power dropdown.
    - Message to websocket icon regarding use of global api key.
    - History now shows Print Time in red formatted as {hours}:{minutes}:{seconds} underneith the original format.
    - Added a true server alive check. Client now polls this whilst active and throws a modal up when connection lost. Will reload the page automatically (manual also) when connection restored. 
  
### Changed
    - Make a note of the plugin/settings hash
    - Adding a printer will now show Printer State as "Awaiting WebSocket" until the websocket updates the printers status.
    - File list is now stored in database to save re-scanning on server load.
    - Added timeout to file scanning, will only try to update 4 times then await users resync for information.
    - Thumbnails are now stored with history in /images/historyCollection/thumbs. The /images folder will need mounting to docker to make this persistent if you want to use this feature. 

### Fixed
    - Fixed Add Printer table not clearing correctly.
    - Fixed connection to OctoPrint for release of 1.4.1. Caveat, can no longer use global API key. Fixed #85 & #89
    - Fixed issue with print time acuracy calculation in history.
    - Fixed issue with history showing incorrect cost per hour
    - Fixed camera rotation on views.
    - Fixed not grabbing name from OctoPrint.
    - Fixed filament Manager loading with 0 spools.
    - Fixed issue with changing filament dropdown on filemanager selecting printer instead.
    - Fixed duplicate listener issue when uploading new files.
    - Fixed Printer Control Dropdown not updating on modal load.
    - Fixed Printer Settings not showing Printer Selection dropdown.
    - Fixed issue of temps colours not showing on camera view.
    - Fixed stats on history not showing correctly
    - Fixed filament manager stats not fixing correctly
        
### Removed
   

## [v1.1.5.6 - RC1]

### Added
    - Power button now asks for confirmation when switching off
    - Seperate smaller width table for adding printers. Should help with adding printers on a smaller screen laptop. 
    - Thumbnail to history view modal. Captures and stores it on the webserver. 
    - Added percent bar for Status on History Filters. Will show total failed/success/cancelled percentages on filtered results. 
    - Added hover information to file actions on file list
    - New Monilithic docker builds, builds with MongoDB included.
    - Printer Control now supports multiple tools
    - Printer Control now shows "Updated" status for tools. Shows the last time the temperature was grabbed.
    - History now displays multiple tool information if it was collected in the record. All successful prints will contain this information. 
    - pm2 now outputs full process logs into log folder. 
    - Printer Control now has web and power buttons. 
    - Printers Manager now shows status for the 6 checks an OctoPrint client will go through. API, File, State, Profile, Settings and System. Red shows not yet scanned and green shows scanned. 
    - Added filters to Terminal output on Printer Control. Same as OctoPrint currently: temp,sd,wait
    - Terminal output is now colour coded: temp - yellow, sd - grey, wait - red.
    - Filament manager plugin can now be resynced from the filament manager screen.
    - History now calculates print cost per hour for each print.
    - History statistics now show average cost per hour in the history filters sections
    - New patreon members lactose, scott and jose. Big thanks for your support!
    - Views now display "Tool #" next to filament if already displayed on the view. 
    - Panel & list view now displays individual tool numbers and temps associated, bed and chamber will also be shown if enabled.
    - Camera view will tally your tool numbers temperatures, so all tool# designations are tallied to Tool and Bed and Chamber designations get tallied into Bed.
    - Added progress bar to list view extra information.
    - Current operations now displays current file
    
### Changed
    - Moved the file manager management buttons outside of the Printers and Files list. This keeps them at the top whilst scrolling inside your files. 
    - Thumbnails if available are now captured when logging history for any file. They will be saved per file in the client images folder.
    - Panel view now shows file thumbnail if available and no camera is set.
    - Printer Control window now shows file thumbnail if available on selected job.
    - State runner now updates octoprint job information with the selected thumbnail and filament length so this information can be used on the client.
    - Started counting individual printer error/cancelled/success ratio
    - Re-configured the printer control view:
        - Moved all the elements into new positions. Hopefully this brings more focus on what's used all the time, and it also allows for upcoming modifications to see extra tools/chamber temperatures. 
        - Converted Terminal input to multi-line input
    - File List now shows actions buttons as bar across bottom of file.
    - database configuration now defaults to localhost address for db uri.
    - The File list now shows Filament Cost and Printer Cost seperate. 
        - Filament Cost requires a filament to be selected to generate. Re-Sync to update.  
        - Printer Cost requires your printer costs been filled in in Printer Settings and also requires an expected time to be generated. 
    - Client now uses service workers for information retrieval. 
    - History information now generated on server side then sent to the client, should improve loading times. 
    - Filament information now generated on server side then sent to the client, should improve loading times. 
    - Printer Control improvements, now shows loading spinner when loading/switching to a different print. Speeds should be slightly improved``
        - Printer Control now live reloads filament/file changes. Shouldn't need to re-sync nearly as much manually. 
        - First re-sync will happen after 1000ms, trigger by file upload/filament change. Second re-sync on file upload first after 10000ms, this isn't always enough for OctoPrint to generate file meta so manual re-sync maybe required after this.
    - Printer Management buttons have been moved to a card body. 
    - Docker no longer installs & updates node_modules on start if the folder exists.
    - Camera's on OctoFarm now respect the camera enabled setting within OctoPrint. If disabled it will attempt to display the currently selected files thumbnail, failing both the cameraurl and thumbnail url will not load the camera block.
    - Filament selection has been combined into the Tools header for list view. 
    
### Fixed
    - Fix file manager bug with default date sorting.
    - Fixed styling issue with the filters and sorting dropdowns on views making the bar bigger.
    - Printer Settings didn't apply new content editable css to fields.
    - Fixed issue with websockets not been gracefully closed. Should help with double alerts/history notifications after editing/changing a printer meta.
    - Fixed Panel view sorting not returning to index.
    - Fixed issue with sorting breaking fullscreen elements
    - Fixed bug with filament manager not turning off editable styling
    - Fixed issue with profiles not saving on filemant manager
    - Fixed bug with file manager resetting page scroll when entering folder/choosing printer
    - Server reboot has a notification and no longer needs page to re-load. Live updating. 
    - Improved loading times on history with pre-calculating the list values server side. 
    - Filament manager failed on re-syncing due to changes when adding spools/profiles. 
    - Speed improvements with new backend pre-calculation. All information should be prepared ready for client access before access. 
    - Fixed #77 - Farm Utilisation not calculated correctly.
    - Filament Manager plugin tweaks: Fixed #73 and #74
        - Filament Manager now keeps up to date when filament is down dated. It will re-sync your filament library after a print.
        - Improved log output and it's own file. 
        - Server start fires a re-sync to make sure no changes are missed.
        - Caveat: OctoFarm doesn't know when you change a filament on OctoPrint, any changes you make there for filament, you will need to tell OctoFarm with a Re-Sync/Spool selection.
    - Fixed #79 - Duplicate historical entries due to multiple listeners getting assigned on printer edit/delete.
    - Fixed some dependancy security issues and updated node modules. Please make sure to run npm install / npm update if you've already installed node_modules. 
    
### Removed
    - History may not now show your selected spool for old records with no job information caught. This is mainly going to be cancelled/failed prints as there is no information caught or prints that start and finish before OctoPrint can generate the job information. OctoFarm now relies on the tool# information provided in this for captured histories to render spool information correctly.     
    
## [Released]

## [v1.1.5.5]

### Added
    - New sorting function for Camera, Panel and List view's. You can now filter by Idle, Active, Disconnected and Complete states and your available groups
    - You can now choose the sorting for the view too by Index, Progress and Time.
    - Added support for PrusaSlicer Thumbnail and Ultimaker Format Package Thumbnail plugins. 
        - Usual OctoFarm standard applies, if you've just uploaded you need to re-sync to generate the thumbnail with the rest of the meta. 

### Changed
    - Error's are now captured as a full log set. To be displayed in UI at a later date.
    - History.js is non-destructive to filament

### Removed
    - Old sorting functions

### Deprecated

### Fixed
    - Fixed Printer Manager page name
    - Fixed issue with error message not displaying in hover
    - Fixed Alerts Trigger column not been wide enough to display alert.
    - Fixed Alerts section of printer settings not showing Trigger selection


## [v1.1.5.4]

### Added
    - Seperated out process/system uptimes on server settings

### Fixed
    - Fixed issue with heating trigger not working with floats
    - Fixed issue with Power settings not sending correct command

## [v1.1.5.3]

### Changed
    - Changed message for websocket returning to Alive and Receiving data

### Fixed
    - Websockets terminated correctly when changes are made to edits and farm updates.
    - Fixed filament manager setting not been respected
    - Fixed issue with multiple histories been logged due to websocket termination

## [v1.1.5.2]

### Fixed
    - Alerts manager didn't allow saving of new alerts

## [v1.1.5.1]

### Fixed
    - Fixed issue with history stalling on loading old database entries.
    - Fixed issue with editing printers not correctly clearing out the old ones.

### Security

## [v1.1.5]
 - Notable changes only: to see exact changelog please look at DEVELOPMENT below. 

 - New Dashboard
 - New Printer Management screen
 - Statistics/filters added to most pages
 - Improved octoprint monitor with speration between OctoPrint Host, OctoPrint Server and Websocket connection
 - Filament Manager complete re-design
    - Caveat: Old filament manager database no longer works
 - Overhauled history with information from filament manager and new printer settings i.e. cost. 
 - New Printer settings panel
 - New Printer control panel
 - PSUControl and other power plugin support
 - New Alerts system with ability to fire custom system script.


## [DEVELOPMENTS]

## [v1.1.4.9-dev-4.4]

### Added
    - History Page:
        - File Name Search
        - Path Filter
        - Spool Name Search
    - Filament Manager: 
        - Pagination added to Spools and Profile lists
        - Default sort option for spools
        - Material Filter for Spools
        - Spool Search
        - Statistics bar at the top
            - Used / Remaining Progress Bar
            - Counts for profiles and spools
            - Total Weight/Used/Price
            - Material Breakdowns for Weight/Used/Price
    - File Manager: 
        - Has basic statistics: File/Folder Counts, Largest Smallest and Average Size/Length
        - Displays current printer state
        - Printer list now has a filter for Active,Idle and Disconnected printers
        - Can now select filament from file manager.
            - Change filament and re-sync to update costs.
    - Alerts: This alerts are fired on a specified trigger and run a custom script with a single command passed through
        - Select Triggers: Print Done, Print Failed, Print Errors, Cool Down, Print Paused
        - Custom Script Location
        - Save new script
        - Delete old scripts
        - Edit scripts
    - Printer Settings 
        - Now shows all the current alerts applied to that specific printer
    - List view Extra Info now includes percent remaining. 
    - Printer errors are now logged to a seperate database. 
    - New dependancy for nano events
    
### Changed
    - Moved filament manager plugin sync to server settings under Filament Manager Settings. 
    - New Filament Setting: Check if filament selected and warn to add one before starting a print. Default: False.
    - Filament Manager allows selection when printer active IF filament Manager plugin is not linked.
    - History now asks if your sure on deletions...
    - Server settings now only prompts to restart when changing setting that requires restart
    - OctoFarm now rescans the client when updating throttle settings.
    - Temps now all read from unified temperature file, should keep consistency across the board. 
    - Temps are now applied independant of state. Each state has some triggers:
        - Active: Will display orange if temperature drifts out of heating variation settings
        - Complete: Will show blue when fully cooled down
        - Everything else: Will update temperature if figure available.

### Removed

### Fixed
    - Fixed broken printer settings modal
    - File Manager file action buttons on new line
    - Broken total percent in filament manager
    - Broken action buttons on views
    - Indefinate counter on ETA
    - Fixed issue with filamentCheck not getting applied with no setting.
    - Fixed firefox not added editable text boxes in
    - Fixed sticky tables on history
    - Added sticky table to printer management
    

## [v1.1.4.9-dev-3.9]

### Added
    - Farm Utilisation chart on dashboard now calculates Failed Hours. These are the hours totaled registered from history that are set as success = false;
    - Idle hours is now black on the farm unitlisation key, red for failed and active is green.
    - Keys and bar charts added to the Cumulative/Average times on the dashboard
    - Keys added to the Printer Status, Printer Progress, Printer Temps and Printer Utilisation heat charts on dashboard.
    - Current Operations View. Displays full screen the current operations bar. 
    - Panel, List and Camera View all react to groups now. When loading a page it will always default to "All Printers", any modification with the drop down will append a URL to the page. This URL can be re-used as a book mark to automatically load a group. 
    - History page now has metrics.
    - Can now select and save filament changes in history.
    - Server Settings re-activated with the following:
        - Shows server Status here instead of dashboard.
        - Lists current log files and allows for download.
        - Server settings
        - Server timeout settings
    - When saving settings it now asks if you'd like to restart OctoFarm. Confirm will restart the service. 
    - Client settings to show extra information on views. List, Panel and Camera View
    - File manager shows weight when length is calculated. Defaults to 1.24 density with 1.75mm filament.
    - History button to set default sort function button and pagination. Remembers previously set values on client. 
    - File Manager now has sort capabilities. File Name, Print Time, Upload Date.
    - New Printer settings modal. Connection Defaults, Profile Changes, Power Button actions, Gcode Script and Other Settings (Camera / Heating Triggers)
    - History now has filter dropdowns for File Name, Printer Name, Filament Type. 
    - Activated the restart/shutdown host and octoprint buttons
    - Added checks for power state if enabled. Will check every 20 seconds for a state change unless powered off/on/toggled through the UI.
    - Added buttons to activate the settings for power control. You will only see options for which you have setup.
        - Drop down will show "Power On/Off" 
        - As above it will check every 20 seconds for a state change, unless you action power toggle/on/off. 
        - Main power button will toggle the current state.
        - The Main power button will show the following colours:
            - black - No status could be found.
            - red - Printer is turned off.
            - green - Printer is turned on.
    - Filters on history table also now show totals of everything filtered, ignoring pagination.
    - Printer Cost settings calculation
        - Default values added on printer init. 
        - Enter in your printers Power Consumption, kilowat price, purchase price, esitmated life span, maintenance costs
        - Will be calculated on history grab. 
        - Due to cost settings been captured on history grab no backwards compatablility. Have added ability to "Update Cost" settings, if printer doesn't exist in database anymore then a default set of values will be used.
        - History statistic totals now include Total Printer Cost/Highest Printer Cost
        - History filter totals now show printer cost total and combined total.
    - Added drag and drop to all views and printer control panel
        - Currently when you drag a file and hover over a printer/file list you will get a darkened box, dropping your file here will initiate the upload. 
        - If you only have a single file it will ask if you would like to print the file.
        - If you are on Printer Control/File Manager it will choose the current folder to upload too.
        
### Changed
    - Group dropdown only appears if groups exist.
    - Renamed the views removing the "Views" Tag. Added in placeholders on hover to describe function.
    - Filament manager now get's its own page (caveat, full redesign so no longer works with old database, history will show but will not recognise a filament. Editing ability to select the spool as been enabled if you'd like to update them.)
        - New support for the filament manager plugin, press the sync button at the bottom of the filament page to activate. You will require this to automagically track filament usage on your spools.
        - Will now track costs if available. 
        - Can also apply temperature offsets with these, whatever is entered -/+ into the offset field will now be applied at the start of a print.
    - Reduced the width of printer manager, allowing for click close outside of the modal window.
    - History page now loads latest first as default.
    - Removed underscores from history page. 
    - History page will only load now with history added. Message to collect some before activation pops up. 
    - Job information is now captured within history for cancelled prints. May use in UI at a later date. 
    - If filament exists in library then ask if you'd like to select before print. 
    - History now captures information and waits 10 seconds before triggering the collection. This is for filament manager sync to collect the latest values before proceding. 
    - Power Settings and Alerts are now saved in database
    
### Removed
    - Old filament manager and database structure. 
    - Removed serverConfig file, now stored in the database and edited through the UI. 
    - Removed file statistic from dashboard
    - Remove old sort function from History

### Fixed
    - Fixed Panel view file name been stuck in loading...
    - Printer control not correctly displaying step rate.
    - Fixed issue with list view not updating list colour on state change.
    - Fixed issue with history index sort requiring two clicks.
    - Filament calculation now correctly applies to power of.
    - Fixed annoying pop-up with no printers.
    - Fixed groups not hiding when none availabe.
    - Fixed errant blank group showing.
    - Cancelled prints not grabbing name of printer
    - History collection creates unique ID based on the last captured print index, rather than the history length.
    - Fixed issue with selected filament getting overwritten when passing to history.
    - Fixed weight calculation been unusually high.
    - Fix for jobs not been captured
    - Fixed issue with filament manager not adding filaments due to 0.00 on temp offset.
    - Not collecting history if there was none.
    - Fixed issue with ping pong incorrectly fireing for mid-connection websockets
    - Fixed history index not sequencially counting if multiple entries collected at same time.
    - Fixed issue where filament would update on List/Panel view when changes/history captured.
    - Dropdowns for power appearing off page.
    - Fixed power dropdowns showing under cam headings/panel
    - Typo's in client settings
    - Timeout with large file sets

## [v1.1.4.9-dev-2.7]

### Added
    - Printer Control Manager now allows for switching of printers on the fly from the modal. No need to close and re-open. 
    - Historical collection for Farm Statistics, now gathers up to 1 hours of live data. (Temperature). Resets on server restart. 
    - Added loading status to all dashboard graphs and data. 
    - Activity heatmap for the last 7 days - Calculates a percentage of activity per printers in that state for the whole day, calculation will happen all day then save the final days value. 
    - Added check for if printers exist on dashboard load, note tells you to add some.
    - Added new Patreon member EIPS to About page. 
    - Tool tip explanations for states on Printers Page. Host, Printer and Websockets. 
    - New state when printer fresh on the farm, "Setting Up" Whilst awaiting for scanner to finish with other printers. Hits searching state straight after.
    - Tool tip explanations for dashboard Action buttons, and Printer Management setup buttons, camera view, panel view and list view and current operations.
    - Any table headers are now clickable and can be sorted by the text below. This includes, Printer Management, Filament List, List View, History. Hovering will display a sort icon to indicate can be sorted.
    - Sort Index is now viewable on Printer List, will auto update after moving a printer into a new sort index.
    - Note to README regarding thanks to JetBrains for use of their IDE.
    - New dependancy "requests" Required for API calls to user endpoints. 
    - New heat type graphs, Printer Status, Printer Progress, Printer Temps, Printer Utilisation. - Will be adding a key in next version. 
    - Farm Utilisation back and updates live with active printers. 
    - Current Status bar graph. 
    - Current Utilisation graph. 
    
### Changed
    - Printer web button does not disable when offline
    - Printer re-sync now detroys any established connection and re-sets up the specific printer fresh regardless of state..
    - Uploads done on the Printer Control modal are now not dependant on the status you can check the status by viewing the printer. A complete notification will be done whe the file has been uploaded. 
    - Current upload count no longer uses the +/- mechanism, it counts the uploads and displays the current amount found.
    - New farm status graphs for Temp. Shows Actual and Targets for global tool and bed temperatures with a status at top for total farm temperature. 
    - Dashboard printer list now moved to it's own page Printers. 
    - Printer list has changed to scroll with page. The full list is loaded rather than constraining to a specific height. 
    - View pages no longer inside dropdown
    - Editing printers only re-scans the currently edited set. 
    - Path now shows on hover in printer manager & list view. Panel and Camera will take some time due to wrappers overlaying the tag...
    - History now shows view icon instead of edit for captured prints, Notes are still editable.
    - Changed up the farm Status styling to more match inline with OctoFarm colours
    - All views inc... Printer Control now truncate names to not overflow, add "..." to the end of the string to state it has been truncated. 
    - All views inc... Printer Control now display the full path when hovering over file name.
    - Re-Sync does a full sync of octoprint again. 
    
### Removed
    - Pointless space wasting footers on dashboard
    - CPU Stats from main page. 

### Fixed
    - Printer Camera in printer mananger now displays correct placeholder when no URL detected. Placeholder updated for new URL system. 
    - Added in websocket Ping/Pong which will fire every 30 seconds to check the connection is still alive
    - Fixed annoying browser console output warning of multiple similar id's
    - Fixed saying "Done" when 0 seconds was detected.
    - Fixed issue with history not grabbing relevant job information due to OctoPrint sending null information when prints started without the gcode calculation running. Added checks for progress and currentZ too. 
    - Fixed issue with startup trying to grab currentOp/statistics too fast causing errors. 
    - Fixed logs not been deleted
    - Fixed circular structure errors with moving over to Flatted library for JSON stringify/parse.
    - Fixed overly long filenames causing wrapping issue on Camera View
    - List view not respecting word wrapping for file name
    - Fixed gap in top of list view header when scrolled
    - Fixed error with history page not displaying job information on view
    - Fixed incorrect re-direct to login/registration pages when either is disbaled. Login disabled will re-direct straight to the dashboard now. 
    - Fixed issues with pages loading with no printers. 
    
## [v1.1.4.9-dev-1]

### Added
    - New Node dependancy's, make sure to run "npm install" & "npm update"
        - pm2: Now takes over daemonising your server. Should work cross platform, and allows for server restarts to be done from the GUI. 
            - Log's are still output to the log folder but you can use the following commands to control your installation:
                - pm2 stop OctoFarm: Stops the running OctoFarm service. 
                - pm2 restart OctoFarm: Restarts the running OctoFarm service. 
        - exec: Used for executing the pm2 scripts for restarting OctoFarm server. 
    - Much improved logging for all areas. Now creates new log files as follows:
        - OctoFarm-Server.log: Server errors and information
        - OctoFarm-State.log: Printer logging for state collection...
        - OctoFarm-API.log: Logs all actions made from the client -> OctoFarm.
        - OctoFarm-HistoryCollection.log: Logs all attempts at adding prints to history. 
    - Disonnected state is now counted and shown in Current Operations overview.
    - Terminal input can now be pressed with enter key
    - Terminal input now auto capitalises all inputs.
    - Printer Management now allows editing printers already on the farm. Turn on edit mode on the dashboard.
    - File manager now list upload date next to print time.
    - File manager now has an upload and print option.    
    - Current Operations has a new button "Restart Print" Shows up when print is complete allowing you to quickly restart that specific print. 
    - Views now have a cooldown colour change on the temperature icons. When under a specified limit the icon will go blue indicating the tool/bed is now cool.
    - All views now have 3 buttons, Printer Control, Web View (OctoPrint interface) and Power Control.
    
### Changed
    - Dashboard has had a re-vamp.
        - Printers are now added inline. Clicking "+ Add Printer" will pop up a box to the top of your printer list. Deleting it can be removed, and saving the printer it will be added to a new row on the list and start off a scan. A notification will be generated after a connection attempt. 
    - Closed is now renamed to Disconnected. This is when your USB port is not connected to OctoPrint. 
    - Server Settings only accessible by Administrator.
    - Filament moved from System Menu to the navigation bar. 
    - Switched over to new platform for feature requests: https://features.octofarm.net
    - Split the Printer states for the dashboard to make it clearer. There is now the following: 
        - WebSocket: 
            - Green: connected.
            - Yellow: Live but not receiving data. This is usually due to your printer been disconnected from OctoPrint when added as no data is transmitted from OctoPrint. 
            - Red: not connected.
        - Host State:
            - Online: Host connection active
            - Shutdown: Cannot connect to host
        - Printer State: 
            - Disconnected: Printer not connected to OctoPrint.
            - No-API: Failed to grab API status, usually due to CORS if Host State = Online.
            - The usual OctoPrint states: Idle, Printing, Cancelling, Error, Paused, Pausing
    - Full file manager added to Printer Control pop-up.
    - Printer Manager now split (Old Setting Cog):
        - Printer Control (Printer Icon): Connection and Printer Control inc... file manager. 
            - File selection here now has the majority of the File Manager functionality for a single printer. 
        - Printer Settings (Cog Icon): Anything that's a 1 time settings, so Settings, Alerts, Power and Gcode Scripts
        - Printer Power (Power Icon): Will open the power menu for shutdown, restart, reboot and custom buttons setup in the Printer Settings Modal.
    - Split the information generation for Server -> Client comminication, will save some CPU on serverside and client side... 
    - If printer name not available will default to IP. 
    - Converted to using a full URL string for printer connection... 
        - If you already have port:ip set in the database this will be automagically converted for you. It will default to http:// when creating the new field. 
        - Anyone adding and setting up new printers will have to use the full URL string now. If you leave http:// out it will automatically add that in as default. 
    - Camera URL is similar to above, it will automagically add in the http:// for you if you have previous items in the database, you may also specify your own connection string with https://.
    - Temperature values no longer use the external buttons on the input. This is now a number field and uses the original HTML up and down arrows that appear on focus.
    - Export printers now exports with the following tags: Printer Name, Printer Group, Printer URL, Camera URL and API Key
    - Import printers no longer deletes all old printers to import new ones. The new printers are added to your existing list. 
    - Completed Prints are now triggered by percent complete rather than Print time left as it seems prints can get left with time left when actually completed.
    - Moved all detailed instructions to the WIKI page, and removed from README.md.
    - Views progress bars now display colours to corrospond with state. Yellow = Currently printing, Green = Complete. 
    - Camera View now displays text on the print and cancel buttons. 
    - File manager brought inline with the printer manager version after update.
    
### Removed
    - Printer Management, see changed regarding dashboard. 
    - History and file statistics from Dashboard.
    - Removed systemInfo from database, extra uneeded steps as data is all gathered live anyway. 

### Fixed
    - Long server starts due to second information grab. Now runs in the background to not effect start up.
    - Fixed issues with throttle and server re-start checking printers whom the hosts are not online. 
    - Fixed issue with multiple connected clients causing bubbling when grabbing information from the server. 
    - Fixed issue with JSON Stringify error and clients receiving duff data due to it. 
    - Fixed file manager single file refresh.
    - Fixed and issue with folders not allowing entry when created inside a path. 
    - Fixed issue with newly created folder not recognising new file till refresh.
    - Fixed issue with newly created files not moving to folders until refresh.
    - Fixed issue with Camera view reacting to Panel view Hide Disconnected Setting.
    - Fixed spacing icon on temperature displays
    - Fixed views not updating temperature for complete/idle printers.
    - Fixed cameras not applying multiple rotate settings

## [v1.1.4-6-bugfix]

### Added 

 - Added back in the re-sync all button. This will fire off the same re-sync command as the printer one but for all printers. 
 - Websockets connections are now indicated separately to Printer Status. The Printer Icon on the dashboard will show this status. 
    - Green = Currently connected
    - Yellow = Attempting a connection
    - Red = Disconnected.  
 - State now grabs an Error and displays on the printer status label if one occurs until rectified. 
 - Show printer index on printer with no name
 - Current Operations Card on view's now displays the predicted end date and time, calculated from the current date + print time remaining.
 - More Checks into the API/Websocket connection... if it fails to grab your API Key it will now warn you. You will see "No-API" in the state. Pressing the refresh button for your printer on dashboard will attempt a reconnect. 
 - Current Operations allows you to now de-select a file and remove it from the view. When a print is complete, you will see a "Harvest Your Print!" button, click it to remove the printer from that View.
 - Added configuration options to /serverConfig/timeout.js - This is for any printer that doesn't respond quick enough i.e the Prusa instances have shown to have this issue. Issue #26.

### Changed
 - Dashboard layout has been updated with a fixed sidebar. Medium sized screens and above will display this. 
 - Refactored mobile views for dashboard - See Deprecated.
 - Current Operations now viewable on mobile.
 - async information reception from server -> client. 
 - State should now show if Serial Error occurs on OctoPrint.
 - Shutdown printers, that have been scanned by the farm will now wait 15-seconds before trying to grab an API connection. This should help those with websockets not connecting initially.
 - History now captures and displays selected rolls of filament. No usage available from OctoPrint currently.
 - An initial API connection timeout now increases until it hit's an upper limit. So all API connections will attempt at the default of 1000ms, this will then increase to 10000ms after the first attempt hitting the upper limit and hard fail afterwards. These are configurable in serverConfig/server.js.
 
### Deprecated

 - Mobile view printer list no longer available due to dashboard changes. Will be returning in later release. 

### Fixed
 - Issue #21 - Camera View and Panel view don't respect Offline/Shutdown printer hiding.
 - Sometimes when removing printers would incorrectly try to update the state still.
 - Some offline/shutdown Printers would try ask to Re-Sync when not required due to still been offline/shutdown.
 - My git account... pushes as myself now. Hopefully...
 - Camera View Current Operations now updates with printers.
 - Fixed issue with Current Operations not clearing final finished or ended print card. 
 - Issue #22 - File Manager crashes when using Canvas Hub.
 - Docker should now correctly put logs into log folder.
 - Freshly created filament is now found and saved in the history logs. 
 - Issue #26 - File timeout issues. 
    - This issue is down to a ludicrously large amount of gcode files stored on a persons OctoPrint system. If your a gcode hoarder and having issues with your files scanning into OctoFarm you will need to play with the API connections, or do some house keeping. Anyone else you won't know any different.
    - Some numbers reported back from a user:
        - sub 200 files, was completely fine. 
        - 380 + files will nearly hit the full second api timeout which is 10 seconds...
        - 670 + files you will need to play with the system timeout I've created to get those to scan. 
    - I will be working to make improvements to this in the future where possible but for now the timeout changes will succeed and I believe it's only an edge set of users that get this effect going by reports I've had. If you do not, do not worry. 

## [v1.1.4-2-bugfix]

### Added
 - New states to OctoPrint detection... Now includes and reacts to "Searching..." + "Shutdown".
    - Searching... will be shown when OctoFarm is trying to make a connection to to OctoPrint... 
    - If the OctoPrint host is unreachable it will enter an Shutdown state... NOTE: If OctoPrint instance is added in a shutdown state, it currently get's stuck in Searching... a Re-Sync will refresh this.
    
### Changed 
 - All screens updated to respond to the changes.

### Fixed

- Fixed issue with passworded/non-passworded OctoPrint instances running on 1.4.0 not re-establishing web sockets. 
- Fixed issue with adding printers offline, not correctly re-establishing websocket connection.
- Fixed issue with Shutdown Instances, ie. the OctoPrint host been turned off, causing server crash.
- Current Operations correctly loads if all printers are added offline, no display error requiring refresh.


## [Released]

## [v1.1.4-bugfix]

### Added

- Added windows specific docker-compose example to README

### Changed

- Offline Polling is now back. System -> Server Settings to change and click save to update.
- Updated the note on the settings screen to better reflect this and it's affect. Yes I like potato's.
- Changed the whole websocket implementation to help with issue #15. NOTE: If you add your printer to the farm offline, you may still need to re-sync (dashboard re-sync button) it to get it detected by the farm. I'm working on why this is happening still. Printers added Online then going Offline do not encounter this. This is also the case for restarting the server with offline printers. 

### Removed

### Deprecated

### Fixed

- Fixed the errant " displayed on all views
- Fixed the errant . when loading offline printers.
- Fixed issue with printer's not collecting correct data issue #15 ie _default bug... Should no longer exist.
- Fixed issue with retract button not working issue #18

### Security

## [Released]

## [v1.1.4]

### Added

- Massive readme update, installation instructions will hopefully be a bit more clear now. Especially for docker!
- Closed printers are tracked better.
- Ability to change port - Setting available in serverConfig/server.js requires server restart to take effect.
- Ability to turn off login requirement - Setting available in serverConfig/server.js requires server restart to take effect.
- Ability to turn off registration pages - Setting available in serverConfig/server.js requires server restart to take effect.
  - For docker check the README.md it contains the paths you need to make persistent.
- Notes to printer manager regarding HTTP and the use of port:ip combo.
- Padded our the installation instructions on the README.md file.
- Dashboard now has the ability to refresh the printers connection/information. Good incase you encounter crashes and the websocket doesn't automatically update, or you make changes to OctoPrints settings outside of OctoFarm.
  - Pressing on an Offline printer will attempt to re-establish the lost websocket connection then update the instace from OctoPrint.
  - Pressing on an Online printer will update the instance from OctoPrint.
- New button on Printer List in Dashboard. You can drag and drop this button to re-order your printer list. This will also persist a reboot, all views respect this order.
- History list delete button is now enabled.
- History list edit button is now enabled.

### Changed

- Docker now checks for updated packages on start.
- Client will automatically reload the page in 10 seconds if connection to server is lost.
- Tables should now be somewhat responsive on smaller screens. This isn't perfect, tables aren't great for smaller screen sizes but hope this mitigates it some. Anyone with access to smaller devices (mobiles and tablets) send me your screenshots and I will try and improve further.
- Printer Database now stores: FeedRate, FlowRate, PrinterName, Custom Sort Index and filament selected.
- All monitoring views added truncate for filename. Overflows will be replaced with "..."
- Farm Utilisation Idle hours is now correctly multiplied by the total printers in the farm.
- Farm Statistics updated on a longer interval
- Updated port example to show 80 instead of 5001 which is the more common application due to most people using the Pi installation of OctoPrint.
- Printer Manager is restricted to the Admin user only. (This is the first user created).
- Get a warning when adding printers to remove http:// from IP and Camera URL.
- Printers displayed on page will respect the sortedIndex.
- added AutoComplete tags to password and username forms.
- Panel view will now display printers without a CameraURL attached.
- Camera Columns setting is now activated. You can choose from 1-6 columns per row, including 5!.

### Removed


### Deprecated

### Fixed

- Blue screen (selecting) when double clicking a camera view to enlarge.
- Fixed file manager not loading when no Active/Idle/Closed printers are present. Now requires at least 1 Active/Idle/Closed printer to open.
- Fixed Panel View action buttons not working.
- OctoFarm.net Mobile Menu fix
- Percent values correctly rounded to 1 decimal place on dashboard.
- A blank field in the cameraURL now actually pulls through your camera settings from OctoPrint.
- Cameral URL now saves to database after been updated in UI.
- Dashboard now shows printer name if available when offline.
- Statistic runners now close with printer update.
- Fixed annoying message in logs when a client connects
- Times no longer chop off multiple's of 10
- Fixed issue where filament was sometimes not collected in History.
- Fixed issue where flowRate was getting confused with feedRate. Both values are correctly applied now.
- Never online printers now correctly re-grab printer information when connection is re-established.
- Deleting a printer should not require server restart anymore. Please inform me if this is not the case, my testings suggests it's fine now.
- Fixed circular reference error with filaments
- Fixed Panel view not updating filament selection if not previously selected.
- Fixed Colour heading on Filament Type Selection.
- Fixed issue with Printer Manager locking when pressing a few action buttons.
- Printer Manager shows no camera message when none inputted.
- I've found an issue with the \_default profile on File Manager, I think there's some setup specific settings that I can't replicate. I've mitigated this with some checks, but please if your File Manager shows the warning please update issue [#15](https://github.com/NotExpectedYet/OctoFarm/issues/15) with a screen shot of your profile page so I can replicate it further here on my test boxes.
- Fixed the ability to change your background to a URL.

### Security

- Updated some packages with security vulnerabilities. Please make sure to do npm update before starting the application to update these.

## [1.1.3 - BETA :: includes 1.1.1 + 1.1.2] - 13/03/2020

### Added

- Updated to async JSON.stringify implentation to alleviate any further stringify issues.
- 2 Docker installation options:
  https://hub.docker.com/r/thetinkerdad/octofarm - Big thanks to youtuber TheTinkerDad for creating and managing this one.
  https://hub.docker.com/repository/docker/octofarm/octofarm - Thanks to user Knoker for the help and PR with this.

### Changed

- Nothing

### Removed

- Nothing

### Deprecated

- Nothing

### Fixed

- Issue #1 - Panel View wasn't respecting the Hide Closed client setting
- Issue regarding octoprint (I believe, need to test further and reproduce) missing sending temperature data for history
- Cured the memory issue by sending malformed and large objects through JSON.parse

### Securit

- Nothing

## [1.1.0 - BETA] - 12/03/2020

### Added

- Converted to server, database and client package
- Uses websocket for real time information from your octoprint instances
- Uses Server Side Events to keep the OctoFarm web client up to date with what your Server is tracking.
- History section which will
- Filament Manager to track what's on your printer and what you used on a print stored in history
- Brand new file manager with multi upload and queue features.
- Current Operations window configurable to be viewable on any of the monitoring screens as well as it's home on the dashboard.
- Login system, first user created become Admin. (for a future release).
- System information to see the current load of the server OctoFarm runs on.
- Farm Information which will show some grouped farm information about your current jobs.
- Famm Statistics which will give you a quick overview on your farm.
- Print Statistitcs which will collate the history page into some fancy metrics.
- Added Terminal output to interface.

### Changed

- Updated with a brand new Dashboard to include some of the above.
- Revamped monitoring views, all have been neatened.
- Revamped Printer manager accessible from all views: - remembering your printer connection settings - Merged control/tune/file manager tab. - As above, this is where the terminal lives.

### Removed

    - All of version 1.0... this is brand new!

### Deprecated

- Wallpaper can no longer be changed (to be fixed in future release)
- Camera view is currently locked... (to be fixed in a future release)

Nothing else from 1.0 I believe

### Fixed

- Camera rotation not sticking with double click enlarge.

## [TEMPLATE]

## [v]

### Added

### Changed

### Removed

### Deprecated

### Fixed

### Security
