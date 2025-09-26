#!/usr/bin/env python3
"""
CSS CONFLICT ANALYZER - FIXED VERSION
Compatible with Redo Website file structure (src/css)
"""

import os
import re
import json
from pathlib import Path
from collections import defaultdict
from datetime import datetime

class CSSConflictAnalyzer:
    def __init__(self, css_dir="src/css"):
        self.css_dir = Path(css_dir)
        self.css_files = {}
        self.conflicts = []
        self.important_declarations = []
        self.file_breakdown = {}

    def analyze_css_files(self):
        """Analyze all CSS files for conflicts"""
        print("CSS CONFLICT ANALYZER - Food-N-Force Website")
        print("=" * 60)

        if not self.css_dir.exists():
            print(f"CSS directory {self.css_dir} not found!")
            return

        css_files = list(self.css_dir.glob("*.css"))
        # Filter out backup files
        css_files = [f for f in css_files if not any(pattern in f.name for pattern in ['.pre-', '.backup', '.bak', '.temp', '.tmp', '-backup', '_backup'])]
        css_files.sort()

        print(f"Found {len(css_files)} CSS files")
        print()

        total_size = 0
        total_lines = 0
        total_selectors = 0
        total_properties = 0
        total_important = 0

        for css_file in css_files:
            print(f"Analyzing {css_file.name}...")

            try:
                content = css_file.read_text(encoding='utf-8', errors='ignore')
                size_bytes = len(content.encode('utf-8'))
                size_kb = size_bytes / 1024
                lines = len(content.splitlines())

                # Count selectors (approximate)
                selectors = len(re.findall(r'[^{}]*{', content))

                # Count properties (approximate)
                properties = len(re.findall(r'[a-zA-Z-]+\s*:\s*[^;]+;', content))

                # Count !important declarations
                important_count = len(re.findall(r'!important', content))

                self.file_breakdown[css_file.name] = {
                    'size_bytes': size_bytes,
                    'size_kb': round(size_kb, 2),
                    'lines': lines
                }

                total_size += size_kb
                total_lines += lines
                total_selectors += selectors
                total_properties += properties
                total_important += important_count

                # Find conflicts within this file
                self._find_conflicts_in_file(css_file.name, content)

                # Find !important declarations
                self._find_important_declarations(css_file.name, content)

            except Exception as e:
                print(f"Error analyzing {css_file.name}: {e}")

        print()
        print("ANALYZING CONFLICTS...")
        print()

        # Analyze cross-file conflicts
        self._find_cross_file_conflicts()

        # Generate report
        self._generate_report(total_size, total_lines, total_selectors, total_properties, total_important)

    def _find_conflicts_in_file(self, filename, content):
        """Find conflicts within a single file"""
        # Remove comments
        content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)

        # Find all CSS rules
        rules = re.findall(r'([^{}]+){([^{}]*)}', content)

        selector_properties = defaultdict(list)

        for selector, properties in rules:
            selector = selector.strip()
            if selector:
                # Extract properties from this rule
                prop_matches = re.findall(r'([a-zA-Z-]+)\s*:\s*([^;]+);', properties)
                for prop, value in prop_matches:
                    selector_properties[selector].append({
                        'property': prop.strip(),
                        'value': value.strip(),
                        'file': filename
                    })

        # Look for duplicate properties within selectors
        for selector, props in selector_properties.items():
            prop_counts = defaultdict(list)
            for prop_data in props:
                prop_counts[prop_data['property']].append(prop_data)

            for prop, occurrences in prop_counts.items():
                if len(occurrences) > 1:
                    self.conflicts.append({
                        'type': 'property_conflict',
                        'selector': selector,
                        'property': prop,
                        'declarations': [
                            {
                                'file': occ['file'],
                                'value': occ['value'],
                                'declaration': f"{prop}: {occ['value']}"
                            } for occ in occurrences
                        ],
                        'severity': 'medium'
                    })

    def _find_cross_file_conflicts(self):
        """Find conflicts between different CSS files"""
        # This is a simplified version - in a real implementation,
        # you'd need to parse CSS more thoroughly
        pass

    def _find_important_declarations(self, filename, content):
        """Find all !important declarations"""
        important_matches = re.findall(r'([^{]+){[^{}]*([a-zA-Z-]+)\s*:\s*([^;]+!important)[^}]*}', content)

        for selector, prop, value in important_matches:
            self.important_declarations.append({
                'selector': selector.strip(),
                'property': prop.strip(),
                'value': value.strip(),
                'file': filename
            })

    def _generate_report(self, total_size, total_lines, total_selectors, total_properties, total_important):
        """Generate analysis report"""
        print("CSS ANALYSIS RESULTS")
        print("=" * 60)

        print("BUNDLE METRICS:")
        print(f"   Files: {len(self.css_files)}")
        print(f"   Size: {total_size:.2f} KB")
        print(f"   Lines: {total_lines}")

        print()
        print("ARCHITECTURE METRICS:")
        print(f"   Selectors: {total_selectors}")
        print(f"   Properties: {total_properties}")
        print(f"   !important: {total_important}")

        print()
        print("CONFLICT ANALYSIS:")
        print(f"   Total Conflicts: {len(self.conflicts)}")

        property_conflicts = len([c for c in self.conflicts if c['type'] == 'property_conflict'])
        print(f"   Property Conflicts: {property_conflicts}")
        print(f"   Specificity Conflicts: {len(self.conflicts) - property_conflicts}")

        print()
        print("PERFORMANCE BUDGET:")
        budget_kb = 45
        usage_percent = (total_size / budget_kb) * 100
        print(f"   Current: {total_size:.2f} KB")
        print(f"   Budget: {budget_kb} KB")
        print(f"   Usage: {usage_percent:.1f}%")

        if usage_percent > 100:
            print(f"   Status: OVER BUDGET ({usage_percent - 100:.1f}% over)")
        else:
            print(f"   Status: WITHIN BUDGET")

        print()
        print("SLDS COMPLIANCE:")
        # Simplified SLDS analysis
        slds_tokens = 0
        custom_properties = 0

        css_files_for_slds = [f for f in self.css_dir.glob("*.css") if not any(pattern in f.name for pattern in ['.pre-', '.backup', '.bak', '.temp', '.tmp', '-backup', '_backup'])]
        for css_file in css_files_for_slds:
            try:
                content = css_file.read_text(encoding='utf-8', errors='ignore')
                slds_tokens += len(re.findall(r'--slds-[a-zA-Z-]+', content))
                custom_properties += len(re.findall(r'--[a-zA-Z-]+:', content))
            except:
                pass

        compliance_score = (slds_tokens / max(custom_properties, 1)) * 100
        print(f"   SLDS Tokens: {slds_tokens}")
        print(f"   Custom Properties: {custom_properties}")
        print(f"   Compliance Score: {compliance_score:.1f}%")

        print()
        print("RECOMMENDATIONS:")
        if total_size > budget_kb:
            print(f"   1. Reduce bundle size by {total_size - budget_kb:.1f} KB")
        if total_important > 100:
            print(f"   2. Reduce !important declarations ({total_important} found)")
        if len(self.conflicts) > 10:
            print(f"   3. Resolve CSS conflicts ({len(self.conflicts)} found)")
        if property_conflicts > 5:
            print(f"   4. Fix property conflicts ({property_conflicts} found)")
        print("   5. Implement CSS layers for better cascade management")
        print("   6. Use CSS custom properties for better maintainability")

        # Save detailed report
        self._save_detailed_report(total_size, total_lines, total_selectors, total_properties, total_important)

    def _save_detailed_report(self, total_size, total_lines, total_selectors, total_properties, total_important):
        """Save detailed analysis to JSON file"""
        report_data = {
            'timestamp': datetime.now().isoformat(),
            'metrics': {
                'total_files': len([f for f in self.css_dir.glob("*.css") if not any(pattern in f.name for pattern in ['.pre-', '.backup', '.bak', '.temp', '.tmp', '-backup', '_backup'])]),
                'bundle_size_bytes': int(total_size * 1024),
                'bundle_size_kb': round(total_size, 2),
                'total_lines': total_lines,
                'total_selectors': total_selectors,
                'total_properties': total_properties,
                'important_count': total_important,
                'conflict_count': len(self.conflicts),
                'property_conflicts': len([c for c in self.conflicts if c['type'] == 'property_conflict']),
                'specificity_conflicts': len(self.conflicts) - len([c for c in self.conflicts if c['type'] == 'property_conflict'])
            },
            'conflicts': self.conflicts[:10],  # First 10 conflicts
            'important_declarations': self.important_declarations[:20],  # First 20 !important declarations
            'file_breakdown': self.file_breakdown
        }

        # Ensure reports directory exists
        reports_dir = Path("tools/reports")
        reports_dir.mkdir(exist_ok=True)

        report_file = reports_dir / "css-conflict-analysis.json"
        with open(report_file, 'w') as f:
            json.dump(report_data, f, indent=2)

        print(f"\nDetailed report saved: {report_file}")

def main():
    analyzer = CSSConflictAnalyzer()
    analyzer.analyze_css_files()

if __name__ == "__main__":
    main()