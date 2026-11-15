import os
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
import re, shutil, os, sys, subprocess
from xml.sax.saxutils import escape

SRC = os.path.join(ROOT,'build','att')
OUT = os.path.join(ROOT,"forms")
WORK = os.path.join(ROOT,"build","work")

CODE = 'QP 10.ZS-01'
FORM = 'Zapisnik sa sastanka'
EDITION = '01'

CFG = {
    'idss': dict(src='9905a83a', width=10335, accent='035EA1', line='08ABE6', top_pad=0, top_margin=1350,
                 name='Privatna ustanova INTERNATIONALE DEUTSCHE SCHULE SARAJEVO – Međunarodna njemačka škola Sarajevo',
                 short='IDSS', out='Zapisnik_sa_sastanka_IDSS_QP10-ZS-01.docx'),
    'zajednicki': dict(src='9905a83a', width=10335, accent='035EA1', line='08ABE6', top_pad=0, top_margin=1350, joint=True,
                 code='QP 10.ZS-02', form='Zapisnik sa zajedni\u010dkog sastanka uprave',
                 title='Z A P I S N I K   S A   Z A J E D N I \u010c K O G   S A S T A N K A   U P R A V E',
                 name='Privatna ustanova INTERNATIONALE DEUTSCHE SCHULE SARAJEVO \u2013 Me\u0111unarodna njema\u010dka \u0161kola Sarajevo  |  Privatna predškolska ustanova \u201eInternational Montessori House\u201c Sarajevo',
                 names=['Privatna ustanova INTERNATIONALE DEUTSCHE SCHULE SARAJEVO \u2013 Me\u0111unarodna njema\u010dka \u0161kola Sarajevo',
                        'Privatna predškolska ustanova \u201eInternational Montessori House\u201c Sarajevo'],
                 short='ZAJ', out='Zapisnik_zajednicki_sastanak_uprave_QP10-ZS-02.docx'),
    'imh': dict(src='45932168', width=9360, accent='9F633F', line='2CB14D', top_pad=0,
                name='Privatna predškolska ustanova „International Montessori House“ Sarajevo',
                short='IMH', out='Zapisnik_sa_sastanka_IMH_QP10-ZS-01.docx'),
}
FONT = 'Century Gothic'
LANG = 'bs-Latn-BA'


def rpr(sz=18, b=False, color=None, i=False):
    s = f'<w:rFonts w:ascii="{FONT}" w:hAnsi="{FONT}" w:cs="{FONT}"/>'
    if b: s += '<w:b/>'
    if i: s += '<w:i/>'
    if color: s += f'<w:color w:val="{color}"/>'
    s += f'<w:sz w:val="{sz}"/><w:szCs w:val="{sz}"/><w:lang w:val="{LANG}"/>'
    return f'<w:rPr>{s}</w:rPr>'


def run(t, **k):
    return f'<w:r>{rpr(**k)}<w:t xml:space="preserve">{escape(t)}</w:t></w:r>'


def para(content='', jc='left', before=0, after=0, sz=18, keep=False, ind=None, **k):
    if isinstance(content, str) and not content.startswith('<w:'):
        content = run(content, sz=sz, **k) if content else ''
    kn = '<w:keepNext/>' if keep else ''
    ind_x = f'<w:ind w:left="{ind}"/>' if ind else ''
    return (f'<w:p><w:pPr>{kn}<w:spacing w:before="{before}" w:after="{after}" w:line="252" w:lineRule="auto"/>{ind_x}'
            f'<w:jc w:val="{jc}"/>{rpr(sz=sz)}</w:pPr>{content}</w:p>')


def tc(width, content, fill=None, span=1, vmerge=None, borders=None, valign='center', color_line='888888'):
    shd = f'<w:shd w:val="clear" w:color="auto" w:fill="{fill}"/>' if fill else ''
    gs = f'<w:gridSpan w:val="{span}"/>' if span > 1 else ''
    return (f'<w:tc><w:tcPr><w:tcW w:w="{width}" w:type="dxa"/>{gs}{shd}'
            f'<w:tcMar><w:top w:w="50" w:type="dxa"/><w:left w:w="90" w:type="dxa"/><w:bottom w:w="50" w:type="dxa"/><w:right w:w="90" w:type="dxa"/></w:tcMar>'
            f'<w:vAlign w:val="{valign}"/></w:tcPr>{content}</w:tc>')


def table(cols, rows, line, heights=None):
    total = sum(cols)
    grid = ''.join(f'<w:gridCol w:w="{c}"/>' for c in cols)
    b = f'w:val="single" w:sz="4" w:space="0" w:color="{line}"'
    borders = ''.join(f'<w:{s} {b}/>' for s in ('top', 'left', 'bottom', 'right', 'insideH', 'insideV'))
    out = (f'<w:tbl><w:tblPr><w:tblW w:w="{total}" w:type="dxa"/><w:tblBorders>{borders}</w:tblBorders>'
           f'<w:tblLayout w:type="fixed"/><w:tblLook w:val="0000"/></w:tblPr><w:tblGrid>{grid}</w:tblGrid>')
    for ri, r in enumerate(rows):
        if ri < len(rows) - 1:
            r = r.replace('<w:keepNext/>', '').replace('<w:pPr>', '<w:pPr><w:keepNext/>')
        h = heights[ri] if heights and heights[ri] else None
        trpr = '<w:trPr><w:cantSplit/>' + (f'<w:trHeight w:val="{h}" w:hRule="atLeast"/>' if h else '') + '</w:trPr>'
        out += f'<w:tr>{trpr}{r}</w:tr>'
    return out + '</w:tbl>'


def build_body(cfg, variant_note=True):
    W = cfg['width']; A = cfg['accent']; L = cfg['line']
    body = []

    def spacer(n=120):
        body.append(para('', after=0, before=0, sz=2).replace('w:line="252"', f'w:line="{n}"'))

    def section(title):
        body.append(para(run(title, sz=20, b=True, color=A), before=200, after=70, keep=True))

    def head_row(cols, labels):
        return ''.join(tc(c, para(run(t, sz=16, b=True, color='FFFFFF'), jc='left'), fill=A) for c, t in zip(cols, labels))

    def label_cell(w, t):
        return tc(w, para(run(t, sz=16, b=True, color=A)))

    def val_cell(w, t='', span=1):
        return tc(w, para(run(t, sz=18) if t else ''), span=span)

    # top padding below letterhead logo
    if cfg['top_pad']:
        body.append(para('', sz=2).replace('w:line="252"', f'w:line="{cfg["top_pad"]}"'))

    # reference line
    body.append(para(run('Broj zapisnika: ____ / ____        Sarajevo, ______________', sz=18), after=140))
    body.append(para(run(cfg.get('title','Z A P I S N I K   S A   S A S T A N K A'), sz=26 if cfg.get('joint') else 30, b=True, color=A), jc='center', after=40))
    for nm in cfg.get('names', [cfg['name']]):
        body.append(para(run(nm, sz=15, i=True), jc='center', after=20))
    body.append(para('', after=120, sz=4))

    # 1. Vrsta sastanka
    section('1. Vrsta sastanka')
    types = [('☐ Razgovor sa zaposlenim', '☐ Individualni roditeljski sastanak'),
             ('☐ Grupni (razredni) roditeljski sastanak', '☐ Sastanak sa partnerom'),
             ('☐ Radni sastanak tima / stručnog organa', '☐ Drugo: ______________________')]
    if cfg.get('joint'):
        types = [('\u2610 Redovni sastanak uprave', '\u2610 Vanredni sastanak uprave'), ('\u2610 Strateški / planski sastanak', '\u2610 Drugo: ______________________')]
    half = W // 2
    rows = [''.join(tc(half, para(run(t, sz=18))) for t in pair) for pair in types]
    body.append(table([half, W - half], rows, L))

    # 2. Osnovni podaci
    section('2. Osnovni podaci')
    c4 = [int(W * .2), int(W * .3), int(W * .2)]
    c4.append(W - sum(c4))
    rows = [
        label_cell(c4[0], 'Tema sastanka') + val_cell(c4[1] + c4[2] + c4[3], '', span=3),
        label_cell(c4[0], 'Mjesto održavanja') + val_cell(c4[1]) + label_cell(c4[2], 'Datum') + val_cell(c4[3]),
        label_cell(c4[0], 'Vrijeme početka') + val_cell(c4[1]) + label_cell(c4[2], 'Vrijeme završetka') + val_cell(c4[3]),
        label_cell(c4[0], 'Nivo povjerljivosti') + tc(c4[1] + c4[2] + c4[3], para(run('☐ Opći      ☐ Povjerljiv      ☐ Strogo povjerljivo', sz=18)), span=3),
        label_cell(c4[0], 'Snimanje sastanka') + tc(c4[1] + c4[2] + c4[3], para(run('☐ Ne      ☐ Da, uz saglasnost svih prisutnih (evidentirano prije početka)', sz=18)), span=3),
    ]
    body.append(table(c4, rows, L))

    # 3. Prisutni
    section('3. Prisutni, odsutni i učesnici bez prava glasa')
    pc = [600, int(W * .38)]
    pc += [int(W * .27)]
    pc.append(W - sum(pc))
    rows = [head_row(pc, ['R.br.', 'Ime i prezime', 'Funkcija / uloga', 'Napomena (kasniji dolazak, raniji odlazak, vrijeme)'])]
    for i in range(1, 6):
        rows.append(tc(pc[0], para(run(str(i), sz=16), jc='center')) + ''.join(val_cell(w) for w in pc[1:]))
    body.append(table(pc, rows, L, heights=[None] + [330] * 5))
    spacer(60)
    c2 = [int(W * .5)]; c2.append(W - c2[0])
    rows = [
        tc(c2[0], para(run('Opravdano odsutni (ime i prezime):', sz=16, b=True, color=A)) + para('')) +
        tc(c2[1], para(run('Neopravdano odsutni (ime i prezime):', sz=16, b=True, color=A)) + para('')),
        tc(W, para(run('Učesnici bez prava glasa (ime i prezime, funkcija):', sz=16, b=True, color=A)) + para(''), span=2),
    ]
    body.append(table(c2, rows, L, heights=[620, 520]))

    # 4. Kvorum, predsjedavajući, zapisničar
    section('4. Kvorum, predsjedavajući i zapisničar')
    k = [int(W * .22), int(W * .28), int(W * .22)]
    k.append(W - sum(k))
    rows = [
        label_cell(k[0], 'Kvorum') + tc(k[1] + k[2] + k[3], para(run('☐ Ostvaren      ☐ Nije ostvaren      ☐ Nije potreban     (ima li potreban broj prisutnih za pravovaljano odlučivanje?)', sz=16)), span=3),
        label_cell(k[0], 'Predsjedavajući') + val_cell(k[1]) + label_cell(k[2], 'Zapisničar') + val_cell(k[3]),
    ]
    body.append(table(k, rows, L))

    # 5. Dnevni red
    section('5. Dnevni red')
    if cfg.get('joint'):
        dc = [850, W - 850 - 1900 - 1800, 1800, 1900]
        rows = [head_row(dc, ['Tačka', 'Predmet', 'Ustanova (IMH / IDSS / zajedničko)', 'Prijedlog usvojen? (za / protiv / suzdržani)'])]
        for i in range(1, 5):
            rows.append(tc(dc[0], para(run(f'{i}.', sz=16), jc='center')) + val_cell(dc[1]) + val_cell(dc[2]) + val_cell(dc[3]))
    else:
        dc = [850, W - 850 - 1900, 1900]
        rows = [head_row(dc, ['Tačka', 'Predmet', 'Prijedlog usvojen? (za / protiv / suzdržani)'])]
        for i in range(1, 5):
            rows.append(tc(dc[0], para(run(f'{i}.', sz=16), jc='center')) + val_cell(dc[1]) + val_cell(dc[2]))
    body.append(table(dc, rows, L, heights=[None] + [330] * 4))
    body.append(para(run('Predsjedavajući predlaže dnevni red i daje ga na usvajanje; prisutni ga glasanjem usvajaju i mogu ga dopuniti.', sz=14, i=True), before=40, after=0))

    # 6. Tok sastanka
    section('6. Tok sastanka po tačkama dnevnog reda')
    body.append(para(run('Za svaku tačku: ime osobe koja je učestvovala u raspravi i sažet prikaz njenog izlaganja. Ništa se ne bilježi što nije izrečeno.', sz=14, i=True), after=60, keep=True))
    tk = [int(W * .22), W - int(W * .22)]
    for n in (1, 2, 3):
        rows = [
            tc(W, para(run(f'Ad {n}.  Naziv tačke: ' + ('______________________________   \u2610 IMH  \u2610 IDSS  \u2610 zajedničko' if cfg.get('joint') else '____________________________________________'), sz=18, b=True, color='FFFFFF'), keep=True), fill=A, span=2),
            tc(tk[0], para(run('Rasprava', sz=16, b=True, color=A), keep=True), valign='top') + tc(tk[1], para('', keep=True)),
            tc(tk[0], para(run('Rezultat glasanja', sz=16, b=True, color=A))) + tc(tk[1], para(run('Za: ____     Protiv: ____     Suzdržani: ____     ☐ Javno   ☐ Tajno   ☐ Bez glasanja', sz=16))),
            tc(tk[0], para(run('Zaključak', sz=16, b=True, color=A)), valign='top') + val_cell(tk[1]),
            tc(tk[0], para(run('Izdvojeno mišljenje', sz=16, b=True, color=A)), valign='top') + val_cell(tk[1]),
        ]
        body.append(table(tk, rows, L, heights=[None, 900, None, 520, 380]))
        spacer(120)
    body.append(para(run('Za dodatne tačke kopirati blok „Ad N.“. Odlazak ili naknadni dolazak prisutnih upisuje se uz ime i vrijeme u dijelu 3.', sz=14, i=True), after=0))

    # 7. Zadaci
    section('7. Zadaci i dogovori')
    zc = [600, int(W * .38 if cfg.get('joint') else W * .42), int(W * .2), 1500]
    zc.append(W - sum(zc) - (1400 if cfg.get('joint') else 0))
    if cfg.get('joint'): zc.append(1400)
    rows = [head_row(zc, ['R.br.', 'Zadatak / dogovor', 'Odgovorna osoba', 'Krajnji rok', 'Status'] + (['Ustanova'] if cfg.get('joint') else []))]
    for i in range(1, 6):
        rows.append(tc(zc[0], para(run(str(i), sz=16), jc='center')) + ''.join(val_cell(w) for w in zc[1:]))
    body.append(table(zc, rows, L, heights=[None] + [330] * 5))
    body.append(para(run('Svaki zadatak mora imati odgovornu osobu i krajnji rok (QP 01).', sz=14, i=True), before=40, after=0))

    # 8. Prilozi, naredni sastanak
    section('8. Prilozi i naredni sastanak')
    rows = [
        label_cell(c4[0], 'Prilozi uz zapisnik') + val_cell(W - c4[0]),
        label_cell(c4[0], 'Naredni sastanak') + val_cell(W - c4[0]),
    ]
    body.append(table([c4[0], W - c4[0]], rows, L))

    # 9. Ovjera
    section('9. Ovjera zapisnika')
    oc = [int(W * .22), int(W * .28), int(W * .22)]
    oc.append(W - sum(oc))
    rows = [
        label_cell(oc[0], 'Vrijeme završetka') + val_cell(oc[1]) + label_cell(oc[2], 'Status') + tc(oc[3], para(run('☐ Nacrt      ☐ Potvrđen', sz=18))),
        label_cell(oc[0], 'Zapisničar (potpis)') + val_cell(oc[1]) + label_cell(oc[2], 'Predsjedavajući (potpis)') + val_cell(oc[3]),
        label_cell(oc[0], 'Datum potvrde') + val_cell(oc[1]) + label_cell(oc[2], 'Potvrdio (ime i prezime)') + val_cell(oc[3]),
    ]
    body.append(table(oc, rows, L, heights=[None, 780, None]))

    # Upute na novoj stranici
    body.append('<w:p><w:r><w:br w:type="page"/></w:r></w:p>')
    if cfg['top_pad']:
        body.append(para('', sz=2).replace('w:line="252"', f'w:line="{cfg["top_pad"]}"'))
    body.append(para(run('Upute za vođenje zapisnika', sz=24, b=True, color=A), after=100))
    body.append(para(run('Zapisnik ima obilježje isprave kojom se potvrđuje rad i određuje oblik i tok sastanka. Dok ga ne potvrdi ovlaštena osoba, zapisnik je nacrt.', sz=17), after=100))
    body.append(para(run('Zapisnik obavezno sadrži:', sz=17, b=True, color=A), after=40))
    items = [
        'naziv sastanka s rednim brojem, mjesto, datum i vrijeme početka;',
        'imena prisutnih, te opravdano i neopravdano odsutnih; učesnike bez prava glasa;',
        'utvrđivanje kvoruma (potreban broj prisutnih za pravovaljano odlučivanje);',
        'ime predsjedavajućeg i zapisničara;',
        'dnevni red po tačkama; predsjedavajući ga predlaže, a prisutni ga glasanjem usvajaju i mogu dopuniti;',
        'tok sastanka: predmete rasprave, imena osoba koje su učestvovale i sažet prikaz izlaganja;',
        'rezultate glasanja po tačkama (za, protiv, suzdržani) i zaključke;',
        'izdvojeno mišljenje člana, ako on zatraži da se unese u zapisnik;',
        'zadatke s odgovornom osobom i krajnjim rokom;',
        'vrijeme završetka ili prekida sastanka, oznaku priloga te potpis predsjedavajućeg i zapisničara.',
    ]
    for t in items:
        body.append(para(run('–  ' + t, sz=17), after=30, ind=240))
    body.append(para(run('Tokom sastanka:', sz=17, b=True, color=A), before=120, after=40))
    for t in [
        'predsjedavajući obrazlaže temu ili prijedlog;',
        'otvara se rasprava;',
        'odluka se donosi glasanjem (javnim ili tajnim); predsjedavajući pita ko je za, ko protiv, ko je suzdržan;',
        'način tajnog glasanja propisuje akt ustanove.',
    ]:
        body.append(para(run('–  ' + t, sz=17), after=30, ind=240))
    body.append(para(run('Bilježenje toka sastanka:', sz=17, b=True, color=A), before=120, after=40))
    for t in [
        'zapisničar bilježi izlaganja pod imenom i prezimenom osobe, u prvom licu, ili ih sažeto prepričava;',
        'ako je neko napustio sastanak ili naknadno došao, zapisničar bilježi ime, prezime i vrijeme odlaska ili dolaska.',
    ]:
        body.append(para(run('–  ' + t, sz=17), after=30, ind=240))
    if cfg.get('joint'):
        body.append(para(run('Zajednički sastanak uprave:', sz=17, b=True, color=A), before=120, after=40))
        for t in [
            'uz svaku tačku dnevnog reda i svaki zadatak označava se ustanova na koju se odnosi: IMH, IDSS ili zajedničko;',
            'cijeli zapisnik dostupan je samo upravi obje ustanove;',
            'nakon potvrde izrađuju se izvodi za arhive ustanova: izvod za IMH sadrži tačke i zadatke označene IMH i zajedničke, a izvod za IDSS tačke i zadatke označene IDSS i zajedničke;',
            'ono što je izrečeno samo o jednoj ustanovi ne smije se naći u izvodu druge ustanove.',
        ]:
            body.append(para(run('\u2013  ' + t, sz=17), after=30, ind=240))
    body.append(para(run('Snimanje i zaštita podataka:', sz=17, b=True, color=A), before=120, after=40))
    for t in [
        'sastanak se snima samo uz saglasnost svih prisutnih, evidentiranu prije početka snimanja;',
        'nacrt zapisnika izrađen iz snimka pregleda i ispravlja zapisničar; nejasna mjesta ostaju označena kao [nejasno];',
        'povjerljivi zapisnici dostupni su samo ovlaštenim osobama.',
    ]:
        body.append(para(run('–  ' + t, sz=17), after=30, ind=240))
    return ''.join(body)


def footer_xml(cfg, orig):
    A = cfg['accent']
    def r(t, b=False, sz=15, color=None):
        return run(t, sz=sz, b=b, color=color)
    def fld(instr):
        return (f'<w:r>{rpr(sz=15)}<w:fldChar w:fldCharType="begin"/></w:r><w:r>{rpr(sz=15)}<w:instrText xml:space="preserve"> {instr} </w:instrText></w:r>'
                f'<w:r>{rpr(sz=15)}<w:fldChar w:fldCharType="separate"/></w:r><w:r>{rpr(sz=15)}<w:t>1</w:t></w:r><w:r>{rpr(sz=15)}<w:fldChar w:fldCharType="end"/></w:r>')
    ind = '<w:ind w:left="-709" w:right="-705"/>' if cfg['short'] == 'IMH' else '<w:ind w:right="1800"/>'
    ctrl = (f'<w:p><w:pPr><w:pBdr><w:top w:val="single" w:sz="6" w:space="4" w:color="{A}"/></w:pBdr>'
            f'<w:spacing w:before="0" w:after="40" w:line="240" w:lineRule="auto"/>{ind}'
            f'{rpr(sz=15)}</w:pPr>'
            + r(cfg.get('code', CODE), b=True, color=A) + r('   |   ' + cfg.get('form', FORM) + '   |   Izdanje ' + EDITION + '   |   Strana ')
            + fld('PAGE') + r(' od ') + fld('NUMPAGES') + '</w:p>')
    root = re.search(r'<w:ftr[^>]*>', orig)
    head = orig[:root.end()]
    if cfg['short'] == 'IMH':
        rest = orig[root.end():]
        return head + ctrl + rest
    name = ''.join(f'<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:ind w:right="1800"/>{rpr(sz=14)}</w:pPr>'
            + r(nm, sz=14) + '</w:p>' for nm in cfg.get('names', [cfg['name']]))
    return head + ctrl + name + '</w:ftr>'


def build(key):
    cfg = CFG[key]
    d = f"{WORK}/{key}"
    if os.path.exists(d): shutil.rmtree(d)
    shutil.copytree(f"{SRC}/{cfg['src']}", d)
    docp = f'{d}/word/document.xml'
    x = open(docp, encoding='utf8').read()
    bstart = x.index('<w:body>') + len('<w:body>')
    sect = x[x.rindex('<w:sectPr'):x.rindex('</w:body>')]
    if cfg.get('top_margin'):
        sect = sect.replace('w:top="536"', f'w:top="{cfg["top_margin"]}"')
    x = x[:bstart] + build_body(cfg) + sect + '</w:body></w:document>'
    open(docp, 'w', encoding='utf8').write(x)
    fp = f'{d}/word/footer1.xml'
    orig_footer = open(fp, encoding='utf8').read()
    open(fp, 'w', encoding='utf8').write(footer_xml(cfg, orig_footer))
    ct = f'{d}/[Content_Types].xml'
    c = open(ct, encoding='utf8').read().replace('wordprocessingml.template.main+xml', 'wordprocessingml.document.main+xml')
    open(ct, 'w', encoding='utf8').write(c)
    out = f"{OUT}/{cfg['out']}"
    if os.path.exists(out): os.remove(out)
    subprocess.check_call(f'cd "{d}" && zip -qXrD "{out}" .', shell=True)
    return out


if __name__ == '__main__':
    for k in CFG:
        print(build(k))
