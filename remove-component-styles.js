const fs = require('fs');
const path = require('path');

const componentFiles = [
  'c:\\Users\\UT\\OneDrive\\Desktop\\hsc_exam\\frontend\\src\\app\\components\\institute-search-modal\\institute-search-modal.component.ts',
  'c:\\Users\\UT\\OneDrive\\Desktop\\hsc_exam\\frontend\\src\\app\\components\\board-header\\board-header.component.ts',
  'c:\\Users\\UT\\OneDrive\\Desktop\\hsc_exam\\frontend\\src\\app\\components\\admin-status-dashboard\\admin-status-dashboard.component.ts',
  'c:\\Users\\UT\\OneDrive\\Desktop\\hsc_exam\\frontend\\src\\app\\components\\institute-picker\\institute-picker.component.ts',
  'c:\\Users\\UT\\OneDrive\\Desktop\\hsc_exam\\frontend\\src\\app\\components\\enhanced-table\\enhanced-table.component.ts',
  'c:\\Users\\UT\\OneDrive\\Desktop\\hsc_exam\\frontend\\src\\app\\layouts\\app-shell\\app-shell.component.ts'
];

function removeInlineStyles(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Remove the styles: [ ... ] array completely
    // Match pattern: ,\n  styles: [`...`]
    // We need to be careful to preserve the rest of the decorator
    
    // Strategy: Find the styles: [` pattern and remove everything until the closing `]
    const stylesPattern = /,\s*\n\s*styles:\s*\[\`[\s\S]*?\`\]/;
    
    // Check if pattern matches
    if (stylesPattern.test(content)) {
      content = content.replace(stylesPattern, '');
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`✓ Removed styles from ${path.basename(filePath)}`);
      return true;
    } else {
      console.log(`✗ No styles pattern found in ${path.basename(filePath)}`);
      return false;
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Process all component files
let totalProcessed = 0;
let totalSucceeded = 0;

console.log('Removing inline styles from components...\n');

componentFiles.forEach(file => {
  if (fs.existsSync(file)) {
    totalProcessed++;
    if (removeInlineStyles(file)) {
      totalSucceeded++;
    }
  } else {
    console.log(`! File not found: ${file}`);
  }
});

console.log(`\nCompleted: ${totalSucceeded}/${totalProcessed} components cleaned`);
