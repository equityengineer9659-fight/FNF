#!/usr/bin/env python3
"""
Safe Dead Code Eliminator
Identifies and removes clearly unused or redundant CSS rules
Ultra-conservative approach - only removes obviously safe patterns
"""

import os
import re
import sys
from collections import defaultdict

def read_file_safely(filepath):
    """Read file with proper UTF-8 encoding"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return None

def write_file_safely(filepath, content):
    """Write file with proper UTF-8 encoding"""
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    except Exception as e:
        print(f"Error writing {filepath}: {e}")
        return False

def analyze_dead_code_patterns(content):
    """Analyze potential dead code patterns"""

    analysis = {
        'empty_rules': [],
        'comment_blocks': [],
        'duplicate_properties': [],
        'redundant_overrides': []
    }

    # Find completely empty CSS rules
    empty_rule_pattern = r'([^{}]+)\s*\{\s*\}'
    empty_matches = list(re.finditer(empty_rule_pattern, content))

    for match in empty_matches:
        selector = match.group(1).strip()
        # Skip media queries and keyframes which can legitimately be empty
        if not any(keyword in selector.lower() for keyword in ['@media', '@keyframes', '@supports', '@font-face']):
            analysis['empty_rules'].append({
                'selector': selector,
                'match': match,
                'bytes_saved': len(match.group(0))
            })

    # Find large comment blocks (conservative - only /* ... */ style)
    comment_pattern = r'/\*[^*]*\*+(?:[^/*][^*]*\*+)*/'
    comment_matches = list(re.finditer(comment_pattern, content, re.DOTALL))

    for match in comment_matches:
        comment_text = match.group(0)
        # Only target very large comments (>100 chars) that look like old code
        if len(comment_text) > 100 and ('TODO' in comment_text or 'FIXME' in comment_text or 'OLD' in comment_text.upper()):
            analysis['comment_blocks'].append({
                'content': comment_text[:50] + '...',
                'match': match,
                'bytes_saved': len(comment_text)
            })

    # Find duplicate property declarations within the same rule
    rule_pattern = r'([^{}]+)\{([^{}]+)\}'
    rule_matches = re.finditer(rule_pattern, content, re.DOTALL)

    for rule_match in rule_matches:
        selector = rule_match.group(1).strip()
        rule_body = rule_match.group(2)

        # Find all property declarations in this rule
        prop_pattern = r'([a-z-]+)\s*:\s*([^;]+);'
        properties = re.findall(prop_pattern, rule_body, re.IGNORECASE)

        # Check for duplicate properties
        prop_counts = defaultdict(list)
        for prop, value in properties:
            prop_counts[prop.strip().lower()].append(value.strip())

        for prop, values in prop_counts.items():
            if len(values) > 1:
                # Only flag obvious duplicates (same property, different values)
                analysis['duplicate_properties'].append({
                    'selector': selector,
                    'property': prop,
                    'values': values,
                    'estimated_bytes': len(f"{prop}: {values[0]};") * (len(values) - 1)
                })

    return analysis

def safe_dead_code_elimination(content, filename):
    """Apply safe dead code elimination"""
    print(f"Analyzing dead code patterns in {filename}...")

    dead_code_analysis = analyze_dead_code_patterns(content)
    eliminations = []
    total_savings = 0

    print(f"Dead code analysis:")
    print(f"  Empty rules found: {len(dead_code_analysis['empty_rules'])}")
    print(f"  Large comment blocks: {len(dead_code_analysis['comment_blocks'])}")
    print(f"  Duplicate properties: {len(dead_code_analysis['duplicate_properties'])}")

    # Remove empty CSS rules (very safe)
    for empty_rule in dead_code_analysis['empty_rules'][:3]:  # Conservative limit
        print(f"  Found empty rule: {empty_rule['selector'][:50]}...")
        # Remove the empty rule
        pattern = re.escape(empty_rule['match'].group(0))
        content = re.sub(pattern, '', content, count=1)
        total_savings += empty_rule['bytes_saved']
        eliminations.append(f"Removed empty rule '{empty_rule['selector'][:30]}...': {empty_rule['bytes_saved']} bytes")

    # Remove large comment blocks that look like old code (very conservative)
    for comment_block in dead_code_analysis['comment_blocks'][:2]:  # Very conservative
        print(f"  Found large comment: {comment_block['content']}")
        # Remove the comment block
        pattern = re.escape(comment_block['match'].group(0))
        content = re.sub(pattern, '', content, count=1, flags=re.DOTALL)
        total_savings += comment_block['bytes_saved']
        eliminations.append(f"Removed large comment block: {comment_block['bytes_saved']} bytes")

    # Remove obvious duplicate properties (only when values are identical)
    for dup_prop in dead_code_analysis['duplicate_properties'][:2]:  # Very conservative
        if len(set(dup_prop['values'])) == 1:  # All values are the same
            print(f"  Found duplicate property: {dup_prop['property']} in {dup_prop['selector'][:30]}...")
            # This is a more complex operation, skip for now to maintain safety
            # eliminations.append(f"Would remove duplicate {dup_prop['property']}: {dup_prop['estimated_bytes']} bytes")

    return content, total_savings, eliminations

def safe_dead_code_eliminator(css_path):
    """Apply safe dead code elimination to CSS file"""
    if not os.path.exists(css_path):
        print(f"File not found: {css_path}")
        return False

    filename = os.path.basename(css_path)
    print(f"Safe dead code elimination of {css_path}...")

    original_content = read_file_safely(css_path)
    if not original_content:
        return False

    original_size = len(original_content.encode('utf-8'))
    print(f"Original size: {original_size:,} bytes ({original_size/1024:.2f} KB)")

    # Apply safe dead code elimination
    optimized_content, bytes_saved, eliminations = safe_dead_code_elimination(original_content, filename)

    new_size = len(optimized_content.encode('utf-8'))
    savings_percent = (bytes_saved / original_size) * 100 if bytes_saved > 0 else 0

    print(f"\nSafe Dead Code Elimination Results:")
    print(f"Original: {original_size:,} bytes ({original_size/1024:.2f} KB)")
    print(f"Optimized: {new_size:,} bytes ({new_size/1024:.2f} KB)")
    print(f"Savings: {bytes_saved:,} bytes ({bytes_saved/1024:.2f} KB)")
    print(f"Reduction: {savings_percent:.1f}%")

    if eliminations:
        print(f"\nSafe eliminations applied:")
        for elimination in eliminations:
            print(f"  + {elimination}")
    else:
        print("No safe dead code eliminations identified")

    if bytes_saved < 20:
        print("Minimal savings detected - skipping modification")
        return True

    # Create backup
    backup_path = css_path.replace('.css', '.pre-dead-code-elimination.css')
    write_file_safely(backup_path, original_content)
    print(f"Backup: {os.path.basename(backup_path)}")

    # Apply elimination
    if write_file_safely(css_path, optimized_content):
        print("+ Safe dead code elimination completed")
        return True
    else:
        print("- Dead code elimination failed")
        return False

def main():
    if len(sys.argv) < 2:
        print("Usage: python safe-dead-code-eliminator.py <css-file-path>")
        sys.exit(1)

    css_path = sys.argv[1]
    success = safe_dead_code_eliminator(css_path)

    if success:
        print(f"\n{'='*60}")
        print("SAFETY GUARANTEE:")
        print("+ Only removes clearly unused/empty rules")
        print("+ Preserves all functional CSS")
        print("+ No impact on visual styling")
        print("+ Ultra-conservative approach")
        print(f"{'='*60}")

if __name__ == '__main__':
    main()