/**
 * About Page Layout Fix
 * Forces "What We Bring" section into single row
 * Add this script to about.html before closing </body> tag
 */

document.addEventListener('DOMContentLoaded', function() {
    // Find the What We Bring section
    const expertiseHeading = document.getElementById('expertise-heading');
    if (!expertiseHeading) return;
    
    // Get the parent section
    const section = expertiseHeading.closest('section');
    if (!section) return;
    
    // Find all expertise cards
    const allCards = section.querySelectorAll('.expertise-card');
    if (allCards.length !== 4) return; // Should have exactly 4 cards
    
    // Find the container
    const container = section.querySelector('.slds-container_large');
    if (!container) return;
    
    // Create a new single grid container
    const newGrid = document.createElement('div');
    newGrid.className = 'slds-grid slds-gutters_large expertise-single-row';
    
    // Create new column wrappers for each card
    allCards.forEach((card, index) => {
        // Create column div
        const col = document.createElement('div');
        col.className = 'slds-col';
        col.style.flex = '1 1 0';
        col.style.maxWidth = 'none';
        
        // Clone the card
        const cardClone = card.cloneNode(true);
        col.appendChild(cardClone);
        newGrid.appendChild(col);
    });
    
    // Find and remove the old grid containers
    const oldGrids = container.querySelectorAll('.slds-grid.slds-wrap');
    oldGrids.forEach(grid => grid.remove());
    
    // Insert the new single grid after the heading
    expertiseHeading.parentNode.insertBefore(newGrid, expertiseHeading.nextSibling);
    
    // Add CSS to ensure single row layout
    const style = document.createElement('style');
    style.textContent = `
        .expertise-single-row {
            display: flex !important;
            flex-wrap: nowrap !important;
            justify-content: space-between !important;
            gap: 1.5rem !important;
            margin-top: 2rem !important;
            overflow-x: auto !important;
        }
        
        .expertise-single-row .slds-col {
            flex: 1 1 0 !important;
            min-width: 220px !important;
            max-width: none !important;
        }
        
        .expertise-single-row .expertise-card {
            height: 100% !important;
            text-align: center !important;
        }
        
        @media (max-width: 1200px) {
            .expertise-single-row {
                padding: 0 1rem;
                -webkit-overflow-scrolling: touch;
            }
        }
    `;
    document.head.appendChild(style);
    
    console.log('What We Bring section restructured into single row');
});