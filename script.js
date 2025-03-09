body {
    font-family: Arial, sans-serif;
    line-height: 1.6;
    margin: 0;
    padding: 20px;
    background-color: #f5f5f5;
    color: #333;
}

.container {
    max-width: 800px;
    margin: 0 auto;
    background-color: white;
    padding: 30px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h1 {
    text-align: center;
    color: #2c3e50;
    margin-bottom: 30px;
}

h3 {
    color: #2c3e50;
    margin-top: 25px;
    margin-bottom: 15px;
}

.form-group {
    margin-bottom: 20px;
    width: 100%;
}

label {
    display: block;
    margin-bottom: 8px;
    font-weight: bold;
}

/* Make all form elements the same width */
input[type="text"], 
select, 
.file-input-container, 
.file-input-button, 
.generate-button {
    width: 100%;
    box-sizing: border-box;
}

input[type="text"], select {
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 16px;
    height: 44px; /* Consistent height */
}

.file-input-container {
    position: relative;
    overflow: hidden;
    display: inline-block;
}

.file-input-button {
    border: 1px solid #ddd;
    color: #333;
    background-color: white;
    padding: 10px;
    border-radius: 4px;
    font-size: 16px;
    display: inline-block;
    cursor: pointer;
    text-align: center;
    height: 44px; /* Consistent height */
    line-height: 24px; /* Center text vertically */
}

.file-input {
    position: absolute;
    font-size: 100px;
    opacity: 0;
    right: 0;
    top: 0;
    cursor: pointer;
    width: 100%;
    height: 100%;
}

.file-name {
    margin-top: 8px;
    font-size: 14px;
    color: #666;
}

.preview-container {
    margin-top: 25px;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 15px;
    max-height: 300px;
    overflow: auto;
}

.csv-preview {
    width: 100%;
    overflow-x: auto;
}

.csv-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
}

.csv-table th, .csv-table td {
    padding: 8px;
    text-align: left;
    border: 1px solid #ddd;
}

.csv-table th {
    background-color: #f2f2f2;
    font-weight: bold;
}

.csv-table tr:nth-child(even) {
    background-color: #f9f9f9;
}

.generate-button {
    background-color: #2c3e50;
    color: white;
    border: none;
    padding: 12px 20px;
    font-size: 16px;
    border-radius: 4px;
    cursor: pointer;
    margin-top: 20px;
    transition: background-color 0.3s;
    height: 48px; /* Slightly taller for better appearance */
}

.generate-button:hover {
    background-color: #1a2530;
}

.footer {
    margin-top: 30px;
    text-align: center;
    font-size: 14px;
    color: #777;
}
