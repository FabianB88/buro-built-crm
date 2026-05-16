export function exportToCsv(filename: string, headers: string[], rows: (string | number | undefined | null)[][]): void {
  const escape = (v: string | number | undefined | null) =>
    `"${String(v ?? '').replace(/"/g, '""')}"`

  const csv = [headers, ...rows]
    .map(row => row.map(escape).join(','))
    .join('\r\n')

  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
