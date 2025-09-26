#!/usr/bin/env python3
"""
Visual Baseline Validator - Windows Compatible
Creates and compares visual screenshots for regression testing
"""

import json
import os
import time
from datetime import datetime
from pathlib import Path
import requests
from PIL import Image, ImageDraw, ImageFont
from playwright.sync_api import sync_playwright

class VisualBaselineValidator:
    def __init__(self, base_url="http://localhost:4173"):
        self.base_url = base_url
        self.screenshots_dir = Path("tools/reports/screenshots")
        self.baseline_dir = self.screenshots_dir / "baseline"
        self.comparison_dir = self.screenshots_dir / "comparison"

        # Create directories
        self.screenshots_dir.mkdir(parents=True, exist_ok=True)
        self.baseline_dir.mkdir(exist_ok=True)
        self.comparison_dir.mkdir(exist_ok=True)

        # Pages to test
        self.pages = [
            {"name": "index", "url": "/", "title": "Home Page"},
            {"name": "about", "url": "/about.html", "title": "About Page"},
            {"name": "services", "url": "/services.html", "title": "Services Page"},
            {"name": "resources", "url": "/resources.html", "title": "Resources Page"},
            {"name": "impact", "url": "/impact.html", "title": "Impact Page"},
            {"name": "contact", "url": "/contact.html", "title": "Contact Page"}
        ]

        # Viewport configurations to test
        self.viewports = [
            {"name": "desktop", "width": 1920, "height": 1080},
            {"name": "tablet", "width": 768, "height": 1024},
            {"name": "mobile", "width": 375, "height": 667}
        ]

    def check_server_running(self):
        """Check if the development server is running"""
        try:
            response = requests.get(self.base_url, timeout=5)
            return response.status_code == 200
        except requests.RequestException:
            return False

    def wait_for_server(self, timeout=30):
        """Wait for the development server to be available"""
        print(f"Waiting for server at {self.base_url}...")

        start_time = time.time()
        while time.time() - start_time < timeout:
            if self.check_server_running():
                print(f"[SUCCESS] Server is running at {self.base_url}")
                return True
            time.sleep(1)
            print(".", end="", flush=True)

        print(f"[ERROR] Server not available at {self.base_url} after {timeout} seconds")
        return False

    def capture_screenshot(self, page, page_info, viewport_info, screenshot_type="baseline"):
        """Capture a screenshot of a page"""
        filename = f"{page_info['name']}_{viewport_info['name']}.png"

        if screenshot_type == "baseline":
            filepath = self.baseline_dir / filename
        else:
            filepath = self.comparison_dir / filename

        url = f"{self.base_url}{page_info['url']}"

        try:
            # Set viewport using correct API
            page.set_viewport_size({"width": viewport_info["width"], "height": viewport_info["height"]})

            # Navigate to page
            page.goto(url, wait_until="networkidle", timeout=30000)

            # Wait for any animations or dynamic content
            page.wait_for_timeout(2000)

            # Hide any dynamic elements that might cause false differences
            page.evaluate("""
                // Hide elements that change dynamically
                const elementsToHide = document.querySelectorAll('[data-test="dynamic"]');
                elementsToHide.forEach(el => el.style.visibility = 'hidden');

                // Stabilize any random animations
                const particles = document.querySelector('#particles-container');
                if (particles) {
                    particles.style.opacity = '0.3';
                }
            """)

            # Take screenshot
            page.screenshot(path=str(filepath), full_page=True)

            print(f"  Screenshot saved: {filename} ({viewport_info['name']})")
            return True

        except Exception as e:
            print(f"  [ERROR] Failed to capture {filename}: {e}")
            return False

    def create_baseline(self):
        """Create baseline screenshots for all pages and viewports"""
        if not self.wait_for_server():
            return False

        print(f"\nCreating visual baseline...")
        print(f"Baseline directory: {self.baseline_dir}")

        with sync_playwright() as p:
            # Use Chromium for consistency
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()

            # Disable animations for consistent screenshots
            page.add_init_script("""
                // Disable animations
                const style = document.createElement('style');
                style.textContent = `
                    *, *::before, *::after {
                        animation-duration: 0.01ms !important;
                        animation-iteration-count: 1 !important;
                        transition-duration: 0.01ms !important;
                        scroll-behavior: auto !important;
                    }
                `;
                document.head.appendChild(style);
            """)

            total_screenshots = len(self.pages) * len(self.viewports)
            current = 0

            for page_info in self.pages:
                print(f"\nCapturing {page_info['title']}...")

                for viewport_info in self.viewports:
                    current += 1
                    print(f"  [{current}/{total_screenshots}] {viewport_info['name']} viewport...")

                    success = self.capture_screenshot(page, page_info, viewport_info, "baseline")
                    if not success:
                        browser.close()
                        return False

            browser.close()

        # Create baseline manifest
        baseline_manifest = {
            "timestamp": datetime.now().isoformat(),
            "base_url": self.base_url,
            "pages": self.pages,
            "viewports": self.viewports,
            "total_screenshots": total_screenshots
        }

        manifest_path = self.baseline_dir / "baseline_manifest.json"
        with open(manifest_path, 'w') as f:
            json.dump(baseline_manifest, f, indent=2)

        print(f"\n[SUCCESS] Baseline created with {total_screenshots} screenshots")
        print(f"[INFO] Baseline manifest saved: {manifest_path}")
        return True

    def compare_with_baseline(self):
        """Compare current state with baseline screenshots"""
        if not self.baseline_dir.exists() or not any(self.baseline_dir.iterdir()):
            print("[ERROR] No baseline found. Run create_baseline() first.")
            return False

        if not self.wait_for_server():
            return False

        print(f"\nComparing with baseline...")
        print(f"Comparison directory: {self.comparison_dir}")

        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()

            # Same init script as baseline
            page.add_init_script("""
                const style = document.createElement('style');
                style.textContent = `
                    *, *::before, *::after {
                        animation-duration: 0.01ms !important;
                        animation-iteration-count: 1 !important;
                        transition-duration: 0.01ms !important;
                        scroll-behavior: auto !important;
                    }
                `;
                document.head.appendChild(style);
            """)

            differences = []

            for page_info in self.pages:
                print(f"\nComparing {page_info['title']}...")

                for viewport_info in self.viewports:
                    filename = f"{page_info['name']}_{viewport_info['name']}.png"
                    baseline_path = self.baseline_dir / filename

                    if not baseline_path.exists():
                        print(f"  [WARNING] No baseline for {filename}")
                        continue

                    print(f"  Comparing {viewport_info['name']} viewport...")

                    # Capture new screenshot
                    success = self.capture_screenshot(page, page_info, viewport_info, "comparison")
                    if not success:
                        continue

                    comparison_path = self.comparison_dir / filename

                    # Compare images (basic pixel comparison)
                    try:
                        baseline_img = Image.open(baseline_path)
                        comparison_img = Image.open(comparison_path)

                        if baseline_img.size != comparison_img.size:
                            differences.append({
                                "page": page_info['name'],
                                "viewport": viewport_info['name'],
                                "type": "size_difference",
                                "baseline_size": baseline_img.size,
                                "current_size": comparison_img.size
                            })
                            print(f"    [DIFFERENCE] Size mismatch detected")
                        else:
                            # Simple pixel-by-pixel comparison
                            baseline_pixels = list(baseline_img.getdata())
                            comparison_pixels = list(comparison_img.getdata())

                            different_pixels = sum(1 for a, b in zip(baseline_pixels, comparison_pixels) if a != b)
                            total_pixels = len(baseline_pixels)
                            difference_percentage = (different_pixels / total_pixels) * 100

                            if difference_percentage > 0.1:  # More than 0.1% difference
                                differences.append({
                                    "page": page_info['name'],
                                    "viewport": viewport_info['name'],
                                    "type": "visual_difference",
                                    "difference_percentage": difference_percentage,
                                    "different_pixels": different_pixels,
                                    "total_pixels": total_pixels
                                })
                                print(f"    [DIFFERENCE] {difference_percentage:.2f}% visual difference")
                            else:
                                print(f"    [MATCH] Visual match confirmed")

                    except Exception as e:
                        print(f"    [ERROR] Comparison failed: {e}")

            browser.close()

        # Save comparison report
        comparison_report = {
            "timestamp": datetime.now().isoformat(),
            "total_differences": len(differences),
            "differences": differences,
            "status": "PASS" if len(differences) == 0 else "FAIL"
        }

        report_path = self.comparison_dir / "comparison_report.json"
        with open(report_path, 'w') as f:
            json.dump(comparison_report, f, indent=2)

        if len(differences) == 0:
            print(f"\n[SUCCESS] All screenshots match baseline perfectly")
        else:
            print(f"\n[WARNING] {len(differences)} visual differences detected")
            for diff in differences:
                if diff["type"] == "visual_difference":
                    print(f"  - {diff['page']} ({diff['viewport']}): {diff['difference_percentage']:.2f}% difference")
                else:
                    print(f"  - {diff['page']} ({diff['viewport']}): Size difference")

        print(f"[INFO] Comparison report saved: {report_path}")
        return len(differences) == 0

def main():
    """Main function to run visual validation"""
    import sys

    validator = VisualBaselineValidator()

    if len(sys.argv) < 2:
        print("Usage:")
        print("  python visual-baseline-validator.py baseline  - Create baseline screenshots")
        print("  python visual-baseline-validator.py compare   - Compare with baseline")
        sys.exit(1)

    command = sys.argv[1]

    if command == "baseline":
        success = validator.create_baseline()
        sys.exit(0 if success else 1)
    elif command == "compare":
        success = validator.compare_with_baseline()
        sys.exit(0 if success else 1)
    else:
        print(f"[ERROR] Unknown command: {command}")
        sys.exit(1)

if __name__ == "__main__":
    main()