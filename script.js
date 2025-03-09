document.addEventListener('DOMContentLoaded', function() {
    // File input handler
    document.getElementById('csvFile').addEventListener('change', function(e) {
        const fileName = e.target.files[0] ? e.target.files[0].name : 'No file chosen';
        document.getElementById('fileName').textContent = fileName;
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
});
