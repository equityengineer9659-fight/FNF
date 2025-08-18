/**
 * Impact Page H2 Diagnostic Script
 */

function runImpactH2Diagnostics() {
    console.log('=== IMPACT PAGE H2 DIAGNOSTICS ===');
    
    // Find the H2 element
    const h2 = document.querySelector('#impact-heading');
    if (!h2) {
        console.log('H2 with id "impact-heading" not found');
        return;
    }
    
    console.log('H2 Element found:', h2);
    console.log('H2 Classes:', Array.from(h2.classList).join(', '));
    
    const computedStyles = window.getComputedStyle(h2);
    console.log('H2 Position:', computedStyles.position);
    console.log('H2 Padding Bottom:', computedStyles.paddingBottom);
    console.log('H2 Font Weight:', computedStyles.fontWeight);
    console.log('H2 Color:', computedStyles.color);
    
    // Check for pseudo-element
    const afterStyles = window.getComputedStyle(h2, ':after');
    console.log('--- PSEUDO-ELEMENT :after ---');
    console.log('Content:', afterStyles.content);
    console.log('Display:', afterStyles.display);
    console.log('Position:', afterStyles.position);
    console.log('Background:', afterStyles.background);
    console.log('Width:', afterStyles.width);
    console.log('Height:', afterStyles.height);
    console.log('Z-Index:', afterStyles.zIndex);
    
    // Try to create the underline manually
    console.log('--- CREATING MANUAL UNDERLINE ---');
    
    // Remove any existing manual underlines
    document.querySelectorAll('.manual-underline').forEach(el => el.remove());
    
    // Get H2 position and dimensions
    const h2Rect = h2.getBoundingClientRect();
    console.log('H2 Rectangle:', h2Rect);
    
    // Create a manual underline element positioned relative to the page
    const underline = document.createElement('div');
    underline.className = 'manual-underline';
    underline.style.cssText = `
        position: fixed;
        top: ${h2Rect.bottom + window.scrollY - 8}px;
        left: ${h2Rect.left + (h2Rect.width / 2) - 40}px;
        width: 80px;
        height: 5px;
        background: #ffffff;
        border-radius: 2px;
        z-index: 999999;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
        border: 1px solid #ccc;
        pointer-events: none;
    `;
    
    // Append to body instead of H2 to avoid overflow issues
    document.body.appendChild(underline);
    
    console.log('Manual underline created and added to body');
    
    // Also try adding it as a sibling to H2
    const underline2 = document.createElement('div');
    underline2.className = 'manual-underline';
    underline2.style.cssText = `
        width: 80px;
        height: 5px;
        background: #ffffff;
        border-radius: 2px;
        margin: 0 auto;
        margin-top: 0.5rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
        border: 1px solid #ccc;
    `;
    
    // Insert after H2
    h2.parentNode.insertBefore(underline2, h2.nextSibling);
    
    console.log('Second manual underline added as sibling');
    
    // Last resort - create a very obvious test element
    console.log('--- CREATING OBVIOUS TEST ELEMENT ---');
    const testElement = document.createElement('div');
    testElement.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 200px;
        height: 100px;
        background: red;
        color: white;
        font-size: 20px;
        text-align: center;
        line-height: 100px;
        z-index: 9999999;
        border: 5px solid yellow;
    `;
    testElement.textContent = 'TEST VISIBLE?';
    document.body.appendChild(testElement);
    
    // Remove it after 3 seconds
    setTimeout(() => {
        testElement.remove();
    }, 3000);
    
    console.log('Red test element created - should be visible for 3 seconds');
    console.log('=== END DIAGNOSTICS ===');
}

// Export to global scope
window.runImpactH2Diagnostics = runImpactH2Diagnostics;

console.log('Impact H2 diagnostic script loaded. Run: runImpactH2Diagnostics()');