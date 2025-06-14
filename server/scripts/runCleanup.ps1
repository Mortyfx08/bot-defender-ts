# Run MongoDB cleanup script
Write-Host "Running MongoDB blocked_ips cleanup..."
npx ts-node server/scripts/cleanupMongoBlockedIPs.ts
 
# Wait for user input before closing
Write-Host "`nPress any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 