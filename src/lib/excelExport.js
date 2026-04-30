import ExcelJS from "exceljs";

// XML 1.0 forbids U+0000–U+0008, U+000B, U+000C, U+000E–U+001F (tab/LF/CR are allowed)
const sanitize = (val) =>
  typeof val === "string" ? val.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "") : val;

const isAbsoluteUrl = (url) => {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

const THIN_BORDER = {
  top: { style: "thin" },
  left: { style: "thin" },
  bottom: { style: "thin" },
  right: { style: "thin" },
};

const applyBorders = (row, fromCol, toCol) => {
  for (let c = fromCol; c <= toCol; c++) {
    row.getCell(c).border = THIN_BORDER;
  }
};

const SEVERITY_COLORS = {
  Critical: "C00000",
  High: "FF0000",
  Medium: "FF6600",
  Low: "00B050",
  Info: "0070C0",
};

const META_PLACEHOLDER_MAP = {
  "{{clientName}}": (meta) => meta.clientName || "",
  "{{assessmentType}}": (meta) => meta.assessmentType || "",
  "{{monthYear}}": (meta) => meta.monthYear || "",
  "{{typeOfAssessment}}": (meta) => meta.typeOfAssessment || "",
};

const fillMetaPlaceholders = (workbook, meta) => {
  const replacements = Object.entries(META_PLACEHOLDER_MAP).map(([key, resolver]) => [key, sanitize(resolver(meta))]);

  workbook.eachSheet((sheet) => {
    sheet.eachRow((row) => {
      row.eachCell({ includeEmpty: false }, (cell) => {
        if (typeof cell.value === "string") {
          let val = cell.value;
          for (const [placeholder, value] of replacements) {
            val = val.split(placeholder).join(value);
          }
          if (val !== cell.value) cell.value = val;
        }
      });
      row.commit();
    });
  });
};

const FINDING_FIELD_MAP = {
  "{{findings_start}}": (f) => f.siNo,
  "{{issueName}}": (f) => f.issueName,
  "{{observation}}": (f) => f.observation,
  "{{riskImpact}}": (f) => f.riskImpact,
  "{{affectedURL}}": (f) => f.affectedURL,
  "{{severity}}": (f) => f.severity,
  "{{recommendation}}": (f) => f.recommendation,
  "{{testEvidence}}": (f) => f.testEvidence || "Annexures",
};

const captureRowStyles = (row) => {
  const styles = {};
  const rowHeight = row.height;
  row.eachCell({ includeEmpty: true }, (cell, colNum) => {
    styles[colNum] = JSON.parse(JSON.stringify(cell.style));
  });
  return { styles, rowHeight };
};

const applyRowStyles = (row, styles, rowHeight) => {
  Object.entries(styles).forEach(([colNum, style]) => {
    row.getCell(Number(colNum)).style = JSON.parse(JSON.stringify(style));
  });
  if (rowHeight) row.height = rowHeight;
};

const mapPlaceholderColumns = (row) => {
  const map = {};
  row.eachCell({ includeEmpty: true }, (cell, colNum) => {
    if (typeof cell.value === "string" && cell.value.startsWith("{{")) {
      map[cell.value.trim()] = colNum;
    }
  });
  return map;
};

const fillFindings = (sheet, findings) => {
  let anchorRowNum = null;

  sheet.eachRow((row, rowNumber) => {
    row.eachCell({ includeEmpty: false }, (cell) => {
      if (cell.value === "{{findings_start}}") {
        anchorRowNum = rowNumber;
      }
    });
  });

  if (anchorRowNum === null) {
    throw new Error("Template missing {{findings_start}} anchor.");
  }

  const anchorRow = sheet.getRow(anchorRowNum);
  const placeholderColMap = mapPlaceholderColumns(anchorRow);
  const { styles, rowHeight } = captureRowStyles(anchorRow);

  const colFieldMap = {};
  Object.entries(placeholderColMap).forEach(([placeholder, colNum]) => {
    if (FINDING_FIELD_MAP[placeholder]) {
      colFieldMap[colNum] = FINDING_FIELD_MAP[placeholder];
    }
  });

  findings.forEach((finding, index) => {
    const rowNum = anchorRowNum + index;
    const row = sheet.getRow(rowNum);

    applyRowStyles(row, styles, rowHeight || 100);

    Object.entries(colFieldMap).forEach(([colNum, resolver]) => {
      const cell = row.getCell(Number(colNum));
      cell.value = sanitize(resolver(finding));
    });

    const urlColNum = placeholderColMap["{{affectedURL}}"];
    if (urlColNum && finding.affectedURL) {
      const urlCell = row.getCell(urlColNum);
      const url = finding.affectedURL;
      if (isAbsoluteUrl(url)) {
        urlCell.value = { text: url, hyperlink: url };
        urlCell.font = { color: { argb: "FF0563C1" }, underline: true };
      } else {
        urlCell.value = sanitize(url);
      }
    }

    const evidenceColNum = placeholderColMap["{{testEvidence}}"];
    if (evidenceColNum) {
      const evidenceCell = row.getCell(evidenceColNum);
      const annexureRow = 2 + index * 30;
      evidenceCell.value = { formula: `HYPERLINK("#Annexures!B${annexureRow}","Annexures")`, result: "Annexures" };
      evidenceCell.font = { color: { argb: "FF0563C1" }, underline: true };
    }

    const severityColNum = placeholderColMap["{{severity}}"];
    if (severityColNum) {
      const severityCell = row.getCell(severityColNum);
      const color = SEVERITY_COLORS[finding.severity] || "888888";
      severityCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: `FF${color}` },
      };
      severityCell.font = {
        bold: true,
        color: { argb: "FFFFFFFF" },
      };
      severityCell.alignment = {
        vertical: "middle",
        horizontal: "center",
      };
    }

    const maxCol = Math.max(...Object.keys(styles).map(Number));
    applyBorders(row, 1, maxCol);

    row.commit();
  });

};

const fillAnnexures = async (workbook, findings, { showDescriptions = false } = {}) => {
  const sheet = workbook.getWorksheet("Annexures");
  if (!sheet) return;

  const ROWS_PER_ISSUE = 30;
  const START_ROW = 2;
  const IMAGES_PER_ROW = 3;
  const IMAGE_ROW_COUNT = 19;
  const IMAGE_WIDTH = 400;
  const IMAGE_HEIGHT = 300;
  // Col A is the step-label column; then 3 image slots of 4 cols each (B–E, F–I, J–M) = 13 cols total.
  // Each col ~14.3 chars ≈ 105px → 4 cols ≈ 420px, enough for a 400px image.
  const COLS_PER_SLOT = 4;
  const TOTAL_COLS = 1 + COLS_PER_SLOT * IMAGES_PER_ROW; // 13

  // Widen Annexures columns once so images don't overlap
  for (let c = 1; c <= TOTAL_COLS; c++) {
    sheet.getColumn(c).width = 14.3;
  }

  // Caption cell positions per slot (1-based col): label | caption text
  // Label sits in the col just before each image slot; caption sits at image-slot start.
  const CAPTION_LAYOUT = [
    { labelCol: 1,  captionCol: 2  },  // A / B  (image starts at B)
    { labelCol: 5,  captionCol: 6  },  // E / F  (image starts at F)
    { labelCol: 9,  captionCol: 10 },  // I / J  (image starts at J)
  ];
  // Image tl.col (0-based): B(1), F(5), J(9)
  const IMAGE_COL_OFFSETS = [1, 5, 9];

  for (let i = 0; i < findings.length; i++) {
    const finding = findings[i];
    const issueStartRow = START_ROW + i * ROWS_PER_ISSUE;
    let currentRow = issueStartRow;

    const titleRow = sheet.getRow(currentRow);
    titleRow.height = 24;
    const titleCell = titleRow.getCell(2);
    titleCell.value = sanitize(finding.issueName);
    titleCell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 12 };
    titleCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1F3864" },
    };
    titleCell.alignment = { vertical: "middle", horizontal: "left" };
    sheet.mergeCells(currentRow, 2, currentRow, TOTAL_COLS);
    applyBorders(titleRow, 1, TOTAL_COLS);
    titleRow.commit();
    currentRow += 1;

    // 1 blank row gap after the title
    sheet.getRow(currentRow).height = 8;
    sheet.getRow(currentRow).commit();
    currentRow += 1;

    const steps = finding.annexureSteps || [];

    for (let g = 0; g < steps.length; g += IMAGES_PER_ROW) {
      const group = steps.slice(g, g + IMAGES_PER_ROW);

      // Caption row — only rendered when descriptions are enabled and at least one step has one
      const hasCaptions = showDescriptions && group.some((s) => s.caption);
      if (hasCaptions) {
        const captionRow = sheet.getRow(currentRow);
        captionRow.height = 18;
        group.forEach((step, idx) => {
          if (step.caption) {
            const { captionCol } = CAPTION_LAYOUT[idx];
            captionRow.getCell(captionCol).value = sanitize(step.caption);
          }
        });
        captionRow.commit();
        currentRow += 1;
      }

      // Place images side by side
      const hasAnyImage = group.some((s) => s.imageBase64);
      group.forEach((step, idx) => {
        if (!step.imageBase64) return;
        const normalizedBase64 = step.imageBase64.startsWith("data:")
          ? step.imageBase64
          : `data:${step.imageMimeType || "image/png"};base64,${step.imageBase64}`;
        const imageId = workbook.addImage({
          base64: normalizedBase64,
          extension: (step.imageMimeType || "image/png").split("/")[1],
        });
        sheet.addImage(imageId, {
          tl: { col: IMAGE_COL_OFFSETS[idx], row: currentRow - 1 },
          ext: { width: IMAGE_WIDTH, height: IMAGE_HEIGHT },
        });
      });

      const rowCount = hasAnyImage ? IMAGE_ROW_COUNT : 1;
      for (let r = 0; r < rowCount; r++) {
        sheet.getRow(currentRow).height = 16;
        sheet.getRow(currentRow).commit();
        currentRow += 1;
      }
    }

    sheet.getRow(currentRow).height = 12;
    sheet.getRow(currentRow).commit();
  }
};

export const exportToExcel = async (findings, templateBuffer, reportMeta = {}, options = {}) => {
  if (!templateBuffer) throw new Error("No template loaded.");
  if (!findings.length) throw new Error("No findings to export.");

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(templateBuffer);

  // The template has defined names referencing external workbooks (e.g. '[2]Threat_Database').
  // ExcelJS drops the external link files but keeps these defined names, causing Excel to flag
  // the output as corrupt. Strip any defined names whose ranges point to external workbooks.
  const dns = workbook.definedNames;
  dns.model = dns.model.filter((dn) => dn.ranges.every((r) => !r.includes("[")));

  const observationsSheet = workbook.getWorksheet("Observations");
  if (!observationsSheet) throw new Error('Sheet "Observations" not found in template.');

  fillMetaPlaceholders(workbook, reportMeta);
  fillFindings(observationsSheet, findings);
  await fillAnnexures(workbook, findings, options);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `vapt-report-${Date.now()}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
};
