#!/bin/bash
# EMERGENCY ROLLBACK SCRIPT FOR PHASE 1A
# Restores navigation-styles.css reference if issues detected

echo "PHASE 1A ROLLBACK: Restoring navigation-styles.css reference..."
sed -i "s/navigation-unified.css/navigation-styles.css/" about.html
echo "✓ Rollback complete - navigation-styles.css restored"
echo "✗ navigation-unified.css reference removed"
echo "Page should now function with original CSS"
