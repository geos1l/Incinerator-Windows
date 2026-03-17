import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { FileRecord } from '../src/shared/types';
import { computeScore } from '../src/shared/ranking';

function runPowerShell(script: string): string {
  const tmpFile = path.join(os.tmpdir(), `incinerator-${Date.now()}.ps1`);
  try {
    fs.writeFileSync(tmpFile, script, 'utf-8');
    return execSync(
      `powershell -ExecutionPolicy Bypass -File "${tmpFile}"`,
      { timeout: 20000, encoding: 'utf-8' }
    ).trim();
  } finally {
    try { fs.unlinkSync(tmpFile); } catch { /* ignore */ }
  }
}

export function moveToRecycleBin(filePath: string): void {
  const script = `
Add-Type -AssemblyName Microsoft.VisualBasic
[Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile(
  '${filePath.replace(/'/g, "''")}',
  'OnlyErrorDialogs',
  'SendToRecycleBin'
)
`;
  console.log('[recycle] Moving to Recycle Bin:', filePath);
  runPowerShell(script);
  console.log('[recycle] Done:', filePath);
}

export function permanentDelete(filePath: string): void {
  const script = `Remove-Item -LiteralPath '${filePath.replace(/'/g, "''")}' -Force -Recurse`;
  console.log('[recycle] Permanently deleting:', filePath);
  runPowerShell(script);
  console.log('[recycle] Done:', filePath);
}

export function getRecycleBinFiles(): FileRecord[] {
  const script = `
$shell = New-Object -ComObject Shell.Application
$bin = $shell.Namespace(10)
$items = $bin.Items()
$result = @()
foreach ($item in $items) {
  $result += [PSCustomObject]@{
    Path = $item.Path
    Name = $item.Name
    Size = $item.Size
    DateDeleted = $bin.GetDetailsOf($item, 2)
  }
}
if ($result.Count -eq 0) { Write-Output '[]' }
elseif ($result.Count -eq 1) { ConvertTo-Json @($result) -Compress }
else { $result | ConvertTo-Json -Compress }
`;
  try {
    const output = runPowerShell(script);

    if (!output || output === '[]') return [];

    const raw: Array<{
      Path: string;
      Name: string;
      Size: number;
      DateDeleted: string;
    }> = JSON.parse(output);

    return raw.map((item) => {
      const ext = item.Name.includes('.')
        ? item.Name.substring(item.Name.lastIndexOf('.')).toLowerCase()
        : '';
      const sizeMB = (item.Size || 0) / (1024 * 1024);
      const deletedDate = item.DateDeleted ? new Date(item.DateDeleted).getTime() : Date.now();
      const daysUntilAutoDelete = Math.max(0, 30 - Math.floor((Date.now() - deletedDate) / (1000 * 60 * 60 * 24)));

      const partial = {
        id: `recycle-${item.Path}`,
        path: item.Path,
        name: item.Name,
        extension: ext,
        sizeMB,
        createdAt: deletedDate,
        lastOpenedAt: deletedDate,
        isScheduled: true,
        daysUntilAutoDelete,
      };

      return {
        ...partial,
        deletionScore: computeScore(partial),
      };
    });
  } catch (err) {
    console.error('Failed to read Recycle Bin:', err);
    return [];
  }
}

export function getRecycleBinSizeMB(): number {
  try {
    const script = `
$shell = New-Object -ComObject Shell.Application
$bin = $shell.Namespace(10)
$total = 0
foreach ($item in $bin.Items()) { $total += $item.Size }
Write-Output $total
`;
    const output = runPowerShell(script);
    return (parseInt(output, 10) || 0) / (1024 * 1024);
  } catch {
    return 0;
  }
}
