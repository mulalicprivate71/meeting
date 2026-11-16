/* ============ DOCX IZVOZ (uređivi Word dokument na memorandumu ustanove) ============ */
const DX = (() => {
  const FONT = "Century Gothic", LANG = "bs-Latn-BA";
  const CFGS = {
    IDSS: {W: 10335, A: "035EA1", L: "08ABE6", ind: '<w:ind w:right="1800"/>'},
    IMH:  {W: 9360,  A: "9F633F", L: "2CB14D", ind: '<w:ind w:left="-709" w:right="-705"/>'}
  };
  // Uklanja znakove koji nisu dozvoljeni u XML 1.0 (inače Word odbije otvoriti dokument), uključujući neparne surrogate.
  const CIST = s => {
    s = String(s ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, "");
    let o = "";
    for (let i = 0; i < s.length; i++) {
      const c = s.charCodeAt(i);
      if (c >= 0xD800 && c <= 0xDBFF) { const n = s.charCodeAt(i + 1); if (n >= 0xDC00 && n <= 0xDFFF) { o += s[i] + s[i + 1]; i++; } else o += "\uFFFD"; }
      else if (c >= 0xDC00 && c <= 0xDFFF) o += "\uFFFD";
      else o += s[i];
    }
    return o;
  };
  const X = s => CIST(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\t/g, " ");
  const rpr = ({sz = 18, b = false, color = null, i = false} = {}) =>
    `<w:rPr><w:rFonts w:ascii="${FONT}" w:hAnsi="${FONT}" w:cs="${FONT}"/>${b ? "<w:b/>" : ""}${i ? "<w:i/>" : ""}${color ? `<w:color w:val="${color}"/>` : ""}<w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/><w:lang w:val="${LANG}"/></w:rPr>`;
  const run = (t, o = {}) => `<w:r>${rpr(o)}<w:t xml:space="preserve">${X(t)}</w:t></w:r>`;
  const para = (content = "", o = {}) => {
    const {jc = "left", before = 0, after = 0, sz = 18, keep = false, ind = 0} = o;
    return `<w:p><w:pPr>${keep ? "<w:keepNext/>" : ""}<w:spacing w:before="${before}" w:after="${after}" w:line="252" w:lineRule="auto"/>${ind ? `<w:ind w:left="${ind}"/>` : ""}<w:jc w:val="${jc}"/>${rpr({sz})}</w:pPr>${content}</w:p>`;
  };
  const text = (t, o = {}) => CIST(t).split(/\r\n|\r|\n/).map(l => para(l ? run(l, o) : "", {sz: o.sz, keep: o.keep})).join("");
  const tc = (w, content, o = {}) => {
    const {fill = null, span = 1, valign = "center"} = o;
    return `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/>${span > 1 ? `<w:gridSpan w:val="${span}"/>` : ""}${fill ? `<w:shd w:val="clear" w:color="auto" w:fill="${fill}"/>` : ""}<w:tcMar><w:top w:w="50" w:type="dxa"/><w:left w:w="90" w:type="dxa"/><w:bottom w:w="50" w:type="dxa"/><w:right w:w="90" w:type="dxa"/></w:tcMar><w:vAlign w:val="${valign}"/></w:tcPr>${content}</w:tc>`;
  };
  const table = (cols, rows, line, heights = []) => {
    const total = cols.reduce((a, b) => a + b, 0);
    const bd = ["top", "left", "bottom", "right", "insideH", "insideV"].map(s => `<w:${s} w:val="single" w:sz="4" w:space="0" w:color="${line}"/>`).join("");
    let out = `<w:tbl><w:tblPr><w:tblW w:w="${total}" w:type="dxa"/><w:tblBorders>${bd}</w:tblBorders><w:tblLayout w:type="fixed"/><w:tblLook w:val="0000"/></w:tblPr><w:tblGrid>${cols.map(c => `<w:gridCol w:w="${c}"/>`).join("")}</w:tblGrid>`;
    rows.forEach((r, ri) => {
      if (ri < rows.length - 1) r = r.replace(/<w:keepNext\/>/g, "").replace(/<w:pPr>/g, "<w:pPr><w:keepNext/>");
      const h = heights[ri];
      out += `<w:tr><w:trPr><w:cantSplit/>${h ? `<w:trHeight w:val="${h}" w:hRule="atLeast"/>` : ""}</w:trPr>${r}</w:tr>`;
    });
    return out + "</w:tbl>";
  };
  const spaced = s => s.split(" ").map(w => w.split("").join(" ")).join("   ");
  const cap = t => { t = String(t || "").trim(); return t ? t.charAt(0).toUpperCase() + t.slice(1) : t; };
  const fmtD = iso => { if (!iso) return ""; const p = String(iso).slice(0, 10).split("-"); return p.length === 3 ? `${p[2]}.${p[1]}.${p[0]}.` : String(iso); };
  const cb = (on, t) => (on ? "☒ " : "☐ ") + t;

  function body(m, c, o) {
    const {W, A, L} = c, joint = o.joint, izvod = o.izvod;
    const ok = x => !izvod || x === "zajedničko" || x === izvod;
    const out = [];
    const section = t => out.push(para(run(t, {sz: 20, b: true, color: A}), {before: 200, after: 70, keep: true}));
    const hrow = (cols, labels) => cols.map((w, i) => tc(w, para(run(labels[i], {sz: 16, b: true, color: "FFFFFF"})), {fill: A})).join("");
    const lab = (w, t) => tc(w, para(run(t, {sz: 16, b: true, color: A})));
    const val = (w, t = "", span = 1) => tc(w, text(t, {sz: 18}), {span});
    const note = (t, o2 = {}) => out.push(para(run(t, {sz: 14, i: true}), o2));
    const gap = n => out.push(para("", {sz: 2}).replace('w:line="252"', `w:line="${n}"`));

    out.push(para(run(`Broj zapisnika: ${m.broj || "____"}        Sarajevo, ${fmtD(m.datum) || "______________"}`, {sz: 18}), {after: 140}));
    out.push(para(run(spaced(joint ? "ZAPISNIK SA ZAJEDNIČKOG SASTANKA UPRAVE" : "ZAPISNIK SA SASTANKA") + (izvod ? "  —  IZVOD ZA " + izvod : ""), {sz: joint ? 26 : 30, b: true, color: A}), {jc: "center", after: 40}));
    o.names.forEach(n => out.push(para(run(n, {sz: 15, i: true}), {jc: "center", after: 20})));
    out.push(para("", {after: 120, sz: 4}));

    // 1. Vrsta
    section("1. Vrsta sastanka");
    const tipovi = joint
      ? [["Redovni sastanak uprave", "Vanredni sastanak uprave"], ["Strateški / planski sastanak", "Drugo"]]
      : [["Razgovor sa zaposlenim", "Individualni roditeljski sastanak"], ["Grupni (razredni) roditeljski sastanak", "Sastanak sa partnerom"], ["Radni sastanak tima / stručnog organa", "Drugo"]];
    const known = tipovi.flat();
    const half = Math.floor(W / 2);
    out.push(table([half, W - half], tipovi.map(pair => pair.map(t => {
      const on = m.tip === t || (t === "Drugo" && !known.includes(m.tip));
      return tc(half, para(run(cb(on, t) + (t === "Drugo" ? (on && m.tip !== "Drugo" ? ": " + m.tip : ": ______________________") : ""), {sz: 18})));
    }).join("")), L));

    // 2. Osnovni podaci
    section("2. Osnovni podaci");
    const c4 = [Math.floor(W * .2), Math.floor(W * .3), Math.floor(W * .2)]; c4.push(W - c4[0] - c4[1] - c4[2]);
    const rest3 = c4[1] + c4[2] + c4[3];
    out.push(table(c4, [
      lab(c4[0], "Tema sastanka") + val(rest3, m.tema, 3),
      lab(c4[0], "Mjesto održavanja") + val(c4[1], m.mjesto) + lab(c4[2], "Datum") + val(c4[3], fmtD(m.datum)),
      lab(c4[0], "Vrijeme početka") + val(c4[1], m.pocetak) + lab(c4[2], "Vrijeme završetka") + val(c4[3], m.kraj),
      lab(c4[0], "Nivo povjerljivosti") + tc(rest3, para(run(["Opći", "Povjerljiv", "Strogo povjerljivo"].map(x => cb(m.povjerljivost === x, x)).join("      "), {sz: 18})), {span: 3}),
      lab(c4[0], "Snimanje sastanka") + tc(rest3, para(run(cb(!m.snimano, "Ne") + "      " + cb(!!m.snimano, "Da, uz saglasnost svih prisutnih (evidentirano prije početka)"), {sz: 18})), {span: 3})
    ], L));

    // 3. Prisutni
    section("3. Prisutni, odsutni i učesnici bez prava glasa");
    const pc = [600, Math.floor(W * .38), Math.floor(W * .27)]; pc.push(W - pc[0] - pc[1] - pc[2]);
    const pris = m.prisutni.filter(p => p.ime || p.uloga || p.napomena);
    const nP = Math.max(5, pris.length);
    const prow = [hrow(pc, ["R.br.", "Ime i prezime", "Funkcija / uloga", "Napomena (kasniji dolazak, raniji odlazak, vrijeme)"])];
    for (let i = 0; i < nP; i++) { const p = pris[i] || {}; prow.push(tc(pc[0], para(run(String(i + 1), {sz: 16}), {jc: "center"})) + val(pc[1], p.ime) + val(pc[2], p.uloga) + val(pc[3], p.napomena)); }
    out.push(table(pc, prow, L, [null, ...Array(nP).fill(330)]));
    gap(60);
    const c2 = [Math.floor(W / 2), W - Math.floor(W / 2)];
    const lblcell = (w, l, v, span = 1) => tc(w, para(run(l, {sz: 16, b: true, color: A})) + text(v, {sz: 18}), {span});
    out.push(table(c2, [
      lblcell(c2[0], "Opravdano odsutni (ime i prezime):", m.odsutniOp) + lblcell(c2[1], "Neopravdano odsutni (ime i prezime):", m.odsutniNeop),
      lblcell(W, "Učesnici bez prava glasa (ime i prezime, funkcija):", m.bezGlasa, 2)
    ], L, [620, 520]));

    // 4. Kvorum
    section("4. Kvorum, predsjedavajući i zapisničar");
    const k = [Math.floor(W * .22), Math.floor(W * .28), Math.floor(W * .22)]; k.push(W - k[0] - k[1] - k[2]);
    out.push(table(k, [
      lab(k[0], "Kvorum") + tc(k[1] + k[2] + k[3], para(run(["Ostvaren", "Nije ostvaren", "Nije potreban"].map(x => cb(m.kvorum === x, x)).join("      "), {sz: 16})), {span: 3}),
      lab(k[0], "Predsjedavajući") + val(k[1], m.predsjedavajuci) + lab(k[2], "Zapisničar") + val(k[3], m.zapisnicar)
    ], L));

    // 5. Dnevni red
    const tacke = m.tacke.filter(t => ok(t.oznaka));
    section("5. Dnevni red");
    const dc = joint ? [850, W - 850 - 1900 - 1800, 1800, 1900] : [850, W - 850 - 1900, 1900];
    const dlab = joint ? ["Tačka", "Predmet", "Ustanova (IMH / IDSS / zajedničko)", "Prijedlog usvojen? (za / protiv / suzdržani)"] : ["Tačka", "Predmet", "Prijedlog usvojen? (za / protiv / suzdržani)"];
    const nD = Math.max(4, tacke.length);
    const drow = [hrow(dc, dlab)];
    for (let i = 0; i < nD; i++) {
      const t = tacke[i];
      const glas = t && (t.za || t.protiv || t.suzdrzani) ? `${t.za || "-"} / ${t.protiv || "-"} / ${t.suzdrzani || "-"}` : "";
      drow.push(tc(dc[0], para(run(`${i + 1}.`, {sz: 16}), {jc: "center"})) + val(dc[1], t ? cap(t.naslov) : "") + (joint ? val(dc[2], t ? t.oznaka : "") : "") + val(dc[dc.length - 1], glas));
    }
    out.push(table(dc, drow, L, [null, ...Array(nD).fill(330)]));
    note("Predsjedavajući predlaže dnevni red i daje ga na usvajanje; prisutni ga glasanjem usvajaju i mogu ga dopuniti.", {before: 40});

    // 6. Tok
    section("6. Tok sastanka po tačkama dnevnog reda");
    out.push(para(run("Za svaku tačku: ime osobe koja je učestvovala u raspravi i sažet prikaz njenog izlaganja. Ništa se ne bilježi što nije izrečeno.", {sz: 14, i: true}), {after: 60, keep: true}));
    const tk = [Math.floor(W * .22), W - Math.floor(W * .22)];
    const nT = Math.max(1, tacke.length);
    for (let n = 0; n < nT; n++) {
      const t = tacke[n] || {naslov: "", oznaka: "", rasprava: "", nacin: "", za: "", protiv: "", suzdrzani: "", zakljucak: "", izdvojeno: ""};
      const ozn = joint ? "   " + ["IMH", "IDSS", "zajedničko"].map(x => cb(t.oznaka === x, x)).join("  ") : "";
      out.push(table(tk, [
        tc(W, para(run(`Ad ${n + 1}.  ${cap(t.naslov) || "____________________________________________"}${ozn}`, {sz: 18, b: true, color: "FFFFFF"}), {keep: true}), {fill: A, span: 2}),
        tc(tk[0], para(run("Rasprava", {sz: 16, b: true, color: A}), {keep: true}), {valign: "top"}) + tc(tk[1], text(t.rasprava, {sz: 18, keep: true})),
        lab(tk[0], "Rezultat glasanja") + tc(tk[1], para(run(`Za: ${t.za || "____"}     Protiv: ${t.protiv || "____"}     Suzdržani: ${t.suzdrzani || "____"}     ` + ["Javno", "Tajno", "Bez glasanja"].map(x => cb(t.nacin === x, x)).join("   "), {sz: 16}))),
        tc(tk[0], para(run("Zaključak", {sz: 16, b: true, color: A})), {valign: "top"}) + tc(tk[1], text(t.zakljucak, {sz: 18})),
        tc(tk[0], para(run("Izdvojeno mišljenje", {sz: 16, b: true, color: A})), {valign: "top"}) + tc(tk[1], text(t.izdvojeno, {sz: 18}))
      ], L, [null, 900, null, 520, 380]));
      gap(120);
    }

    // 7. Zadaci
    const zad = m.zadaci.filter(z => z.zadatak && ok(z.oznaka));
    section("7. Zadaci i dogovori");
    const zc = [600, Math.floor(W * (joint ? .38 : .42)), Math.floor(W * .2), 1500];
    zc.push(W - zc.reduce((a, b) => a + b, 0) - (joint ? 1400 : 0)); if (joint) zc.push(1400);
    const nZ = Math.max(5, zad.length);
    const zrow = [hrow(zc, ["R.br.", "Zadatak / dogovor", "Odgovorna osoba", "Krajnji rok", "Status", ...(joint ? ["Ustanova"] : [])])];
    for (let i = 0; i < nZ; i++) {
      const z = zad[i] || {};
      zrow.push(tc(zc[0], para(run(String(i + 1), {sz: 16}), {jc: "center"})) + val(zc[1], z.zadatak) + val(zc[2], z.odgovorna) + val(zc[3], fmtD(z.rok)) + val(zc[4], z.zadatak ? z.status : "") + (joint ? val(zc[5], z.oznaka) : ""));
    }
    out.push(table(zc, zrow, L, [null, ...Array(nZ).fill(330)]));
    note("Svaki zadatak mora imati odgovornu osobu i krajnji rok (QP 01).", {before: 40});

    // 8. Prilozi
    section("8. Prilozi i naredni sastanak");
    out.push(table([c4[0], W - c4[0]], [lab(c4[0], "Prilozi uz zapisnik") + val(W - c4[0], m.prilozi), lab(c4[0], "Naredni sastanak") + val(W - c4[0], m.naredni)], L));

    // 9. Ovjera
    section("9. Ovjera zapisnika");
    const oc = [Math.floor(W * .22), Math.floor(W * .28), Math.floor(W * .22)]; oc.push(W - oc[0] - oc[1] - oc[2]);
    const potv = m.status === "potvrdjen";
    out.push(table(oc, [
      lab(oc[0], "Vrijeme završetka") + val(oc[1], m.kraj) + lab(oc[2], "Status") + tc(oc[3], para(run(cb(!potv, "Nacrt") + "      " + cb(potv, "Potvrđen"), {sz: 18}))),
      lab(oc[0], "Zapisničar (potpis)") + val(oc[1], "") + lab(oc[2], "Predsjedavajući (potpis)") + val(oc[3], ""),
      lab(oc[0], "Datum potvrde") + val(oc[1], potv ? fmtD(m.potvrdjenoKada) : "") + lab(oc[2], "Potvrdio (ime i prezime)") + val(oc[3], potv ? m.potvrdio : "")
    ], L, [null, 780, null]));
    return out.join("");
  }

  function footerCtrl(c, code, form, edition) {
    const r = (t, o = {}) => run(t, {sz: 15, ...o});
    const fld = ins => `<w:r>${rpr({sz: 15})}<w:fldChar w:fldCharType="begin"/></w:r><w:r>${rpr({sz: 15})}<w:instrText xml:space="preserve"> ${ins} </w:instrText></w:r><w:r>${rpr({sz: 15})}<w:fldChar w:fldCharType="separate"/></w:r><w:r>${rpr({sz: 15})}<w:t>1</w:t></w:r><w:r>${rpr({sz: 15})}<w:fldChar w:fldCharType="end"/></w:r>`;
    return `<w:p><w:pPr><w:pBdr><w:top w:val="single" w:sz="6" w:space="4" w:color="${c.A}"/></w:pBdr><w:spacing w:before="0" w:after="40" w:line="240" w:lineRule="auto"/>${c.ind}${rpr({sz: 15})}</w:pPr>`
      + r(code, {b: true, color: c.A}) + r(`   |   ${form}   |   Izdanje ${edition}   |   Strana `) + fld("PAGE") + r(" od ") + fld("NUMPAGES") + "</w:p>";
  }
  const namesXml = names => names.map(nm => `<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:ind w:right="1800"/>${rpr({sz: 14})}</w:pPr>${run(nm, {sz: 14})}</w:p>`).join("");

  async function izvezi(m, izvod, USTANOVE, TPL, kod, izdanje) {
    if (!window.JSZip) throw new Error("Biblioteka za DOCX izvoz nije učitana.");
    const joint = m.scope === "ZAJEDNICKI";
    const key = izvod || (joint ? "IDSS" : m.scope);
    const c = CFGS[key];
    const names = (joint && !izvod) ? [USTANOVE.IDSS.naziv, USTANOVE.IMH.naziv] : [USTANOVE[key].naziv];
    const code = joint ? "QP 10.ZS-02" : kod;
    const form = joint ? "Zapisnik sa zajedničkog sastanka uprave" : "Zapisnik sa sastanka";
    const zip = await JSZip.loadAsync(TPL[key], {base64: true});
    let doc = await zip.file("word/document.xml").async("string");
    const tijelo = body(m, c, {joint, izvod, names});
    doc = doc.replace("@@BODY@@", () => tijelo);
    zip.file("word/document.xml", doc);
    let ft = await zip.file("word/footer1.xml").async("string");
    const ctrlX = footerCtrl(c, code + (izvod ? " (izvod)" : ""), form + (izvod ? " – izvod" : ""), izdanje), namesX = namesXml(names);
    ft = ft.replace("@@CTRL@@", () => ctrlX).replace("@@NAMES@@", () => namesX);
    zip.file("word/footer1.xml", ft);
    return zip.generateAsync({type: "blob", compression: "DEFLATE", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"});
  }
  return {izvezi};
})();
