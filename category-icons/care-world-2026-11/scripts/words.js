// شعارات مكتوبة لكل براند (تقريب لهويته)
const WORD = {
  evoluderm: (s, c) => `<div style="display:inline-flex;flex-direction:column;align-items:center;direction:ltr">
      <svg width="${430 * s}" height="${26 * s}" viewBox="0 0 430 26"><path d="M8 22 Q215 -6 422 22" fill="none" stroke="${c}" stroke-width="3"/></svg>
      <span style="font-family:Nunito;font-weight:800;font-size:${104 * s}px;line-height:1;letter-spacing:.01em;color:${c}">Evoluderm</span>
      <svg width="${430 * s}" height="${26 * s}" viewBox="0 0 430 26"><path d="M8 4 Q215 32 422 4" fill="none" stroke="${c}" stroke-width="3"/></svg></div>`,
  cerave: (s, c) => `<span class="lat" style="font-family:Montserrat;font-weight:700;font-size:${96 * s}px;letter-spacing:-.01em;color:${c}">Cera<span style="font-weight:800">Ve</span></span>`,
  'la-roche-posay': (s, c) => `<div class="lat" style="text-align:center"><div style="font-family:Jost;font-weight:500;font-size:${62 * s}px;letter-spacing:.12em;color:${c}">LA ROCHE-POSAY</div><div style="font-family:Jost;font-weight:400;font-size:${17 * s}px;letter-spacing:.42em;color:${c};opacity:.75;margin-top:${8 * s}px">LABORATOIRE DERMATOLOGIQUE</div></div>`,
  bioderma: (s, c) => `<div class="lat" style="text-align:center"><div style="font-family:Montserrat;font-weight:800;font-size:${80 * s}px;letter-spacing:.05em;color:${c}">BIODERMA</div><div style="font-family:Jost;font-weight:400;font-size:${17 * s}px;letter-spacing:.42em;color:${c};opacity:.75;margin-top:${8 * s}px">LABORATOIRE DERMATOLOGIQUE</div></div>`,
  eucerin: (s, c) => `<span class="lat" style="font-family:'Playfair Display';font-weight:700;font-size:${100 * s}px;letter-spacing:.01em;color:${c}">Eucerin</span>`,
  avene: (s, c) => `<div class="lat" style="text-align:center"><div style="font-family:Jost;font-weight:400;font-size:${18 * s}px;letter-spacing:.5em;color:${c};opacity:.8;margin-bottom:${6 * s}px">EAU THERMALE</div><div style="font-family:'Playfair Display';font-weight:600;font-size:${100 * s}px;color:${c};line-height:1">Avène</div></div>`,
  lierac: (s, c) => `<div class="lat" style="text-align:center"><div style="font-family:Jost;font-weight:300;font-size:${86 * s}px;letter-spacing:.34em;margin-left:-.34em;color:${c}">LIERAC</div><div style="font-family:Jost;font-weight:400;font-size:${18 * s}px;letter-spacing:1em;color:${c};opacity:.7;margin-top:${8 * s}px">PARIS</div></div>`,
  beesline: (s, c) => `<span class="lat" style="font-family:Montserrat;font-weight:700;font-size:${92 * s}px;color:${c}">Beesline<span style="font-size:.4em;vertical-align:super;font-weight:500">®</span></span>`,
  'the-ordinary': (s, c) => `<span class="lat" style="font-family:Inter;font-weight:500;font-size:${86 * s}px;letter-spacing:-.02em;color:${c}">The Ordinary.</span>`,
  anua: (s, c) => `<span class="lat" style="font-family:Montserrat;font-weight:500;font-size:${92 * s}px;letter-spacing:.34em;margin-left:-.34em;color:${c}">ANUA</span>`,
  'loreal-professionnel': (s, c) => `<div class="lat" style="text-align:center"><div style="font-family:'Playfair Display';font-weight:700;font-size:${74 * s}px;letter-spacing:.04em;color:${c};line-height:1">L'ORÉAL</div><div style="font-family:Jost;font-weight:500;font-size:${24 * s}px;letter-spacing:.5em;color:${c};margin-top:${8 * s}px">PROFESSIONNEL</div></div>`,
  kerastase: (s, c) => `<div class="lat" style="text-align:center"><div style="font-family:'Bodoni Moda';font-weight:600;font-size:${78 * s}px;letter-spacing:.14em;margin-left:-.14em;color:${c};line-height:1">KÉRASTASE</div><div style="font-family:Jost;font-weight:400;font-size:${18 * s}px;letter-spacing:1em;color:${c};opacity:.7;margin-top:${10 * s}px">PARIS</div></div>`,
};
module.exports = { WORD };
