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
            
            // Create a simple .hyd format (this would be replaced with your actual format)
            const timestamp = new Date().toISOString();
            const hydContent = `PROJECT: ${projectName}
CALCULATION_TYPE: ${calculationType}
TIMESTAMP: ${timestamp}
CSV_DATA:
${csvContent}`;
            
            // Create and download the .hyd file
            const blob = new Blob([hydContent], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${projectName.replace(/\s+/g, '_')}.hyd`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
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
});
