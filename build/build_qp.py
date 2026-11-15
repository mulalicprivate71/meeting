import sys, os, shutil, subprocess, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build as B
from build import para, run, tc, table, rpr

cfg = dict(B.CFG['idss'])
W = cfg['width']; A = cfg['accent']; L = cfg['line']
IDSS = B.CFG['idss']['name']
body = []
def H(t): body.append(para(run(t, sz=22, b=True, color=A), before=260, after=80, keep=True))
def H2(t): body.append(para(run(t, sz=19, b=True, color=A), before=140, after=50, keep=True))
def P(t, **k): body.append(para(run(t, sz=18), after=70, **k))
def BL(items):
    for t in items: body.append(para(run('–  ' + t, sz=18), after=40, ind=300))
def MARK(t): body.append(para(run('[' + t + ']', sz=16, i=True, color='E8262C'), after=70))
def hr(cols, labels): return ''.join(tc(c, para(run(t, sz=16, b=True, color='FFFFFF')), fill=A) for c, t in zip(cols, labels))
def row(cols, vals): return ''.join(tc(c, para(run(v, sz=16))) for c, v in zip(cols, vals))
def tbl(cols, head, data):
    rows = [hr(cols, head)] + [row(cols, r) for r in data]
    body.append(table(cols, rows, L)); body.append(para('', after=60, sz=4))

body.append(para(run('QP 10', sz=40, b=True, color=A), before=0, after=0))
body.append(para(run('SASTANCI I ZAPISNICI SA SASTANAKA', sz=30, b=True, color=A), after=100))
body.append(para(run(IDSS, sz=15, i=True), after=160))
tbl([int(W*.25), int(W*.25), int(W*.25), W-3*int(W*.25)], ['Izdanje','Datum izdanja','Pripremio','Odobrio'], [['01','____________','____________','Direktor']])
MARK('NACRT procedure. Predstavlja prijedlog teksta koji treba uskladiti s IM 01, QP 01 i QP 03 i odobriti u skladu s QP 03. Tekst u uglastim zagradama zahtijeva odluku ili provjeru.')

H('SADRŽAJ')
for t in ['1. Distribucija i kontrola','2. Svrha','3. Područje primjene','4. Termini i definicije','5. Referentna dokumenta','6. Opis rada','7. Opće odredbe o zapisima','8. Odgovornosti i ovlaštenja','9. Zapisi','10. Prilozi']:
    body.append(para(run(t, sz=17), after=20, ind=300))

H('1. DISTRIBUCIJA I KONTROLA')
H2('1.1 Distribucija')
tbl([1200, 4200, W-5400], ['Primjerak broj','Ime i prezime','Funkcija'], [['1.','','Direktor'],['2.','','Office manager'],['3.','','Sekretar škole'],['4.','','Pedagog škole'],['5.','','Psiholog škole']])
H2('1.2 Kontrola')
P('Kontrolisani primjerci identifikuju se brojem primjerka. Nekontrolisani primjerci izdaju se prema odluci Menadžera kvaliteta i označavaju se natpisom „NEKONTROLISANI PRIMJERAK – UNIŠTITI NAKON UPOTREBE“. Sva pitanja u vezi s ovim dokumentom upućuju se Menadžeru kvaliteta.')

H('2. SVRHA')
P('Procedura određuje način pripreme, održavanja, snimanja, zapisivanja, potvrđivanja, čuvanja i arhiviranja sastanaka, tako da svaki sastanak koji se vodi u okviru QMS-a ima potvrđen zapisnik u propisanom obliku, s jasno određenim zaključcima, zadacima, odgovornim osobama i rokovima.')

H('3. PODRUČJE PRIMJENE')
P('Procedura se primjenjuje u ustanovi Privatna ustanova INTERNATIONALE DEUTSCHE SCHULE SARAJEVO – Međunarodna njemačka škola Sarajevo na sljedeće sastanke:')
BL(['razgovore sa zaposlenim;','individualne i grupne (razredne) roditeljske sastanke;','sastanke s partnerima;','radne sastanke timova i stručnih organa;','sastanke uprave.'])
P('Procedura se primjenjuje i na zajedničke sastanke uprave ustanova IDSS i International Montessori House (IMH), kada se na istom sastanku raspravlja o obje ustanove.')
P('QMS ne obuhvata ustanovu IMH. Obrazac QP 10.ZS-01 u varijanti za IMH koristi se prema odluci Direktora radi jedinstvenog načina vođenja zapisnika; ti zapisnici nisu predmet provjere QMS-a. Izvod zajedničkog zapisnika za IMH arhivira se u arhivi IMH.')

H('4. TERMINI I DEFINICIJE')
tbl([2300, W-2300], ['Pojam','Značenje'], [
 ['QMS','Sistem menadžmenta kvalitetom (Quality management system).'],
 ['Zapisnik','Zapis o sastanku u obrascu QP 10.ZS-01 ili QP 10.ZS-02, koji sadrži podatke o sastanku, prisutnima, toku, zaključcima i zadacima.'],
 ['Nacrt zapisnika','Zapisnik koji još nije potvrdio Direktor. Nacrt nije službeni zapis.'],
 ['Potvrđeni zapisnik','Zapisnik koji je pregledan, ispravljen i potvrđen; nakon potvrde se ne mijenja.'],
 ['Predsjedavajući','Osoba koja vodi sastanak.'],
 ['Zapisničar','Osoba koja vodi zapisnik i odgovorna je za njegovu tačnost.'],
 ['Kvorum','Potreban broj prisutnih za pravovaljano odlučivanje.'],
 ['Saglasnost za snimanje','Evidentirana saglasnost svih prisutnih na snimanje sastanka, data prije početka snimanja.'],
 ['Zajednički sastanak uprave','Sastanak na kojem se raspravlja o IMH i IDSS; ima poseban obrazac QP 10.ZS-02.'],
 ['Izvod','Dio zajedničkog zapisnika koji se odnosi na jednu ustanovu i zajedničke tačke; arhivira se u arhivi te ustanove.'],
 ['Nivo povjerljivosti','Opći, povjerljiv ili strogo povjerljivo; određuje ko smije pristupiti zapisniku.']])

H('5. REFERENTNA DOKUMENTA')
tbl([2300, W-2300], ['Oznaka','Naziv'], [
 ['ISO 9001:2015','Sistemi menadžmenta kvalitetom – Zahtjevi (tačka 7.5, dokumentovane informacije)'],
 ['IM 01','Poslovnik QMS-a'],['QP 01','Preispitivanje QMS-a'],['QP 03','Upravljanje dokumentovanim informacijama'],
 ['Propis o zaštiti ličnih podataka','Zakon o zaštiti ličnih podataka („Službeni glasnik BiH“, broj 12/25) i podzakonski akti']])
MARK('Prije odobrenja provjeriti da li je zakon u punoj primjeni (prelazni rok) i da li su doneseni podzakonski akti.')

H('6. OPIS RADA')
H2('6.1 Priprema sastanka')
BL(['Organizator određuje ustanovu (IDSS, IMH ili zajednički sastanak uprave), vrstu sastanka, temu, mjesto, datum, učesnike i dnevni red.','Organizator određuje nivo povjerljivosti. Razgovori o zaposlenima i o djeci određuju se kao povjerljivi ili strogo povjerljivi.','Predsjedavajući i zapisničar određuju se prije početka sastanka.','Za zajednički sastanak uprave svaka tačka dnevnog reda označava se kao IMH, IDSS ili zajedničko.'])
H2('6.2 Snimanje sastanka i saglasnost')
BL(['Sastanak se snima samo uz saglasnost svih prisutnih.','Saglasnost se evidentira prije početka snimanja: ko je saglasnost evidentirao, kada i za koji sastanak.','Ako neko od prisutnih ne daje saglasnost, sastanak se ne snima, a zapisnik se vodi ručno.','Snimanje se vrši u aplikaciji za zapisnike ili učitavanjem gotovog audio zapisa.'])
H2('6.3 Vođenje sastanka i zapisnika')
BL(['Predsjedavajući predlaže dnevni red, koji prisutni glasanjem usvajaju i mogu ga dopuniti.','Zapisničar bilježi tok sastanka po tačkama dnevnog reda: ko je učestvovao u raspravi i sažetak izlaganja.','Rezultat glasanja (za, protiv, suzdržani) i zaključak bilježe se po tačkama. Izdvojeno mišljenje bilježi se na zahtjev člana.','Za svaki zadatak određuju se odgovorna osoba i krajnji rok (QP 01). Rok i odgovorna osoba upisuju se samo ako su izričito dogovoreni.'])
H2('6.4 Izrada nacrta iz snimka')
BL(['Snimak se obrađuje u aplikaciji: izrađuje se transkript i nacrt zapisnika u propisanom obrascu.','Obrada se vrši preko vanjskih servisa za prepoznavanje govora i izradu teksta. Ustanova s pružaocem usluge zaključuje pisani ugovor o obradi podataka (član 30 Zakona), a prenos podataka izvan Bosne i Hercegovine vrši se u skladu s poglavljem IV Zakona (čl. 46–51).','Ništa se ne upisuje što nije izrečeno. Nejasna mjesta označavaju se kao [nejasno].','Nacrt se ne smije smatrati zapisnikom dok ga ne potvrdi Direktor.'])
MARK('Odrediti pružaoca usluge i uslove ugovora o obradi podataka (lokacija obrade, čuvanje podataka kod pružaoca).')
H2('6.5 Pregled i potvrda zapisnika')
BL(['Zapisničar pregleda i ispravlja nacrt, uz provjeru po snimku gdje je to potrebno.','Zapisnik potvrđuje Direktor. Prije potvrde aplikacija upozorava na zadatke bez odgovorne osobe ili roka i na mjesta označena kao [nejasno].','Potvrđeni zapisnik se zaključava i ne može se mijenjati. Ispravka se vrši novim izdanjem zapisnika uz obrazloženje.'])
H2('6.6 Zadaci i praćenje')
P('Zadaci iz potvrđenih zapisnika prate se po statusu (otvoren, u toku, završen) i ulaze u mjesečne izvještaje i preispitivanje rukovodstva (QP 01).')
H2('6.7 Zajednički sastanci uprave')
BL(['Vodi se jedan snimak i jedan zapisnik (QP 10.ZS-02).','Cijeli zajednički zapisnik dostupan je samo upravi obje ustanove.','Nakon potvrde izrađuju se izvodi: izvod za IMH sadrži tačke i zadatke označene IMH i zajedničke; izvod za IDSS sadrži tačke i zadatke označene IDSS i zajedničke.','Ono što je izrečeno samo o jednoj ustanovi ne smije se naći u izvodu druge ustanove.'])
H2('6.8 Povjerljivost i zaštita podataka')
BL(['Pristup zapisnicima određen je ulogom osobe u ustanovi i nivoom povjerljivosti zapisnika.','Zapisnici ustanova IDSS i IMH čuvaju se odvojeno.','Pristup i izmjene se evidentiraju u dnevniku aplikacije.'])
H2('6.9 Čuvanje i brisanje snimaka')
BL(['Audio snimak se briše nakon potvrde zapisnika.','Potvrđeni zapisnik i transkript čuvaju se u elektronskoj arhivi aplikacije godinu dana.'])
MARK('Rok čuvanja zapisnika i transkripta od godinu dana odredio je Direktor; po isteku roka Direktor odobrava uništavanje.')
H2('6.10 Prevod na engleski')
P('Zapisnik se sastavlja na bosanskom jeziku. Na zahtjev korisnika izrađuje se prevod potvrđenog zapisnika na engleski jezik, koji se čuva uz zapisnik i označava kao prevod. Mjerodavan je zapisnik na bosanskom jeziku.')

H('7. OPĆE ODREDBE O ZAPISIMA')
P('Zapisnici su formalizovani zapisi. Struktura, oblik, sadržaj, evidencija, čuvanje i arhiviranje zapisa određeni su procedurom QP 03 (tačka 7). Zapisi ove procedure unose se u Pregled zapisa ove procedure [šifra obrasca „Pregled zapisa“ za QP 10 dodjeljuje se prema QP 03; u repozitoriju svaka procedura ima svoj, npr. QP 04.PZ-04].')

H('8. ODGOVORNOSTI I OVLAŠTENJA')
tbl([2400, W-2400], ['Uloga','Odgovornost'], [
 ['Direktor','Odobrava proceduru; potvrđuje zapisnike; odobrava uništavanje zapisa kojima je istekao rok čuvanja.'],
 ['Organizator sastanka','Priprema sastanak, određuje ustanovu, nivo povjerljivosti, učesnike i dnevni red.'],
 ['Predsjedavajući','Vodi sastanak, osigurava saglasnost za snimanje i glasanje po dnevnom redu.'],
 ['Zapisničar','Vodi zapisnik, pregleda i ispravlja nacrt.'],
  ['Menadžer kvaliteta','Kontroliše primjenu procedure; ažurira Pregled zapisa ove procedure [šifra obrasca „Pregled zapisa“ za QP 10 dodjeljuje se prema QP 03; u repozitoriju svaka procedura ima svoj, npr. QP 04.PZ-04].'],
 ['Administrator aplikacije','Direktor (direktor@idss.ba). Dodjeljuje uloge i pristup po ustanovi; nadzire brisanje snimaka.'],
 ['Svi učesnici','Pridržavaju se ove procedure i povjerljivosti zapisnika.']])

H('9. ZAPISI')
tbl([2500, 1500, 1700, 2000, W-7700], ['Naziv zapisa','Oznaka','Odgovorna osoba','Mjesto čuvanja','Rok čuvanja'], [
 ['Zapisnik sa sastanka','QP 10.ZS-01','Zapisničar','Elektronska arhiva (aplikacija)','godinu dana'],
 ['Zapisnik sa zajedničkog sastanka uprave','QP 10.ZS-02','Zapisničar','Elektronska arhiva (aplikacija), pristup samo uprava','godinu dana'],
 ['Evidencija saglasnosti za snimanje','u aplikaciji','Predsjedavajući','Elektronska arhiva (aplikacija)','kao zapisnik'],
 ['Audio snimak sastanka','—','Administrator aplikacije','Privatna pohrana aplikacije','do potvrde zapisnika'],
 ['Transkript sastanka','—','Zapisničar','Elektronska arhiva (aplikacija)','godinu dana']])

H('10. PRILOZI')
BL(['Prilog 1: Obrazac QP 10.ZS-01 – Zapisnik sa sastanka (varijante IDSS i IMH)','Prilog 2: Obrazac QP 10.ZS-02 – Zapisnik sa zajedničkog sastanka uprave'])

# izgradnja dokumenta
d = f"{B.WORK}/qp"
if os.path.exists(d): shutil.rmtree(d)
shutil.copytree(f"{B.SRC}/{cfg['src']}", d)
x = open(f'{d}/word/document.xml', encoding='utf8').read()
bs = x.index('<w:body>') + 8
sect = x[x.rindex('<w:sectPr'):x.rindex('</w:body>')].replace('w:top="536"', 'w:top="1350"')
x = x[:bs] + ''.join(body) + sect + '</w:body></w:document>'
open(f'{d}/word/document.xml', 'w', encoding='utf8').write(x)
fp = f'{d}/word/footer1.xml'
orig = open(fp, encoding='utf8').read()
c2 = dict(cfg, code='QP 10', form='Sastanci i zapisnici sa sastanaka', names=[IDSS])
open(fp, 'w', encoding='utf8').write(B.footer_xml(c2, orig))
ct = f'{d}/[Content_Types].xml'
ct_orig = open(ct, encoding='utf8').read()
open(ct, 'w', encoding='utf8').write(ct_orig.replace('wordprocessingml.template.main+xml', 'wordprocessingml.document.main+xml'))
out = f"{B.ROOT}/docs/QP_10_Sastanci_i_zapisnici_sa_sastanaka.docx"
if os.path.exists(out): os.remove(out)
subprocess.check_call(f'cd "{d}" && zip -qXrD "{out}" .', shell=True)
print(out)
