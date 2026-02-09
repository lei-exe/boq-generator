function parseNumber(value) {
    return parseFloat(String(value).replace(/,/g, '')) || 0;
}

function formatNumber(value) {
    return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Expose globally
window.parseNumber = parseNumber;
window.formatNumber = formatNumber;
