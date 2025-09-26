#!/usr/bin/env python3
"""
Comprehensive Analysis Runner - WINDOWS COMPATIBLE VERSION
Runs all repaired analysis scripts and provides a summary dashboard
Fixed Unicode encoding issues for Windows compatibility
"""

import subprocess
import sys
from pathlib import Path
from datetime import datetime
import os

# Set console encoding for Windows compatibility
if os.name == 'nt':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.detach())

def run_script(script_path, script_name):
    """Run a script and capture its output"""
    print(f"\n{'='*80}")
    print(f"RUNNING: {script_name}")
    print(f"{'='*80}")

    try:
        # Set environment to handle encoding properly
        env = os.environ.copy()
        env['PYTHONIOENCODING'] = 'utf-8'

        result = subprocess.run([sys.executable, script_path],
                              capture_output=False,
                              text=True,
                              cwd=".",
                              env=env)

        if result.returncode == 0:
            print(f"[SUCCESS] {script_name} completed successfully")
            return True
        else:
            print(f"[FAILED] {script_name} failed with return code {result.returncode}")
            return False

    except Exception as e:
        print(f"[ERROR] Error running {script_name}: {e}")
        return False

def main():
    print("="*100)
    print("FOOD-N-FORCE WEBSITE - COMPREHENSIVE ANALYSIS DASHBOARD")
    print(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*100)

    # List of repaired scripts to run
    scripts_to_run = [
        ("tools/css-conflict-analyzer-fixed.py", "CSS Conflict Analyzer"),
        ("tools/performance-analyzer-fixed.py", "Performance Analyzer"),
        ("tools/runtime-conflict-analyzer-fixed.py", "Runtime Conflict Analyzer")
    ]

    results = {}

    for script_path, script_name in scripts_to_run:
        script_file = Path(script_path)
        if script_file.exists():
            results[script_name] = run_script(script_path, script_name)
        else:
            print(f"[ERROR] Script not found: {script_path}")
            results[script_name] = False

    # Summary
    print("\n" + "="*100)
    print("ANALYSIS SUMMARY")
    print("="*100)

    successful = sum(1 for success in results.values() if success)
    total = len(results)

    print(f"\nAnalysis Scripts Executed: {successful}/{total}")

    for script_name, success in results.items():
        status = "[SUCCESS]" if success else "[FAILED]"
        print(f"  {script_name}: {status}")

    if successful == total:
        print(f"\n[COMPLETE] ALL ANALYSIS SCRIPTS COMPLETED SUCCESSFULLY!")
        print(f"[REPORTS] Check the tools/reports/ directory for detailed analysis results")
    else:
        print(f"\n[WARNING] {total - successful} script(s) failed to execute")

    print(f"\n[FILES] Report files generated:")
    reports_dir = Path("tools/reports")
    if reports_dir.exists():
        for report_file in reports_dir.glob("*.json"):
            print(f"   - {report_file}")
    else:
        print("   - No reports directory found")

if __name__ == "__main__":
    main()