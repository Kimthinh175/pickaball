// ==========================================
// CORE SVG AVATAR GENERATOR
// ==========================================

export function svgAvatar(name) {
    const colors = ['#0b6996', '#0b8a6e', '#6b0b99', '#99490b', '#0b3d99', '#379de0', '#f5782b', '#10b981'];
    const h = [...(name || '?')].reduce((acc, c) => acc * 31 + c.charCodeAt(0), 0);
    const bg = colors[Math.abs(h) % colors.length];
    const parts = (name || '?').trim().split(/\s+/);
    const ini = parts.length >= 2
        ? (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase()
        : (name || '?').slice(0, 2).toUpperCase();

    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96'>
        <rect width='96' height='96' rx='48' fill='${bg}'/>
        <text x='48' y='63' font-family='Arial, sans-serif' font-size='34' fill='#ffffff' text-anchor='middle' font-weight='bold'>${ini}</text>
    </svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}
