#!/usr/bin/env python3
"""
Enhanced CSS Dependency Analyzer
Analyzes CSS selectors, JavaScript CSS injection, inline styles, and dependencies 
across HTML/JS files to predict impact of changes and detect conflicts.
"""

import re
import os
import json
from pathlib import Path
from collections import defaultdict
from typing import Dict, List, Set, Tuple
import ast

class CSSAnalyzer:
    def __init__(self, css_dir: str, html_files: List[str], js_dir: str = "js"):
        self.css_dir = Path(css_dir)
        self.html_files = [Path(f) for f in html_files]
        self.js_dir = Path(js_dir)
        self.css_rules = {}
        self.html_classes = defaultdict(set)
        self.html_ids = defaultdict(set)
        self.inline_styles = defaultdict(list)
        self.js_css_injections = defaultdict(list)
        self.js_class_manipulations = defaultdict(list)
        self.js_style_manipulations = defaultdict(list)
        self.dependencies = defaultdict(set)
        self.conflicts = defaultdict(list)
        
    def parse_css_files(self):
        """Extract CSS rules and selectors from all CSS files"""
        css_files = list(self.css_dir.glob("*.css"))
        # Filter out backup files
        css_files = [f for f in css_files if not any(pattern in f.name for pattern in ['.pre-', '.backup', '.bak', '.temp', '.tmp', '-backup', '_backup'])]
        
        for css_file in css_files:
            with open(css_file, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Remove comments and clean content
            content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
            
            # Extract CSS rules
            rules = re.findall(r'([^{}]+){([^{}]*)}', content)
            
            for selector_group, declarations in rules:
                selectors = [s.strip() for s in selector_group.split(',')]
                
                for selector in selectors:
                    if selector:
                        self.css_rules[selector] = {
                            'file': css_file.name,
                            'declarations': declarations.strip(),
                            'classes': self._extract_classes(selector),
                            'ids': self._extract_ids(selector),
                            'elements': self._extract_elements(selector)
                        }
    
    def parse_html_files(self):
        """Extract classes, IDs, and inline styles from HTML files"""
        for html_file in self.html_files:
            with open(html_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Extract classes
            class_matches = re.findall(r'class=["\']([^"\']*)["\']', content, re.IGNORECASE)
            for match in class_matches:
                classes = match.split()
                for cls in classes:
                    self.html_classes[html_file.name].add(cls)
            
            # Extract IDs
            id_matches = re.findall(r'id=["\']([^"\']*)["\']', content, re.IGNORECASE)
            for match in id_matches:
                self.html_ids[html_file.name].add(match)
            
            # Extract inline styles
            inline_style_matches = re.findall(r'style=["\']([^"\']*)["\']', content, re.IGNORECASE)
            for match in inline_style_matches:
                self.inline_styles[html_file.name].append({
                    'style': match,
                    'properties': self._parse_inline_style(match)
                })
            
            # Extract style tags
            style_tag_matches = re.findall(r'<style[^>]*>(.*?)</style>', content, re.DOTALL | re.IGNORECASE)
            for match in style_tag_matches:
                self.inline_styles[html_file.name].append({
                    'style': match,
                    'type': 'style_tag',
                    'properties': self._extract_css_properties(match)
                })
    
    def _extract_classes(self, selector: str) -> Set[str]:
        """Extract class names from CSS selector"""
        return set(re.findall(r'\.([a-zA-Z0-9_-]+)', selector))
    
    def _extract_ids(self, selector: str) -> Set[str]:
        """Extract ID names from CSS selector"""
        return set(re.findall(r'#([a-zA-Z0-9_-]+)', selector))
    
    def _extract_elements(self, selector: str) -> Set[str]:
        """Extract element names from CSS selector"""
        # Simple element extraction - could be enhanced
        elements = re.findall(r'\b([a-z][a-z0-9]*)\b', selector.lower())
        return set(elements)
    
    def _parse_inline_style(self, style: str) -> Dict[str, str]:
        """Parse inline style attribute into property-value pairs"""
        properties = {}
        declarations = style.split(';')
        for decl in declarations:
            if ':' in decl:
                prop, value = decl.split(':', 1)
                properties[prop.strip()] = value.strip()
        return properties
    
    def _extract_css_properties(self, css_text: str) -> List[Dict]:
        """Extract CSS properties from CSS text (for style tags)"""
        properties = []
        # Remove comments
        css_text = re.sub(r'/\*.*?\*/', '', css_text, flags=re.DOTALL)
        
        # Extract rules
        rules = re.findall(r'([^{}]+){([^{}]*)}', css_text)
        for selector, declarations in rules:
            prop_dict = {}
            decl_list = declarations.split(';')
            for decl in decl_list:
                if ':' in decl:
                    prop, value = decl.split(':', 1)
                    prop_dict[prop.strip()] = value.strip()
            
            if prop_dict:
                properties.append({
                    'selector': selector.strip(),
                    'properties': prop_dict
                })
        return properties
    
    def parse_javascript_files(self):
        """Analyze JavaScript files for CSS manipulation"""
        js_files = list(self.js_dir.rglob("*.js"))
        
        for js_file in js_files:
            try:
                with open(js_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                self._analyze_js_css_patterns(js_file.name, content)
                
            except (UnicodeDecodeError, IOError) as e:
                print(f"Warning: Could not read {js_file}: {e}")
    
    def _analyze_js_css_patterns(self, filename: str, content: str):
        """Analyze JavaScript content for CSS-related patterns"""
        
        # Pattern 1: style property manipulation (element.style.property = value)
        style_patterns = [
            r'\.style\.([a-zA-Z][a-zA-Z0-9]*)\s*=\s*["\']([^"\']*)["\']',
            r'\.style\[["\']([\w-]+)["\']\]\s*=\s*["\']([^"\']*)["\']',
            r'\.style\.cssText\s*=\s*["\']([^"\']*)["\']'
        ]
        
        for pattern in style_patterns:
            matches = re.findall(pattern, content)
            for match in matches:
                if len(match) == 2:
                    prop, value = match
                    self.js_style_manipulations[filename].append({
                        'type': 'style_property',
                        'property': prop,
                        'value': value
                    })
                elif len(match) == 1:  # cssText case
                    self.js_style_manipulations[filename].append({
                        'type': 'cssText',
                        'value': match[0]
                    })
        
        # Pattern 2: className manipulation
        class_patterns = [
            r'\.className\s*[+]?=\s*["\']([^"\']*)["\']',
            r'\.classList\.add\(["\']([^"\']*)["\']',
            r'\.classList\.remove\(["\']([^"\']*)["\']',
            r'\.classList\.toggle\(["\']([^"\']*)["\']',
            r'\.classList\.contains\(["\']([^"\']*)["\']'
        ]
        
        for pattern in class_patterns:
            matches = re.findall(pattern, content)
            for match in matches:
                self.js_class_manipulations[filename].append({
                    'class': match,
                    'action': self._determine_class_action(pattern)
                })
        
        # Pattern 3: CSS insertion (insertRule, appendChild with style elements)
        css_injection_patterns = [
            r'insertRule\(["\']([^"\']*)["\']',
            r'\.innerHTML\s*[+]?=\s*["\']<style[^>]*>([^<]*)</style>["\']',
            r'document\.createElement\(["\']style["\'].*?\.textContent\s*=\s*["\']([^"\']*)["\']',
            r'\.addRule\(["\']([^"\']*)["\']'
        ]
        
        for pattern in css_injection_patterns:
            matches = re.findall(pattern, content, re.DOTALL)
            for match in matches:
                self.js_css_injections[filename].append({
                    'css_rule': match,
                    'type': 'dynamic_injection'
                })
        
        # Pattern 4: jQuery/Framework CSS manipulation
        jquery_patterns = [
            r'\$\([^)]*\)\.css\(["\']([^"\']*)["\'][^)]*["\']([^"\']*)["\']',
            r'\.css\(\{([^}]*)\}',
            r'\.addClass\(["\']([^"\']*)["\']',
            r'\.removeClass\(["\']([^"\']*)["\']'
        ]
        
        for pattern in jquery_patterns:
            matches = re.findall(pattern, content)
            for match in matches:
                if isinstance(match, tuple) and len(match) == 2:
                    prop, value = match
                    self.js_style_manipulations[filename].append({
                        'type': 'jquery_css',
                        'property': prop,
                        'value': value
                    })
                elif 'addClass' in pattern or 'removeClass' in pattern:
                    self.js_class_manipulations[filename].append({
                        'class': match,
                        'action': 'jquery_class'
                    })
    
    def _determine_class_action(self, pattern: str) -> str:
        """Determine the type of class manipulation from the regex pattern"""
        if 'add' in pattern:
            return 'add'
        elif 'remove' in pattern:
            return 'remove'
        elif 'toggle' in pattern:
            return 'toggle'
        elif 'contains' in pattern:
            return 'check'
        else:
            return 'set'
    
    def analyze_dependencies(self):
        """Build dependency map between CSS rules and HTML/JS usage"""
        self.parse_css_files()
        self.parse_html_files()
        self.parse_javascript_files()
        self._detect_conflicts()
        
        # Build dependencies
        for selector, rule_info in self.css_rules.items():
            for html_file in self.html_files:
                html_name = html_file.name
                
                # Check class dependencies
                for cls in rule_info['classes']:
                    if cls in self.html_classes[html_name]:
                        self.dependencies[selector].add(f"{html_name}:class:{cls}")
                
                # Check ID dependencies
                for id_name in rule_info['ids']:
                    if id_name in self.html_ids[html_name]:
                        self.dependencies[selector].add(f"{html_name}:id:{id_name}")
        
        # Build JS dependencies
        for js_file, class_manipulations in self.js_class_manipulations.items():
            for manipulation in class_manipulations:
                cls = manipulation['class']
                # Find CSS rules that use this class
                for selector, rule_info in self.css_rules.items():
                    if cls in rule_info['classes']:
                        self.dependencies[selector].add(f"js:{js_file}:class:{cls}")
    
    def _detect_conflicts(self):
        """Detect potential CSS conflicts between files, inline styles, and JS"""
        # Check for property conflicts between CSS files
        property_sources = defaultdict(list)
        
        # Collect all property sources
        for selector, rule_info in self.css_rules.items():
            properties = self._extract_properties_from_declarations(rule_info['declarations'])
            for prop in properties:
                property_sources[prop].append({
                    'type': 'css_file',
                    'source': rule_info['file'],
                    'selector': selector
                })
        
        # Add inline style properties
        for html_file, styles in self.inline_styles.items():
            for style_info in styles:
                if isinstance(style_info['properties'], dict):
                    for prop in style_info['properties']:
                        property_sources[prop].append({
                            'type': 'inline_style',
                            'source': html_file,
                            'style': style_info['style']
                        })
                elif isinstance(style_info['properties'], list):
                    # Handle style tag properties (list of dicts)
                    for prop_dict in style_info['properties']:
                        for prop in prop_dict.get('properties', {}):
                            property_sources[prop].append({
                                'type': 'inline_style',
                                'source': html_file,
                                'selector': prop_dict.get('selector', ''),
                                'style': style_info['style']
                            })
        
        # Add JS style manipulations
        for js_file, manipulations in self.js_style_manipulations.items():
            for manipulation in manipulations:
                prop = manipulation.get('property', 'cssText')
                property_sources[prop].append({
                    'type': 'js_manipulation',
                    'source': js_file,
                    'manipulation': manipulation
                })
        
        # Identify conflicts (same property from multiple sources)
        for prop, sources in property_sources.items():
            if len(sources) > 1:
                self.conflicts[prop] = sources
    
    def _extract_properties_from_declarations(self, declarations: str) -> Set[str]:
        """Extract property names from CSS declarations"""
        properties = set()
        decl_list = declarations.split(';')
        for decl in decl_list:
            if ':' in decl:
                prop = decl.split(':', 1)[0].strip()
                if prop:
                    properties.add(prop)
        return properties
    
    def predict_change_impact(self, selector: str) -> Dict:
        """Predict impact of changing or deleting a CSS selector"""
        if selector not in self.css_rules:
            return {"error": f"Selector '{selector}' not found in CSS files"}
        
        rule_info = self.css_rules[selector]
        affected_files = []
        js_dependencies = []
        
        for dependency in self.dependencies.get(selector, set()):
            parts = dependency.split(':', 2)
            if len(parts) >= 3:
                source_type, file_name, value = parts[0], parts[1], parts[2]
                if source_type == 'js':
                    js_dependencies.append({
                        'js_file': file_name,
                        'type': 'class_manipulation',
                        'value': value
                    })
                else:
                    affected_files.append({
                        'file': file_name,
                        'type': source_type,
                        'value': value
                    })
        
        # Check for conflicts
        properties = self._extract_properties_from_declarations(rule_info['declarations'])
        conflicts = {prop: self.conflicts.get(prop, []) for prop in properties if prop in self.conflicts}
        
        return {
            'selector': selector,
            'css_file': rule_info['file'],
            'declarations': rule_info['declarations'],
            'classes_used': list(rule_info['classes']),
            'ids_used': list(rule_info['ids']),
            'elements_used': list(rule_info['elements']),
            'affected_html_files': affected_files,
            'js_dependencies': js_dependencies,
            'property_conflicts': conflicts,
            'impact_count': len(affected_files) + len(js_dependencies)
        }
    
    def find_unused_selectors(self) -> List[str]:
        """Find CSS selectors that appear unused in HTML files"""
        unused = []
        
        for selector in self.css_rules:
            if selector not in self.dependencies or not self.dependencies[selector]:
                unused.append(selector)
        
        return unused
    
    def generate_report(self, output_file: str = None):
        """Generate comprehensive dependency report"""
        self.analyze_dependencies()
        
        js_files = list(self.js_dir.rglob("*.js"))
        
        report = {
            'summary': {
                'total_css_rules': len(self.css_rules),
                'total_html_files': len(self.html_files),
                'total_js_files': len(js_files),
                'css_files_analyzed': list(set(rule['file'] for rule in self.css_rules.values())),
                'html_files_analyzed': [f.name for f in self.html_files],
                'js_files_analyzed': [f.name for f in js_files],
                'inline_styles_found': sum(len(styles) for styles in self.inline_styles.values()),
                'js_css_injections': sum(len(inj) for inj in self.js_css_injections.values()),
                'js_class_manipulations': sum(len(manip) for manip in self.js_class_manipulations.values()),
                'property_conflicts': len(self.conflicts)
            },
            'unused_selectors': self.find_unused_selectors(),
            'inline_styles': dict(self.inline_styles),
            'js_css_injections': dict(self.js_css_injections),
            'js_class_manipulations': dict(self.js_class_manipulations),
            'js_style_manipulations': dict(self.js_style_manipulations),
            'property_conflicts': dict(self.conflicts),
            'dependency_map': {}
        }
        
        # Add dependency details
        for selector in self.css_rules:
            impact = self.predict_change_impact(selector)
            report['dependency_map'][selector] = impact
        
        if output_file:
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(report, f, indent=2, ensure_ascii=False)
        
        return report
    
    def analyze_specific_class(self, class_name: str) -> Dict:
        """Analyze a specific CSS class across all sources"""
        results = {
            'class_name': class_name,
            'css_rules': [],
            'html_usage': [],
            'js_manipulations': [],
            'inline_styles': [],
            'conflicts': []
        }
        
        # Find CSS rules using this class
        for selector, rule_info in self.css_rules.items():
            if class_name in rule_info['classes']:
                results['css_rules'].append({
                    'selector': selector,
                    'file': rule_info['file'],
                    'declarations': rule_info['declarations']
                })
        
        # Find HTML usage
        for html_file, classes in self.html_classes.items():
            if class_name in classes:
                results['html_usage'].append(html_file)
        
        # Find JS manipulations
        for js_file, manipulations in self.js_class_manipulations.items():
            for manipulation in manipulations:
                if manipulation['class'] == class_name:
                    results['js_manipulations'].append({
                        'js_file': js_file,
                        'action': manipulation['action']
                    })
        
        # Find inline styles (check if any inline styles reference this class)
        for html_file, styles in self.inline_styles.items():
            for style_info in styles:
                if 'type' in style_info and style_info['type'] == 'style_tag':
                    for prop_info in style_info['properties']:
                        if class_name in prop_info['selector']:
                            results['inline_styles'].append({
                                'html_file': html_file,
                                'selector': prop_info['selector'],
                                'properties': prop_info['properties']
                            })
        
        return results

def main():
    # Configuration for your project - Updated paths for new architecture
    css_dir = "src/css"  # Updated to match Vite/modern architecture
    html_files = [
        "index.html", "about.html", "services.html",
        "resources.html", "impact.html", "contact.html"
    ]
    js_dir = "src/js"  # Updated to match Vite/modern architecture
    
    analyzer = CSSAnalyzer(css_dir, html_files, js_dir)
    
    # Generate full report
    print("Analyzing CSS dependencies, JavaScript interactions, and inline styles...")
    report = analyzer.generate_report("enhanced-css-dependency-report.json")
    
    print(f"\n=== Enhanced CSS Dependency Analysis Report ===")
    print(f"Total CSS Rules: {report['summary']['total_css_rules']}")
    print(f"CSS Files: {', '.join(report['summary']['css_files_analyzed'])}")
    print(f"HTML Files: {', '.join(report['summary']['html_files_analyzed'])}")
    print(f"JS Files: {report['summary']['total_js_files']}")
    print(f"Unused Selectors: {len(report['unused_selectors'])}")
    print(f"Inline Styles Found: {report['summary']['inline_styles_found']}")
    print(f"JS CSS Injections: {report['summary']['js_css_injections']}")
    print(f"JS Class Manipulations: {report['summary']['js_class_manipulations']}")
    print(f"Property Conflicts: {report['summary']['property_conflicts']}")
    
    # Show conflicts
    if report['property_conflicts']:
        print(f"\n=== Property Conflicts Detected ===")
        conflict_count = 0
        for prop, sources in report['property_conflicts'].items():
            if len(sources) > 1 and conflict_count < 5:  # Show first 5 conflicts
                print(f"\nProperty '{prop}' defined in {len(sources)} places:")
                for source in sources:
                    if source['type'] == 'css_file':
                        print(f"  - CSS: {source['source']} ({source['selector']})")
                    elif source['type'] == 'inline_style':
                        print(f"  - Inline: {source['source']}")
                    elif source['type'] == 'js_manipulation':
                        print(f"  - JS: {source['source']}")
                conflict_count += 1
        
        if len(report['property_conflicts']) > 5:
            print(f"  ... and {len(report['property_conflicts']) - 5} more conflicts")
    
    # Show JS interactions
    if report['js_class_manipulations']:
        print(f"\n=== JavaScript Class Manipulations ===")
        js_count = 0
        for js_file, manipulations in report['js_class_manipulations'].items():
            if manipulations and js_count < 3:  # Show first 3 JS files
                print(f"\nFile: {js_file}")
                for manip in manipulations[:3]:  # Show first 3 per file
                    print(f"  - {manip['action']}: .{manip['class']}")
                if len(manipulations) > 3:
                    print(f"  ... and {len(manipulations) - 3} more")
                js_count += 1
    
    # Show unused selectors
    if report['unused_selectors']:
        print(f"\nPotentially Unused Selectors:")
        for selector in report['unused_selectors'][:10]:  # Show first 10
            print(f"  - {selector}")
        if len(report['unused_selectors']) > 10:
            print(f"  ... and {len(report['unused_selectors']) - 10} more")
    
    # Example: Check specific selector impact
    print(f"\n=== Example: Impact Analysis ===")
    example_selectors = ['.nav-menu', '.hero-section', '.btn-primary']
    
    for selector in example_selectors:
        impact = analyzer.predict_change_impact(selector)
        if 'error' not in impact:
            print(f"\nSelector: {selector}")
            print(f"  CSS File: {impact['css_file']}")
            print(f"  Total Impact: {impact['impact_count']} elements")
            if impact['affected_html_files']:
                files = set(item['file'] for item in impact['affected_html_files'])
                print(f"  HTML Files: {', '.join(files)}")
            if impact['js_dependencies']:
                js_files = set(item['js_file'] for item in impact['js_dependencies'])
                print(f"  JS Dependencies: {', '.join(js_files)}")
            if impact['property_conflicts']:
                print(f"  Conflicts: {len(impact['property_conflicts'])} properties")
    
    print(f"\nFull report saved to: enhanced-css-dependency-report.json")
    
    # Example: Analyze specific class
    print(f"\n=== Example: Class Analysis ===")
    class_analysis = analyzer.analyze_specific_class('nav-menu')
    if class_analysis['css_rules'] or class_analysis['html_usage'] or class_analysis['js_manipulations']:
        print(f"Class '.nav-menu' analysis:")
        print(f"  CSS Rules: {len(class_analysis['css_rules'])}")
        print(f"  HTML Usage: {len(class_analysis['html_usage'])} files")
        print(f"  JS Manipulations: {len(class_analysis['js_manipulations'])}")
        if class_analysis['js_manipulations']:
            for js_manip in class_analysis['js_manipulations'][:3]:
                print(f"    - {js_manip['js_file']}: {js_manip['action']}")
    else:
        print("Class '.nav-menu' not found or not used.")

if __name__ == "__main__":
    main()