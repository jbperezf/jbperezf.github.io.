document.addEventListener('DOMContentLoaded', function() {
    // File input handler
    document.getElementById('csvFile').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const fileName = file.name;
            document.getElementById('fileName').textContent = fileName;
            
            // Parse and preview CSV
            parseAndDisplayCSV(file);
        } else {
            document.getElementById('fileName').textContent = 'No file chosen';
            document.getElementById('csvPreviewContainer').style.display = 'none';
        }
    });
    
    // Generate button handler
    document.getElementById('generateButton').addEventListener('click', function() {
        const projectName = document.getElementById('projectName').value;
        const calculationType = document.getElementById('calculationType').value;
        const csvFile = document.getElementById('csvFile').files[0];
        
        if (!projectName || !calculationType || !csvFile) {
            alert('Please fill all required fields');
            return;
        }
        
        // Read the CSV file
        const reader = new FileReader();
        reader.onload = function(e) {
            const csvContent = e.target.result;
            
            // Parse CSV data to create HYD file
            generateHydFile(csvContent, projectName, calculationType);
        };
        
        reader.readAsText(csvFile);
    });
    
    // Function to parse and display CSV data
    function parseAndDisplayCSV(file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const csvData = e.target.result;
            const rows = csvData.split('\n');
            
            // Create table HTML
            let tableHTML = '<table class="csv-table">';
            
            // Parse each row
            rows.forEach((row, rowIndex) => {
                if (row.trim() === '') return; // Skip empty rows
                
                const cells = parseCSVRow(row);
                
                tableHTML += '<tr>';
                
                // Use first row as header
                if (rowIndex === 0) {
                    cells.forEach(cell => {
                        tableHTML += `<th>${cell}</th>`;
                    });
                } else {
                    cells.forEach(cell => {
                        tableHTML += `<td>${cell}</td>`;
                    });
                }
                
                tableHTML += '</tr>';
            });
            
            tableHTML += '</table>';
            
            // Display the table
            const previewContainer = document.getElementById('csvPreviewContainer');
            const preview = document.getElementById('csvPreview');
            preview.innerHTML = tableHTML;
            previewContainer.style.display = 'block';
        };
        
        reader.readAsText(file);
    }
    
    // Helper function to properly parse CSV rows (handles quoted values with commas)
    function parseCSVRow(row) {
        const result = [];
        let cell = '';
        let inQuotes = false;
        
        for (let i = 0; i < row.length; i++) {
            const char = row[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(cell);
                cell = '';
            } else {
                cell += char;
            }
        }
        
        // Add the last cell
        result.push(cell);
        
        return result;
    }

    // Convert CSV to array of objects with headers as keys
    function csvToArray(text) {
        const rows = text.split('\n');
        const headers = parseCSVRow(rows[0]);
        
        return rows.slice(1)
            .filter(row => row.trim() !== '')
            .map(row => {
                const data = parseCSVRow(row);
                return headers.reduce((obj, header, index) => {
                    obj[header.trim()] = data[index] ? data[index].trim() : '';
                    return obj;
                }, {});
            });
    }

    // Generate the HYD file based on PowerShell logic
    function generateHydFile(csvContent, projectName, calculationType) {
        // Parse CSV content into array of objects
        const csvData = csvToArray(csvContent);
        
        // Generate channel calculation blocks
        const channelCalcBlocks = csvData.map(row => createChannelCalcBlock(row));
        
        // Generate lining calculation blocks for channels with name matching the pattern
        const liningCalcBlocks = csvData
            .filter(row => row.CHANNELNAME && row.CHANNELNAME.includes('100 yr_High Slope'))
            .map(row => createLiningCalcBlock(row));
        
        // Create the combined blocks
        const allChannelCalcBlock = "CHANNELCALCBLOCK\n" + channelCalcBlocks.join("\n") + "\nENDCHANNELCALCBLOCK";
        
        let allLiningCalcBlock = "";
        if (liningCalcBlocks.length > 0) {
            allLiningCalcBlock = "LININGCALCBLOCK\n" + liningCalcBlocks.join("\n") + "\nENDLININGCALCBLOCK";
        }
        
        // Create the header
        const currentDate = new Date();
        const formattedDate = `${currentDate.getMonth() + 1} ${currentDate.getDate()} ${currentDate.getFullYear()}`;
        
        const hydFileHeader = `HYDRAULICTOOLBOXPROJECT53

UNITS                0
NUMCALCS             0
TITLE                "${projectName} - Ditches"
DESIGNER             ""
DATE                 ${formattedDate}
NOTES                "This file was generated on ${currentDate.toLocaleDateString()} using 'HydraulicToolbox Utilities' Web Application."




`;
        
        const hydFileFooter = "ENDOFFILE";
        
        // Combine all content
        const fullFileContent = [
            hydFileHeader,
            allChannelCalcBlock,
            allLiningCalcBlock,
            hydFileFooter
        ].join("\n");
        
        // Create and download the .hyd file
        const blob = new Blob([fullFileContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${projectName.replace(/\s+/g, '_')} - Ditches.hyd`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Notify the user
        alert(`HYD file created successfully: ${projectName} - Ditches.hyd`);
    }
    
    // Create a channel calculation block (equivalent to New-ChannelCalcBlock in PowerShell)
    function createChannelCalcBlock(row) {
        const channelType = row.WIDTH === '0' ? 2 : 0;
        const channelGuid = generateGuid();
        
        return `CHANNELCALC
CHANNELNAME          "${row.CHANNELNAME}"
CHANNELNOTES         "${row.CHANNELNOTES || ''}"
LATITUDE             0.000000
LONGITUDE            0.000000
CHANNELTYPE          ${channelType}
ZSCALE               0
CALCTYPE             1
FLOW                 ${row.FLOW}   
SIDESLOPE1           ${row.SIDESLOPE1}
SIDESLOPE2           ${row.SIDESLOPE2}
WIDTH                ${row.WIDTH}
DEPTH                0.000000
LONGSLOPE            ${row.LONGSLOPE}
MANNINGS             ${row.MANNINGS}
PIPEDIAMETER         0.000000
HYDRADIUS            0.000000
PERMSHEARSTRESS      1.500000
CALCMAXSHEARSTRESS   0.000000
CALCAVGSHEARSTRESS   0.000000
AREAOFFLOW           0.000000
AVEVELOCITY          0.000000
WETTEDPERIMETER      0.000000
TOPWIDTH             0.000000
FROUDE               0.000000
CRITICALDEPTH        0.000000
CRITICALTOPWIDTH     0.000000
CRITICALVELOCITY     0.000000
CRITICALSLOPE        0.000000
STABILITYFACTOR      0.000000
RISE                 0.000000
SPAN                 0.000000
CROSSSECTIONREADONLY 0
CROSSECTIONDATA      3
STATION    0.000000 STATIONELEV 0.000000 STATIONMANNINGS 0.000000
STATION    0.000000 STATIONELEV 0.000000 STATIONMANNINGS 0.000000
STATION    0.000000 STATIONELEV 0.000000 STATIONMANNINGS 0.000000
ENDCROSSECTIONDATA
CHANNELGUID          ${channelGuid}
ENDCHANNELCALC`;
    }
    
    // Create a lining calculation block (equivalent to New-LiningCalcBlock in PowerShell)
    function createLiningCalcBlock(row) {
        const liningGuid = generateGuid();
        
        return `LININGCALC
LININGNAME           "${row.CHANNELNAME} - Lining Calc"
LININGNOTES          ""
LATITUDE             0.000000
LONGITUDE            0.000000
LININGTYPE           2
SELMETHOD            0
SELCHANNEL           0
\tRIPRAPLINING
\t\tSAFETYFACTOR         1.000000
\t\tGAMMAWATER           62.400000
\t\tMANNINGSN            0.000000
\t\tGEOMCALC             0
\t\tCURVATURERAD         0.000000
\t\tENDBASECLASS
\tD50                  0.000000
\tGAMMASOIL            165.000000
\tSHAPEFACTOR          1
\tENDRIPRAPLINING
\tVEGLINING
\t\tSAFETYFACTOR         1.000000
\t\tGAMMAWATER           62.400000
\t\tMANNINGSN            0.000000
\t\tGEOMCALC             0
\t\tCURVATURERAD         0.000000
\t\tENDBASECLASS
\tHEIGHT               0.333000
\tCN                   0.000000
\tCF                   0.750000
\tD75                  0.100000
\tPLASTICITY           0.000000
\tPOROSITY             0.000000
\tC1                   1.070000
\tC2                   14.300000
\tC3                   47.700000
\tC4                   1.420000
\tC5                   -0.610000
\tC6                   0.000100
\tCOHESIVE             0
\tCONDITION            2
\tGROWTHFORM           2
\tSOILCLASS            3
\tENDVEGLINING
\tRECPLINING
\t\tSAFETYFACTOR         1.000000
\t\tGAMMAWATER           62.400000
\t\tMANNINGSN            0.035000
\t\tGEOMCALC             0
\t\tCURVATURERAD         0.000000
\t\tENDBASECLASS
\tSHEARRECP            2.250000
\tSHEARMID             0.000000
\tMANNINGLOW           0.000000
\tMANNINGMID           0.000000
\tMANNINGUP            0.000000
\tD75                  0.100000
\tPLASTICITY           0.000000
\tPOROSITY             0.000000
\tC1                   1.070000
\tC2                   14.300000
\tC3                   47.700000
\tC4                   1.420000
\tC5                   -0.610000
\tC6                   0.000100
\tCOHESIVE             0
\tMANNINGRANGE         0
\tENDRECPLINING
\tGABIONLINING
\t\tSAFETYFACTOR         1.000000
\t\tGAMMAWATER           62.400000
\t\tMANNINGSN            0.000000
\t\tGEOMCALC             0
\t\tCURVATURERAD         0.000000
\t\tENDBASECLASS
\tD50                  0.000000
\tGAMMASOIL            165.000000
\tMATTRESST            0.000000
\tENDGABIONLINING
LININGGUID           ${liningGuid}
ENDLININGCALC`;
    }
    
    // Generate a GUID similar to PowerShell's System.Guid.NewGuid()
    function generateGuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
});