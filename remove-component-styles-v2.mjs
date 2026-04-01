import fs from 'fs';
import path from 'path';

const componentFiles = [
  'c:\\Users\\UT\\OneDrive\\Desktop\\hsc_exam\\frontend\\src\\app\\components\\institute-search-modal\\institute-search-modal.component.ts',
  'c:\\Users\\UT\\OneDrive\\Desktop\\hsc_exam\\frontend\\src\\app\\layouts\\app-shell\\app-shell.component.ts'
];

function removeInlineStyles(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalLength = content.length;
    
    // Pattern 1: styles: [`...`]
    let pattern1 = /,\s*\n\s*styles:\s*\[\`[\s\S]*?\`\]/;
    if (pattern1.test(content)) {
      content = content.replace(pattern1, '');
      console.log(`✓ Removed styles (pattern 1) from ${path.basename(filePath)}`);
    } else {
      // Pattern 2: styles: [\n    `...`\n  ]
      let pattern2 = /,\s*\n\s*styles:\s*\[\s*\n[\s\S]*?\n\s*\]/;
      if (pattern2.test(content)) {
        content = content.replace(pattern2, '');
        console.log(`✓ Removed styles (pattern 2) from ${path.basename(filePath)}`);
      } else {
        console.log(`✗ No styles pattern found in ${path.basename(filePath)}`);
        return false;
      }
    }
    
    if (content.length !== originalLength) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`  Saved changes (removed ${originalLength - content.length} bytes)`);
      return true;
    }
    
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Process component files
let totalSucceeded = 0;

console.log('Removing remaining inline styles...\n');

componentFiles.forEach(file => {
  if (fs.existsSync(file)) {
    if (removeInlineStyles(file)) {
      totalSucceeded++;
    }
  } else {
    console.log(`! File not found: ${file}`);
  }
});

console.log(`\nCompleted: ${totalSucceeded}/${componentFiles.length} components cleaned`);
