@echo off
echo Installing MCP Tools for FNF Project...
echo.

echo Installing Browser MCP...
npx -y browser-use --version
echo.

echo Installing Lighthouse MCP...
npx -y @anthropic/mcp-lighthouse --version
echo.

echo Installing Playwright MCP...
npx -y @anthropic/mcp-playwright --version
echo.

echo Installing Filesystem MCP...
npx -y @anthropic/mcp-filesystem --version
echo.

echo Installing GitHub MCP...
npx -y @anthropic/mcp-github --version
echo.

echo Installing Playwright browsers...
npx playwright install chromium
echo.

echo MCP Tools installation complete!
echo.
echo Next steps:
echo 1. Copy claude_mcp_config.json to your Claude Desktop config location
echo 2. Restart Claude Desktop
echo 3. Test with agents using protected logo spinning effects
echo.
pause