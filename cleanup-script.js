// Quick cleanup script - will delete this after use
const fs = require('fs');

const files = ['about.html', 'contact.html', 'resources.html', 'impact.html'];

files.forEach(filename => {
    let content = fs.readFileSync(filename, 'utf8');
    
    // Remove embedded ULTRA SIMPLE MOBILE NAVIGATION block
    const startMarker = '        // ULTRA SIMPLE MOBILE NAVIGATION';
    const endMarker = '        });';
    
    let startIndex = content.indexOf(startMarker);
    if (startIndex !== -1) {
        let endIndex = content.indexOf(endMarker, startIndex);
        if (endIndex !== -1) {
            endIndex += endMarker.length + 1; // Include newline
            let before = content.substring(0, startIndex);
            let after = content.substring(endIndex);
            content = before + after;
        }
    }
    
    // Ensure mobile navigation script is referenced
    if (!content.includes('js/mobile-navigation-clean.js')) {
        content = content.replace(
            '<script src="js/original-mesh-background.js">',
            '<script src="js/mobile-navigation-clean.js"></script>\n    <script src="js/original-mesh-background.js">'
        );
    }
    
    fs.writeFileSync(filename, content);
    console.log(`Cleaned ${filename}`);
});

console.log('All files cleaned!');