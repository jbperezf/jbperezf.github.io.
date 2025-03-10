document.addEventListener('DOMContentLoaded', function() {
    // Modal functionality
    const modal = document.getElementById('helpModal');
    const helpButton = document.getElementById('helpButton');
    const closeButton = modal.querySelector('.close-button');

    helpButton.addEventListener('click', () => {
        modal.classList.add('show');
    });

    closeButton.addEventListener('click', () => {
        modal.classList.remove('show');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });

    // Escape key closes modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            modal.classList.remove('show');
        }
    });

    // Menu toggle functionality
    const menuButton = document.querySelector('.menu-button');
    const sidebar = document.querySelector('.sidebar');
    const appContainer = document.querySelector('.app-container');
    
    function toggleSidebar(show) {
        if (show) {
            sidebar.classList.add('active');
            appContainer.classList.remove('sidebar-hidden');
        } else {
            sidebar.classList.remove('active');
            appContainer.classList.add('sidebar-hidden');
        }
    }

    // Only enable menu toggle on mobile
    if (window.innerWidth <= 768) {
        toggleSidebar(false);
    }

    menuButton.addEventListener('click', () => {
        menuButton.classList.toggle('active');
        toggleSidebar(menuButton.classList.contains('active'));
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            toggleSidebar(true);
        } else {
            toggleSidebar(false);
        }
    });

    // Close sidebar when clicking outside
    document.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target) && !menuButton.contains(e.target) && sidebar.classList.contains('active')) {
            menuButton.classList.remove('active');
            sidebar.classList.remove('active');
            mainContent.classList.remove('shifted');
        }
    });

    // Navigation handling
    document.querySelectorAll('.nav-button').forEach(button => {
        button.addEventListener('click', () => {
            // Update active button
            document.querySelectorAll('.nav-button').forEach(b => b.classList.remove('active'));
            button.classList.add('active');
            
            // Show corresponding section
            const sectionId = button.dataset.section;
            document.querySelectorAll('.tool-section').forEach(section => {
                section.classList.remove('active');
            });
            document.getElementById(sectionId).classList.add('active');
        });
    });

    // File input handler for HYD report converter
    document.getElementById('hydFile').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            document.getElementById('hydFileName').textContent = file.name;
        } else {
            document.getElementById('hydFileName').textContent = 'No file chosen';
        }
    });

    // Convert button handler
    document.getElementById('convertButton').addEventListener('click', function() {
        const hydFile = document.getElementById('hydFile').files[0];
        if (!hydFile) {
            alert('Please select a HYD report file');
            return;
        }
        convertHydToCSV(hydFile);
    });

    // File input handler
    document.getElementById('csvFile').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            showUploadedFile(this, 'csvDragZone', 'csvUploadedFile');
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

    // Function to convert HYD report to CSV
    function convertHydToCSV(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const arrayBuffer = e.target.result;
            
            mammoth.extractRawText({arrayBuffer: arrayBuffer})
                .then(function(result) {
                    const text = result.value;
                    console.log('Extracted text:', text); // Debug log
                    
                    if (!text || !text.includes('Channel Analysis:')) {
                        alert('No channel analysis data found in the document.');
                        return;
                    }

                    const csvContent = processReportToCSV(text);
                    
                    if (!csvContent || csvContent.split('\n').length <= 1) {
                        alert('No data could be extracted from the document.');
                        return;
                    }

                    // Add BOM for Excel compatibility
                    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
                    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = file.name.replace('.docx', '.csv');
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    
                    alert('CSV file created successfully!');
                })
                .catch(function(error) {
                    console.error('Error:', error);
                    alert('Error processing file: ' + error.message);
                });
        };
        reader.readAsArrayBuffer(file);
    }

    function processReportToCSV(text) {
        console.log('Processing text:', text); // Debug log

        // Define headers based on PowerShell script
        const headers = [
            "Channel Analysis", "Channel Type", "Side Slope 1 (Z1) ft/ft", "Side Slope 2 (Z2) ft/ft",
            "Channel Width ft", "Longitudinal Slope ft/ft", "Manning's n", "Flow cfs", "Depth ft",
            "Area of Flow ft^2", "Wetted Perimeter ft", "Hydraulic Radius ft", "Average Velocity ft/s",
            "Top Width ft", "Froude Number", "Critical Depth ft", "Critical Velocity ft/s",
            "Critical Slope ft/ft", "Critical Top Width ft", "Calculated Max Shear Stress lb/ft^2",
            "Calculated Avg Shear Stress lb/ft^2"
        ];

        // Create CSV rows array starting with headers
        let csvRows = [`"${headers.join('","')}"`];

        // Define regex patterns for data extraction
        const patterns = {
            "Channel Type": /Channel Type:\s*([^\r\n]+)/i,
            "Side Slope 1 (Z1) ft/ft": /Side Slope 1 \(Z1\):\s*([\d.]+)/i,
            "Side Slope 2 (Z2) ft/ft": /Side Slope 2 \(Z2\):\s*([\d.]+)/i,
            "Channel Width ft": /Channel Width[: ]*(\d+\.?\d*)/i,
            "Longitudinal Slope ft/ft": /Longitudinal Slope:\s*([\d.]+)/i,
            "Manning's n": /Manning'?s n:\s*([\d.]+)/i,
            "Flow cfs": /Flow[: ]*(\d+\.?\d*)/i,
            "Depth ft": /Depth[: ]*(\d+\.?\d*)/i,
            "Area of Flow ft^2": /Area of Flow[: ]*(\d+\.?\d*)/i,
            "Wetted Perimeter ft": /Wetted Perimeter[: ]*(\d+\.?\d*)/i,
            "Hydraulic Radius ft": /Hydraulic Radius[: ]*(\d+\.?\d*)/i,
            "Average Velocity ft/s": /Average Velocity[: ]*(\d+\.?\d*)/i,
            "Top Width ft": /Top Width[: ]*(\d+\.?\d*)/i,
            "Froude Number": /Froude Number:\s*([\d.]+)/i,
            "Critical Depth ft": /Critical Depth[: ]*(\d+\.?\d*)/i,
            "Critical Velocity ft/s": /Critical Velocity[: ]*(\d+\.?\d*)/i,
            "Critical Slope ft/ft": /Critical Slope:\s*([\d.]+)/i,
            "Critical Top Width ft": /Critical Top Width[: ]*(\d+\.?\d*)/i,
            "Calculated Max Shear Stress lb/ft^2": /(?:Calculated )?Max[imum]* Shear Stress[: ]*(\d+\.?\d*)/i,
            "Calculated Avg Shear Stress lb/ft^2": /(?:Calculated )?Avg[erage]* Shear Stress[: ]*(\d+\.?\d*)/i
        };

        // Split by "Channel Analysis:" to get each section
        const sections = text.split(/Channel Analysis:/g).filter(section => section.trim());
        console.log('Found sections:', sections.length); // Debug log

        // Process each section
        sections.forEach((section, index) => {
            // Extract channel analysis name
            const lines = section.split(/[\r\n]+/);
            const channelAnalysis = lines[0].trim().replace(/\s*(?:Notes:|Input Parameters:).*$/, '');
            console.log(`Processing section ${index + 1}:`, channelAnalysis); // Debug log

            // Create data object with default values
            const data = {
                "Channel Analysis": channelAnalysis,
                "Channel Width ft": "0.00" // Default for triangular channels
            };

            // Extract all other fields using regex patterns
            Object.entries(patterns).forEach(([field, pattern]) => {
                const match = section.match(pattern);
                if (match) {
                    data[field] = match[1].trim();
                    console.log(`Found ${field}:`, data[field]); // Debug log
                }
            });

            // Create CSV line with all headers in order
            const csvLine = headers.map(header => {
                const value = data[header] || "";
                return `"${value.replace(/"/g, '""')}"`;  // Properly escape quotes
            }).join(',');

            csvRows.push(csvLine);
        });

        const csvContent = csvRows.join('\n');
        console.log('Generated CSV:', csvContent); // Debug log
        return csvContent;
    }

    // Drag and drop functionality
    function setupDragAndDrop(dragZoneId, fileInputId) {
        const dragZone = document.getElementById(dragZoneId);
        const fileInput = document.getElementById(fileInputId);

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dragZone.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            dragZone.addEventListener(eventName, highlight, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dragZone.addEventListener(eventName, unhighlight, false);
        });

        function highlight(e) {
            dragZone.classList.add('drag-over');
        }

        function unhighlight(e) {
            dragZone.classList.remove('drag-over');
        }

        dragZone.addEventListener('drop', handleDrop, false);

        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;

            if (files.length) {
                fileInput.files = files;
                fileInput.dispatchEvent(new Event('change'));
            }
        }
    }

    // Setup drag and drop for both file inputs
    setupDragAndDrop('csvDragZone', 'csvFile');
    setupDragAndDrop('hydDragZone', 'hydFile');

    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' bytes';
        else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        else return (bytes / 1048576).toFixed(1) + ' MB';
    }

    function showUploadedFile(fileInput, dragZoneId, uploadedFileId) {
        const file = fileInput.files[0];
        if (file) {
            const dragZone = document.getElementById(dragZoneId);
            const uploadedFile = document.getElementById(uploadedFileId);
            
            // Update file info
            uploadedFile.querySelector('.file-name').textContent = file.name;
            uploadedFile.querySelector('.file-size').textContent = formatFileSize(file.size);
            
            // Show uploaded file, hide drag zone
            dragZone.classList.add('file-uploaded');
            uploadedFile.classList.add('active');
            
            // Handle delete button
            uploadedFile.querySelector('.delete-file').onclick = () => {
                fileInput.value = '';
                dragZone.classList.remove('file-uploaded');
                uploadedFile.classList.remove('active');
            };
        }
    }

    // Update file input handlers
    document.getElementById('csvFile').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            showUploadedFile(this, 'csvDragZone', 'csvUploadedFile');
        }
    });

    document.getElementById('hydFile').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            showUploadedFile(this, 'hydDragZone', 'hydUploadedFile');
        }
    });

    // Template download handler
    document.getElementById('downloadTemplate').addEventListener('click', function() {
        const headers = [
            "CHANNELNAME",
            "CHANNELNOTES",
            "SIDESLOPE1",
            "SIDESLOPE2",
            "WIDTH",
            "LONGSLOPE",
            "MANNINGS",
            "FLOW"
        ];
        
        const csvContent = `"${headers.join('","')}"`;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'hyd_generator_template.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
});